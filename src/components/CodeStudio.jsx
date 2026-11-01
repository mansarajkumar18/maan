import React, { useState } from 'react';
import {
  Code,
  Play,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Terminal,
  Cpu,
  Layers,
  FileCode2,
  CheckCircle2,
  AlertTriangle,
  Download,
  Share2,
  Maximize2,
  Wand2,
} from 'lucide-react';
import { CODE_PRESETS, AI_MODELS } from '../data/mockData';

export default function CodeStudio({ activeModel, onNotify }) {
  const [selectedPreset, setSelectedPreset] = useState(CODE_PRESETS[0]);
  const [code, setCode] = useState(CODE_PRESETS[0].code);
  const [activeTab, setActiveTab] = useState('output'); // 'output' | 'analysis' | 'tests'
  const [isRunning, setIsRunning] = useState(false);
  const [isRefactoring, setIsRefactoring] = useState(false);
  const [executionOutput, setExecutionOutput] = useState({
    status: 'success',
    duration: '24.2 ms',
    memory: '14.8 MB',
    logs: [
      '[Nova Engine v3.8] Compilation started with LLVM JIT backend...',
      '[Telemetry] Initializing high-throughput ring buffer...',
      '[Live Stream] Shards 0-63 reporting NOMINAL state.',
      '✓ Telemetry cluster healthy: 49,120 req/s @ 18.4ms p99',
    ],
  });
  const [copied, setCopied] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset);
    setCode(preset.code);
    onNotify?.(`Loaded preset: ${preset.name}`, 'info');
  };

  const handleRunCode = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setExecutionOutput({
        status: 'success',
        duration: `${(15 + Math.random() * 20).toFixed(1)} ms`,
        memory: `${(12 + Math.random() * 6).toFixed(1)} MB`,
        logs: [
          `[${activeModel.name}] Executing sandbox test suite...`,
          `[Runtime] Target environment: Node.js v22.14 / V8 JIT`,
          `[Memory Profile] Peak allocated heap: ${(12 + Math.random() * 5).toFixed(1)} MB`,
          `✓ All 12 invariant tests PASSED (0 regressions)`,
          `[Benchmark] Execution completed in ${(15 + Math.random() * 20).toFixed(1)} ms`,
        ],
      });
      onNotify?.('Code executed successfully in isolated sandbox!', 'success');
    }, 700);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    onNotify?.('Code copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyAiTransformation = (type) => {
    setIsRefactoring(true);
    setTimeout(() => {
      setIsRefactoring(false);
      if (type === 'optimize') {
        setCode((prev) => `// [Optimized by ${activeModel.name} - Zero-Copy SIMD Acceleration]\n` + prev);
        onNotify?.('Applied performance optimizations!', 'success');
      } else if (type === 'types') {
        setCode((prev) => `// [TypeScript Strict Definitions Added by ${activeModel.name}]\n` + prev);
        onNotify?.('Generated strict TypeScript interfaces!', 'success');
      } else if (type === 'tests') {
        setActiveTab('tests');
        onNotify?.('Generated test harness with 100% branch coverage!', 'success');
      }
      setAiPrompt('');
    }, 800);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1">
            <Code className="w-4 h-4" />
            <span>Interactive Code Studio</span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px]">
              Multi-Language
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
            High-Performance AI Coding Workspace
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Engineered with AST synthesis, live sandbox execution, and real-time complexity analysis.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-navy-850 hover:bg-navy-800 text-slate-300 hover:text-white border border-white/10 text-xs font-medium transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-navy-950 font-semibold text-xs shadow-glow-blue transition-all disabled:opacity-50"
          >
            {isRunning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            <span>{isRunning ? 'Executing...' : 'Run Sandbox'}</span>
          </button>
        </div>
      </div>

      {/* Preset Selector Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 custom-scrollbar">
        <span className="text-xs text-slate-400 shrink-0 flex items-center gap-1.5 font-medium pl-1">
          <FileCode2 className="w-3.5 h-3.5 text-slate-400" /> Presets:
        </span>
        {CODE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleSelectPreset(preset)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
              selectedPreset.id === preset.id
                ? 'bg-blue-600/20 border-blue-500 text-blue-200 shadow-glow-blue'
                : 'bg-navy-850/60 hover:bg-navy-800/80 border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Main Split Layout: Code Editor + Runner Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Code Editor (7 cols) */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl bg-navy-900/90 border border-white/10 overflow-hidden shadow-2xl backdrop-blur-xl">
          {/* Editor Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-navy-950/80 border-b border-white/10 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
              </div>
              <span className="text-slate-400 font-mono text-[11px] font-semibold">
                {selectedPreset.language.toUpperCase()} • {selectedPreset.name}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-slate-400">
              <span className="font-mono text-[11px] text-slate-400">UTF-8</span>
              <span className="text-slate-600">|</span>
              <span className="font-mono text-[11px] text-cyan-400">{code.split('\n').length} lines</span>
            </div>
          </div>

          {/* Textarea Code Editor */}
          <div className="relative flex-1 min-h-[460px] bg-navy-950/50">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-full p-4 font-mono text-xs sm:text-sm text-slate-200 bg-transparent resize-none focus:outline-none custom-scrollbar leading-relaxed"
              spellCheck="false"
            />
          </div>

          {/* AI Quick Transformation Bar */}
          <div className="p-3 bg-navy-950/90 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="text-xs text-slate-300 font-medium">AI Assist:</span>
              <button
                onClick={() => handleApplyAiTransformation('optimize')}
                disabled={isRefactoring}
                className="px-2.5 py-1 rounded-md bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-medium transition-all"
              >
                ⚡ Optimize Performance
              </button>
              <button
                onClick={() => handleApplyAiTransformation('types')}
                disabled={isRefactoring}
                className="px-2.5 py-1 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-medium transition-all"
              >
                📘 TypeScript Strict
              </button>
              <button
                onClick={() => handleApplyAiTransformation('tests')}
                disabled={isRefactoring}
                className="px-2.5 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-all"
              >
                🧪 Generate Unit Tests
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Execution Sandbox & Analysis (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Terminal / Analysis Tabs */}
          <div className="rounded-2xl bg-navy-900/90 border border-white/10 overflow-hidden shadow-2xl backdrop-blur-xl flex flex-col h-full min-h-[460px]">
            
            {/* Tab Buttons */}
            <div className="flex items-center border-b border-white/10 bg-navy-950/80 px-2 pt-2">
              <button
                onClick={() => setActiveTab('output')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
                  activeTab === 'output'
                    ? 'border-cyan-400 text-cyan-300 bg-navy-850/60'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Sandbox Output</span>
              </button>

              <button
                onClick={() => setActiveTab('analysis')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
                  activeTab === 'analysis'
                    ? 'border-purple-400 text-purple-300 bg-navy-850/60'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Complexity & AST</span>
              </button>

              <button
                onClick={() => setActiveTab('tests')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
                  activeTab === 'tests'
                    ? 'border-emerald-400 text-emerald-300 bg-navy-850/60'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Unit Suite (12)</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-4 flex-1 flex flex-col custom-scrollbar overflow-y-auto">
              {activeTab === 'output' && (
                <div className="space-y-4">
                  {/* Telemetry Stats Bar */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-navy-950/70 border border-white/5">
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Status</p>
                      <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        PASS (0 Err)
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Latency</p>
                      <p className="text-xs font-mono font-bold text-cyan-400 mt-0.5">
                        {executionOutput.duration}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Heap Mem</p>
                      <p className="text-xs font-mono font-bold text-purple-400 mt-0.5">
                        {executionOutput.memory}
                      </p>
                    </div>
                  </div>

                  {/* Terminal Log Output */}
                  <div className="p-3.5 rounded-xl bg-black/60 border border-white/5 font-mono text-xs text-slate-300 space-y-1.5 min-h-[260px]">
                    <div className="text-slate-500 text-[11px] pb-1 border-b border-white/5">
                      --- Sandbox Console Stream ---
                    </div>
                    {executionOutput.logs.map((log, idx) => (
                      <div
                        key={idx}
                        className={
                          log.startsWith('✓')
                            ? 'text-emerald-400'
                            : log.includes('error') || log.includes('fail')
                            ? 'text-rose-400'
                            : 'text-slate-300'
                        }
                      >
                        {log}
                      </div>
                    ))}
                    {isRunning && (
                      <div className="text-cyan-400 animate-pulse">
                        &gt; Executing instructions in thread pool...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'analysis' && (
                <div className="space-y-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-navy-950/70 border border-white/5 space-y-2">
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-cyan-400" />
                      Algorithmic Complexity
                    </h4>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="p-2.5 rounded-lg bg-navy-900/60 border border-white/5">
                        <span className="text-slate-400 text-[11px]">Time Complexity</span>
                        <p className="text-sm font-mono font-bold text-emerald-400">O(N log N)</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-navy-900/60 border border-white/5">
                        <span className="text-slate-400 text-[11px]">Space Auxiliary</span>
                        <p className="text-sm font-mono font-bold text-blue-400">O(1) In-Place</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-navy-950/70 border border-white/5 space-y-2">
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-400" />
                      AST Safety Invariants
                    </h4>
                    <ul className="space-y-1.5 text-slate-300">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Zero memory leaks detected across 100,000 virtual cycles</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Thread safe: No shared un-synchronized state</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Clean cleanup on unmount / process termination</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'tests' && (
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-between">
                    <span className="font-semibold">Suite Results: 12 / 12 Passing</span>
                    <span className="text-[11px] font-mono">100% Branch Coverage</span>
                  </div>

                  {[
                    { name: 'it should initialize without buffer overflow', time: '1.2ms' },
                    { name: 'it correctly batches metrics within 16.6ms window', time: '4.8ms' },
                    { name: 'it safely handles disconnection & backpressure', time: '2.1ms' },
                    { name: 'it enforces strict telemetry schema contracts', time: '0.9ms' },
                    { name: 'it cleans up Web Worker memory on disposal', time: '1.5ms' },
                  ].map((test, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-navy-950/60 border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-slate-200">{test.name}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">{test.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
