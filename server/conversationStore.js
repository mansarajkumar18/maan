import fs from 'fs';
import path from 'path';

// Resolve persistent storage directory
let baseDataDir = path.resolve(process.cwd(), 'data', 'conversations');

try {
  if (!fs.existsSync(baseDataDir)) {
    fs.mkdirSync(baseDataDir, { recursive: true });
  }
} catch {
  // If cwd is not writable (e.g. AWS Lambda / Vercel), fall back to /tmp/nova-data
  baseDataDir = path.resolve('/tmp', 'nova-data', 'conversations');
  try {
    if (!fs.existsSync(baseDataDir)) {
      fs.mkdirSync(baseDataDir, { recursive: true });
    }
  } catch {
    // In-memory fallback will be handled gracefully if disk writes fail
  }
}

// In-memory fallback map for environments with no disk access
const inMemoryStore = new Map();

/**
 * Sanitizes an identifier to prevent path traversal.
 */
function sanitizeId(id, fallback = null) {
  if (!id || typeof id !== 'string') return fallback;
  const cleaned = id.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 80);
  return cleaned || fallback;
}

/**
 * Returns the directory for a specific user.
 */
function getUserDir(userId) {
  const cleanUser = sanitizeId(userId, 'default-user');
  const userDir = path.join(baseDataDir, cleanUser);
  try {
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    return userDir;
  } catch {
    return null;
  }
}

/**
 * Lists all conversations for a user.
 */
export async function listConversations(userId, options = {}) {
  const cleanUser = sanitizeId(userId, 'default-user');
  const { search = '', limit = 50 } = options;
  const searchLower = (search || '').toLowerCase().trim();

  const userDir = getUserDir(cleanUser);
  const results = [];

  if (userDir && fs.existsSync(userDir)) {
    try {
      const files = fs.readdirSync(userDir).filter((f) => f.endsWith('.json'));

      for (const file of files) {
        try {
          const filePath = path.join(userDir, file);
          const raw = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(raw);

          if (data && data.id) {
            results.push(data);
          }
        } catch {
          // ignore corrupted single file
        }
      }
    } catch {
      // ignore readdir error
    }
  }

  // Include in-memory entries for this user
  for (const [key, conv] of inMemoryStore.entries()) {
    if (key.startsWith(`${cleanUser}:`) && !results.some((r) => r.id === conv.id)) {
      results.push(conv);
    }
  }

  // Filter by search query if provided
  let filtered = results;
  if (searchLower) {
    filtered = results.filter((c) => {
      const titleMatch = (c.title || '').toLowerCase().includes(searchLower);
      const messageMatch = (c.messages || []).some((m) =>
        (m.content || '').toLowerCase().includes(searchLower)
      );
      return titleMatch || messageMatch;
    });
  }

  // Sort by updatedAt descending
  filtered.sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  // Return formatted summaries
  return filtered.slice(0, limit).map((c) => ({
    id: c.id,
    userId: cleanUser,
    title: c.title || 'Conversation',
    model: c.model || 'Nova 3.5 Ultra',
    mode: c.mode || 'general',
    messageCount: Array.isArray(c.messages) ? c.messages.length : 0,
    lastMessage: c.messages && c.messages.length > 0 ? c.messages[c.messages.length - 1].content.slice(0, 100) : '',
    createdAt: c.createdAt || new Date().toISOString(),
    updatedAt: c.updatedAt || new Date().toISOString(),
  }));
}

/**
 * Retrieves a full conversation by ID with user ownership check.
 */
export async function getConversation(userId, conversationId) {
  const cleanUser = sanitizeId(userId, 'default-user');
  const cleanConvId = sanitizeId(conversationId, null);
  if (!cleanConvId) return null;

  // Check in-memory store first
  const memoryKey = `${cleanUser}:${cleanConvId}`;
  if (inMemoryStore.has(memoryKey)) {
    return inMemoryStore.get(memoryKey);
  }

  const userDir = getUserDir(cleanUser);
  if (!userDir) return null;

  const filePath = path.join(userDir, `${cleanConvId}.json`);
  if (!fs.existsSync(filePath)) return null;

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    if (data.userId && data.userId !== cleanUser) {
      return null; // Authorization mismatch
    }
    return data;
  } catch {
    return null;
  }
}

/**
 * Saves or updates a conversation.
 */
export async function saveConversation(userId, conversationData) {
  const cleanUser = sanitizeId(userId, 'default-user');
  const id = sanitizeId(conversationData.id, null) || `chat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  // Load existing if available to preserve createdAt
  const existing = await getConversation(cleanUser, id);

  // Generate title from first user message if title is not specified
  let title = conversationData.title;
  if (!title && Array.isArray(conversationData.messages)) {
    const firstUserMsg = conversationData.messages.find((m) => m.role === 'user');
    if (firstUserMsg && firstUserMsg.content) {
      title = firstUserMsg.content.slice(0, 36).trim() + (firstUserMsg.content.length > 36 ? '...' : '');
    }
  }

  const record = {
    id,
    userId: cleanUser,
    title: title || existing?.title || 'New Conversation',
    model: conversationData.model || existing?.model || 'Nova 3.5 Ultra',
    mode: conversationData.mode || existing?.mode || 'general',
    deepThink: conversationData.deepThink ?? existing?.deepThink ?? true,
    webSearch: conversationData.webSearch ?? existing?.webSearch ?? false,
    summary: conversationData.summary || existing?.summary || '',
    messages: Array.isArray(conversationData.messages) ? conversationData.messages : [],
    createdAt: existing?.createdAt || conversationData.createdAt || now,
    updatedAt: now,
  };

  // Save to in-memory store
  inMemoryStore.set(`${cleanUser}:${id}`, record);

  // Save to file storage
  const userDir = getUserDir(cleanUser);
  if (userDir) {
    try {
      const filePath = path.join(userDir, `${id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[ConversationStore Write Warning]:', err.message);
    }
  }

  return record;
}

/**
 * Renames a conversation.
 */
export async function renameConversation(userId, conversationId, newTitle) {
  const cleanUser = sanitizeId(userId, 'default-user');
  const cleanConvId = sanitizeId(conversationId, null);
  if (!cleanConvId) throw new Error('Invalid conversation ID.');

  const trimmedTitle = (newTitle || '').trim().slice(0, 100);
  if (!trimmedTitle) {
    throw new Error('Conversation title cannot be empty.');
  }

  const conv = await getConversation(cleanUser, cleanConvId);
  if (!conv) {
    throw new Error('Conversation not found or access denied.');
  }

  conv.title = trimmedTitle;
  conv.updatedAt = new Date().toISOString();

  return saveConversation(cleanUser, conv);
}

/**
 * Deletes a conversation.
 */
export async function deleteConversation(userId, conversationId) {
  const cleanUser = sanitizeId(userId, 'default-user');
  const cleanConvId = sanitizeId(conversationId, null);
  if (!cleanConvId) return false;

  inMemoryStore.delete(`${cleanUser}:${cleanConvId}`);

  const userDir = getUserDir(cleanUser);
  if (userDir) {
    const filePath = path.join(userDir, `${cleanConvId}.json`);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        return true;
      } catch (err) {
        console.warn('[ConversationStore Delete Warning]:', err.message);
      }
    }
  }

  return true;
}

/**
 * Clears all conversations for a user.
 */
export async function clearAllConversations(userId) {
  const cleanUser = sanitizeId(userId, 'default-user');

  // Clear memory
  for (const key of inMemoryStore.keys()) {
    if (key.startsWith(`${cleanUser}:`)) {
      inMemoryStore.delete(key);
    }
  }

  const userDir = getUserDir(cleanUser);
  if (userDir && fs.existsSync(userDir)) {
    try {
      const files = fs.readdirSync(userDir).filter((f) => f.endsWith('.json'));
      for (const file of files) {
        fs.unlinkSync(path.join(userDir, file));
      }
    } catch {
      // ignore
    }
  }

  return true;
}
