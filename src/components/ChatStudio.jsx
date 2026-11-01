import React, { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import { INITIAL_CHAT_SESSIONS, AI_MODELS } from '../data/mockData';

export default function ChatStudio({ activeModel, onNotify }) {
  const [sessions, setSessions] = useState(INITIAL_CHAT_SESSIONS);
  const [currentSessionId, setCurrentSessionId] = useState('chat-1');
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [deepThinkEnabled, setDeepThinkEnabled] = useState(true);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const [codeInterpreterEnabled, setCodeInterpreterEnabled] = useState(false);
  const [expandedThoughts, setExpandedThoughts] = useState({ 'm2': true });
  const [copiedCodeIdx, setCopiedCodeIdx] = useState(null);

  const messagesEndRef = useRef(null);
  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages, isGenerating]);

  const toggleThought = (msgId) => {
    setExpandedThoughts((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const handleCreateNewChat = () => {
    const newSession = {
      id: `chat-${Date.now()}`,
      title: 'New Conversation',
      timestamp: 'Just now',
      model: activeModel.name,
      messages: [],
    };
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newSession.id);
  };

  const handleDeleteSession = (sessionId, e) => {
    e.stopPropagation();
    const filtered = sessions.filter((s) => s.id !== sessionId);
    setSessions(filtered);
    if (filtered.length > 0 && currentSessionId === sessionId) {
      setCurrentSessionId(filtered[0].id);
    }
  };

  const handleSendMessage = (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isGenerating) return;

    const userMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Update session title if first message
    const updatedMessages = [...currentSession.messages, userMessage];
    const newTitle = currentSession.messages.length === 0 ? text.slice(0, 32) + '...' : currentSession.title;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? { ...s, title: newTitle, messages: updatedMessages }
          : s
      )
    );

    setInputValue('');
    setIsGenerating(true);

    // Simulate AI generation with reasoning chain
    setTimeout(() => {
      const assistantMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        model: activeModel.name,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        thought: deepThinkEnabled
          ? `1. Deconstruct user inquiry: "${text.slice(0, 40)}...".\n2. Query internal vector knowledge store and verify system state.\n3. Formulate structured, high-accuracy breakdown with production-grade syntax.\n4. Validate edge cases, security considerations, and latency profiles.`
          : null,
        content: `Here is the comprehensive analysis and execution plan for your request:

### Solution Architecture & Implementation

\`\`\`javascript
// High-performance asynchronous pipeline
export async function executeNovaTask(payload) {
  const telemetry = { startTime: performance.now(), status: 'INITIATED' };
  
  try {
    const result = await processWithDistributedNodes(payload, {
      priority: 'CRITICAL',
      consensusVerification: true,
      maxRetries: 3
    });
    
    return {
      success: true,
      data: result,
      executionMs: performance.now() - telemetry.startTime
    };
  } catch (error) {
    console.error('Nova Execution Failure:', error);
    throw error;
  }
}
\`\`\`

### Key Architectural Advantages
* **Fault-Tolerant Resilience**: Automatic fallback across heterogeneous model clusters.
* **Near-Zero Latency**: Microsecond memory pipelining with zero copy buffers.
* **Deterministic Verification**: Output invariant checks ensure strict adherence to prompt constraints.`,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, messages: [...s.messages, assistantMessage] }
            : s
        )
      );
      setExpandedThoughts((prev) => ({ ...prev, [assistantMessage.id]: true }));
      setIsGenerating(false);
    }, 900);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeIdx(id);
    onNotify?.('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-5rem)] flex gap-6 animate-in fade-in duration-300">
      
      {/* Sidebar: Conversation History */}
      <div className="hidden md:flex flex-col w-72 shrink-0 rounded-2xl bg-navy-900/80 border border-white/10 p-3 shadow-glass backdrop-blur-xl">
        
        {/* New Chat Button */}
        <button
          onClick={handleCreateNewChat}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-glow-blue transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Conversation</span>
        </button>

        {/* Sessions List */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-1 pr-1">
          <p className="px-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">
            Recent Intelligence Threads
          </p>

          {sessions.map((sess) => (
            <div
              key={sess.id}
              onClick={() => setCurrentSessionId(sess.id)}
              className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-all ${
                sess.id === currentSessionId
                  ? 'bg-blue-600/20 border border-blue-500/40 text-white font-medium'
                  : 'hover:bg-white/5 text-slate-300 hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${sess.id === currentSessionId ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className="truncate">{sess.title}</span>
              </div>

              <button
                onClick={(e) => handleDeleteSession(sess.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all"
                title="Delete Thread"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Bottom Sidebar Info */}
        <div className="pt-3 border-t border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-cyan-400" />
            <span>{activeModel.name}</span>
          </div>
          <span className="font-mono text-emerald-400">Online</span>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col rounded-2xl bg-navy-900/80 border border-white/10 shadow-glass backdrop-blur-xl overflow-hidden">
        
        {/* Chat Thread Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-navy-950/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">
                {currentSession?.title || 'Active Session'}
              </h2>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                <span>Model: {activeModel.name}</span>
                <span>•</span>
                <span className="text-emerald-400">Latency: {activeModel.speed}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Empty Conversation State */}
          {currentSession?.messages?.length === 0 && (
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

                  <div className="flex-1 space-y-3">
                    
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
                      
                      {/* Render custom formatted text with code blocks */}
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
                      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyToClipboard(msg.content, msg.id)}
                            className="p-1 rounded hover:text-white hover:bg-white/5"
                            title="Copy Response"
                          >
                            <Copy className="w-3.5 h-3.5" />
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
                          {msg.model} • {msg.time}
                        </span>
                      </div>

                    </div>
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
                  {deepThinkEnabled ? 'Deep reasoning & synthesizing citations...' : 'Nova is generating...'}
                </span>
              </div>
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

            <button
              onClick={() => setCodeInterpreterEnabled(!codeInterpreterEnabled)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all ${
                codeInterpreterEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-navy-900/60 text-slate-400 hover:text-slate-200 border border-white/5'
              }`}
            >
              <Terminal className="w-3 h-3 text-emerald-400" />
              <span>Code Sandbox</span>
            </button>
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
              placeholder={`Message ${activeModel.name}... (Press Enter to send, Shift+Enter for newline)`}
              className="w-full bg-transparent text-sm text-white placeholder-slate-400 resize-none focus:outline-none font-sans py-1 max-h-32"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isGenerating}
              className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-glow-blue disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
