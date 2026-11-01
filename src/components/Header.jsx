import React, { useState } from 'react';
import msrLogo from '../assets/msr-logo.png';
import {
  Sparkles,
  Search,
  MessageSquare,
  Code,
  FileText,
  Image,
  Mic,
  Settings,
  ChevronDown,
  Command,
  Zap,
  Activity,
  Layers,
} from 'lucide-react';
import { AI_MODELS } from '../data/mockData';

export default function Header({
  activeTab,
  setActiveTab,
  activeModel,
  setActiveModel,
  onOpenCommandPalette,
  onOpenSettings,
  tokenUsage,
}) {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  const tabs = [
    { id: 'search', label: 'Omni-Search', icon: Search, badge: 'Live Web' },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare, badge: '1M Context' },
    { id: 'code', label: 'Code Studio', icon: Code, badge: 'Runner' },
    { id: 'docs', label: 'Doc Intelligence', icon: FileText, badge: 'PDF/CSV' },
    { id: 'image', label: 'Creative Studio', icon: Image, badge: '8K Vision' },
    { id: 'voice', label: 'Neural Voice', icon: Mic, badge: '30+ Lang' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-navy-950/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('search')}
              className="flex items-center gap-3 text-left group"
            >
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl overflow-hidden p-[1px] bg-gradient-to-tr from-blue-500 via-cyan-400 to-purple-500 shadow-glow-blue transition-all duration-300 group-hover:scale-105 group-hover:shadow-glow-cyan">
                <img
                  src={msrLogo}
                  alt="MSR Digital Media"
                  className="w-full h-full object-cover rounded-[11px] bg-navy-950"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-display font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-cyan-200 to-blue-400 bg-clip-text text-transparent">
                    MSR <span className="text-cyan-400 font-bold">DIGITAL MEDIA</span>
                  </span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-wider uppercase rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    AI
                  </span>
                </div>
                <span className="text-[10px] font-sans text-slate-400 -mt-0.5 tracking-wider uppercase">
                  Ideas • Design • Growth
                </span>
              </div>
            </button>
          </div>

          {/* Navigation Modes Switcher (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 bg-navy-900/90 p-1 rounded-xl border border-white/5 shadow-inner">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-blue-600/90 to-cyan-600/90 shadow-glow-cyan/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-4 h-[2px] bg-cyan-400 rounded-full shadow-[0_0_8px_#38bdf8]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Elements */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Quick Command Palette Button */}
            <button
              onClick={onOpenCommandPalette}
              className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-navy-900/80 border border-white/10 hover:border-white/20 text-slate-400 hover:text-slate-200 text-xs transition-colors"
              title="Search commands, tools & prompts (Ctrl+K)"
            >
              <Command className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono text-[11px] text-slate-500">⌘K</span>
            </button>

            {/* Model Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-navy-900/90 border border-white/10 hover:border-cyan-500/40 text-xs text-slate-200 transition-all shadow-sm"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-medium hidden md:inline">{activeModel.name}</span>
                <span className="font-medium md:hidden">{activeModel.name.split(' ')[0]}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {modelDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-navy-900/95 border border-white/10 shadow-2xl p-2 z-50 backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-white/5 mb-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Neural Engine Core
                    </p>
                  </div>
                  <div className="space-y-1">
                    {AI_MODELS.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setActiveModel(model);
                          setModelDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 ${
                          activeModel.id === model.id
                            ? 'bg-blue-600/20 border border-blue-500/40'
                            : 'hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 bg-gradient-to-r ${model.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-white truncate">{model.name}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                              {model.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{model.description}</p>
                          <div className="flex items-center gap-2 mt-1.5 text-[9px] font-mono text-cyan-400/90">
                            <span>⚡ {model.speed}</span>
                            <span>•</span>
                            <span>📚 {model.context}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Token / Telemetry Meter (Desktop) */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-navy-900/60 border border-white/5 text-[11px] font-mono text-slate-400">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>{tokenUsage.toLocaleString()} tokens</span>
            </div>

            {/* Settings Trigger */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
              title="Platform Settings & Preferences"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden flex items-center justify-between overflow-x-auto py-2 border-t border-white/5 no-scrollbar gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-white bg-blue-600/30 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
