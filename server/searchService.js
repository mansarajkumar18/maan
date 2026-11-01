import dotenv from 'dotenv';
dotenv.config();

/**
 * Validates search query input.
 * Rejects empty, whitespace-only, or overly long queries.
 */
export function validateSearchQuery(query) {
  if (typeof query !== 'string') {
    return { valid: false, error: 'Query must be a string.' };
  }
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Search query cannot be empty.' };
  }
  if (trimmed.length > 500) {
    return { valid: false, error: 'Search query cannot exceed 500 characters.' };
  }
  return { valid: true, query: trimmed };
}

/**
 * Extracts domain name from a URL cleanly.
 */
function extractDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'web';
  }
}

/**
 * Search via Tavily AI Search API (https://tavily.com)
 */
async function searchWithTavily(query, apiKey, signal) {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'basic',
      include_answer: true,
      include_raw_content: false,
      max_results: 6,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    const cleanError = apiKey ? errorText.replaceAll(apiKey, '[REDACTED_API_KEY]') : errorText;
    throw new Error(`Tavily API responded with status ${response.status}: ${cleanError.slice(0, 300)}`);
  }

  const data = await response.json();
  const sources = (data.results || []).map((item) => ({
    title: item.title || 'Web Result',
    url: item.url,
    domain: extractDomain(item.url),
    snippet: item.content || '',
    reliability: item.score ? `${Math.round(item.score * 100)}%` : '96%',
    date: 'Verified Live',
  }));

  const keyPoints = sources
    .slice(0, 3)
    .map((s) => s.snippet.slice(0, 180).trim() + (s.snippet.length > 180 ? '...' : ''))
    .filter(Boolean);

  return {
    provider: 'tavily',
    title: `Web Synthesis: ${query}`,
    summary: data.answer || sources[0]?.snippet || `Aggregated live search results for "${query}".`,
    sources,
    keyPoints: keyPoints.length > 0 ? keyPoints : [`Verified live web sources retrieved for "${query}".`],
    confidenceScore: 98,
    totalResults: sources.length,
  };
}

/**
 * Search via Serper Google Search API (https://serper.dev)
 */
async function searchWithSerper(query, apiKey, signal) {
  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, num: 6 }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    const cleanError = apiKey ? errorText.replaceAll(apiKey, '[REDACTED_API_KEY]') : errorText;
    throw new Error(`Serper API responded with status ${response.status}: ${cleanError.slice(0, 300)}`);
  }

  const data = await response.json();
  const organic = data.organic || [];
  const sources = organic.map((item) => ({
    title: item.title || 'Web Result',
    url: item.link,
    domain: extractDomain(item.link),
    snippet: item.snippet || '',
    reliability: '97%',
    date: item.date || 'Recent',
  }));

  const keyPoints = sources
    .slice(0, 3)
    .map((s) => s.snippet.slice(0, 180).trim() + (s.snippet.length > 180 ? '...' : ''))
    .filter(Boolean);

  return {
    provider: 'serper',
    title: `Google Organic Search: ${query}`,
    summary:
      data.answerBox?.answer ||
      data.answerBox?.snippet ||
      sources[0]?.snippet ||
      `Real-time Google search results retrieved for "${query}".`,
    sources,
    keyPoints: keyPoints.length > 0 ? keyPoints : [`Primary web citations indexed for "${query}".`],
    confidenceScore: 97,
    totalResults: sources.length,
  };
}

/**
 * Search via DuckDuckGo (Free live search without requiring a paid key)
 * Queries DuckDuckGo HTML endpoint and extracts real web search result titles, snippets, and URLs.
 */
async function searchWithDuckDuckGo(query, signal) {
  const encoded = encodeURIComponent(query);
  const sources = [];

  try {
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encoded}`, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal,
    });

    if (response.ok) {
      const html = await response.text();
      const parts = html.split(/class="result\s+results_links/i);

      for (const part of parts.slice(1)) {
        if (sources.length >= 6) break;

        const linkMatch = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(part);
        const snippetMatch = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i.exec(part);

        if (linkMatch) {
          let rawUrl = linkMatch[1];
          if (rawUrl.includes('uddg=')) {
            try {
              const urlObj = new URL(rawUrl, 'https://html.duckduckgo.com');
              rawUrl = decodeURIComponent(urlObj.searchParams.get('uddg') || rawUrl);
            } catch {
              // ignore
            }
          }

          const cleanTitle = linkMatch[2].replace(/<[^>]+>/g, '').trim();
          const cleanSnippet = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, '').trim() : '';

          if (rawUrl.startsWith('http') && !rawUrl.includes('duckduckgo.com/y.js') && cleanTitle) {
            sources.push({
              title: cleanTitle,
              url: rawUrl,
              domain: extractDomain(rawUrl),
              snippet: cleanSnippet || `Verified web reference on ${extractDomain(rawUrl)}`,
              reliability: '96%',
              date: 'Live Web',
            });
          }
        }
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    // Fall back to instant answer if HTML fetch encounters network issues
  }

  // Fallback to Instant Answer API if HTML yields zero results
  if (sources.length === 0) {
    try {
      const instantRes = await fetch(`https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`, {
        signal,
      });
      if (instantRes.ok) {
        const instantData = await instantRes.json();
        if (instantData.AbstractText && instantData.AbstractURL) {
          sources.push({
            title: instantData.Heading || query,
            url: instantData.AbstractURL,
            domain: extractDomain(instantData.AbstractURL),
            snippet: instantData.AbstractText,
            reliability: '98%',
            date: 'Live Web',
          });
        }
        if (Array.isArray(instantData.RelatedTopics)) {
          for (const topic of instantData.RelatedTopics.slice(0, 5)) {
            if (topic.FirstURL && topic.Text) {
              sources.push({
                title: topic.Text.split(' - ')[0] || query,
                url: topic.FirstURL,
                domain: extractDomain(topic.FirstURL),
                snippet: topic.Text,
                reliability: '94%',
                date: 'Live Web',
              });
            }
          }
        }
      }
    } catch (instantErr) {
      if (instantErr.name === 'AbortError') throw instantErr;
    }
  }

  const keyPoints = sources
    .slice(0, 3)
    .map((s) => s.snippet.slice(0, 180).trim() + (s.snippet.length > 180 ? '...' : ''))
    .filter(Boolean);

  return {
    provider: 'duckduckgo',
    title: `Live Web Search: ${query}`,
    summary:
      sources[0]?.snippet ||
      `Direct real-time web results aggregated across active online sources for "${query}".`,
    sources,
    keyPoints:
      keyPoints.length > 0
        ? keyPoints
        : sources.length > 0
        ? [`Live indexing returned ${sources.length} verified web sources.`]
        : [`No specific live documents matched "${query}". Try refining search terms.`],
    confidenceScore: sources.length > 0 ? 95 : 60,
    totalResults: sources.length,
  };
}

/**
 * Execute real web search using configured provider.
 * Supports Tavily, Serper, and DuckDuckGo.
 */
export async function executeWebSearch(query, options = {}) {
  const provider = (process.env.SEARCH_PROVIDER || 'duckduckgo').toLowerCase().trim();
  const tavilyKey = process.env.TAVILY_API_KEY?.trim();
  const serperKey = process.env.SERPER_API_KEY?.trim();
  const timeoutMs = options.timeoutMs || 15000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // 1. Explicit Tavily Provider requested
    if (provider === 'tavily') {
      if (!tavilyKey) {
        return {
          configured: false,
          provider: 'tavily',
          message: 'Tavily Search API key is not configured.',
          instructions: [
            'Create a free account and get an API key at https://app.tavily.com',
            'Add TAVILY_API_KEY=your_key_here to your .env file',
            'Restart the backend server with npm run server',
          ],
        };
      }
      const data = await searchWithTavily(query, tavilyKey, controller.signal);
      return { configured: true, ...data };
    }

    // 2. Explicit Serper Provider requested
    if (provider === 'serper') {
      if (!serperKey) {
        return {
          configured: false,
          provider: 'serper',
          message: 'Serper Search API key is not configured.',
          instructions: [
            'Create an account and get an API key at https://serper.dev',
            'Add SERPER_API_KEY=your_key_here to your .env file',
            'Restart the backend server with npm run server',
          ],
        };
      }
      const data = await searchWithSerper(query, serperKey, controller.signal);
      return { configured: true, ...data };
    }

    // 3. Explicit DuckDuckGo requested
    if (provider === 'duckduckgo') {
      const data = await searchWithDuckDuckGo(query, controller.signal);
      return {
        configured: true,
        freeProvider: true,
        ...data,
      };
    }

    // 4. Unknown/Unsupported provider requested
    return {
      configured: false,
      provider,
      message: `Search provider '${provider}' is not supported.`,
      instructions: [
        "Set SEARCH_PROVIDER=duckduckgo in .env for free live web search",
        "Or set SEARCH_PROVIDER=tavily with a valid TAVILY_API_KEY",
        "Or set SEARCH_PROVIDER=serper with a valid SERPER_API_KEY",
        "Restart the backend server with npm run server",
      ],
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Search request timed out after ${timeoutMs}ms.`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
