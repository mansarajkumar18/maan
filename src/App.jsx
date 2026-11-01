import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import OmniSearch from './components/OmniSearch';
import ChatStudio from './components/ChatStudio';
import CodeStudio from './components/CodeStudio';
import DocIntelligence from './components/DocIntelligence';
import CreativeStudio from './components/CreativeStudio';
import NeuralVoice from './components/NeuralVoice';
import CommandPalette from './components/CommandPalette';
import SettingsModal from './components/SettingsModal';
import Toast from './components/Toast';
import { AI_MODELS } from './data/mockData';
import {
  Activity,
  Sparkles,
  Command,
  ShieldCheck,
  Zap,
  Globe2,
  Terminal,
} from 'lucide-react';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('search');
  const [activeModel, setActiveModel] = useState(AI_MODELS[0]);
  const [tokenUsage, setTokenUsage] = useState(148290);
  const [toast, setToast] = useState(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const showNotification = (message, type = 'info') => {
    setToast({ message, type });
  };

  // Keyboard shortcut for Cmd/Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Subtle token usage tick for live atmosphere
  useEffect(() => {
    const interval = setInterval(() => {
      setTokenUsage((prev) => prev + Math.floor(Math.random() * 8) + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSendToChat = (text) => {
    setActiveTab('chat');
    showNotification('Sent context directly to AI Chat!', 'info');
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden">
      
      {/* Background Gradient Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/10 blur-[130px]" />
        <div className="absolute top-[20%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-purple-600/10 blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-cyan-600/10 blur-[120px]" />
        <div className="absolute inset-0 bg-grid-pattern opacity-60" />
      </div>

      {/* Persistent Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeModel={activeModel}
        setActiveModel={setActiveModel}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        tokenUsage={tokenUsage}
      />

      {/* Main Feature View Container */}
      <main className="flex-1 relative z-10">
        {activeTab === 'search' && (
          <OmniSearch
            onNotify={showNotification}
            onSendToChat={handleSendToChat}
          />
        )}
        {activeTab === 'chat' && (
          <ChatStudio
            activeModel={activeModel}
            onNotify={showNotification}
          />
        )}
        {activeTab === 'code' && (
          <CodeStudio
            activeModel={activeModel}
            onNotify={showNotification}
          />
        )}
        {activeTab === 'docs' && (
          <DocIntelligence
            onNotify={showNotification}
            onSendToChat={handleSendToChat}
          />
        )}
        {activeTab === 'image' && (
          <CreativeStudio
            onNotify={showNotification}
            onSendToChat={handleSendToChat}
          />
        )}
        {activeTab === 'voice' && (
          <NeuralVoice
            onNotify={showNotification}
          />
        )}
      </main>

      {/* Platform Status Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-navy-950/80 backdrop-blur-md py-4 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Cluster Telemetry Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-slate-200">MSR Neural Mesh: Online</span>
            </div>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-[11px] text-cyan-400">38ms edge latency</span>
            <span className="text-slate-600 hidden md:inline">•</span>
            <span className="text-slate-400 hidden md:inline font-mono text-[11px]">
              Engine: {activeModel.name}
            </span>
          </div>

          {/* Quick Shortcuts & Brand */}
          <div className="flex items-center gap-4 text-slate-400">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-navy-900 border border-white/5">
              <img src="/msr-logo.png" alt="MSR" className="w-4 h-4 rounded object-cover" />
              <span className="text-slate-300 font-semibold text-[11px]">MSR Digital Media</span>
            </div>
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-navy-900 border border-white/10 hover:border-white/20 text-slate-300 transition-colors"
            >
              <Command className="w-3 h-3 text-cyan-400" />
              <span className="text-[11px]">Cmd + K</span>
            </button>
            <span className="text-slate-500 font-mono text-[11px]">v3.8-Enterprise</span>
          </div>
        </div>
      </footer>

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(tab) => {
          setActiveTab(tab);
          showNotification(`Navigated to ${tab.toUpperCase()}`, 'info');
        }}
        onSelectModel={(model) => setActiveModel(model)}
        onNotify={showNotification}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onNotify={showNotification}
      />

      {/* Floating Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
