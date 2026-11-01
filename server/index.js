import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { validateSearchQuery, executeWebSearch } from './searchService.js';
import {
  validateAnswerRequest,
  generateIntelligentAnswer,
  buildContextualSearchQuery,
} from './aiService.js';
import {
  listConversations,
  getConversation,
  saveConversation,
  renameConversation,
  deleteConversation,
  clearAllConversations,
} from './conversationStore.js';
import { streamChatCompletion, generateChatCompletion } from './chatService.js';
import {
  listDocuments,
  getDocument,
  saveDocument,
  deleteDocument,
  clearAllDocuments,
} from './documentStore.js';
import {
  parseDocumentBuffer,
  createDocumentChunks,
  generateInitialDocIntelligence,
  executeDocumentAnalysis,
  queryDocument,
} from './documentService.js';
import {
  validateCodePayload,
  generateCode,
  explainCode,
  debugCode,
  optimizeCode,
  chatWithCode,
  executeSandboxedCode,
} from './codeService.js';
import {
  listProjects,
  getProject,
  saveProject,
  deleteProject,
  saveProjectFile,
  renameProjectFile,
  deleteProjectFile,
} from './projectStore.js';
import {
  generateCreativeImage,
  editCreativeImage,
  enhanceCreativePrompt,
  validateImagePayload,
  CREATIVE_STYLES,
  ASPECT_RATIOS,
  CREATIVE_TEMPLATES,
} from './creativeService.js';
import {
  listCreativeImages,
  getCreativeImage,
  saveCreativeImage,
  deleteCreativeImage,
} from './creativeStore.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Lightweight In-Memory Sliding Window Rate Limiter
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute
const requestRecords = new Map();

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown-client';
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  const timestamps = (requestRecords.get(ip) || []).filter((ts) => ts > windowStart);

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldestTimestamp = timestamps[0];
    const retryAfter = Math.ceil((oldestTimestamp + RATE_LIMIT_WINDOW_MS - now) / 1000);
    res.setHeader('Retry-After', retryAfter > 0 ? retryAfter : 1);
    return res.status(429).json({
      success: false,
      error: `Rate limit exceeded. Too many requests. Please wait ${retryAfter}s before retrying.`,
      code: 'RATE_LIMIT_EXCEEDED',
    });
  }

  timestamps.push(now);
  requestRecords.set(ip, timestamps);
  next();
}

// Clean up stale IP records every 5 minutes
setInterval(() => {
  const windowStart = Date.now() - RATE_LIMIT_WINDOW_MS;
  for (const [ip, timestamps] of requestRecords.entries()) {
    const fresh = timestamps.filter((ts) => ts > windowStart);
    if (fresh.length === 0) {
      requestRecords.delete(ip);
    } else {
      requestRecords.set(ip, fresh);
    }
  }
}, 5 * 60 * 1000);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/api', rateLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    searchProvider: process.env.SEARCH_PROVIDER || 'duckduckgo',
    aiProvider: process.env.AI_PROVIDER || 'auto',
    hasTavilyKey: Boolean(process.env.TAVILY_API_KEY),
    hasSerperKey: Boolean(process.env.SERPER_API_KEY),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
    hasGroqKey: Boolean(process.env.GROQ_API_KEY),
  });
});

// Existing Real Web Search endpoint
app.post('/api/search', async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    const { query } = (req.body && typeof req.body === 'object') ? req.body : {};

    // 1. Input Validation
    const validation = validateSearchQuery(query);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    // 2. Execute Web Search via configured provider
    const searchResult = await executeWebSearch(validation.query, {
      timeoutMs: 15000,
    });

    // 3. Handle unconfigured API key state
    if (searchResult.configured === false) {
      return res.status(200).json({
        success: false,
        configured: false,
        provider: searchResult.provider,
        message: searchResult.message,
        instructions: searchResult.instructions,
      });
    }

    // 4. Return successful web search response
    return res.status(200).json({
      success: true,
      configured: true,
      query: validation.query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...searchResult,
    });
  } catch (error) {
    const errorMsg = error.message || 'An unexpected error occurred during search.';
    console.error('[Search API Error]:', errorMsg);
    const isTimeout = errorMsg.includes('timed out');
    return res.status(isTimeout ? 504 : 500).json({
      success: false,
      error: isTimeout
        ? 'Search request timed out. The provider took too long to respond.'
        : errorMsg,
    });
  }
});

// Intelligent AI Answer Engine Endpoint
app.post('/api/answer', async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    // 1. Request Validation
    const validation = validateAnswerRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    const { query, conversationHistory, conversationId } = validation;

    // 2. Build contextual search query for follow-up conversation turns
    const contextualSearchQuery = buildContextualSearchQuery(query, conversationHistory);

    // 3. Retrieve Real Web Search Evidence (reuses existing search pipeline)
    const searchResult = await executeWebSearch(contextualSearchQuery, {
      timeoutMs: 15000,
    });

    if (searchResult.configured === false) {
      return res.status(200).json({
        success: false,
        configured: false,
        type: 'search_provider_unconfigured',
        provider: searchResult.provider,
        message: searchResult.message,
        instructions: searchResult.instructions,
      });
    }

    // 4. Generate Grounded AI Answer with Verified Citations
    const answerResult = await generateIntelligentAnswer(query, searchResult, {
      conversationHistory,
      conversationId,
      timeoutMs: 25000,
    });

    if (answerResult.configured === false) {
      return res.status(200).json({
        success: false,
        configured: false,
        type: 'ai_provider_unconfigured',
        provider: answerResult.provider,
        message: answerResult.message,
        instructions: answerResult.instructions,
      });
    }

    // 5. Return Complete AI Answer Package
    return res.status(200).json({
      success: true,
      configured: true,
      query,
      contextualSearchQuery: contextualSearchQuery !== query ? contextualSearchQuery : undefined,
      answer: answerResult.answer,
      model: answerResult.model,
      aiProvider: answerResult.provider,
      searchProvider: searchResult.provider,
      citations: answerResult.citations,
      allSources: answerResult.allSources,
      totalCitations: answerResult.totalCitations,
      invalidCitationsRemoved: answerResult.invalidCitationsRemoved,
      confidenceScore: answerResult.confidenceScore,
      conversationId: answerResult.conversationId,
      timestamp: answerResult.timestamp,
    });
  } catch (error) {
    const errorMsg = error.message || 'An unexpected error occurred during answer generation.';
    console.error('[AI Answer API Error]:', errorMsg);
    const isTimeout = errorMsg.includes('timed out');
    return res.status(isTimeout ? 504 : 500).json({
      success: false,
      error: isTimeout
        ? 'Answer generation request timed out. Upstream services took too long to respond.'
        : errorMsg,
    });
  }
});

/**
 * Extracts and sanitizes user ID from request headers or query.
 */
function getUserId(req) {
  const raw = req.headers['x-user-id'] || req.query.userId || 'default-user';
  return typeof raw === 'string' ? raw.trim().slice(0, 80) : 'default-user';
}

// -------------------------------------------------------------
// Persistent Conversation History Management Endpoints
// -------------------------------------------------------------

// List user conversations
app.get('/api/conversations', async (req, res) => {
  try {
    const userId = getUserId(req);
    const search = req.query.search || '';
    const limit = parseInt(req.query.limit, 10) || 50;

    const conversations = await listConversations(userId, { search, limit });
    return res.json({ success: true, conversations });
  } catch (err) {
    console.error('[List Conversations Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Get single conversation by ID
app.get('/api/conversations/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    const conv = await getConversation(userId, req.params.id);

    if (!conv) {
      return res.status(404).json({ success: false, error: 'Conversation not found or access denied.' });
    }
    return res.json({ success: true, conversation: conv });
  } catch (err) {
    console.error('[Get Conversation Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Save or update conversation
app.post('/api/conversations', async (req, res) => {
  try {
    const userId = getUserId(req);
    const payload = req.body || {};

    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid conversation payload.' });
    }

    const saved = await saveConversation(userId, payload);
    return res.json({ success: true, conversation: saved });
  } catch (err) {
    console.error('[Save Conversation Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Rename conversation title
app.patch('/api/conversations/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { title } = req.body || {};

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Title is required.' });
    }

    const updated = await renameConversation(userId, req.params.id, title);
    return res.json({ success: true, conversation: updated });
  } catch (err) {
    console.error('[Rename Conversation Error]:', err.message);
    return res.status(400).json({ success: false, error: err.message });
  }
});

// Delete single conversation
app.delete('/api/conversations/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    await deleteConversation(userId, req.params.id);
    return res.json({ success: true, deleted: true, id: req.params.id });
  } catch (err) {
    console.error('[Delete Conversation Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// Real-Time Streaming & Standard AI Chat Endpoints
// -------------------------------------------------------------

// SSE Streaming AI Chat Endpoint
app.post('/api/chat/stream', async (req, res) => {
  const controller = new AbortController();

  // If client disconnects or clicks stop, abort upstream generation
  req.on('close', () => {
    controller.abort();
  });

  try {
    const {
      messages = [],
      model = 'Nova 3.5 Ultra',
      mode = 'general',
      deepThink = true,
      webSearch = false,
      conversationId,
    } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'Messages array cannot be empty.' });
    }

    // Set SSE Headers
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    await streamChatCompletion({
      messages,
      model,
      mode,
      deepThink,
      webSearch,
      signal: controller.signal,
      onChunk: (chunk) => {
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
      },
    });

    if (!res.writableEnded) {
      res.write(`data: [DONE]\n\n`);
      res.end();
    }
  } catch (streamErr) {
    const isAborted = controller.signal.aborted || streamErr.message?.includes('aborted');
    if (!res.writableEnded) {
      if (isAborted) {
        res.write(`data: ${JSON.stringify({ type: 'done', aborted: true })}\n\n`);
        res.write(`data: [DONE]\n\n`);
        res.end();
      } else {
        console.error('[Chat Stream Error]:', streamErr.message);
        res.write(`data: ${JSON.stringify({ type: 'error', error: streamErr.message })}\n\n`);
        res.write(`data: [DONE]\n\n`);
        res.end();
      }
    }
  }
});

// Standard Non-Streaming AI Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const {
      messages = [],
      model = 'Nova 3.5 Ultra',
      mode = 'general',
      deepThink = true,
      webSearch = false,
    } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'Messages array cannot be empty.' });
    }

    const completion = await generateChatCompletion({
      messages,
      model,
      mode,
      deepThink,
      webSearch,
    });

    return res.json({
      success: true,
      ...completion,
    });
  } catch (err) {
    console.error('[Chat Completion Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// Document Intelligence & Multi-Modal Ingestion Endpoints
// -------------------------------------------------------------

// Upload and ingest document (PDF, DOCX, TXT)
app.post('/api/documents/upload', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { filename, extension, contentBase64, size } = req.body || {};

    if (!filename || (!contentBase64 && contentBase64 !== '')) {
      return res.status(400).json({
        success: false,
        error: 'Filename and document content are required.',
      });
    }

    const ext = (extension || filename.split('.').pop() || '').toLowerCase();
    if (!['pdf', 'docx', 'txt'].includes(ext)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported file format '.${ext}'. Only PDF, DOCX, and TXT files are supported.`,
      });
    }

    // Decode buffer
    let buffer;
    if (typeof contentBase64 === 'string' && contentBase64.includes('base64,')) {
      buffer = Buffer.from(contentBase64.split('base64,')[1], 'base64');
    } else if (typeof contentBase64 === 'string') {
      buffer = Buffer.from(contentBase64, 'base64');
    } else {
      buffer = Buffer.from('');
    }

    // Size boundary validation (25MB limit)
    const MAX_DOC_SIZE_BYTES = 25 * 1024 * 1024;
    if (buffer.length > MAX_DOC_SIZE_BYTES) {
      return res.status(400).json({
        success: false,
        error: `File size exceeds the 25MB limit. Please upload a smaller document.`,
      });
    }

    // Parse document text and extract pages
    const parsed = parseDocumentBuffer(buffer, filename, ext);
    if (!parsed.text || parsed.text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: `The document appears to be empty or contains non-readable scanned images without OCR text.`,
      });
    }

    // Create semantic chunks
    const chunks = createDocumentChunks(parsed.text, parsed.pages);

    // Compute metrics and initial intelligence
    const intel = generateInitialDocIntelligence(parsed.text, parsed.pages, filename);

    // Human-readable size format
    const sizeDisplay = size || `${Math.max(1, Math.round(buffer.length / 1024))} KB`;

    // Persist document record
    const savedDoc = await saveDocument(userId, {
      name: filename,
      extension: ext,
      size: sizeDisplay,
      pages: parsed.pages,
      extractedText: parsed.text,
      chunks,
      summary: intel.summary,
      metrics: intel.metrics,
      keyInsights: intel.keyInsights,
    });

    return res.status(200).json({
      success: true,
      document: {
        id: savedDoc.id,
        name: savedDoc.name,
        size: savedDoc.size,
        extension: savedDoc.extension,
        pages: savedDoc.pages,
        summary: savedDoc.summary,
        metrics: savedDoc.metrics,
        keyInsights: savedDoc.keyInsights,
        chunkCount: savedDoc.chunks.length,
      },
    });
  } catch (err) {
    console.error('[Document Upload Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// List all documents for user
app.get('/api/documents', async (req, res) => {
  try {
    const userId = getUserId(req);
    const documents = await listDocuments(userId);
    return res.json({ success: true, documents });
  } catch (err) {
    console.error('[List Documents Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Get single document by ID
app.get('/api/documents/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    const doc = await getDocument(userId, req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found or access denied.' });
    }
    return res.json({ success: true, document: doc });
  } catch (err) {
    console.error('[Get Document Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Perform one of 9 AI Document Analysis operations
app.post('/api/documents/:id/analyze', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { task = 'summarize' } = req.body || {};

    const doc = await getDocument(userId, req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found or access denied.' });
    }

    const analysis = await executeDocumentAnalysis(task, doc);
    return res.json({ success: true, ...analysis });
  } catch (err) {
    console.error('[Document Analysis Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Document Q&A / Chat endpoint
app.post('/api/documents/:id/query', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { query, history = [] } = req.body || {};

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ success: false, error: 'Query is required.' });
    }

    const doc = await getDocument(userId, req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found or access denied.' });
    }

    const queryResult = await queryDocument(query, doc, history);
    return res.json({ success: true, ...queryResult });
  } catch (err) {
    console.error('[Document Query Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Delete document
app.delete('/api/documents/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    const deleted = await deleteDocument(userId, req.params.id);
    return res.json({ success: true, deleted, id: req.params.id });
  } catch (err) {
    console.error('[Delete Document Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// Phase 6: Advanced AI Code Studio Endpoints
// -------------------------------------------------------------

// AI Code Generation
app.post('/api/code/generate', async (req, res) => {
  try {
    const validation = validateCodePayload(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }
    const { prompt, language, type, context } = req.body;
    const result = await generateCode({ prompt, language, type, context });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[Code Generate Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// AI Code Explanation
app.post('/api/code/explain', async (req, res) => {
  try {
    const validation = validateCodePayload(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }
    const { code, language, mode, selection } = req.body;
    const result = await explainCode({ code, language, mode, selection });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[Code Explain Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// AI Debugging
app.post('/api/code/debug', async (req, res) => {
  try {
    const validation = validateCodePayload(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }
    const { code, language, errorMessage, stackTrace, expectedBehavior, actualBehavior } = req.body;
    const result = await debugCode({ code, language, errorMessage, stackTrace, expectedBehavior, actualBehavior });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[Code Debug Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// AI Code Optimization
app.post('/api/code/optimize', async (req, res) => {
  try {
    const validation = validateCodePayload(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }
    const { code, language, focusArea } = req.body;
    const result = await optimizeCode({ code, language, focusArea });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[Code Optimize Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// AI Coding Chat
app.post('/api/code/chat', async (req, res) => {
  try {
    const { message, history, activeFile, code, selection, language, openFiles } = req.body || {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message cannot be empty.' });
    }
    const result = await chatWithCode({ message, history, activeFile, code, selection, language, openFiles });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[Code Chat Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Security-First Sandboxed Code Execution
app.post('/api/code/execute', async (req, res) => {
  try {
    const validation = validateCodePayload(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }
    const { code, language, timeoutMs } = req.body;
    const result = await executeSandboxedCode({ code, language, timeoutMs });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[Code Execution Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// Coding Project & File Workspace Endpoints
// -------------------------------------------------------------

// List user projects
app.get('/api/projects', async (req, res) => {
  try {
    const userId = getUserId(req);
    const projects = await listProjects(userId);
    return res.json({ success: true, projects, count: projects.length });
  } catch (err) {
    console.error('[List Projects Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Get single project
app.get('/api/projects/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    const project = await getProject(userId, req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found or access denied.' });
    }
    return res.json({ success: true, project });
  } catch (err) {
    console.error('[Get Project Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Create or save project
app.post('/api/projects', async (req, res) => {
  try {
    const userId = getUserId(req);
    const saved = await saveProject(userId, req.body || {});
    return res.status(201).json({ success: true, project: saved });
  } catch (err) {
    console.error('[Save Project Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Update project
app.put('/api/projects/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    const saved = await saveProject(userId, { ...(req.body || {}), id: req.params.id });
    return res.json({ success: true, project: saved });
  } catch (err) {
    console.error('[Update Project Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Delete project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    const deleted = await deleteProject(userId, req.params.id);
    return res.json({ success: true, deleted, id: req.params.id });
  } catch (err) {
    console.error('[Delete Project Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Save or create file inside project
app.post('/api/projects/:id/files', async (req, res) => {
  try {
    const userId = getUserId(req);
    const updated = await saveProjectFile(userId, req.params.id, req.body || {});
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Project not found or access denied.' });
    }
    return res.json({ success: true, project: updated });
  } catch (err) {
    console.error('[Save Project File Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Rename file inside project
app.put('/api/projects/:id/files/rename', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { oldPath, newPath } = req.body || {};
    const updated = await renameProjectFile(userId, req.params.id, oldPath, newPath);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Project not found or access denied.' });
    }
    return res.json({ success: true, project: updated });
  } catch (err) {
    console.error('[Rename Project File Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Delete file inside project
app.delete('/api/projects/:id/files', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { filePath } = req.body || {};
    const updated = await deleteProjectFile(userId, req.params.id, filePath);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Project not found or access denied.' });
    }
    return res.json({ success: true, project: updated });
  } catch (err) {
    console.error('[Delete Project File Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// Phase 7: Advanced AI Creative Studio Endpoints
// -------------------------------------------------------------

// Creative Metadata (Styles, Aspect Ratios, Templates)
app.get('/api/creative/meta', (req, res) => {
  res.json({
    success: true,
    styles: CREATIVE_STYLES,
    aspectRatios: ASPECT_RATIOS,
    templates: CREATIVE_TEMPLATES,
  });
});

// AI Prompt Enhancement Assistant
app.post('/api/creative/enhance-prompt', async (req, res) => {
  try {
    const { prompt, style, aspectRatio } = req.body || {};
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ success: false, error: 'Prompt cannot be empty.' });
    }
    const result = await enhanceCreativePrompt(prompt, { style, aspectRatio });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[Creative Enhance Prompt Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// AI Text-to-Image Generation
app.post('/api/creative/generate', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { prompt, style, aspectRatio, negativePrompt, templateId, save = true } = req.body || {};

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ success: false, error: 'Prompt is required for image generation.' });
    }

    const generated = await generateCreativeImage({
      prompt,
      style,
      aspectRatio,
      negativePrompt,
      templateId,
    });

    let savedRecord = generated;
    if (save) {
      savedRecord = await saveCreativeImage(userId, generated);
    }

    return res.status(201).json({ success: true, image: savedRecord });
  } catch (err) {
    console.error('[Creative Generate Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// AI Image Editing
app.post('/api/creative/edit', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { sourceImage, editInstruction, targetStyle, save = true } = req.body || {};

    const validation = validateImagePayload({ image: sourceImage, editInstruction });
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    const edited = await editCreativeImage({
      sourceImage,
      editInstruction,
      targetStyle,
    });

    let savedRecord = edited;
    if (save) {
      savedRecord = await saveCreativeImage(userId, edited);
    }

    return res.status(201).json({ success: true, image: savedRecord });
  } catch (err) {
    console.error('[Creative Edit Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// List User Creative Gallery
app.get('/api/creative/gallery', async (req, res) => {
  try {
    const userId = getUserId(req);
    const images = await listCreativeImages(userId);
    return res.json({ success: true, images, count: images.length });
  } catch (err) {
    console.error('[Creative Gallery Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Get Specific Image
app.get('/api/creative/gallery/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    const image = await getCreativeImage(userId, req.params.id);
    if (!image) {
      return res.status(404).json({ success: false, error: 'Image not found or access denied.' });
    }
    return res.json({ success: true, image });
  } catch (err) {
    console.error('[Creative Get Image Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Delete Image with Confirmation
app.delete('/api/creative/gallery/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    const deleted = await deleteCreativeImage(userId, req.params.id);
    return res.json({ success: true, deleted, id: req.params.id });
  } catch (err) {
    console.error('[Creative Delete Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Central 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.url}`,
  });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err.message || err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: status === 400 ? (err.message || 'Malformed JSON payload in request body.') : 'Internal Server Error',
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[NOVA AI Engine] Express backend running on http://localhost:${PORT}`);
    console.log(`[NOVA AI Engine] Search provider: ${process.env.SEARCH_PROVIDER || 'duckduckgo'}`);
    console.log(`[NOVA AI Engine] AI provider: ${process.env.AI_PROVIDER || 'auto'}`);
  });
}

export default app;
