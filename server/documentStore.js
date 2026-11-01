import fs from 'fs';
import path from 'path';

// Base directory for persistent document storage
let baseDocDir = path.resolve(process.cwd(), 'data', 'documents');

try {
  if (!fs.existsSync(baseDocDir)) {
    fs.mkdirSync(baseDocDir, { recursive: true });
  }
} catch {
  baseDocDir = path.resolve('/tmp', 'nova-data', 'documents');
  try {
    if (!fs.existsSync(baseDocDir)) {
      fs.mkdirSync(baseDocDir, { recursive: true });
    }
  } catch {
    // In-memory fallback will handle state
  }
}

// In-memory cache fallback for serverless / read-only runtime environments
const inMemoryDocStore = new Map();

/**
 * Sanitizes an identifier to prevent path traversal attacks.
 */
function sanitizeId(id, fallback = null) {
  if (!id || typeof id !== 'string') return fallback;
  const cleaned = id.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 80);
  return cleaned || fallback;
}

/**
 * Resolves user directory.
 */
function getUserDocDir(userId) {
  const cleanUser = sanitizeId(userId, 'default-user');
  const userDir = path.join(baseDocDir, cleanUser);
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
 * Lists all documents belonging to a user.
 */
export async function listDocuments(userId) {
  const cleanUser = sanitizeId(userId, 'default-user');
  const userDir = getUserDocDir(cleanUser);
  const docs = [];

  if (userDir && fs.existsSync(userDir)) {
    try {
      const files = fs.readdirSync(userDir).filter((f) => f.endsWith('.json'));
      for (const file of files) {
        try {
          const raw = fs.readFileSync(path.join(userDir, file), 'utf8');
          const data = JSON.parse(raw);
          if (data && data.id) docs.push(data);
        } catch {
          // ignore corrupted file
        }
      }
    } catch {
      // ignore
    }
  }

  // Include in-memory documents
  for (const [key, doc] of inMemoryDocStore.entries()) {
    if (key.startsWith(`${cleanUser}:`) && !docs.some((d) => d.id === doc.id)) {
      docs.push(doc);
    }
  }

  // Sort by updatedAt descending
  docs.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());

  // Return summaries (omit full raw extracted text for fast listing)
  return docs.map((d) => ({
    id: d.id,
    userId: cleanUser,
    name: d.name,
    size: d.size,
    extension: d.extension,
    pages: d.pages || 1,
    summary: d.summary || '',
    metrics: d.metrics || [],
    keyInsights: d.keyInsights || [],
    chunkCount: Array.isArray(d.chunks) ? d.chunks.length : 0,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));
}

/**
 * Retrieves a single document by ID with user ownership validation.
 */
export async function getDocument(userId, documentId) {
  const cleanUser = sanitizeId(userId, 'default-user');
  const cleanDocId = sanitizeId(documentId, null);
  if (!cleanDocId) return null;

  const memoryKey = `${cleanUser}:${cleanDocId}`;
  if (inMemoryDocStore.has(memoryKey)) {
    return inMemoryDocStore.get(memoryKey);
  }

  const userDir = getUserDocDir(cleanUser);
  if (!userDir) return null;

  const filePath = path.join(userDir, `${cleanDocId}.json`);
  if (!fs.existsSync(filePath)) return null;

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
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
 * Saves or updates a document record.
 */
export async function saveDocument(userId, docData) {
  const cleanUser = sanitizeId(userId, 'default-user');
  const id = sanitizeId(docData.id, null) || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const record = {
    id,
    userId: cleanUser,
    name: (docData.name || 'Untitled Document').slice(0, 150),
    size: docData.size || '12 KB',
    extension: docData.extension || 'txt',
    pages: docData.pages || 1,
    author: docData.author || 'MSR Intelligence Engine',
    date: docData.date || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    extractedText: docData.extractedText || '',
    chunks: Array.isArray(docData.chunks) ? docData.chunks : [],
    summary: docData.summary || '',
    metrics: Array.isArray(docData.metrics) ? docData.metrics : [],
    keyInsights: Array.isArray(docData.keyInsights) ? docData.keyInsights : [],
    createdAt: docData.createdAt || now,
    updatedAt: now,
  };

  inMemoryDocStore.set(`${cleanUser}:${id}`, record);

  const userDir = getUserDocDir(cleanUser);
  if (userDir) {
    try {
      const filePath = path.join(userDir, `${id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf8');
    } catch (err) {
      console.warn('[DocumentStore Write Warning]:', err.message);
    }
  }

  return record;
}

/**
 * Deletes a document by ID.
 */
export async function deleteDocument(userId, documentId) {
  const cleanUser = sanitizeId(userId, 'default-user');
  const cleanDocId = sanitizeId(documentId, null);
  if (!cleanDocId) return false;

  inMemoryDocStore.delete(`${cleanUser}:${cleanDocId}`);

  const userDir = getUserDocDir(cleanUser);
  if (userDir) {
    const filePath = path.join(userDir, `${cleanDocId}.json`);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        return true;
      } catch (err) {
        console.warn('[DocumentStore Delete Warning]:', err.message);
      }
    }
  }

  return true;
}

/**
 * Clears all documents for a user.
 */
export async function clearAllDocuments(userId) {
  const cleanUser = sanitizeId(userId, 'default-user');
  for (const key of inMemoryDocStore.keys()) {
    if (key.startsWith(`${cleanUser}:`)) {
      inMemoryDocStore.delete(key);
    }
  }

  const userDir = getUserDocDir(cleanUser);
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
