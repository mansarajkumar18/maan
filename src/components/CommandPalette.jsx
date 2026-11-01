import React, { useState, useEffect } from 'react';
import {
  Search,
  MessageSquare,
  Code,
  FileText,
  Image,
  Mic,
  Settings,
  Sparkles,
  Zap,
  ArrowRight,
  Command,
  X,
} from 'lucide-react';
import { AI_MODELS } from '../data/mockData';

export default function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onSelectModel,
  onNotify,
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'search',
      title: 'Go to Omni-Search',
      category: 'Navigation',
      icon: Search,
      action: () => {
        onNavigate('search');
        onClose();
      },
    },
    {
      id: 'chat',
      title: 'Open Multi-Modal AI Chat',
      category: 'Navigation',
      icon: MessageSquare,
      action: () => {
        onNavigate('chat');
        onClose();
      },
    },
    {
      id: 'code',
      title: 'Launch Code Studio & Sandbox',
      category: 'Navigation',
      icon: Code,
      action: () => {
        onNavigate('code');
        onClose();
      },
    },
    {
      id: 'docs',
      title: 'Analyze Document Intelligence (PDF/CSV)',
      category: 'Navigation',
      icon: FileText,
      action: () => {
        onNavigate('docs');
        onClose();
      },
    },
    {
      id: 'image',
      title: 'Generate Vision & AI Images',
      category: 'Navigation',
      icon: Image,
      action: () => {
        onNavigate('image');
        onClose();
      },
    },
    {
      id: 'voice',
      title: 'Neural Speech & Polyglot Translation',
      category: 'Navigation',
      icon: Mic,
      action: () => {
        onNavigate('voice');
        onClose();
      },
    },
    ...AI_MODELS.map((model) => ({
      id: `model-${model.id}`,
      title: `Switch active engine to ${model.name}`,
      category: 'Model Routing',
      icon: Zap,
      action: () => {
        onSelectModel(model);
        onNotify?.(`Switched active inference model to ${model.name}`, 'success');
        onClose();
      },
    })),
  ];

  const filteredActions = actions.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-navy-950/80 backdrop-blur-xl animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-navy-900 border border-white/15 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar inside Palette */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-navy-950/60">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to feature..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredActions.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No matching commands found.
            </div>
          ) : (
            filteredActions.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-navy-800 text-left transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-navy-950 text-cyan-400 group-hover:text-cyan-300">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-200 group-hover:text-white">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-slate-500">{item.category}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-navy-950/80 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-2">
            <img src="/msr-logo.png" alt="MSR" className="w-4 h-4 rounded object-cover" />
            <span className="text-slate-300 font-medium">MSR Digital Media • Omni-Palette</span>
          </span>
          <span className="font-mono text-[10px] text-slate-500">⌘K / Ctrl+K</span>
        </div>
      </div>
    </div>
  );
}
