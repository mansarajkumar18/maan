import React, { useState } from 'react';
import {
  Sliders,
  Key,
  Shield,
  Trash2,
  Download,
  Check,
  X,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, onNotify }) {
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [streamResponses, setStreamResponses] = useState(true);
  const [webSearchGrounding, setWebSearchGrounding] = useState(true);
  const [guardrailsEnabled, setGuardrailsEnabled] = useState(true);
  const [apiKey, setApiKey] = useState('nv-live-94a8e291bc44f01');
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onNotify?.('Inference parameters and security policies updated!', 'success');
    onClose();
  };

  const handleClearCache = () => {
    onNotify?.('Client-side cache and telemetry buffer purged!', 'info');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-xl animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-navy-900 border border-white/15 shadow-2xl overflow-hidden space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-navy-950/60">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Platform Settings & Telemetry</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* Section: Inference Tuning */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" />
              Inference Tuning
            </h4>

            {/* Temperature Slider */}
            <div className="space-y-2 p-3.5 rounded-xl bg-navy-950/70 border border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Temperature (Creativity)</span>
                <span className="font-mono text-cyan-400 font-bold">{temperature}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-navy-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Deterministic (0.0)</span>
                <span>Balanced (0.7)</span>
                <span>Exploratory (1.0)</span>
              </div>
            </div>

            {/* Max Output Tokens */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-navy-950/70 border border-white/5 text-xs">
              <div>
                <span className="text-slate-300 font-medium block">Max Generation Window</span>
                <span className="text-[11px] text-slate-500">Tokens reserved per completion stream</span>
              </div>
              <select
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="px-3 py-1.5 rounded-lg bg-navy-900 border border-white/10 font-mono text-xs text-cyan-300 focus:outline-none"
              >
                <option value={2048}>2,048 tokens</option>
                <option value={4096}>4,096 tokens</option>
                <option value={8192}>8,192 tokens</option>
                <option value={16384}>16,384 tokens</option>
              </select>
            </div>
          </div>

          {/* Section: Grounding & Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              Safety & Verification
            </h4>

            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-xl bg-navy-950/70 border border-white/5 cursor-pointer">
                <span className="text-xs text-slate-300">Live Web Grounding & Fact Checking</span>
                <input
                  type="checkbox"
                  checked={webSearchGrounding}
                  onChange={(e) => setWebSearchGrounding(e.target.checked)}
                  className="rounded bg-navy-900 border-white/20 text-cyan-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-navy-950/70 border border-white/5 cursor-pointer">
                <span className="text-xs text-slate-300">Strict Hallucination Filter & Guardrails</span>
                <input
                  type="checkbox"
                  checked={guardrailsEnabled}
                  onChange={(e) => setGuardrailsEnabled(e.target.checked)}
                  className="rounded bg-navy-900 border-white/20 text-purple-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Section: API Access */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Key className="w-3.5 h-3.5" />
              API Credentials
            </h4>

            <div className="p-3.5 rounded-xl bg-navy-950/70 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Enterprise Engine Secret</span>
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="text-[11px] text-cyan-400 hover:underline"
                >
                  {showKey ? 'Hide' : 'Reveal'}
                </button>
              </div>
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-navy-900 border border-white/10 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Section: Storage & Maintenance */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
            <button
              onClick={handleClearCache}
              className="flex items-center gap-2 text-xs text-rose-400 hover:text-rose-300 p-2 rounded-lg hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Purge Local Buffer & Logs</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-navy-950/80 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-glow-blue transition-all"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
