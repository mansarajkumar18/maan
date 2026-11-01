import React, { useState, useEffect, useRef } from 'react';
import {
  Image as ImageIcon,
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
  Trash2,
  Upload,
  X,
  ExternalLink,
  Send,
  Share2,
  Crop,
} from 'lucide-react';
import { CREATIVE_GALLERY } from '../data/mockData';

const STYLES = [
  'Photorealistic',
  'Cinematic',
  '3D Render',
  'Cartoon',
  'Anime',
  'Digital Art',
  'Watercolor',
  'Minimalist',
  'Product Photography',
  'Professional Design',
];

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Square', desc: 'Social & Avatars', dims: '1024×1024' },
  { id: '16:9', label: '16:9 Landscape', desc: 'YouTube & Desktop', dims: '1792×1024' },
  { id: '9:16', label: '9:16 Portrait', desc: 'Reels, Shorts, Stories', dims: '1024×1792' },
  { id: '4:3', label: '4:3 Standard', desc: 'Presentation & Editorial', dims: '1024×768' },
];

const TEMPLATES = [
  {
    id: 'youtube-thumbnail',
    name: 'YouTube Thumbnail',
    ratio: '16:9',
    style: 'Cinematic',
    modifier: 'high-contrast dramatic lighting, vibrant focal point, 8k YouTube thumbnail aesthetic, bold visual storytelling',
  },
  {
    id: 'instagram-story',
    name: 'Instagram Story / Reel',
    ratio: '9:16',
    style: 'Digital Art',
    modifier: 'vertical full-bleed composition, modern aesthetic, clean margins for UI overlays, trending Instagram visual',
  },
  {
    id: 'marketing-banner',
    name: 'Marketing Banner',
    ratio: '16:9',
    style: 'Professional Design',
    modifier: 'clean negative space for typography, studio lighting, premium commercial advertising visual, 8k render',
  },
  {
    id: 'poster-print',
    name: 'Promotional Poster',
    ratio: '9:16',
    style: 'Minimalist',
    modifier: 'striking graphic composition, Swiss design inspired, bold color blocking, high artistic value',
  },
  {
    id: 'product-showcase',
    name: 'Product Showcase',
    ratio: '1:1',
    style: 'Product Photography',
    modifier: 'commercial product photography, soft studio lightbox, reflections, sharp focus, 85mm lens, pristine quality',
  },
  {
    id: 'business-graphic',
    name: 'Business Presentation',
    ratio: '4:3',
    style: '3D Render',
    modifier: 'isometric futuristic corporate technology visual, clean frosted glass elements, smooth lighting, premium 3D',
  },
];

export default function CreativeStudio({ onNotify, onSendToChat }) {
  const [activeMode, setActiveMode] = useState('generate'); // 'generate' | 'edit' | 'templates'
  const [gallery, setGallery] = useState(CREATIVE_GALLERY);
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Photorealistic');
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [activeModalImage, setActiveModalImage] = useState(null);
  const [copiedPromptId, setCopiedPromptId] = useState(null);

  // Image Editing State
  const [uploadedImage, setUploadedImage] = useState(null);
  const [editInstruction, setEditInstruction] = useState('');
  const [editedResult, setEditedResult] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [beforeAfterView, setBeforeAfterView] = useState('split'); // 'split' | 'toggle'
  const [showOriginalInToggle, setShowOriginalInToggle] = useState(false);

  const fileInputRef = useRef(null);

  // Load user creative gallery on mount
  useEffect(() => {
    async function loadGallery() {
      try {
        const res = await fetch('/api/creative/gallery');
        const data = await res.json();
        if (data.success && Array.isArray(data.images) && data.images.length > 0) {
          // Merge user gallery with default presets
          const userItems = data.images.map((item) => ({
            id: item.id,
            title: item.title || item.prompt.slice(0, 30),
            prompt: item.prompt,
            style: item.style,
            ratio: item.aspectRatio || '1:1',
            dimensions: item.dimensions,
            engine: item.engine,
            imageUrl: item.imageUrl,
            originalImageUrl: item.originalImageUrl,
            isEdited: item.isEdited,
            createdAt: item.createdAt,
            tags: [item.style, item.aspectRatio || '1:1', item.engine || 'AI'],
          }));
          setGallery((prev) => {
            const existingIds = new Set(userItems.map((u) => u.id));
            const filteredDefaults = prev.filter((p) => !existingIds.has(p.id));
            return [...userItems, ...filteredDefaults];
          });
        }
      } catch (err) {
        console.warn('[CreativeStudio] Error loading gallery:', err.message);
      }
    }
    loadGallery();
  }, []);

  // 1. AI Text-to-Image Generation
  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!prompt.trim()) {
      onNotify?.('Please enter a description for the image.', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/creative/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: selectedStyle,
          aspectRatio: selectedRatio,
          negativePrompt: negativePrompt.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.image) {
        const img = data.image;
        const newRecord = {
          id: img.id,
          title: img.title || prompt.slice(0, 30) + '...',
          prompt: img.prompt,
          enhancedPrompt: img.enhancedPrompt,
          style: img.style,
          ratio: img.aspectRatio,
          dimensions: img.dimensions,
          engine: img.engine,
          imageUrl: img.imageUrl,
          createdAt: img.createdAt,
          tags: img.tags || [img.style, img.aspectRatio, 'AI Render'],
        };
        setGallery((prev) => [newRecord, ...prev]);
        setActiveModalImage(newRecord);
        onNotify?.(`Synthesized 8K asset via ${img.engine}!`, 'success');
      } else {
        onNotify?.(data.error || 'Generation failed on server.', 'error');
      }
    } catch (err) {
      onNotify?.(err.message || 'Network error during image generation.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. AI Prompt Assistant Enhancer
  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      onNotify?.('Enter a short prompt idea first to enhance.', 'error');
      return;
    }

    setIsEnhancing(true);
    try {
      const res = await fetch('/api/creative/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: selectedStyle,
          aspectRatio: selectedRatio,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.enhancedPrompt) setPrompt(data.enhancedPrompt);
        if (data.negativePrompt) setNegativePrompt(data.negativePrompt);
        onNotify?.('Prompt enhanced with professional cinematography & lighting descriptors!', 'success');
      } else {
        onNotify?.(data.error || 'Enhancement failed.', 'error');
      }
    } catch (err) {
      onNotify?.(err.message || 'Enhancement service unavailable.', 'error');
    } finally {
      setIsEnhancing(false);
    }
  };

  // 3. Image Upload for Editing
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(png|jpeg|jpg|webp)$/i)) {
      onNotify?.('Please upload a valid PNG, JPG, or WebP image.', 'error');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      onNotify?.('File exceeds maximum 15MB limit.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result);
      setEditedResult(null);
      onNotify?.(`Uploaded image: ${file.name}`, 'info');
    };
    reader.readAsDataURL(file);
  };

  // 4. Apply AI Image Editing
  const handleApplyEdit = async () => {
    if (!uploadedImage) {
      onNotify?.('Please upload an image first.', 'error');
      return;
    }
    if (!editInstruction.trim()) {
      onNotify?.('Please provide instructions for what to change.', 'error');
      return;
    }

    setIsEditing(true);
    try {
      const res = await fetch('/api/creative/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceImage: uploadedImage,
          editInstruction: editInstruction.trim(),
          targetStyle: selectedStyle,
        }),
      });

      const data = await res.json();
      if (data.success && data.image) {
        const item = data.image;
        setEditedResult(item);
        const newRecord = {
          id: item.id,
          title: item.title,
          prompt: `Edit: ${item.editInstruction}`,
          style: item.style,
          ratio: '1:1',
          dimensions: item.dimensions,
          engine: item.engine,
          imageUrl: item.imageUrl,
          originalImageUrl: item.originalImageUrl,
          isEdited: true,
          createdAt: item.createdAt,
          tags: ['AI Edited', item.style, 'Before & After'],
        };
        setGallery((prev) => [newRecord, ...prev]);
        onNotify?.('Applied AI transformations successfully!', 'success');
      } else {
        onNotify?.(data.error || 'Image editing failed.', 'error');
      }
    } catch (err) {
      onNotify?.(err.message || 'Network error during image editing.', 'error');
    } finally {
      setIsEditing(false);
    }
  };

  // 5. Template Selection
  const handleSelectTemplate = (template) => {
    setSelectedRatio(template.ratio);
    setSelectedStyle(template.style);
    setPrompt((prev) => {
      const base = prev.trim() ? prev.trim() : 'Futuristic visual';
      return `${base}, ${template.modifier}`;
    });
    setActiveMode('generate');
    onNotify?.(`Loaded template: ${template.name}`, 'info');
  };

  // 6. Copy Prompt
  const handleCopyPrompt = (img, e) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(img.prompt);
    setCopiedPromptId(img.id);
    onNotify?.('Prompt copied to clipboard!', 'success');
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  // 7. Download Image
  const handleDownload = (img, e) => {
    e?.stopPropagation();
    const link = document.createElement('a');
    link.href = img.imageUrl;
    link.download = `nova-${img.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'creative'}.png`;
    link.click();
    onNotify?.('Downloading high-resolution asset...', 'success');
  };

  // 8. Delete Image with Confirmation
  const handleDeleteImage = async (img, e) => {
    e?.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${img.title}"?`)) return;

    try {
      await fetch(`/api/creative/gallery/${img.id}`, { method: 'DELETE' });
      setGallery((prev) => prev.filter((i) => i.id !== img.id));
      if (activeModalImage?.id === img.id) setActiveModalImage(null);
      onNotify?.('Image deleted from gallery', 'info');
    } catch {
      setGallery((prev) => prev.filter((i) => i.id !== img.id));
      if (activeModalImage?.id === img.id) setActiveModalImage(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      
      {/* Studio Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Creative AI & Vision Studio</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-mono">
              Phase 7 • Multi-Modal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-wide">
            Generative Creative Design Studio
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Synthesize concept art, YouTube thumbnails, ad banners, and edit visual assets with real multi-modal diffusion.
          </p>
        </div>

        {/* Mode Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-navy-900 border border-white/10">
          {[
            { id: 'generate', label: 'Text-to-Image', icon: ImageIcon },
            { id: 'edit', label: 'AI Image Editor', icon: Crop },
            { id: 'templates', label: 'Design Templates', icon: Layers },
          ].map((mode) => {
            const Icon = mode.icon;
            const isActive = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-purple-600/40 text-purple-200 border border-purple-500/40 shadow-glow-purple font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-navy-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MODE 1: TEXT-TO-IMAGE GENERATION */}
      {activeMode === 'generate' && (
        <div className="p-6 rounded-2xl bg-navy-900/90 border border-white/10 shadow-2xl backdrop-blur-xl mb-10 space-y-4">
          
          {/* Main Prompt Input Area */}
          <div className="relative">
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
              <span>Image Description Prompt:</span>
              <button
                type="button"
                onClick={handleEnhancePrompt}
                disabled={isEnhancing || !prompt.trim()}
                className="flex items-center gap-1 text-[11px] text-purple-300 hover:text-purple-200 bg-purple-500/10 hover:bg-purple-500/20 px-2.5 py-1 rounded-lg border border-purple-500/30 transition-all disabled:opacity-50"
              >
                <Wand2 className={`w-3.5 h-3.5 ${isEnhancing ? 'animate-spin' : ''}`} />
                <span>{isEnhancing ? 'Enhancing with AI...' : 'AI Prompt Assistant'}</span>
              </button>
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your vision (e.g. 'A futuristic crystalline quantum server room suspended over liquid helium with violet volumetric rays, 8k octane render...')"
              className="w-full p-4 rounded-xl bg-navy-950 border border-white/10 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-purple-400 custom-scrollbar resize-none leading-relaxed"
            />
          </div>

          {/* Optional Negative Prompt */}
          <div className="pt-1">
            <details className="text-xs text-slate-400 cursor-pointer">
              <summary className="text-[11px] text-slate-400 hover:text-slate-200 select-none">
                + Add Negative Prompt (What to avoid in image)
              </summary>
              <input
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="e.g. blurry, low quality, artifacts, watermark, distorted anatomy"
                className="w-full mt-2 px-3 py-2 rounded-xl bg-navy-950 border border-white/10 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-400"
              />
            </details>
          </div>

          {/* Style Selector Chips (10 Styles) */}
          <div className="pt-2">
            <span className="text-xs text-slate-400 font-medium block mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-400" /> Visual Style:
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {STYLES.map((style) => (
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
          </div>

          {/* Aspect Ratio & Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-white/5">
            
            {/* Aspect Ratio Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs text-slate-400 font-medium shrink-0 flex items-center gap-1.5">
                <Crop className="w-3.5 h-3.5" /> Ratio:
              </span>
              <div className="flex items-center gap-1.5 bg-navy-950 p-1 rounded-xl border border-white/10">
                {ASPECT_RATIOS.map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => setSelectedRatio(r.id)}
                    title={`${r.label} (${r.dims}) — ${r.desc}`}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                      selectedRatio === r.id
                        ? 'bg-purple-600 text-white shadow-sm font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {r.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Action Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-glow-purple transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>{isGenerating ? 'Synthesizing 8K Render...' : 'Generate Visual Asset'}</span>
            </button>
          </div>
        </div>
      )}

      {/* MODE 2: AI IMAGE EDITING WORKSPACE */}
      {activeMode === 'edit' && (
        <div className="p-6 rounded-2xl bg-navy-900/90 border border-white/10 shadow-2xl backdrop-blur-xl mb-10 space-y-6">
          <div className="border-b border-white/10 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Crop className="w-4 h-4 text-purple-400" />
                <span>AI Natural Language Image Editor</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload any PNG, JPG, or WebP image up to 15MB. Request modifications without overwriting your original.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left: Upload & Instructions */}
            <div className="space-y-4">
              
              {/* File Upload Box */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Source Image:</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/20 hover:border-purple-400/60 rounded-xl p-6 text-center cursor-pointer transition-all bg-navy-950/60 hover:bg-navy-950"
                >
                  <Upload className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-300 font-medium">Click to select an image from your device</p>
                  <p className="text-[11px] text-slate-500 mt-1">PNG, JPG, WebP supported (Up to 15MB)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Natural Language Edit Instruction */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Natural Language Editing Instruction:
                </label>
                <textarea
                  rows={3}
                  value={editInstruction}
                  onChange={(e) => setEditInstruction(e.target.value)}
                  placeholder="e.g. 'Change the background to a rainy cyberpunk street at night with neon reflections, enhance lighting...'"
                  className="w-full p-3 rounded-xl bg-navy-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 resize-none leading-relaxed"
                />
              </div>

              {/* Target Artistic Style */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Target Artistic Style:</label>
                <div className="flex flex-wrap gap-1.5">
                  {STYLES.slice(0, 6).map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setSelectedStyle(style)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] border transition-all ${
                        selectedStyle === style
                          ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                          : 'bg-navy-950 border-white/10 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleApplyEdit}
                disabled={isEditing || !uploadedImage || !editInstruction.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-glow-purple transition-all disabled:opacity-50"
              >
                {isEditing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                <span>{isEditing ? 'Synthesizing Edits...' : 'Apply AI Edits'}</span>
              </button>
            </div>

            {/* Right: Before-and-After Workspace */}
            <div className="rounded-xl bg-navy-950 border border-white/10 p-4 flex flex-col items-center justify-center min-h-[320px]">
              {uploadedImage ? (
                <div className="w-full space-y-3">
                  
                  {/* View Mode Toggle Controls */}
                  {editedResult && (
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="text-xs font-semibold text-purple-400">Before & After Comparison</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setBeforeAfterView('split')}
                          className={`px-2.5 py-0.5 rounded text-[11px] font-medium border ${
                            beforeAfterView === 'split'
                              ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                              : 'bg-navy-900 border-white/10 text-slate-400'
                          }`}
                        >
                          Side-by-Side
                        </button>
                        <button
                          onClick={() => setBeforeAfterView('toggle')}
                          className={`px-2.5 py-0.5 rounded text-[11px] font-medium border ${
                            beforeAfterView === 'toggle'
                              ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                              : 'bg-navy-900 border-white/10 text-slate-400'
                          }`}
                        >
                          Single Toggle
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Render Comparison Views */}
                  {editedResult ? (
                    beforeAfterView === 'split' ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-1">ORIGINAL IMAGE</span>
                          <img
                            src={uploadedImage}
                            alt="Original"
                            className="w-full h-56 object-cover rounded-lg border border-white/10"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-400 block mb-1">AI EDITED RESULT</span>
                          <img
                            src={editedResult.imageUrl}
                            alt="Edited"
                            className="w-full h-56 object-cover rounded-lg border border-emerald-500/40 shadow-glow-purple"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="relative">
                          <img
                            src={showOriginalInToggle ? uploadedImage : editedResult.imageUrl}
                            alt="Comparison"
                            className="w-full h-64 object-cover rounded-lg border border-white/10"
                          />
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 text-[10px] text-white backdrop-blur">
                            {showOriginalInToggle ? 'Showing: Original' : 'Showing: AI Edited'}
                          </span>
                        </div>
                        <button
                          onMouseDown={() => setShowOriginalInToggle(true)}
                          onMouseUp={() => setShowOriginalInToggle(false)}
                          className="w-full py-1.5 rounded-lg bg-navy-900 border border-white/10 text-xs text-slate-300 font-medium select-none"
                        >
                          Hold to View Original
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="text-center">
                      <span className="text-[10px] text-slate-400 block mb-2">SOURCE IMAGE LOADED</span>
                      <img
                        src={uploadedImage}
                        alt="Uploaded preview"
                        className="max-h-64 mx-auto object-contain rounded-lg border border-white/10"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-slate-500">
                  <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Upload an image on the left to preview and edit</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: CREATIVE DESIGN TEMPLATES */}
      {activeMode === 'templates' && (
        <div className="p-6 rounded-2xl bg-navy-900/90 border border-white/10 shadow-2xl backdrop-blur-xl mb-10">
          <div className="border-b border-white/10 pb-3 mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Creative Design Presets & Canvas Sizes</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a specialized creative workflow to pre-configure dimensions, aspect ratio, and composition modifiers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                onClick={() => handleSelectTemplate(tmpl)}
                className="p-4 rounded-xl bg-navy-950 border border-white/10 hover:border-purple-500/50 hover:bg-navy-900 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    {tmpl.ratio}
                  </span>
                  <span className="text-[11px] text-slate-500 group-hover:text-purple-400 transition-colors">
                    Use Template →
                  </span>
                </div>
                <h3 className="font-semibold text-sm text-slate-200 group-hover:text-white mb-1">
                  {tmpl.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2">
                  Style: {tmpl.style} • {tmpl.modifier.slice(0, 75)}...
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Asset Gallery & Generation History */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>Creative Gallery & Production Assets</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-navy-900 border border-white/10 text-xs text-slate-400 font-mono">
              {gallery.length} Assets
            </span>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {gallery.map((img) => (
            <div
              key={img.id}
              onClick={() => setActiveModalImage(img)}
              className="group relative rounded-2xl overflow-hidden bg-navy-900/80 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:shadow-glow-purple cursor-pointer flex flex-col"
            >
              
              {/* Image Preview Container */}
              <div className="relative aspect-video w-full overflow-hidden bg-navy-950">
                <img
                  src={img.imageUrl}
                  alt={img.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Badges Overlay */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-navy-950/80 backdrop-blur-md text-purple-300 border border-white/10">
                    {img.ratio || '1:1'}
                  </span>
                  {img.isEdited && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/80 text-white font-semibold">
                      Edited
                    </span>
                  )}
                </div>

                {/* Quick Action Overlay Buttons */}
                <div className="absolute inset-0 bg-navy-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => handleCopyPrompt(img, e)}
                    title="Copy Prompt"
                    className="p-2 rounded-xl bg-navy-900/90 text-white hover:bg-purple-600 transition-colors border border-white/10"
                  >
                    {copiedPromptId === img.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={(e) => handleDownload(img, e)}
                    title="Download Asset"
                    className="p-2 rounded-xl bg-navy-900/90 text-white hover:bg-purple-600 transition-colors border border-white/10"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteImage(img, e)}
                    title="Delete Asset"
                    className="p-2 rounded-xl bg-navy-900/90 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors border border-white/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-slate-200 group-hover:text-purple-300 transition-colors line-clamp-1">
                    {img.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {img.prompt}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>{img.style}</span>
                  <span>{img.engine || 'Nova Neural'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full-Screen Image Inspection Modal */}
      {activeModalImage && (
        <div
          onClick={() => setActiveModalImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-navy-900 border border-white/15 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="truncate pr-4">
                <h3 className="font-bold text-white text-base truncate">{activeModalImage.title}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {activeModalImage.style} • {activeModalImage.ratio} • {activeModalImage.dimensions || '1024×1024'}
                </p>
              </div>
              <button
                onClick={() => setActiveModalImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Image View */}
            <div className="flex-1 bg-black/60 flex items-center justify-center p-4 overflow-hidden">
              <img
                src={activeModalImage.imageUrl}
                alt={activeModalImage.title}
                className="max-h-[50vh] max-w-full object-contain rounded-lg shadow-2xl"
              />
            </div>

            {/* Modal Details & Action Bar */}
            <div className="p-4 border-t border-white/10 bg-navy-950/80 space-y-3">
              <div>
                <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider block mb-1">
                  Generation Prompt:
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-mono bg-navy-900/80 p-2.5 rounded-lg border border-white/5">
                  {activeModalImage.prompt}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <span className="text-[11px] font-mono text-slate-400">
                  Engine: <strong className="text-purple-300">{activeModalImage.engine || 'Nova Neural v3.8'}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onSendToChat?.(`Analyze this creative visual concept: "${activeModalImage.prompt}"`);
                      setActiveModalImage(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-850 hover:bg-navy-800 text-slate-300 hover:text-white border border-white/10 text-xs transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send to AI Chat</span>
                  </button>

                  <button
                    onClick={(e) => handleDownload(activeModalImage, e)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-glow-purple transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Image</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
