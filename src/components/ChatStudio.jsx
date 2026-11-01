import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  Plus,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Paperclip,
  Globe,
  Brain,
  Code,
  Volume2,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronRight,
  Zap,
  Terminal,
  Share2,
  Square,
  Edit2,
  Search,
  BookOpen,
  HelpCircle,
  Lightbulb,
  Languages,
  FileText,
  AlertTriangle,
} from 'lucide-react';

const CHAT_MODES = [
  { id: 'general', label: 'General Assistant', icon: Sparkles, desc: 'Balanced intelligence & reasoning' },
  { id: 'beginner', label: 'Beginner Mode', icon: BookOpen, desc: 'Everyday analogies & plain English' },
  { id: 'technical', label: 'Technical Deep-Dive', icon: Code, desc: 'Architecture, code & complexities' },
  { id: 'summarize', label: 'Executive Summary', icon: FileText, desc: 'Key takeaways & action items' },
  { id: 'translate', label: 'Translation', icon: Languages, desc: 'Semantic cultural fidelity' },
  { id: 'brainstorm', label: 'Brainstorming', icon: Lightbulb, desc: 'Divergent ideas & tradeoff matrix' },
  { id: 'qa', label: 'Direct Q&A', icon: HelpCircle, desc: 'Concise, direct, factual resolution' },
];

export default function ChatStudio({ activeModel, onNotify }) {
  // Session list & active conversation
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatError, setChatError] = useState(null);

  // Configuration & Feature Toggles
  const [activeMode, setActiveMode] = useState('general');
  const [deepThinkEnabled, setDeepThinkEnabled] = useState(true);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const [expandedThoughts, setExpandedThoughts] = useState({});
  const [copiedCodeIdx, setCopiedCodeIdx] = useState(null);

  // History Sidebar state
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Refs
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  const userId = 'user-msr-default';

  // Find active session
  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0] || null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages, isGenerating]);

  // Load conversations on mount
  useEffect(() => {
    let isMounted = true;

    async function loadInitialConversations() {
      try {
        const res = await fetch(`/api/conversations?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && Array.isArray(data.conversations) && data.conversations.length > 0) {
            // Load full conversation details for the first one
            const firstId = data.conversations[0].id;
            const fullRes = await fetch(`/api/conversations/${firstId}?userId=${userId}`);
            if (fullRes.ok) {
              const fullData = await fullRes.json();
              if (fullData.success && fullData.conversation) {
                setSessions([fullData.conversation]);
                setCurrentSessionId(fullData.conversation.id);
                return;
              }
            }
            setSessions(data.conversations.map((c) => ({ ...c, messages: [] })));
            setCurrentSessionId(firstId);
            return;
          }
        }
      } catch (err) {
        console.warn('Could not fetch conversations from server, checking local backup:', err.message);
      }

      // Fallback: create fresh starting conversation
      if (isMounted) {
        const initial = {
          id: `chat-${Date.now()}`,
          userId,
          title: 'New Conversation',
          model: activeModel?.name || 'Nova 3.5 Ultra',
          mode: 'general',
          deepThink: true,
          webSearch: true,
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setSessions([initial]);
        setCurrentSessionId(initial.id);
      }
    }

    loadInitialConversations();
    return () => {
      isMounted = false;
    };
  }, [userId, activeModel?.name]);

  // Load single conversation messages when switched
  const handleSelectSession = async (sessId) => {
    setCurrentSessionId(sessId);
    setChatError(null);

    const existing = sessions.find((s) => s.id === sessId);
    if (existing && existing.messages && existing.messages.length > 0) {
      return;
    }

    try {
      const res = await fetch(`/api/conversations/${sessId}?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.conversation) {
          setSessions((prev) =>
            prev.map((s) => (s.id === sessId ? data.conversation : s))
          );
        }
      }
    } catch (err) {
      console.warn('Failed loading conversation details:', err.message);
    }
  };

  const toggleThought = (msgId) => {
    setExpandedThoughts((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  // Create new conversation
  const handleCreateNewChat = async () => {
    const newSession = {
      id: `chat-${Date.now()}`,
      userId,
      title: 'New Conversation',
      model: activeModel?.name || 'Nova 3.5 Ultra',
      mode: activeMode,
      deepThink: deepThinkEnabled,
      webSearch: webSearchEnabled,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setChatError(null);

    try {
      await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify(newSession),
      });
    } catch {
      // Local session is ready even if network lags
    }
  };

  // Delete conversation
  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    const filtered = sessions.filter((s) => s.id !== sessionId);
    setSessions(filtered);

    if (currentSessionId === sessionId) {
      if (filtered.length > 0) {
        handleSelectSession(filtered[0].id);
      } else {
        handleCreateNewChat();
      }
    }

    onNotify?.('Conversation deleted', 'info');

    try {
      await fetch(`/api/conversations/${sessionId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId },
      });
    } catch (err) {
      console.warn('Failed to delete on server:', err.message);
    }
  };

  // Rename conversation
  const handleStartRename = (sess, e) => {
    e.stopPropagation();
    setEditingSessionId(sess.id);
    setEditingTitle(sess.title);
  };

  const handleSaveRename = async (sessionId) => {
    const cleanTitle = editingTitle.trim() || 'Untitled Thread';
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, title: cleanTitle } : s))
    );
    setEditingSessionId(null);

    try {
      await fetch(`/api/conversations/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ title: cleanTitle }),
      });
      onNotify?.('Thread renamed', 'success');
    } catch (err) {
      console.warn('Failed renaming on server:', err.message);
    }
  };

  // Clear current thread messages
  const handleClearThread = async () => {
    if (!currentSession) return;
    const cleared = { ...currentSession, messages: [] };
    setSessions((prev) => prev.map((s) => (s.id === currentSession.id ? cleared : s)));
    onNotify?.('Conversation cleared', 'info');

    try {
      await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify(cleared),
      });
    } catch {
      // ignore
    }
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    onNotify?.('Generation stopped by user', 'info');
  };

  // Copy helper
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeIdx(id);
    onNotify?.('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  // Send Message with Real-Time Streaming
  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isGenerating) return;

    setChatError(null);

    const userMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantPlaceholderId = `ai-${Date.now()}`;
    const assistantMessage = {
      id: assistantPlaceholderId,
      role: 'assistant',
      model: activeModel?.name || 'Nova 3.5 Ultra',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      thought: null,
      content: '',
      followUps: [],
    };

    // Update session title if first message
    const isFirst = !currentSession?.messages || currentSession.messages.length === 0;
    const newTitle = isFirst ? text.slice(0, 32).trim() + (text.length > 32 ? '...' : '') : currentSession.title;
    const updatedMessages = [...(currentSession?.messages || []), userMessage, assistantMessage];

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? { ...s, title: newTitle, messages: updatedMessages }
          : s
      )
    );

    setInputValue('');
    setIsGenerating(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Build conversation payload to send to backend
      const payloadMessages = [...(currentSession?.messages || []), userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          messages: payloadMessages,
          model: activeModel?.name || 'Nova 3.5 Ultra',
          mode: activeMode,
          deepThink: deepThinkEnabled,
          webSearch: webSearchEnabled,
          conversationId: currentSessionId,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      let streamedContent = '';
      let streamedThought = '';
      let followUps = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;

            try {
              const chunk = JSON.parse(jsonStr);

              if (chunk.type === 'thought') {
                streamedThought += chunk.text;
                setExpandedThoughts((prev) => ({ ...prev, [assistantPlaceholderId]: true }));
              } else if (chunk.type === 'content') {
                streamedContent += chunk.text;
              } else if (chunk.type === 'followUps') {
                followUps = chunk.suggestions || [];
              } else if (chunk.type === 'error') {
                throw new Error(chunk.error || 'Chat generation error');
              }

              // Update assistant message progressively
              setSessions((prev) =>
                prev.map((s) => {
                  if (s.id !== currentSessionId) return s;
                  const msgs = s.messages.map((m) => {
                    if (m.id !== assistantPlaceholderId) return m;
                    return {
                      ...m,
                      content: streamedContent,
                      thought: streamedThought || null,
                      followUps,
                    };
                  });
                  return { ...s, title: newTitle, messages: msgs };
                })
              );
            } catch {
              // Ignore partial chunk decode
            }
          }
        }
      }

      // Persist final conversation state to backend store
      const finalSession = {
        ...currentSession,
        title: newTitle,
        model: activeModel?.name || 'Nova 3.5 Ultra',
        mode: activeMode,
        messages: updatedMessages.map((m) =>
          m.id === assistantPlaceholderId
            ? { ...m, content: streamedContent, thought: streamedThought || null, followUps }
            : m
        ),
      };

      await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify(finalSession),
      }).catch(() => {});
    } catch (err) {
      if (err.name === 'AbortError' || controller.signal.aborted) {
        console.log('Stream stopped by user.');
      } else {
        console.error('Chat stream failure:', err);
        setChatError(err.message || 'Failed to complete message.');
        onNotify?.(err.message || 'Chat generation error', 'error');
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Regenerate last response
  const handleRegenerate = () => {
    if (!currentSession || !currentSession.messages || currentSession.messages.length === 0) return;
    const lastUser = [...currentSession.messages].reverse().find((m) => m.role === 'user');
    if (lastUser) {
      // Remove last assistant message
      const trimmed = currentSession.messages.filter((m) => m !== currentSession.messages[currentSession.messages.length - 1]);
      setSessions((prev) =>
        prev.map((s) => (s.id === currentSession.id ? { ...s, messages: trimmed } : s))
      );
      handleSendMessage(lastUser.content);
    }
  };

  // Filter sessions by search query
  const filteredSessions = sessions.filter((s) => {
    if (!searchHistoryQuery.trim()) return true;
    const q = searchHistoryQuery.toLowerCase();
    const inTitle = (s.title || '').toLowerCase().includes(q);
    const inMsgs = (s.messages || []).some((m) => (m.content || '').toLowerCase().includes(q));
    return inTitle || inMsgs;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-5rem)] flex gap-6 animate-in fade-in duration-300">
      
      {/* Sidebar: Persistent Conversation History */}
      <div className="hidden md:flex flex-col w-72 shrink-0 rounded-2xl bg-navy-900/80 border border-white/10 p-3 shadow-glass backdrop-blur-xl">
        
        {/* New Chat Button */}
        <button
          onClick={handleCreateNewChat}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-glow-blue transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Conversation</span>
        </button>

        {/* Search Conversations Input */}
        <div className="mt-3 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchHistoryQuery}
            onChange={(e) => setSearchHistoryQuery(e.target.value)}
            placeholder="Search chat history..."
            className="w-full bg-navy-950/70 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 font-sans"
          />
        </div>

        {/* Sessions List */}
        <div className="mt-3 flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          <p className="px-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
            Intelligence Threads ({filteredSessions.length})
          </p>

          {filteredSessions.map((sess) => (
            <div
              key={sess.id}
              onClick={() => handleSelectSession(sess.id)}
              className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-all ${
                sess.id === currentSessionId
                  ? 'bg-blue-600/20 border border-blue-500/40 text-white font-medium shadow-sm'
                  : 'hover:bg-white/5 text-slate-300 hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${sess.id === currentSessionId ? 'text-cyan-400' : 'text-slate-400'}`} />
                
                {editingSessionId === sess.id ? (
                  <input
                    type="text"
                    value={editingTitle}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRename(sess.id);
                      if (e.key === 'Escape') setEditingSessionId(null);
                    }}
                    autoFocus
                    className="w-full bg-navy-950 border border-cyan-400 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none font-sans"
                  />
                ) : (
                  <span className="truncate">{sess.title || 'Untitled Thread'}</span>
                )}
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {editingSessionId === sess.id ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveRename(sess.id);
                    }}
                    className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400"
                    title="Save Title"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={(e) => handleStartRename(sess, e)}
                    className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                    title="Rename Thread"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}

                <button
                  onClick={(e) => handleDeleteSession(sess.id, e)}
                  className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all"
                  title="Delete Thread"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Sidebar Info */}
        <div className="pt-3 border-t border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-cyan-400" />
            <span>{activeModel?.name || 'Nova 3.5 Ultra'}</span>
          </div>
          <span className="font-mono text-emerald-400">Connected</span>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col rounded-2xl bg-navy-900/80 border border-white/10 shadow-glass backdrop-blur-xl overflow-hidden">
        
        {/* Chat Thread Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-navy-950/40 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">
                {currentSession?.title || 'Active Session'}
              </h2>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                <span>Model: {activeModel?.name || 'Nova 3.5 Ultra'}</span>
                <span>•</span>
                <span className="text-cyan-400">Mode: {CHAT_MODES.find((m) => m.id === activeMode)?.label}</span>
              </div>
            </div>
          </div>

          {/* Mode Selector & Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={activeMode}
              onChange={(e) => {
                setActiveMode(e.target.value);
                onNotify?.(`Switched mode to ${CHAT_MODES.find((m) => m.id === e.target.value)?.label}`, 'info');
              }}
              className="bg-navy-950/80 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-300 font-sans focus:outline-none focus:border-cyan-400/40 cursor-pointer"
            >
              {CHAT_MODES.map((m) => (
                <option key={m.id} value={m.id} className="bg-navy-900 text-white">
                  {m.label}
                </option>
              ))}
            </select>

            <button
              onClick={handleClearThread}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
              title="Clear Current Conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNotify?.('Session link copied to clipboard!', 'info')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
              title="Share Conversation"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Thread Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          
          {/* Empty Conversation State */}
          {(!currentSession?.messages || currentSession.messages.length === 0) && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-12">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-500 p-[1px] shadow-glow-blue mb-4">
                <div className="w-full h-full bg-navy-950 rounded-[15px] flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-cyan-400 animate-pulse-subtle" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">How can Nova assist your breakthrough today?</h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Choose a starter prompt or type any architecture, coding challenge, research inquiry, or creative concept.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                {[
                  'Architect a high-throughput event buffer in Rust',
                  'Compare Hyperbolic vs Toric quantum surface codes',
                  'Explain Zero-Knowledge proofs for distributed consensus',
                  'Optimize database query plan for 100M rows table',
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(preset)}
                    className="text-left text-xs p-3 rounded-xl bg-navy-950/60 hover:bg-white/5 border border-white/5 hover:border-cyan-500/30 text-slate-300 hover:text-cyan-300 transition-all"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {currentSession?.messages?.map((msg) => (
            <div key={msg.id} className="space-y-3">
              
              {/* User Message */}
              {msg.role === 'user' && (
                <div className="flex justify-end">
                  <div className="max-w-2xl rounded-2xl rounded-tr-sm bg-gradient-to-r from-blue-600/90 to-cyan-600/90 text-white p-4 shadow-lg text-sm leading-relaxed border border-cyan-400/20">
                    <div className="flex items-center justify-between text-[10px] text-cyan-200/80 mb-1 font-mono">
                      <span>You</span>
                      <span>{msg.time}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              )}

              {/* Assistant Message */}
              {msg.role === 'assistant' && (
                <div className="flex gap-3 max-w-3xl">
                  <div className="w-8 h-8 rounded-xl bg-navy-950 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 mt-1 shadow-glow-cyan/20">
                    <Sparkles className="w-4 h-4" />
                  </div>

                  <div className="flex-1 space-y-3 min-w-0">
                    
                    {/* Collapsible Chain of Thought */}
                    {msg.thought && (
                      <div className="rounded-xl bg-navy-950/70 border border-white/5 overflow-hidden">
                        <button
                          onClick={() => toggleThought(msg.id)}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors bg-white/[0.02]"
                        >
                          <div className="flex items-center gap-2">
                            <Brain className="w-3.5 h-3.5 text-purple-400" />
                            <span>Chain of Thought • Deep Reasoning</span>
                          </div>
                          {expandedThoughts[msg.id] ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {expandedThoughts[msg.id] && (
                          <div className="p-3 text-xs font-mono text-slate-400 border-t border-white/5 bg-navy-950/90 leading-relaxed whitespace-pre-wrap">
                            {msg.thought}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Formatted Content */}
                    <div className="p-5 rounded-2xl rounded-tl-sm bg-navy-950/80 border border-white/10 text-slate-200 text-sm leading-relaxed shadow-sm space-y-4">
                      
                      {/* Custom formatted text with code blocks */}
                      <div className="space-y-3 font-sans">
                        {msg.content.split('```').map((part, i) => {
                          if (i % 2 === 1) {
                            // Code Block
                            const lines = part.split('\n');
                            const lang = lines[0].trim() || 'javascript';
                            const codeText = lines.slice(1).join('\n');

                            return (
                              <div key={i} className="my-3 rounded-xl overflow-hidden border border-white/10 bg-navy-950">
                                <div className="flex items-center justify-between px-3.5 py-1.5 bg-white/5 border-b border-white/5 text-[11px] font-mono text-slate-400">
                                  <span>{lang}</span>
                                  <button
                                    onClick={() => copyToClipboard(codeText, `${msg.id}-${i}`)}
                                    className="flex items-center gap-1 hover:text-white transition-colors"
                                  >
                                    {copiedCodeIdx === `${msg.id}-${i}` ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-400" />
                                        <span className="text-emerald-400">Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copy code</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                <pre className="p-3.5 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed">
                                  <code>{codeText}</code>
                                </pre>
                              </div>
                            );
                          }

                          return (
                            <div key={i} className="whitespace-pre-wrap leading-relaxed">
                              {part}
                            </div>
                          );
                        })}
                      </div>

                      {/* Action Bar */}
                      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyToClipboard(msg.content, msg.id)}
                            className="p-1 rounded hover:text-white hover:bg-white/5"
                            title="Copy Response"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleRegenerate}
                            disabled={isGenerating}
                            className="p-1 rounded hover:text-white hover:bg-white/5"
                            title="Regenerate Response"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onNotify?.('Speech synthesis streaming audio...', 'info')}
                            className="p-1 rounded hover:text-white hover:bg-white/5"
                            title="Listen"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onNotify?.('Response marked helpful', 'success')}
                            className="p-1 rounded hover:text-white hover:bg-white/5"
                            title="Good response"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onNotify?.('Feedback noted for training checkpoint', 'info')}
                            className="p-1 rounded hover:text-white hover:bg-white/5"
                            title="Needs improvement"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="text-[10px] font-mono text-slate-400">
                          {msg.model || activeModel?.name} • {msg.time}
                        </span>
                      </div>

                    </div>

                    {/* Follow-up question suggestion chips */}
                    {msg.followUps && msg.followUps.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[11px] font-mono text-slate-400">Suggested Follow-ups:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.followUps.map((su, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendMessage(su)}
                              disabled={isGenerating}
                              className="text-left text-xs px-2.5 py-1.5 rounded-lg bg-navy-950/70 hover:bg-blue-600/20 border border-white/5 hover:border-cyan-500/30 text-slate-300 hover:text-cyan-300 transition-all"
                            >
                              {su}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}

            </div>
          ))}

          {/* Typing / Generating Indicator */}
          {isGenerating && (
            <div className="flex gap-3 max-w-2xl animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-navy-950 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 animate-spin-slow" />
              </div>
              <div className="p-4 rounded-2xl bg-navy-950/80 border border-white/10 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {deepThinkEnabled ? 'Reasoning & streaming answer...' : 'Nova is generating...'}
                </span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {chatError && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{chatError}</span>
              </div>
              <button
                onClick={handleRegenerate}
                className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-medium"
              >
                Retry
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Composer */}
        <div className="p-4 border-t border-white/10 bg-navy-950/60">
          
          {/* Mode Toggles */}
          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            <button
              onClick={() => setDeepThinkEnabled(!deepThinkEnabled)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all ${
                deepThinkEnabled
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'bg-navy-900/60 text-slate-400 hover:text-slate-200 border border-white/5'
              }`}
            >
              <Brain className="w-3 h-3 text-purple-400" />
              <span>Deep Think (CoT)</span>
            </button>

            <button
              onClick={() => setWebSearchEnabled(!webSearchEnabled)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all ${
                webSearchEnabled
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-navy-900/60 text-slate-400 hover:text-slate-200 border border-white/5'
              }`}
            >
              <Globe className="w-3 h-3 text-cyan-400" />
              <span>Live Grounding</span>
            </button>

            <span className="text-[11px] text-slate-500 font-mono hidden sm:inline ml-auto">
              Mode: {CHAT_MODES.find((m) => m.id === activeMode)?.label}
            </span>
          </div>

          {/* Input Box */}
          <div className="relative flex items-end gap-2 bg-navy-900/90 border border-white/15 rounded-2xl p-2 focus-within:border-cyan-400/60 shadow-glass transition-all">
            <button
              onClick={() => onNotify?.('Multi-modal file attachment ready', 'info')}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors shrink-0"
              title="Attach File or Image"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              rows={2}
              placeholder={`Message ${activeModel?.name || 'Nova'} in ${CHAT_MODES.find((m) => m.id === activeMode)?.label}... (Press Enter to send)`}
              className="w-full bg-transparent text-sm text-white placeholder-slate-400 resize-none focus:outline-none font-sans py-1 max-h-32"
            />

            {/* Stop Generation or Send Button */}
            {isGenerating ? (
              <button
                onClick={handleStopGeneration}
                className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition-all shrink-0"
                title="Stop Generation"
              >
                <Square className="w-4 h-4 fill-white" />
              </button>
            ) : (
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-glow-blue disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
