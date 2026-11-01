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
app.use(express.json({ limit: '1mb' }));
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
