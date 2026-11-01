import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-cyan-400 shrink-0" />,
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-navy-850/95 border border-white/10 shadow-2xl backdrop-blur-xl text-sm animate-bounce-subtle transition-all duration-300">
      {icons[toast.type] || icons.info}
      <span className="text-slate-100 font-medium">{toast.message}</span>
      <button
        onClick={onClose}
        className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
