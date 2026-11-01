import React, { useState } from 'react';
import {
  FileText,
  UploadCloud,
  FileCheck,
  Search,
  Sparkles,
  Layers,
  BarChart3,
  Download,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Cpu,
  BookOpen,
} from 'lucide-react';
import { SAMPLE_DOCUMENTS } from '../data/mockData';

export default function DocIntelligence({ onNotify, onSendToChat }) {
  const [selectedDoc, setSelectedDoc] = useState(SAMPLE_DOCUMENTS[0]);
  const [docQuery, setDocQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [docQueryResult, setDocQueryResult] = useState(null);

  const handleAskDocument = (e) => {
    e?.preventDefault();
    if (!docQuery.trim()) return;

    setIsQuerying(true);
    setTimeout(() => {
      setIsQuerying(false);
      setDocQueryResult({
        question: docQuery,
        answer: `Based on verified extraction from "${selectedDoc.name}" (Page ${Math.floor(
          Math.random() * selectedDoc.pages + 1
        )}):\n\nThe document explicitly highlights that compound multi-agent workflows yield a 4.8x gain in inference efficiency and 320% Year-over-Year adoption growth. Mixture-of-Agents (MoA) routing achieves superior frontier benchmark reasoning while reducing enterprise inference compute expenditure by over 72%.`,
        citations: [
          { page: 12, excerpt: 'Section 3.2: Compound AI System Scaling Metrics' },
          { page: 27, excerpt: 'Table 4: Empirical latency & cost reductions across 14 enterprise benchmarks' },
        ],
      });
      onNotify?.('Document analyzed with verifiable page citations!', 'success');
    }, 600);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1">
            <FileText className="w-4 h-4" />
            <span>Document Intelligence & Neural RAG</span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px]">
              Multi-modal OCR
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
            Enterprise Document Understanding
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Extract tabular data, mathematical proofs, executive summaries, and answer queries with exact page-level citations.
          </p>
        </div>

        {/* Upload Simulation Button */}
        <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-850 hover:bg-navy-800 text-slate-200 hover:text-white border border-white/10 text-xs font-semibold cursor-pointer shadow-lg transition-all hover:border-cyan-500/30">
          <UploadCloud className="w-4 h-4 text-cyan-400" />
          <span>Upload PDF / DOCX / CSV</span>
          <input
            type="file"
            className="hidden"
            onChange={() => onNotify?.('Document ingested into vector store & OCR pipeline!', 'success')}
          />
        </label>
      </div>

      {/* Document Selector Pills */}
      <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2 custom-scrollbar">
        <span className="text-xs text-slate-400 font-medium shrink-0 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" /> Ingested Docs:
        </span>
        {SAMPLE_DOCUMENTS.map((doc) => (
          <button
            key={doc.id}
            onClick={() => {
              setSelectedDoc(doc);
              setDocQueryResult(null);
            }}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-medium transition-all border whitespace-nowrap ${
              selectedDoc.id === doc.id
                ? 'bg-blue-600/20 border-blue-500 text-blue-200 shadow-glow-blue'
                : 'bg-navy-850/60 hover:bg-navy-800 border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>{doc.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
              {doc.pages}p
            </span>
          </button>
        ))}
      </div>

      {/* Main Grid: Document Overview & Metrics + Interactive Neural Q&A */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Document Specs & Metrics (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Document Summary Card */}
          <div className="p-6 rounded-2xl bg-navy-900/90 border border-white/10 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  {selectedDoc.date} • {selectedDoc.author}
                </span>
                <h3 className="text-lg font-bold text-white mt-2">{selectedDoc.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  File Size: {selectedDoc.size} • Pages: {selectedDoc.pages} • Verified OCR
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-navy-950/60 p-4 rounded-xl border border-white/5">
              {selectedDoc.summary}
            </p>

            {/* Extracted Key Metric Cards */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              {selectedDoc.metrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-navy-950/80 border border-white/5 hover:border-cyan-500/30 transition-colors"
                >
                  <p className="text-[11px] text-slate-400 font-medium">{metric.label}</p>
                  <p className="text-lg sm:text-xl font-display font-bold text-cyan-400 mt-1">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Key Insights List */}
          <div className="p-6 rounded-2xl bg-navy-900/90 border border-white/10 shadow-2xl backdrop-blur-xl space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Automated Synthesis & Invariants
            </h4>
            <div className="space-y-2.5">
              {selectedDoc.keyInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-navy-950/60 border border-white/5 text-xs text-slate-300 leading-relaxed"
                >
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] shrink-0 font-bold">
                    {idx + 1}
                  </span>
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Neural Q&A on Document (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="p-6 rounded-2xl bg-navy-900/90 border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-cyan-400" />
                Interrogate Document with AI
              </h3>
              <span className="text-[11px] font-mono text-slate-400">RAG Chunking: 512t</span>
            </div>

            {/* Query Input */}
            <form onSubmit={handleAskDocument} className="relative mb-6">
              <input
                type="text"
                value={docQuery}
                onChange={(e) => setDocQuery(e.target.value)}
                placeholder={`Ask anything about ${selectedDoc.name}...`}
                className="w-full px-4 py-3.5 pr-24 rounded-xl bg-navy-950 border border-white/10 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-400 shadow-inner"
              />
              <button
                type="submit"
                disabled={isQuerying || !docQuery.trim()}
                className="absolute right-2 top-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-navy-950 font-bold text-xs shadow-glow-blue transition-all disabled:opacity-50"
              >
                {isQuerying ? 'Scanning...' : 'Ask AI'}
              </button>
            </form>

            {/* Suggested Document Questions */}
            <div className="mb-6">
              <p className="text-[11px] text-slate-400 font-medium mb-2">Recommended questions:</p>
              <div className="space-y-1.5">
                {[
                  'What are the primary cost and efficiency drivers mentioned?',
                  'Summarize the core technical methodology and statistical confidence.',
                  'Extract all numerical projections and forward-looking estimates.',
                ].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setDocQuery(q);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg bg-navy-950/60 hover:bg-navy-850 border border-white/5 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group"
                  >
                    <span>{q}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            {/* Answer Display */}
            <div className="flex-1 p-4 rounded-xl bg-navy-950/80 border border-white/5 space-y-3 min-h-[220px]">
              {docQueryResult ? (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Verified Answer</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                    {docQueryResult.answer}
                  </p>

                  <div className="pt-3 border-t border-white/5 space-y-2">
                    <span className="text-[11px] font-semibold text-slate-400">Grounding Citations:</span>
                    {docQueryResult.citations.map((c, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-lg bg-navy-900/60 border border-white/5 text-[11px] text-slate-300 flex items-center justify-between"
                      >
                        <span className="font-mono text-cyan-400">Page {c.page}</span>
                        <span className="text-slate-400 truncate max-w-[280px]">{c.excerpt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
                  <Layers className="w-8 h-8 text-slate-600" />
                  <p className="text-xs text-slate-400">
                    Type a query or click a suggested question above to search across {selectedDoc.pages} pages with semantic embeddings.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
