import React, { useState } from 'react';
import {
  Image,
  Sparkles,
  Wand2,
  Download,
  Copy,
  Check,
  Maximize2,
  RefreshCw,
  Sliders,
  Eye,
  Layers,
  Palette,
  CheckCircle2,
} from 'lucide-react';
import { CREATIVE_GALLERY } from '../data/mockData';

export default function CreativeStudio({ onNotify, onSendToChat }) {
  const [gallery, setGallery] = useState(CREATIVE_GALLERY);
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Cyberpunk Neo');
  const [selectedRatio, setSelectedRatio] = useState('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeModalImage, setActiveModalImage] = useState(null);
  const [copiedPromptId, setCopiedPromptId] = useState(null);

  const styles = [
    'Cyberpunk Neo',
    '3D Render',
    'Solarpunk Bio',
    'Photorealistic',
    'Cinematic Sci-Fi',
    'Anime Aesthetic',
  ];

  const aspectRatios = ['16:9', '1:1', '9:16', '4:3'];

  const handleGenerate = (e) => {
    e?.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      const newImage = {
        id: `img-${Date.now()}`,
        title: prompt.slice(0, 28) + '...',
        prompt: prompt,
        style: selectedStyle,
        ratio: selectedRatio,
        imageUrl:
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        tags: [selectedStyle, selectedRatio, '8K Octane', 'AI Render'],
      };
      setGallery([newImage, ...gallery]);
      onNotify?.('Generated 8K ultra-resolution visual artifact!', 'success');
      setPrompt('');
    }, 1200);
  };

  const handleCopyPrompt = (img, e) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(img.prompt);
    setCopiedPromptId(img.id);
    onNotify?.('Prompt copied to clipboard!', 'success');
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Creative AI & Vision Studio</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px]">
              8K Neural Renderer
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
            Generative Multi-Modal Vision
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Synthesize concept art, architectural diagrams, 3D renders, and cinematic frames with sub-pixel diffusion.
          </p>
        </div>
      </div>

      {/* Generator Prompt Composer Card */}
      <div className="p-6 rounded-2xl bg-navy-900/90 border border-white/10 shadow-2xl backdrop-blur-xl mb-10">
        <form onSubmit={handleGenerate} className="space-y-4">
          
          {/* Main Prompt Textarea */}
          <div className="relative">
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your vision (e.g. 'A futuristic crystalline quantum server room suspended over liquid helium with violet volumetric rays, 8k octane render...')"
              className="w-full p-4 rounded-xl bg-navy-950 border border-white/10 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-purple-400 custom-scrollbar resize-none shadow-inner leading-relaxed"
            />
          </div>

          {/* Configuration Options */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            
            {/* Style Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs text-slate-400 font-medium shrink-0 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" /> Style:
              </span>
              {styles.map((style) => (
                <button
                  type="button"
                  key={style}
                  onClick={() => setSelectedStyle(style)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                    selectedStyle === style
                      ? 'bg-purple-600/30 border-purple-500 text-purple-200 shadow-glow-purple'
                      : 'bg-navy-950/60 hover:bg-navy-800 border-white/10 text-slate-300'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>

            {/* Aspect Ratio + Generate Button */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-navy-950 p-1 rounded-xl border border-white/10">
                {aspectRatios.map((ratio) => (
                  <button
                    type="button"
                    key={ratio}
                    onClick={() => setSelectedRatio(ratio)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                      selectedRatio === ratio
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-semibold text-xs shadow-glow-purple transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                <span>{isGenerating ? 'Rendering Frame...' : 'Synthesize Vision'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Gallery Showcase Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Image className="w-5 h-5 text-purple-400" />
            Neural Artifact Gallery
          </h3>
          <span className="text-xs text-slate-400">{gallery.length} High-Res Visuals</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {gallery.map((img) => (
            <div
              key={img.id}
              onClick={() => setActiveModalImage(img)}
              className="group relative rounded-2xl bg-navy-900/90 border border-white/10 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
            >
              {/* Image Frame */}
              <div className="relative aspect-video overflow-hidden bg-navy-950">
                <img
                  src={img.imageUrl}
                  alt={img.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
                
                {/* Ratio Badge */}
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-navy-950/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300">
                  {img.ratio}
                </span>
              </div>

              {/* Card Meta */}
              <div className="p-4 space-y-2">
                <h4 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                  {img.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {img.prompt}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {img.tags.slice(0, 3).map((tag, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-navy-950/80 border border-white/5 text-slate-400 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Quick Action Footer */}
                <div className="pt-2 flex items-center justify-between border-t border-white/5 text-xs text-slate-400">
                  <span className="text-[11px] text-purple-400 font-medium">{img.style}</span>
                  <button
                    onClick={(e) => handleCopyPrompt(img, e)}
                    className="p-1 hover:text-white rounded hover:bg-white/5 transition-colors"
                    title="Copy Prompt"
                  >
                    {copiedPromptId === img.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inspect Modal */}
      {activeModalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/85 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={() => setActiveModalImage(null)}
        >
          <div
            className="relative max-w-4xl w-full rounded-2xl bg-navy-900 border border-white/15 overflow-hidden shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-video max-h-[500px] w-full overflow-hidden bg-black">
              <img
                src={activeModalImage.imageUrl}
                alt={activeModalImage.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setActiveModalImage(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-navy-950/80 text-white hover:bg-navy-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{activeModalImage.title}</h3>
                  <p className="text-xs text-purple-400 font-medium mt-0.5">
                    Style: {activeModalImage.style} • Aspect Ratio: {activeModalImage.ratio}
                  </p>
                </div>
                <button
                  onClick={(e) => handleCopyPrompt(activeModalImage, e)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-850 hover:bg-navy-800 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Prompt</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-navy-950/70 border border-white/5 text-xs text-slate-300 leading-relaxed font-mono">
                {activeModalImage.prompt}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
