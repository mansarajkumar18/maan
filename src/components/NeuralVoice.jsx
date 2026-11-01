import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Languages,
  Sparkles,
  ArrowRightLeft,
  Copy,
  Check,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Radio,
  Share2,
} from 'lucide-react';
import { TRANSLATE_LANGUAGES, TRANSLATE_TONES } from '../data/mockData';

export default function NeuralVoice({ onNotify }) {
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('ja');
  const [selectedTone, setSelectedTone] = useState('professional');
  const [sourceText, setSourceText] = useState(
    'Our next-generation distributed architecture guarantees sub-millisecond data sync across global regions.'
  );
  const [translatedText, setTranslatedText] = useState(
    '当社の次世代分散型アーキテクチャは、グローバルリージョン間でのミリ秒未満のデータ同期を保証します。'
  );
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState('1.0x');

  const handleSwapLanguages = () => {
    const tempLang = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(tempLang);

    const tempText = sourceText;
    setSourceText(translatedText);
    setTranslatedText(tempText);
    onNotify?.('Languages swapped!', 'info');
  };

  const handleTranslate = () => {
    if (!sourceText.trim()) return;
    setIsTranslating(true);
    setTimeout(() => {
      setIsTranslating(false);
      // Sample mock translations for standard languages
      if (targetLang === 'ja') {
        setTranslatedText(
          '当社の次世代分散型アーキテクチャは、グローバルリージョン間でのミリ秒未満のデータ同期を保証します。'
        );
      } else if (targetLang === 'es') {
        setTranslatedText(
          'Nuestra arquitectura distribuida de próxima generación garantiza la sincronización de datos en menos de un milisegundo en todas las regiones globales.'
        );
      } else if (targetLang === 'de') {
        setTranslatedText(
          'Unsere verteilte Architektur der nächsten Generation garantiert eine Datensynchronisation im Sub-Millisekundenbereich über alle globalen Regionen hinweg.'
        );
      } else if (targetLang === 'fr') {
        setTranslatedText(
          'Notre architecture distribuée de nouvelle génération garantit une synchronisation des données en moins d’une milliseconde dans toutes les régions du monde.'
        );
      } else {
        setTranslatedText(
          `[Neural Translation - ${targetLang.toUpperCase()} (${selectedTone})]: ` +
            sourceText.split(' ').reverse().join(' ')
        );
      }
      onNotify?.('Neural translation & acoustic prosody synthesized!', 'success');
    }, 500);
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      onNotify?.('Listening... Speak into your microphone', 'info');
      setTimeout(() => {
        setIsRecording(false);
        setSourceText('Autonomous agent workflows represent a paradigm shift in scalable intelligence.');
        onNotify?.('Voice transcribed with 99.4% acoustic accuracy!', 'success');
      }, 3500);
    } else {
      setIsRecording(false);
    }
  };

  const toggleAudioPlayback = () => {
    if (isPlayingAudio) {
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      setTimeout(() => {
        setIsPlayingAudio(false);
      }, 4000);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    onNotify?.('Translated output copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-400 mb-1">
            <Radio className="w-4 h-4" />
            <span>Neural Voice & Multi-Lingual Translation</span>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px]">
              Sub-100ms Latency
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
            Real-Time Speech & Polyglot Engine
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Zero-shot voice cloning, emotional prosody synthesis, and idiom-aware neural translation in 30+ languages.
          </p>
        </div>

        {/* Live Audio Mic Trigger */}
        <button
          onClick={toggleRecording}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-lg ${
            isRecording
              ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/50'
              : 'bg-navy-850 hover:bg-navy-800 text-slate-200 hover:text-white border border-white/10'
          }`}
        >
          {isRecording ? <Mic className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4 text-rose-400" />}
          <span>{isRecording ? 'Listening (Live Stream)...' : 'Simulate Voice Input'}</span>
        </button>
      </div>

      {/* Language & Tone Bar */}
      <div className="p-4 rounded-2xl bg-navy-900/90 border border-white/10 shadow-xl backdrop-blur-xl mb-6 flex flex-wrap items-center justify-between gap-4">
        
        {/* Language Selectors */}
        <div className="flex items-center gap-3">
          {/* Source Lang */}
          <select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            className="px-3 py-2 rounded-xl bg-navy-950 border border-white/10 text-xs font-semibold text-slate-200 focus:outline-none focus:border-rose-400 cursor-pointer"
          >
            {TRANSLATE_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-navy-950 text-white">
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>

          {/* Swap Button */}
          <button
            onClick={handleSwapLanguages}
            className="p-2 rounded-xl bg-navy-950 hover:bg-navy-800 border border-white/10 text-slate-400 hover:text-white transition-colors"
            title="Swap Languages"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>

          {/* Target Lang */}
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="px-3 py-2 rounded-xl bg-navy-950 border border-white/10 text-xs font-semibold text-slate-200 focus:outline-none focus:border-rose-400 cursor-pointer"
          >
            {TRANSLATE_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-navy-950 text-white">
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tone Selector Chips */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs text-slate-400 font-medium shrink-0">Tone:</span>
          {TRANSLATE_TONES.map((tone) => (
            <button
              key={tone.id}
              onClick={() => setSelectedTone(tone.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                selectedTone === tone.id
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                  : 'bg-navy-950/60 hover:bg-navy-800 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {tone.label.split(' / ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Dual Translation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* Source Text Box */}
        <div className="p-6 rounded-2xl bg-navy-900/90 border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-semibold text-slate-400 uppercase tracking-wider">
                Source ({TRANSLATE_LANGUAGES.find((l) => l.code === sourceLang)?.name})
              </span>
              <span className="font-mono text-[11px] text-slate-500">{sourceText.length} chars</span>
            </div>
            <textarea
              rows={6}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Enter text or speak into microphone..."
              className="w-full bg-transparent text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none resize-none leading-relaxed custom-scrollbar"
            />
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            <button
              onClick={handleTranslate}
              disabled={isTranslating}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white font-semibold text-xs shadow-lg transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isTranslating ? 'Translating...' : 'Translate & Synthesize'}</span>
            </button>
          </div>
        </div>

        {/* Target Translation Box */}
        <div className="p-6 rounded-2xl bg-navy-900/90 border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-semibold text-rose-400 uppercase tracking-wider">
                Target ({TRANSLATE_LANGUAGES.find((l) => l.code === targetLang)?.name})
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="text-sm sm:text-base text-slate-100 leading-relaxed font-sans min-h-[140px] whitespace-pre-wrap">
              {translatedText}
            </div>
          </div>

          {/* Audio Synthesizer Controls */}
          <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleAudioPlayback}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-navy-850 hover:bg-navy-800 text-slate-200 border border-white/10 text-xs font-semibold transition-all hover:border-rose-400"
              >
                {isPlayingAudio ? (
                  <Pause className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                )}
                <span>{isPlayingAudio ? 'Playing Stream...' : 'Play Audio (TTS)'}</span>
              </button>

              {/* Speed Switcher */}
              <select
                value={audioSpeed}
                onChange={(e) => setAudioSpeed(e.target.value)}
                className="px-2 py-1 rounded-lg bg-navy-950 border border-white/10 text-[11px] font-mono text-slate-300 focus:outline-none"
              >
                <option value="0.75x">0.75x</option>
                <option value="1.0x">1.0x</option>
                <option value="1.25x">1.25x</option>
                <option value="1.5x">1.5x</option>
              </select>
            </div>

            {/* Audio Wave Bars Animation */}
            {isPlayingAudio && (
              <div className="flex items-center gap-1 h-5 px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <span className="w-1 h-full bg-rose-400 rounded-full animate-wave-1"></span>
                <span className="w-1 h-full bg-rose-400 rounded-full animate-wave-2"></span>
                <span className="w-1 h-full bg-rose-400 rounded-full animate-wave-3"></span>
                <span className="w-1 h-full bg-rose-400 rounded-full animate-wave-4"></span>
                <span className="w-1 h-full bg-rose-400 rounded-full animate-wave-5"></span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
