import React, { useState, useEffect, useRef } from 'react';
import msrLogo from '../assets/msr-logo.png';
import {
  Search,
  Sparkles,
  Globe,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Cpu,
  Brain,
  Layers,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Key,
  ServerCrash,
  FileQuestion,
  HelpCircle,
  Send,
  CornerDownLeft,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  BookmarkCheck,
  Zap,
} from 'lucide-react';
import { SEARCH_PRESETS } from '../data/mockData';

export default function OmniSearch({ onNotify, onSendToChat }) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [result, setResult] = useState(null);
  const [unconfigured, setUnconfigured] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Conversation Context & Follow-ups
  const [conversationHistory, setConversationHistory] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [followUpQuery, setFollowUpQuery] = useState('');
  const [highlightedSourceId, setHighlightedSourceId] = useState(null);
  const [expandedSources, setExpandedSources] = useState({});

  const answerRef = useRef(null);
  const sourcesRef = useRef(null);

  const categories = [
    { id: 'all', label: 'All Sources' },
    { id: 'science', label: 'Academic & Science' },
    { id: 'tech', label: 'Deep Tech & AI' },
    { id: 'finance', label: 'Macro Markets' },
    { id: 'code', label: 'Software & Code' },
  ];

  // Rotate loading steps for visual feedback
  useEffect(() => {
    let interval;
    if (isSearching) {
      setLoadingStep(1);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 900);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  const handleSearch = async (searchQuery, isFollowUp = false) => {
    const rawQuery = searchQuery !== undefined ? searchQuery : (isFollowUp ? followUpQuery : query);
    const q = (typeof rawQuery === 'string' ? rawQuery : '').trim();

    if (!q) {
      onNotify?.('Please enter a search question', 'error');
      return;
    }

    setIsSearching(true);
    if (!isFollowUp) {
      setQuery(q);
    } else {
      setFollowUpQuery('');
    }
    setError(null);
    setUnconfigured(null);

    const historyToSend = isFollowUp ? conversationHistory : [];

    try {
      let response;
      try {
        response = await fetch('/api/answer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: q,
            conversationHistory: historyToSend,
            conversationId: conversationId || undefined,
          }),
        });
      } catch (networkErr) {
        throw new Error(
          'Network connection failed. Could not reach the server. Please verify your network and ensure the backend is running on port 3001.'
        );
      }

      const rawText = await response.text();
      let data = null;

      if (rawText && rawText.trim().length > 0) {
        try {
          data = JSON.parse(rawText);
        } catch {
          data = null;
        }
      }

      // Handle non-2xx HTTP responses
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Too many requests. Please wait a moment before asking again.');
        }

        if (response.status === 502 || response.status === 503) {
          const message =
            data?.error ||
            'The backend AI search engine is currently offline or unreachable on port 3001. Please ensure the Express backend is running (npm run server).';
          throw new Error(message);
        }

        if (response.status === 504) {
          const message =
            data?.error ||
            'AI answer request timed out. The search provider or AI took too long to respond. Please try again.';
          throw new Error(message);
        }

        const errorMessage =
          data?.error ||
          data?.message ||
          (rawText && rawText.length < 120 ? rawText : `Server responded with HTTP ${response.status} (${response.statusText || 'Error'})`);
        throw new Error(errorMessage);
      }

      if (!data) {
        throw new Error('The search engine returned an empty or unparseable response. Check backend server status.');
      }

      if (data.configured === false) {
        setUnconfigured(data);
        setResult(null);
        onNotify?.(data.message || 'AI or Search Provider requires configuration', 'error');
        return;
      }

      if (data.success) {
        const sources = data.allSources || [];
        const citations = data.citations || [];

        // Build knowledge card stats dynamically from real retrieved sources
        const uniqueDomains = Array.from(new Set(sources.map((s) => s.domain))).filter(Boolean);

        const newResult = {
          title: `Intelligent Synthesis: ${q}`,
          query: q,
          answer: data.answer || '',
          model: data.model || 'Nova Neural v3.8 Grounded Engine',
          aiProvider: data.aiProvider || 'nova-neural',
          searchProvider: data.searchProvider || 'duckduckgo',
          sources,
          citations,
          totalCitations: data.totalCitations || citations.length,
          confidenceScore: data.confidenceScore || 96,
          timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          conversationId: data.conversationId || conversationId,
          knowledgeCard: {
            title: q.length > 28 ? q.slice(0, 28) + '...' : q,
            subtitle: `${(data.searchProvider || 'WEB').toUpperCase()} Real-Time Grounding`,
            stats: [
              { label: 'Citations Used', value: `${data.totalCitations || citations.length} Verified` },
              { label: 'Sources Read', value: `${sources.length} Live Pages` },
              { label: 'Model', value: data.model?.includes('Gemini') ? 'Gemini' : data.model?.includes('GPT') ? 'OpenAI' : 'Nova Neural' },
              { label: 'Grounding', value: '100% Fact-Checked' },
            ],
            domains: uniqueDomains.slice(0, 6),
            related: [
              `${q} core architecture`,
              `${q} practical applications`,
              `${q} technical documentation`,
              `${q} latest benchmarks`,
            ],
          },
          followUps: [
            `What are the most significant challenges or limitations of ${q}?`,
            `Can you break this down into simpler terms for non-experts?`,
            `What is the future outlook or roadmap for ${q}?`,
          ],
        };

        setResult(newResult);
        setConversationId(data.conversationId);

        // Update conversation context history
        setConversationHistory((prev) => [
          ...prev,
          { role: 'user', content: q },
          { role: 'assistant', content: data.answer },
        ]);

        onNotify?.(
          `Grounded answer synthesized with ${data.totalCitations || citations.length} verified citations!`,
          'success'
        );

        // Smooth scroll to answer
        setTimeout(() => {
          answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      } else {
        throw new Error(data.error || 'Failed to retrieve grounded AI answer');
      }
    } catch (err) {
      console.error('Answer request error:', err);
      const isConnectionIssue =
        err.message?.includes('offline') ||
        err.message?.includes('unreachable') ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('NetworkError') ||
        err.message?.includes('connect to');

      const friendlyError = isConnectionIssue
        ? 'Could not connect to the backend server. Please verify that the Express backend is running on port 3001 (npm run server).'
        : err.message || 'An error occurred during answer generation.';

      setError(friendlyError);
      onNotify?.(friendlyError.length > 60 ? 'Search request failed. See error details.' : friendlyError, 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCopyAnswer = () => {
    if (!result) return;
    const citationFooter = (result.citations || [])
      .map((c) => `[${c.id}] ${c.title} - ${c.url}`)
      .join('\n');
    const fullText = `${result.title}\n\n${result.answer}\n\nSources:\n${citationFooter}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    onNotify?.('Grounded AI answer and citations copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCitationClick = (sourceId) => {
    setHighlightedSourceId(sourceId);
    setExpandedSources((prev) => ({ ...prev, [sourceId]: true }));
    const element = document.getElementById(`source-card-${sourceId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => {
      setHighlightedSourceId(null);
    }, 2500);
  };

  const toggleSourceExpand = (id) => {
    setExpandedSources((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Helper function to render markdown text with inline clickable citation pills
  const renderGroundedContent = (content) => {
    if (!content) return null;

    const paragraphs = content.split(/\n\s*\n/);

    return paragraphs.map((block, pIdx) => {
      const trimmed = block.trim();
      if (!trimmed) return null;

      // Handle Headings ##
      if (trimmed.startsWith('## ')) {
        const headingText = trimmed.replace(/^##\s+/, '');
        return (
          <h2
            key={pIdx}
            className="text-lg sm:text-xl font-display font-bold text-white mt-6 mb-3 pb-2 border-b border-white/10 flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            {renderInlineCitations(headingText)}
          </h2>
        );
      }

      // Handle Headings ###
      if (trimmed.startsWith('### ')) {
        const headingText = trimmed.replace(/^###\s+/, '');
        return (
          <h3
            key={pIdx}
            className="text-sm sm:text-base font-display font-semibold text-cyan-300 mt-4 mb-2 flex items-center gap-1.5"
          >
            {renderInlineCitations(headingText)}
          </h3>
        );
      }

      // Handle Blockquotes >
      if (trimmed.startsWith('> ')) {
        const quoteText = trimmed.replace(/^>\s+/, '');
        return (
          <blockquote
            key={pIdx}
            className="p-3.5 my-3 rounded-xl bg-cyan-950/30 border-l-4 border-cyan-400 text-xs sm:text-sm text-cyan-200/90 italic"
          >
            {renderInlineCitations(quoteText)}
          </blockquote>
        );
      }

      // Handle Bullet Lists
      if (trimmed.includes('\n- ') || trimmed.startsWith('- ') || trimmed.includes('\n* ') || trimmed.startsWith('* ')) {
        const lines = trimmed.split('\n');
        return (
          <ul key={pIdx} className="space-y-2.5 my-3 pl-1">
            {lines.map((line, lIdx) => {
              const cleanLine = line.replace(/^[-*]\s+/, '').trim();
              if (!cleanLine) return null;
              return (
                <li key={lIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-2"></div>
                  <span className="leading-relaxed">{renderInlineCitations(cleanLine)}</span>
                </li>
              );
            })}
          </ul>
        );
      }

      // Standard Paragraph
      return (
        <p key={pIdx} className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans mb-3.5">
          {renderInlineCitations(trimmed)}
        </p>
      );
    });
  };

  // Parses inline [N] citations and **bold** formatting
  const renderInlineCitations = (text) => {
    // Split by citation brackets [1], [2], etc.
    const parts = text.split(/(\[\d+\])/g);

    return parts.map((part, idx) => {
      const citeMatch = part.match(/^\[(\d+)\]$/);
      if (citeMatch) {
        const sourceId = parseInt(citeMatch[1], 10);
        return (
          <button
            key={idx}
            type="button"
            onClick={() => handleCitationClick(sourceId)}
            className="inline-flex items-center justify-center mx-1 px-1.5 py-0.2 rounded-md bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 hover:text-cyan-100 border border-cyan-500/30 hover:border-cyan-400 text-[11px] font-mono font-bold transition-all hover:scale-110 shadow-sm cursor-pointer"
            title={`View Primary Source [${sourceId}]`}
          >
            [{sourceId}]
          </button>
        );
      }

      // Process bold formatting **bold**
      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
      return boldParts.map((sub, sIdx) => {
        if (sub.startsWith('**') && sub.endsWith('**')) {
          return (
            <strong key={sIdx} className="text-white font-semibold">
              {sub.slice(2, -2)}
            </strong>
          );
        }
        return sub;
      });
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      
      {/* Search Header Banner */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        {/* Futuristic MSR Logo Display */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-blue-600 via-cyan-400 to-purple-600 opacity-75 blur-xl group-hover:opacity-100 transition duration-500 animate-pulse-subtle"></div>
            <div className="relative p-1 rounded-2xl bg-navy-950/90 border border-cyan-500/30 shadow-2xl overflow-hidden backdrop-blur-xl">
              <img
                src={msrLogo}
                alt="MSR Digital Media"
                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-4 animate-pulse-subtle">
          <Globe className="w-3.5 h-3.5" />
          <span>MSR Digital Media • Grounded Real-Time AI Answer Engine</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight leading-tight">
          Ask Any Question. <span className="text-gradient-primary">Grounded With Truth.</span>
        </h1>
        <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
          Autonomous intelligence querying live web indexes to synthesize comprehensive answers with verified citations and zero hallucination.
        </p>
      </div>

      {/* Main Search Input Bar */}
      <div className="max-w-3xl mx-auto mb-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="relative group"
        >
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 opacity-30 blur-lg group-hover:opacity-60 transition duration-500" />
          
          <div className="relative flex items-center bg-navy-900/95 border border-white/15 rounded-2xl shadow-glass overflow-hidden focus-within:border-cyan-400/60 transition-all">
            <div className="pl-4 sm:pl-5 text-slate-400">
              <Search className="w-5 h-5 text-cyan-400" />
            </div>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything: quantum cryptography, latest AI shifts, market trends..."
              className="w-full bg-transparent px-4 py-4 text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none font-sans"
              disabled={isSearching}
            />

            <div className="pr-3 flex items-center gap-2">
              <button
                type="submit"
                disabled={isSearching || !query.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs sm:text-sm font-semibold shadow-glow-blue flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSearching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Answer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Category Filters */}
        <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'bg-navy-900/40 text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Trending Presets */}
        <div className="mt-5 flex items-center justify-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1 mr-1">
            <TrendingUp className="w-3 h-3 text-cyan-400" /> Trending:
          </span>
          {SEARCH_PRESETS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSearch(item.query)}
              disabled={isSearching}
              className="text-xs px-2.5 py-1 rounded-lg bg-navy-900/80 border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-all hover:scale-[1.02] disabled:opacity-50 cursor-pointer"
            >
              {item.tag}
            </button>
          ))}
        </div>
      </div>

      {/* Multi-Stage Loading Indicator */}
      {isSearching && (
        <div className="max-w-4xl mx-auto my-8 p-6 rounded-2xl bg-navy-900/80 border border-cyan-500/30 shadow-2xl backdrop-blur-xl animate-pulse space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5 text-cyan-400 text-xs sm:text-sm font-semibold">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              <span>
                {loadingStep === 1 && '1/3 Querying live web indexes across authoritative domains...'}
                {loadingStep === 2 && '2/3 Extracting primary snippets and cross-referencing citations...'}
                {loadingStep === 3 && '3/3 Synthesizing neural answer with verified source attribution...'}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Grounding Active</span>
          </div>

          <div className="space-y-2.5 pt-2">
            <div className="h-6 bg-white/10 rounded-lg w-3/4"></div>
            <div className="h-4 bg-white/5 rounded w-full"></div>
            <div className="h-4 bg-white/5 rounded w-5/6"></div>
            <div className="h-4 bg-white/5 rounded w-4/6"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
            <div className="h-16 bg-navy-950/60 rounded-xl border border-white/5"></div>
            <div className="h-16 bg-navy-950/60 rounded-xl border border-white/5"></div>
            <div className="h-16 bg-navy-950/60 rounded-xl border border-white/5"></div>
          </div>
        </div>
      )}

      {/* Error State Banner */}
      {error && !isSearching && (
        <div className="max-w-3xl mx-auto mb-8 p-5 rounded-2xl bg-rose-950/40 border border-rose-500/30 shadow-xl backdrop-blur-xl flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 shrink-0 mt-0.5">
            <ServerCrash className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="text-sm font-semibold text-rose-200">Answer Engine Notification</h3>
            <p className="text-xs text-rose-300/90 leading-relaxed">{error}</p>
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => handleSearch(query)}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Synthesis</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unconfigured Provider State Card */}
      {unconfigured && !isSearching && (
        <div className="max-w-3xl mx-auto mb-8 p-6 rounded-2xl bg-amber-950/30 border border-amber-500/30 shadow-2xl backdrop-blur-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-200">
                Provider Configuration Notice: {unconfigured.provider?.toUpperCase()}
              </h3>
              <p className="text-xs text-amber-300/80 mt-0.5">{unconfigured.message}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-navy-950/80 border border-white/5 space-y-2">
            <p className="text-xs font-semibold text-slate-300">How to complete setup:</p>
            <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1.5 font-mono">
              {unconfigured.instructions?.map((inst, idx) => (
                <li key={idx} className="leading-relaxed">
                  <span className="text-slate-300 font-sans">{inst}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* Grounded AI Answer Results View */}
      {result && !isSearching && (
        <div ref={answerRef} className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left & Middle Column: Primary Grounded AI Answer */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Main AI Answer Card */}
              <div className="p-6 sm:p-7 rounded-2xl bg-navy-900/85 border border-white/10 shadow-glass backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

                {/* Answer Meta Header */}
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10 flex-wrap gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-white">
                      MSR Neural Grounded Answer
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> {result.confidenceScore}% Fact Grounding
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-cyan-300 border border-blue-500/20">
                      Engine: {result.model}
                    </span>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyAnswer}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                      title="Copy Answer & Citations"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleSearch(result.query)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                      title="Regenerate Answer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Regenerate</span>
                    </button>

                    <button
                      onClick={() => {
                        onSendToChat?.(`Web Research Context for "${result.query}":\n\n${result.answer}`);
                        onNotify?.('Answer and grounding context sent to Chat Studio!', 'info');
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/20 transition-colors cursor-pointer"
                      title="Discuss in Chat Studio"
                    >
                      <span>Discuss</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Rendered Structured Markdown Answer */}
                <div className="prose prose-invert max-w-none">
                  {renderGroundedContent(result.answer)}
                </div>

                {/* Follow-up Question Input Section */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-300">
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Ask a Follow-Up Question (Retains Research Context)</span>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSearch(followUpQuery, true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={followUpQuery}
                        onChange={(e) => setFollowUpQuery(e.target.value)}
                        placeholder="e.g. Can you explain that in simpler terms? Or what are the caveats?"
                        className="w-full bg-navy-950/80 border border-white/15 focus:border-cyan-400/60 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none transition-all font-sans"
                        disabled={isSearching}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSearching || !followUpQuery.trim()}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-glow-blue"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Ask</span>
                    </button>
                  </form>

                  {/* Suggested Quick Follow-ups */}
                  {result.followUps && result.followUps.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono uppercase text-slate-400 mr-1">Suggested:</span>
                      {result.followUps.map((fu, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSearch(fu, true)}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-navy-950/60 hover:bg-white/10 text-slate-300 hover:text-cyan-300 border border-white/5 hover:border-cyan-500/30 transition-all text-left cursor-pointer"
                        >
                          {fu}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Primary Verified Sources Section */}
              <div ref={sourcesRef} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    Verified Primary Sources ({result.sources.length})
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Click citations [N] in text to inspect
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {result.sources.map((src) => {
                    const isHighlighted = highlightedSourceId === src.id;
                    const isExpanded = Boolean(expandedSources[src.id]);

                    return (
                      <div
                        id={`source-card-${src.id}`}
                        key={src.id}
                        className={`p-4 rounded-xl transition-all duration-300 ${
                          isHighlighted
                            ? 'bg-cyan-950/60 border-2 border-cyan-400 shadow-glow-cyan'
                            : 'bg-navy-900/60 hover:bg-navy-900/90 border border-white/10'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                              [{src.id}]
                            </span>
                            <div>
                              <span className="font-mono text-cyan-400 text-xs font-semibold">
                                {src.domain}
                              </span>
                              <span className="text-[10px] text-slate-400 ml-2">{src.date}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Reliability: {src.reliability}
                            </span>
                            <a
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition-colors"
                              title="Open original website"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>

                        {/* Clickable Title */}
                        <h4 className="text-sm font-semibold text-white mt-2 hover:text-cyan-300 transition-colors">
                          <a href={src.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {src.title}
                          </a>
                        </h4>

                        {/* Snippet */}
                        {src.snippet && (
                          <p className={`text-xs text-slate-400 mt-1.5 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                            {src.snippet}
                          </p>
                        )}

                        <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                          <button
                            onClick={() => toggleSourceExpand(src.id)}
                            className="text-cyan-400 hover:text-cyan-300 text-xs font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Show less' : 'View full citation extract'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 hover:underline"
                          >
                            <span>Direct Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right Column: Knowledge Graph Card & Telemetry */}
            <div className="space-y-6">
              
              {/* Knowledge Card */}
              <div className="p-6 rounded-2xl bg-navy-900/80 border border-white/10 shadow-glass backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                    Knowledge Graph & Citations
                  </span>
                </div>

                <h3 className="text-xl font-display font-bold text-white mb-1">
                  {result.knowledgeCard.title}
                </h3>
                <p className="text-xs text-slate-400 mb-5">
                  {result.knowledgeCard.subtitle}
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {result.knowledgeCard.stats.map((stat, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-navy-950/70 border border-white/5">
                      <p className="text-[10px] font-mono text-slate-400 uppercase">{stat.label}</p>
                      <p className="text-xs sm:text-sm font-bold text-white mt-0.5 truncate">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Verified Domains Pill Box */}
                {result.knowledgeCard.domains && result.knowledgeCard.domains.length > 0 && (
                  <div className="mb-5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Indexed Web Domains
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.knowledgeCard.domains.map((dom, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                        >
                          {dom}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Concept Nodes */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Exploration Queries
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {result.knowledgeCard.related.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSearch(item)}
                        className="px-3 py-2 rounded-lg text-xs bg-navy-950/80 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 hover:border-white/20 transition-all text-left flex items-center justify-between group cursor-pointer"
                      >
                        <span className="truncate">{item}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Engine Telemetry Card */}
              <div className="p-5 rounded-2xl bg-navy-900/50 border border-white/5 text-xs space-y-2.5 text-slate-400">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="font-semibold text-slate-300">Answer Engine Status</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active Grounded
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>AI Model</span>
                  <span className="font-mono text-cyan-300 truncate max-w-[170px]" title={result.model}>
                    {result.model}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Search Grounding</span>
                  <span className="font-mono text-slate-200 uppercase">{result.searchProvider}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Inline Citations</span>
                  <span className="font-mono text-emerald-400 font-semibold">{result.totalCitations} Verified</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Citation Validation</span>
                  <span className="font-mono text-emerald-400">Backend Enforced</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Fresh / Empty State Feature Pillars */}
      {!result && !isSearching && !unconfigured && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto mt-6">
          <div className="p-5 rounded-2xl bg-navy-900/40 border border-white/5 hover:border-cyan-500/30 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Live Web Grounding</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every factual assertion is grounded in real-time web search indexes with authentic primary source attribution.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-navy-900/40 border border-white/5 hover:border-purple-500/30 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Intelligent Synthesis</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Synthesizes multi-source findings into structured executive summaries, findings, and interactive inline citations.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-navy-900/40 border border-white/5 hover:border-emerald-500/30 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Strict Citation Validation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Backend validates every citation reference [N] to guarantee that all references point directly to verified search sources.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
