export const AI_MODELS = [
  {
    id: 'nova-ultra',
    name: 'Nova 3.5 Ultra',
    badge: 'Flagship',
    description: 'Deep multimodal reasoning, 1M context window, highest accuracy for complex logic and synthesis.',
    speed: '480 ms',
    context: '1,000,000 tokens',
    capabilities: ['Reasoning', 'Vision', 'Deep Search', 'Long Context'],
    color: 'from-blue-500 to-cyan-400',
  },
  {
    id: 'nova-flash',
    name: 'Nova Flash 3.0',
    badge: 'Ultra Fast',
    description: 'Instant sub-50ms responses for real-time applications, quick answers, and high-frequency tasks.',
    speed: '38 ms',
    context: '256,000 tokens',
    capabilities: ['Instant Reply', 'Low Latency', 'High Throughput'],
    color: 'from-amber-400 to-orange-500',
  },
  {
    id: 'nova-coder',
    name: 'Nova Coder Prime',
    badge: 'Code Expert',
    description: 'Trained on billions of lines of verified code. Expert in architecture, refactoring, and debugging.',
    speed: '210 ms',
    context: '512,000 tokens',
    capabilities: ['Multi-lang Coding', 'Unit Tests', 'AST Refactoring'],
    color: 'from-emerald-400 to-teal-500',
  },
  {
    id: 'deep-reason',
    name: 'DeepReason 2.0',
    badge: 'CoT Specialist',
    description: 'Explicit step-by-step mathematical reasoning, formal verification, and multi-step deduction.',
    speed: '620 ms',
    context: '512,000 tokens',
    capabilities: ['Chain-of-Thought', 'Formal Logic', 'Math & Proofs'],
    color: 'from-purple-500 to-pink-500',
  },
];

export const SEARCH_PRESETS = [
  {
    query: 'Latest breakthroughs in room-temperature quantum computing',
    tag: 'Quantum Tech',
    category: 'science',
  },
  {
    query: 'Next-generation solid-state battery commercialization 2026',
    tag: 'Clean Energy',
    category: 'tech',
  },
  {
    query: 'Agentic AI workflows vs DAG-based orchestrations comparison',
    tag: 'AI Architecture',
    category: 'code',
  },
  {
    query: 'Hubble & James Webb combined deep-field cosmological discoveries',
    tag: 'Space Sciences',
    category: 'science',
  },
  {
    query: 'Global semiconductor supply chain diversification analysis',
    tag: 'Macro Finance',
    category: 'finance',
  },
];

export const MOCK_SEARCH_RESULTS = {
  'Latest breakthroughs in room-temperature quantum computing': {
    title: 'Breakthroughs in Near-Room-Temperature Quantum Computing (2026)',
    summary:
      'Recent research published across Nature and Physical Review demonstrates novel topological surface codes and optically addressed nitrogen-vacancy (NV) diamond centers achieving coherence times exceeding 2.4 seconds at 265 Kelvin (-8°C). While true ambient room-temperature fault-tolerant qubits remain in development, this hybrid photonic-spin approach eliminates bulky liquid helium cryostats for rack-mounted quantum co-processors.',
    keyPoints: [
      'Topological spin lattices achieved 99.84% single-qubit fidelity at near-ambient conditions.',
      'Photonic interconnects enable multi-core chiplets without millikelvin dilution refrigerators.',
      'Commercial deployment roadmap predicts industrial quantum cryptographic hardware by late 2027.',
    ],
    confidenceScore: 98.4,
    sources: [
      {
        title: 'Nature Physics: High-temperature topological spin qubits',
        url: 'https://nature.com/articles/phys-q2026-08',
        domain: 'nature.com',
        reliability: '99%',
        date: '3 days ago',
      },
      {
        title: 'MIT Technology Review: Cryogen-free quantum computing advances',
        url: 'https://technologyreview.com/quantum/ambient-scale',
        domain: 'technologyreview.com',
        reliability: '97%',
        date: '1 week ago',
      },
      {
        title: 'IEEE Quantum Computing Survey & Industrial Roadmap',
        url: 'https://ieee.org/quantum-architecture-2026',
        domain: 'ieee.org',
        reliability: '98%',
        date: '2 weeks ago',
      },
    ],
    knowledgeCard: {
      title: 'Diamond NV-Center Qubits',
      subtitle: 'Spin-optical quantum register',
      stats: [
        { label: 'Operating Temp', value: '265 K (-8°C)' },
        { label: 'Coherence Time', value: '2.42 s' },
        { label: 'Gate Fidelity', value: '99.84%' },
        { label: 'Power Draw', value: '< 450 W' },
      ],
      related: ['Rydberg Atom Arrays', 'Silicon Spin Qubits', 'Surface Code Quantum Error Correction'],
    },
    followUps: [
      'What are the commercial power consumption differences versus superconducting qubits?',
      'How does error correction scale for NV-center lattices?',
      'Which quantum software frameworks support this architecture?',
    ],
  },
  default: {
    title: 'Comprehensive AI Multi-Source Synthesis',
    summary:
      'NOVA Omni-Search aggregated over 14 million indexed pages, research whitepapers, and verified live feeds. Analysis reveals accelerated convergence across neural architectures, specialized hardware accelerators, and autonomous agent systems.',
    keyPoints: [
      'Multi-modal grounding integrates real-time web verification with verifiable citation anchoring.',
      'Consensus engine filters conflicting reports and highlights peer-reviewed primary sources.',
      'Autonomous synthesis distills core insights, statistical comparisons, and forward projections.',
    ],
    confidenceScore: 96.8,
    sources: [
      {
        title: 'Global Tech & Science Research Database 2026',
        url: 'https://research-aggregator.internal/feed',
        domain: 'research.org',
        reliability: '98%',
        date: 'Updated today',
      },
      {
        title: 'Global Autonomous Systems Whitepaper',
        url: 'https://arxiv.org/abs/2602.09110',
        domain: 'arxiv.org',
        reliability: '96%',
        date: 'Yesterday',
      },
      {
        title: 'Enterprise Technical Journal & Analytics',
        url: 'https://techjournal.io/analysis',
        domain: 'techjournal.io',
        reliability: '95%',
        date: '2 days ago',
      },
    ],
    knowledgeCard: {
      title: 'Synthesized Topic Intelligence',
      subtitle: 'Real-time contextual graph',
      stats: [
        { label: 'Index Coverage', value: '14.2B pages' },
        { label: 'Verification Latency', value: '142 ms' },
        { label: 'Factual Alignment', value: '99.1%' },
        { label: 'Primary Sources', value: '18 cited' },
      ],
      related: ['Dynamic Verification', 'Neural Ranking 4.0', 'Autonomous Information Synthesis'],
    },
    followUps: [
      'Can you provide a deep-dive technical comparison?',
      'Show practical implementation examples or code snippets.',
      'What are the primary operational challenges and costs?',
    ],
  },
};

export const INITIAL_CHAT_SESSIONS = [
  {
    id: 'chat-1',
    title: 'Reactive Micro-frontend Architecture',
    timestamp: '10 mins ago',
    model: 'Nova 3.5 Ultra',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Design an event-driven architecture for a distributed dashboard that receives 50k real-time metrics per second.',
        time: '09:02 AM',
      },
      {
        id: 'm2',
        role: 'assistant',
        model: 'Nova 3.5 Ultra',
        time: '09:02 AM',
        thought:
          'Analyzing throughput requirements: 50,000 metrics/sec. A direct WebSocket fan-out to the frontend would saturate UI thread frames. We need a dual-tier approach: 1) Ingestion buffer with time-window bucketing (e.g., 60Hz animation frame aligned dispatch), 2) SharedArrayBuffer / Web Worker ingestion with delta compression, 3) Canvas / WebGL visualization layer to prevent DOM node thrashing.',
        content: `Here is a production-grade, highly resilient architecture designed for **50k events/sec** streaming without UI thread stutter:

### 1. Ingestion & Rendering Pipeline

\`\`\`typescript
// Shared Worker Buffer with 60Hz UI batching
class MetricStreamBuffer {
  private queue: MetricPacket[] = [];
  private batchSize = 800; // Flushed every 16.6ms (60 FPS)

  push(metric: MetricPacket) {
    this.queue.push(metric);
    if (this.queue.length >= this.batchSize) {
      this.flushToWorker();
    }
  }

  private flushToWorker() {
    const chunk = this.queue.splice(0, this.batchSize);
    worker.postMessage({ type: 'COMPUTE_AGGREGATES', payload: chunk });
  }
}
\`\`\`

### 2. Architecture Breakdown

1. **Edge Ingestion**: WebSocket or WebTransport via HTTP/3 with Protobuf binary serialization (saving ~74% bandwidth vs JSON).
2. **Web Worker Offload**: Heavy math (EWMA, percentiles, anomaly detection) computed completely off the main thread.
3. **Hardware-Accelerated Canvas**: Render charts via WebGL 2.0 or WebGPU, keeping DOM memory footprint strictly constant.`,
      },
    ],
  },
  {
    id: 'chat-2',
    title: 'Autonomous Multi-Agent Orchestrator',
    timestamp: 'Yesterday',
    model: 'Nova Coder Prime',
    messages: [
      {
        id: 'm3',
        role: 'user',
        content: 'How should I structure an autonomous agent feedback loop with rollback capabilities?',
        time: 'Yesterday',
      },
      {
        id: 'm4',
        role: 'assistant',
        model: 'Nova Coder Prime',
        time: 'Yesterday',
        thought:
          'The core challenge in autonomous agent execution is state irreversibility. Implementing transactional checkpoints with compensatory actions (Saga pattern) guarantees safe execution.',
        content: `To build safe, self-healing agentic workflows, implement the **Transactional Saga Pattern with Git-like Snapshot Trees**:

* **Pre-Execution Checkpoint**: Capture AST and state snapshot before any mutation.
* **Verification Invariant**: Run automated sandbox tests to validate state consistency.
* **Compensatory Rollback**: If invariant checks fail, rewind the snapshot and invoke remediation agents.`,
      },
    ],
  },
];

export const CODE_PRESETS = [
  {
    id: 'react-dashboard',
    name: 'Real-time Metrics Dashboard (React 19)',
    language: 'javascript',
    description: 'High-performance animated metrics grid with glowing telemetry cards and sparklines.',
    code: `import React, { useState, useEffect } from 'react';

export default function TelemetryDashboard() {
  const [metrics, setMetrics] = useState({
    qps: 48920,
    latency: 18.4,
    cacheHitRatio: 99.2,
    nodesActive: 64,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        qps: Math.floor(48000 + Math.random() * 2500),
        latency: Number((17.5 + Math.random() * 2.2).toFixed(1)),
        cacheHitRatio: Number((98.9 + Math.random() * 0.9).toFixed(2)),
        nodesActive: 64 + (Math.random() > 0.8 ? 1 : 0),
      }));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 bg-slate-950 text-white rounded-2xl border border-white/10 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Nova Cluster Telemetry
          </h2>
          <p className="text-xs text-slate-400">Region: us-east-global • Tier 1 Mesh</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
          LIVE • Healthy
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5">
          <p className="text-xs text-slate-400">Total Throughput</p>
          <p className="text-2xl font-mono font-bold text-cyan-400 mt-1">{metrics.qps.toLocaleString()} <span className="text-xs text-slate-500">req/s</span></p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5">
          <p className="text-xs text-slate-400">p99 Latency</p>
          <p className="text-2xl font-mono font-bold text-blue-400 mt-1">{metrics.latency} <span className="text-xs text-slate-500">ms</span></p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5">
          <p className="text-xs text-slate-400">Cache Efficiency</p>
          <p className="text-2xl font-mono font-bold text-purple-400 mt-1">{metrics.cacheHitRatio}%</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5">
          <p className="text-xs text-slate-400">Active Shards</p>
          <p className="text-2xl font-mono font-bold text-emerald-400 mt-1">{metrics.nodesActive} / 64</p>
        </div>
      </div>
    </div>
  );
}`,
  },
  {
    id: 'python-rag',
    name: 'Neural RAG Pipeline (Python)',
    language: 'python',
    description: 'Hybrid sparse-dense retrieval with cross-encoder re-ranking and citation attribution.',
    code: `import numpy as np
from dataclasses import dataclass
from typing import List, Dict

@dataclass
class SearchResult:
    doc_id: str
    content: str
    dense_score: float
    sparse_score: float
    fused_score: float = 0.0

class HybridRetriever:
    """Combines BM25 lexical precision with HNSW dense semantic embeddings."""
    def __init__(self, alpha: float = 0.65):
        self.alpha = alpha  # Weight for dense embedding score

    def reciprocal_rank_fusion(self, dense_results: List[Dict], sparse_results: List[Dict], k: int = 60) -> List[SearchResult]:
        rrf_scores = {}
        
        for rank, item in enumerate(dense_results):
            doc_id = item['id']
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + (self.alpha / (k + rank + 1))
            
        for rank, item in enumerate(sparse_results):
            doc_id = item['id']
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + ((1.0 - self.alpha) / (k + rank + 1))
            
        ranked = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)
        return [SearchResult(doc_id=doc_id, content="", dense_score=0.0, sparse_score=0.0, fused_score=score) for doc_id, score in ranked]

# Example initialization
retriever = HybridRetriever(alpha=0.7)
print("Initialized Nova Neural Retriever with Reciprocal Rank Fusion.")`,
  },
  {
    id: 'rust-concurrency',
    name: 'Async Event Worker (Rust)',
    language: 'rust',
    description: 'Zero-cost async channel consumer with batch backpressure handling and SIMD parsing.',
    code: `use tokio::sync::mpsc;
use std::time::Duration;

#[derive(Debug)]
struct Event {
    id: u64,
    payload: Vec<u8>,
}

pub async fn run_event_processor(mut rx: mpsc::Receiver<Event>) {
    let mut batch = Vec::with_capacity(512);
    let mut flush_timer = tokio::time::interval(Duration::from_millis(16));

    loop {
        tokio::select! {
            Some(event) = rx.recv() => {
                batch.push(event);
                if batch.len() >= 512 {
                    process_batch(&mut batch).await;
                }
            }
            _ = flush_timer.tick() => {
                if !batch.is_empty() {
                    process_batch(&mut batch).await;
                }
            }
        }
    }
}

async fn process_batch(batch: &mut Vec<Event>) {
    println!("Processed {} telemetry events in zero-copy buffer", batch.len());
    batch.clear();
}`,
  },
];

export const SAMPLE_DOCUMENTS = [
  {
    id: 'doc-1',
    name: 'Q3_Global_AI_Market_Forecast.pdf',
    size: '3.4 MB',
    pages: 42,
    date: 'Oct 2026',
    author: 'Nova Intelligence Group',
    summary:
      'Executive summary analyzing the transition from single-turn chat interfaces to compound autonomous AI agent architectures. Key projections include a 320% expansion in enterprise inference workflows and a 45% reduction in multi-modal training FLOPs via mixture-of-agents routing.',
    metrics: [
      { label: 'Market TAM (2028)', value: '$1.48 Trillion' },
      { label: 'Agentic Workflows', value: '+320% YoY' },
      { label: 'Inference Efficiency', value: '4.8x Gain' },
      { label: 'Enterprise Adoption', value: '78.2%' },
    ],
    keyInsights: [
      'Mixture of Agents (MoA) achieves GPT-5 class reasoning at 28% of legacy monolithic cost.',
      'Edge-device neural NPUs now run 14B parameter models with zero cloud dependency at 45 tokens/sec.',
      'Cybersecurity compliance & verifiable audit logs have emerged as the #1 enterprise buying criteria.',
    ],
  },
  {
    id: 'doc-2',
    name: 'Quantum_Topological_Surface_Codes.pdf',
    size: '6.8 MB',
    pages: 68,
    date: 'Sep 2026',
    author: 'Institute of Advanced Computation',
    summary:
      'Comprehensive mathematical exposition of 3D color codes and hyperbolic surface codes for physical qubit suppression. Demonstrates threshold error rates above 1.8% under phenomenological noise models.',
    metrics: [
      { label: 'Fault-tolerant Threshold', value: '1.82%' },
      { label: 'Qubit Overhead Ratio', value: '48:1' },
      { label: 'Syndrome Latency', value: '180 ns' },
      { label: 'Fidelity Bound', value: '99.991%' },
    ],
    keyInsights: [
      'Hyperbolic surface codes reduce spatial overhead by 62% compared to standard Toric lattice codes.',
      'Real-time FPGA syndrome decoders achieve sub-200ns correction loops before phase decoherence sets in.',
      'Compatible with existing transmon and neutral atom optical tweezer hardware architectures.',
    ],
  },
];

export const CREATIVE_GALLERY = [
  {
    id: 'img-1',
    title: 'Cyberpunk Orbital Habitat',
    prompt:
      'Hyper-detailed futuristic orbital megacity inside a rotating Stanford torus, bioluminescent flora, neon rain reflections, cinematic lighting, 8k octane render, Unreal Engine 5.5, atmospheric volumetric fog.',
    style: 'Cyberpunk Neo',
    ratio: '16:9',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    tags: ['Sci-Fi', 'Megastructure', 'Cinematic', 'Bioluminescence'],
  },
  {
    id: 'img-2',
    title: 'Quantum Synaptic Core',
    prompt:
      'Abstract quantum neural processor glowing with ethereal cyan and violet energy threads, crystalline structure, intricate micro-circuitry, macro photography, depth of field, Ray-tracing.',
    style: '3D Render',
    ratio: '1:1',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    tags: ['Hardware', 'Quantum', 'Abstract', '3D'],
  },
  {
    id: 'img-3',
    title: 'Solarpunk Bio-Architecture Oasis',
    prompt:
      'Sustainable solarpunk metropolis with hanging gardens, glass solar domes, cascading waterfalls intertwined with titanium architecture, golden hour sunlight, lush greenery, photorealistic.',
    style: 'Photorealistic',
    ratio: '16:9',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
    tags: ['Solarpunk', 'Architecture', 'Nature', 'Future'],
  },
  {
    id: 'img-4',
    title: 'Deep Space Nebula Explorer',
    prompt:
      'Sleek interstellar exploratory vessel gliding beside a radiant stellar nebula, cosmic dust particles, vibrant ultraviolet light, stars in deep field, cinematic sci-fi masterpiece.',
    style: 'Cinematic',
    ratio: '16:9',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    tags: ['Space', 'Nebula', 'Exploration', 'Stars'],
  },
];

export const TRANSLATE_LANGUAGES = [
  { code: 'en', name: 'English (US)', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish (Español)', flag: '🇪🇸' },
  { code: 'fr', name: 'French (Français)', flag: '🇫🇷' },
  { code: 'de', name: 'German (Deutsch)', flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese (日本語)', flag: '🇯🇵' },
  { code: 'zh', name: 'Mandarin (中文)', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic (العربية)', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi (हिन्दी)', flag: '🇮🇳' },
  { code: 'ko', name: 'Korean (한국어)', flag: '🇰🇷' },
  { code: 'pt', name: 'Portuguese (Português)', flag: '🇧🇷' },
  { code: 'it', name: 'Italian (Italiano)', flag: '🇮🇹' },
  { code: 'ru', name: 'Russian (Русский)', flag: '🇷🇺' },
];

export const TRANSLATE_TONES = [
  { id: 'professional', label: 'Professional / Corporate', desc: 'Precise, courteous, business-ready syntax' },
  { id: 'conversational', label: 'Conversational / Natural', desc: 'Idiomatic native phrasing with natural flow' },
  { id: 'academic', label: 'Academic / Technical', desc: 'Rigorous vocabulary, scholarly nomenclature' },
  { id: 'diplomatic', label: 'Diplomatic / Formal', desc: 'Tactful, elevated tone for sensitive dialogue' },
  { id: 'creative', label: 'Creative / Poetic', desc: 'Evocative phrasing preserving stylistic flair' },
];
