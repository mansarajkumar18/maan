import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import {
  Code,
  Play,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Terminal,
  FileCode2,
  AlertTriangle,
  Download,
  Wand2,
  FolderPlus,
  FilePlus,
  Trash2,
  Edit3,
  Save,
  FileText,
  ChevronRight,
  ChevronDown,
  Maximize2,
  Search,
  Bug,
  Zap,
  MessageSquare,
  Send,
  Sliders,
  X,
  ExternalLink,
  Sun,
  Moon,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { CODE_PRESETS } from '../data/mockData';

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', ext: '.js' },
  { id: 'typescript', label: 'TypeScript', ext: '.ts' },
  { id: 'python', label: 'Python', ext: '.py' },
  { id: 'html', label: 'HTML', ext: '.html' },
  { id: 'css', label: 'CSS', ext: '.css' },
  { id: 'json', label: 'JSON', ext: '.json' },
  { id: 'java', label: 'Java', ext: '.java' },
  { id: 'c', label: 'C', ext: '.c' },
  { id: 'cpp', label: 'C++', ext: '.cpp' },
  { id: 'sql', label: 'SQL', ext: '.sql' },
];

function detectLang(filename) {
  const ext = (filename || '').split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'mjs':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'py':
      return 'python';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'java':
      return 'java';
    case 'c':
      return 'c';
    case 'cpp':
    case 'cc':
    case 'h':
      return 'cpp';
    case 'sql':
      return 'sql';
    default:
      return 'javascript';
  }
}

export default function CodeStudio({ activeModel, onNotify }) {
  // Current Project & Files
  const [currentProject, setCurrentProject] = useState({
    id: 'proj_default',
    name: 'NOVA Code Studio Workspace',
    description: 'Autonomous multi-language developer environment',
    files: [
      {
        name: 'index.js',
        path: 'index.js',
        language: 'javascript',
        content: CODE_PRESETS[0].code,
      },
      {
        name: 'styles.css',
        path: 'styles.css',
        language: 'css',
        content: `/* Custom telemetry styling */\n.telemetry-card {\n  backdrop-filter: blur(12px);\n  background: rgba(15, 23, 42, 0.75);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n}`,
      },
      {
        name: 'README.md',
        path: 'README.md',
        language: 'markdown',
        content: `# NOVA AI Code Studio\n\nBuilt by MSR Digital Media.\n- Monaco Editor Integration\n- Multi-Language Support\n- Real AI Generation, Explanation, Debugging, and Optimization\n- Security-First Isolated Execution Sandbox`,
      },
    ],
  });

  const [activeFilePath, setActiveFilePath] = useState('index.js');
  const [openTabs, setOpenTabs] = useState(['index.js', 'styles.css', 'README.md']);
  const [code, setCode] = useState(CODE_PRESETS[0].code);
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const [editorSelection, setEditorSelection] = useState('');
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // AI & Assistant State
  const [aiTab, setAiTab] = useState('generate'); // 'generate' | 'explain' | 'debug' | 'optimize' | 'chat'
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [genType, setGenType] = useState('component'); // 'component' | 'function' | 'api' | 'tests'
  const [generatedOutput, setGeneratedOutput] = useState(null);

  // Explanation State
  const [explainMode, setExplainMode] = useState('detailed');
  const [explanationOutput, setExplanationOutput] = useState(null);

  // Debug State
  const [debugError, setDebugError] = useState('');
  const [debugStack, setDebugStack] = useState('');
  const [debugExpected, setDebugExpected] = useState('');
  const [debugOutput, setDebugOutput] = useState(null);

  // Optimization State
  const [optimizeFocus, setOptimizeFocus] = useState('all');
  const [optimizeOutput, setOptimizeOutput] = useState(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hello! I am your NOVA AI Coding Companion. I have complete awareness of your active editor file, language, and selected code. Ask me anything, or request refactoring, unit tests, or architecture advice!',
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Execution & Console Drawer State
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [drawerTab, setDrawerTab] = useState('terminal'); // 'terminal' | 'preview'
  const [isRunning, setIsRunning] = useState(false);
  const [executionOutput, setExecutionOutput] = useState({
    status: 'ready',
    stdout: '[NOVA AI Execution Sandbox] System ready. Press "Run Sandbox" to execute code in isolated environment.',
    stderr: '',
    durationMs: 0,
    exitCode: 0,
    simulated: false,
  });

  // Modal / Input Prompts
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [copied, setCopied] = useState(false);

  const editorRef = useRef(null);
  const chatBottomRef = useRef(null);

  // Sync active file code when activeFilePath changes
  useEffect(() => {
    const targetFile = currentProject.files.find((f) => f.path === activeFilePath);
    if (targetFile) {
      setCode(targetFile.content);
    }
  }, [activeFilePath, currentProject]);

  // Scroll chat to bottom on new message
  useEffect(() => {
    if (aiTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, aiTab]);

  const activeLanguage = detectLang(activeFilePath);

  // Handle code change inside editor
  const handleEditorChange = (value) => {
    const newCode = value ?? '';
    setCode(newCode);
    setUnsavedChanges(true);

    // Update in-memory project file content
    setCurrentProject((prev) => ({
      ...prev,
      files: prev.files.map((f) => (f.path === activeFilePath ? { ...f, content: newCode } : f)),
    }));
  };

  // Monaco mount callback
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // Listen to cursor selection
    editor.onDidChangeCursorSelection(() => {
      const selection = editor.getSelection();
      if (selection && !selection.isEmpty()) {
        const selectedText = editor.getModel()?.getValueInRange(selection) || '';
        setEditorSelection(selectedText);
      } else {
        setEditorSelection('');
      }
    });
  };

  // Format code action
  const handleFormatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
      onNotify?.('Formatted code via Monaco Engine', 'info');
    }
  };

  // Copy code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    onNotify?.('Code copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // Download active file
  const handleDownloadFile = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFilePath.split('/').pop() || 'script.js';
    link.click();
    URL.revokeObjectURL(url);
    onNotify?.(`Downloaded ${activeFilePath}`, 'success');
  };

  // Switch active tab
  const handleSelectTab = (filePath) => {
    setActiveFilePath(filePath);
    const file = currentProject.files.find((f) => f.path === filePath);
    if (file) {
      setCode(file.content);
    }
  };

  // Close tab
  const handleCloseTab = (filePath, e) => {
    e.stopPropagation();
    const newTabs = openTabs.filter((t) => t !== filePath);
    setOpenTabs(newTabs);
    if (activeFilePath === filePath && newTabs.length > 0) {
      setActiveFilePath(newTabs[0]);
    }
  };

  // Create new file
  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    const cleanPath = newFileName.trim().replace(/^\/+/, '');
    const filename = cleanPath.split('/').pop() || 'file.js';
    const lang = detectLang(filename);

    if (currentProject.files.some((f) => f.path === cleanPath)) {
      onNotify?.('File with this name already exists.', 'error');
      return;
    }

    const newFile = {
      name: filename,
      path: cleanPath,
      language: lang,
      content: `// ${filename} — Created in NOVA AI Code Studio\n`,
    };

    setCurrentProject((prev) => ({
      ...prev,
      files: [...prev.files, newFile],
    }));

    setOpenTabs((prev) => (prev.includes(cleanPath) ? prev : [...prev, cleanPath]));
    setActiveFilePath(cleanPath);
    setCode(newFile.content);
    setNewFileName('');
    setShowNewFileModal(false);
    onNotify?.(`Created file: ${cleanPath}`, 'success');
  };

  // Delete file with confirmation
  const handleDeleteFile = (filePath) => {
    if (currentProject.files.length <= 1) {
      onNotify?.('Cannot delete the only remaining file.', 'error');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${filePath}?`)) {
      const remainingFiles = currentProject.files.filter((f) => f.path !== filePath);
      const remainingTabs = openTabs.filter((t) => t !== filePath);

      setCurrentProject((prev) => ({ ...prev, files: remainingFiles }));
      setOpenTabs(remainingTabs);

      if (activeFilePath === filePath) {
        const nextActive = remainingTabs[0] || remainingFiles[0].path;
        setActiveFilePath(nextActive);
      }
      onNotify?.(`Deleted ${filePath}`, 'info');
    }
  };

  // Run Code in Sandbox
  const handleRunCode = async () => {
    setIsRunning(true);
    setDrawerOpen(true);
    setDrawerTab('terminal');

    try {
      const res = await fetch('/api/code/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: activeLanguage,
          timeoutMs: 4000,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setExecutionOutput({
          status: data.status,
          stdout: data.stdout || '(No standard output)',
          stderr: data.stderr || '',
          durationMs: data.durationMs || 0,
          exitCode: data.exitCode ?? 0,
          simulated: Boolean(data.simulated),
        });
        if (data.status === 'success') {
          onNotify?.(`Executed successfully in ${data.durationMs}ms`, 'success');
        } else if (data.status === 'simulated') {
          onNotify?.('Analyzed with AI Static Verification Engine', 'info');
        } else {
          onNotify?.(`Execution error (exit code ${data.exitCode})`, 'error');
        }
      } else {
        setExecutionOutput({
          status: 'error',
          stdout: '',
          stderr: data.error || 'Execution failed on server.',
          durationMs: 0,
          exitCode: 1,
          simulated: false,
        });
        onNotify?.(data.error || 'Execution failed', 'error');
      }
    } catch (err) {
      setExecutionOutput({
        status: 'error',
        stdout: '',
        stderr: err.message || 'Network error executing code.',
        durationMs: 0,
        exitCode: 1,
        simulated: false,
      });
      onNotify?.('Error connecting to backend execution service', 'error');
    } finally {
      setIsRunning(false);
    }
  };

  // 1. AI Code Generation
  const handleGenerateCode = async () => {
    if (!aiPrompt.trim()) {
      onNotify?.('Please describe the code you want to generate.', 'error');
      return;
    }

    setIsAiLoading(true);
    setGeneratedOutput(null);

    try {
      const res = await fetch('/api/code/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          language: activeLanguage,
          type: genType,
          context: code.slice(0, 1500),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setGeneratedOutput(data);
        onNotify?.('AI Code generated successfully!', 'success');
      } else {
        onNotify?.(data.error || 'Generation failed', 'error');
      }
    } catch (err) {
      onNotify?.(err.message || 'Failed to generate code', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Insert generated code into editor
  const handleInsertCode = (insertCode, mode = 'replace_selection') => {
    if (!insertCode) return;
    if (mode === 'replace_selection' && editorSelection && editorRef.current) {
      const selection = editorRef.current.getSelection();
      editorRef.current.executeEdits('ai-assistant', [{ range: selection, text: insertCode, forceMoveMarkers: true }]);
      onNotify?.('Replaced selected code in editor', 'success');
    } else if (mode === 'append') {
      const updated = `${code}\n\n${insertCode}`;
      handleEditorChange(updated);
      onNotify?.('Appended code to file', 'success');
    } else {
      handleEditorChange(insertCode);
      onNotify?.('Loaded code into editor', 'success');
    }
  };

  // 2. AI Code Explanation
  const handleExplainCode = async () => {
    setIsAiLoading(true);
    setExplanationOutput(null);

    try {
      const res = await fetch('/api/code/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          selection: editorSelection || null,
          language: activeLanguage,
          mode: explainMode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setExplanationOutput(data.explanation);
        onNotify?.('Code explanation synthesized!', 'success');
      } else {
        onNotify?.(data.error || 'Explanation failed', 'error');
      }
    } catch (err) {
      onNotify?.(err.message || 'Failed to explain code', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  // 3. AI Debugging
  const handleDebugCode = async () => {
    setIsAiLoading(true);
    setDebugOutput(null);

    try {
      const res = await fetch('/api/code/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: activeLanguage,
          errorMessage: debugError,
          stackTrace: debugStack,
          expectedBehavior: debugExpected,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setDebugOutput(data);
        onNotify?.('Bug analysis and fix generated!', 'success');
      } else {
        onNotify?.(data.error || 'Debugging failed', 'error');
      }
    } catch (err) {
      onNotify?.(err.message || 'Failed to debug code', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  // 4. AI Code Optimization
  const handleOptimizeCode = async () => {
    setIsAiLoading(true);
    setOptimizeOutput(null);

    try {
      const res = await fetch('/api/code/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: activeLanguage,
          focusArea: optimizeFocus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOptimizeOutput(data);
        onNotify?.('Optimization complete!', 'success');
      } else {
        onNotify?.(data.error || 'Optimization failed', 'error');
      }
    } catch (err) {
      onNotify?.(err.message || 'Failed to optimize code', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  // 5. AI Coding Chat
  const handleSendChatMessage = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || isAiLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/code/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          activeFile: activeFilePath,
          code: code.slice(0, 4000),
          selection: editorSelection || null,
          language: activeLanguage,
          openFiles: openTabs,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `**Error:** ${data.error || 'Could not generate chat response.'}` },
        ]);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `**Network Error:** ${err.message}` },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Live HTML/JS Preview Content
  const previewHtml =
    activeLanguage === 'html'
      ? code
      : `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: system-ui, sans-serif; background: #0b1329; color: #f8fafc; padding: 20px; }
  </style>
</head>
<body>
  <div id="root">
    <p style="color: #38bdf8;">⚡ Live Web Sandbox Active</p>
    <div id="output"></div>
  </div>
  <script>
    try {
      const consoleLog = console.log;
      console.log = function(...args) {
        consoleLog(...args);
        const el = document.getElementById('output');
        if (el) el.innerHTML += '<div style="font-family:monospace; margin-top:4px; color:#34d399;">> ' + args.join(' ') + '</div>';
      };
      ${code}
    } catch (err) {
      document.getElementById('output').innerHTML += '<div style="color:#f87171; font-family:monospace;">Error: ' + err.message + '</div>';
    }
  </script>
</body>
</html>`;

  return (
    <div className="max-w-[1750px] mx-auto px-2 sm:px-4 lg:px-6 py-4 animate-in fade-in duration-300">
      
      {/* Top Header & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 p-3 rounded-2xl bg-navy-900/80 border border-white/10 backdrop-blur-md">
        
        {/* Brand & Project Status */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-display font-bold text-white tracking-wide">
                NOVA AI Code Studio
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-mono">
                Phase 6 • Multi-Lang
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>{currentProject.name}</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-cyan-400 text-[11px]">{activeFilePath}</span>
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Language Selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-navy-950 border border-white/10 text-xs">
            <span className="text-slate-400 text-[11px]">Lang:</span>
            <select
              value={activeLanguage}
              onChange={(e) => {
                const chosen = e.target.value;
                const match = LANGUAGES.find((l) => l.id === chosen);
                if (match) {
                  const base = activeFilePath.split('.')[0] || 'script';
                  const newPath = `${base}${match.ext}`;
                  setCurrentProject((prev) => ({
                    ...prev,
                    files: prev.files.map((f) =>
                      f.path === activeFilePath ? { ...f, path: newPath, language: chosen } : f
                    ),
                  }));
                  setOpenTabs((prev) => prev.map((t) => (t === activeFilePath ? newPath : t)));
                  setActiveFilePath(newPath);
                }
              }}
              className="bg-transparent text-cyan-300 font-mono text-xs focus:outline-none cursor-pointer"
            >
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id} className="bg-navy-900 text-slate-200">
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setEditorTheme(editorTheme === 'vs-dark' ? 'vs-light' : 'vs-dark')}
            title="Toggle Editor Theme"
            className="p-2 rounded-xl bg-navy-850 hover:bg-navy-800 text-slate-300 hover:text-white border border-white/10 transition-all text-xs"
          >
            {editorTheme === 'vs-dark' ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-slate-300" />}
          </button>

          {/* Format Code */}
          <button
            onClick={handleFormatCode}
            title="Auto-Format Code"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-850 hover:bg-navy-800 text-slate-300 hover:text-white border border-white/10 text-xs transition-all"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Format</span>
          </button>

          {/* Copy Code */}
          <button
            onClick={handleCopyCode}
            title="Copy Code"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-850 hover:bg-navy-800 text-slate-300 hover:text-white border border-white/10 text-xs transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Download File */}
          <button
            onClick={handleDownloadFile}
            title="Download File"
            className="p-2 rounded-xl bg-navy-850 hover:bg-navy-800 text-slate-300 hover:text-white border border-white/10 transition-all text-xs"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
          </button>

          {/* Run Sandbox Button */}
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-navy-950 font-bold text-xs shadow-glow-blue transition-all disabled:opacity-50"
          >
            {isRunning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isRunning ? 'Running...' : 'Run Sandbox'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Grid (File Explorer | Editor + Console | AI Suite) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-[calc(100vh-190px)] min-h-[650px]">
        
        {/* 1. File Explorer (Left - 2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-navy-900/90 border border-white/10 flex flex-col overflow-hidden">
          
          {/* File Explorer Header */}
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileCode2 className="w-3.5 h-3.5 text-cyan-400" /> Files
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowNewFileModal(true)}
                title="New File"
                className="p-1 rounded-lg hover:bg-navy-800 text-slate-400 hover:text-cyan-400 transition-colors"
              >
                <FilePlus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* New File Inline Input */}
          {showNewFileModal && (
            <div className="p-2 border-b border-white/10 bg-navy-950/80 animate-in fade-in">
              <input
                type="text"
                placeholder="e.g. utils/math.js"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
                className="w-full px-2 py-1 bg-navy-900 border border-cyan-500/50 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none mb-1.5"
                autoFocus
              />
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => setShowNewFileModal(false)}
                  className="px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFile}
                  className="px-2.5 py-0.5 rounded bg-cyan-500 text-navy-950 font-bold text-[10px]"
                >
                  Create
                </button>
              </div>
            </div>
          )}

          {/* Files List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {currentProject.files.map((file) => {
              const isActive = file.path === activeFilePath;
              return (
                <div
                  key={file.path}
                  onClick={() => {
                    handleSelectTab(file.path);
                    if (!openTabs.includes(file.path)) {
                      setOpenTabs([...openTabs, file.path]);
                    }
                  }}
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono cursor-pointer transition-all ${
                    isActive
                      ? 'bg-blue-600/20 text-cyan-300 border border-cyan-500/30 font-medium'
                      : 'text-slate-400 hover:bg-navy-800 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <span className="truncate">{file.path}</span>
                  </div>

                  {/* Delete button (visible on hover) */}
                  {currentProject.files.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(file.path);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-all"
                      title="Delete file"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Starter Presets Drawer */}
          <div className="p-3 border-t border-white/10 bg-navy-950/60">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">Starter Presets</span>
            <div className="space-y-1">
              {CODE_PRESETS.slice(0, 3).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    handleEditorChange(preset.code);
                    onNotify?.(`Loaded ${preset.name}`, 'info');
                  }}
                  className="w-full text-left px-2 py-1 rounded text-[11px] text-slate-400 hover:text-cyan-300 hover:bg-navy-850 truncate transition-colors block"
                >
                  ⚡ {preset.name.split('(')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Monaco Editor + Execution Console (Center - 6 Cols) */}
        <div className="lg:col-span-6 rounded-2xl bg-navy-900/90 border border-white/10 flex flex-col overflow-hidden">
          
          {/* File Tabs Bar */}
          <div className="flex items-center justify-between bg-navy-950 border-b border-white/10 px-2 overflow-x-auto custom-scrollbar">
            <div className="flex items-center gap-1 py-1">
              {openTabs.map((tab) => {
                const isActive = tab === activeFilePath;
                return (
                  <div
                    key={tab}
                    onClick={() => handleSelectTab(tab)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-mono cursor-pointer transition-all border-b-2 ${
                      isActive
                        ? 'bg-navy-900 text-cyan-300 border-cyan-400 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-navy-900/50'
                    }`}
                  >
                    <span>{tab.split('/').pop()}</span>
                    {openTabs.length > 1 && (
                      <button
                        onClick={(e) => handleCloseTab(tab, e)}
                        className="hover:text-rose-400 p-0.5 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selection Pill */}
            {editorSelection && (
              <span className="text-[10px] text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 whitespace-nowrap">
                {editorSelection.split('\n').length} lines selected
              </span>
            )}
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 relative overflow-hidden bg-[#1e1e1e]">
            <Editor
              height="100%"
              theme={editorTheme}
              language={activeLanguage}
              value={code}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              options={{
                fontSize: 13,
                fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
                minimap: { enabled: true },
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                autoIndent: 'full',
                formatOnPaste: true,
                formatOnType: true,
                tabSize: 2,
                smoothScrolling: true,
              }}
              loading={
                <div className="flex items-center justify-center h-full text-slate-400 gap-2 font-mono text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Loading Monaco Workspace...</span>
                </div>
              }
            />
          </div>

          {/* Bottom Execution & Console Drawer */}
          <div className="border-t border-white/10 bg-navy-950 flex flex-col">
            
            {/* Drawer Tabs */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 bg-navy-900/60">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setDrawerOpen(true);
                    setDrawerTab('terminal');
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold ${
                    drawerTab === 'terminal' && drawerOpen
                      ? 'bg-navy-800 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Terminal Output</span>
                  {executionOutput.status === 'success' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setDrawerOpen(true);
                    setDrawerTab('preview');
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold ${
                    drawerTab === 'preview' && drawerOpen
                      ? 'bg-navy-800 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Live Web Preview</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {executionOutput.simulated && (
                  <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    AI Static Analysis
                  </span>
                )}
                {executionOutput.durationMs > 0 && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {executionOutput.durationMs}ms
                  </span>
                )}
                <button
                  onClick={() => setDrawerOpen(!drawerOpen)}
                  className="p-1 rounded text-slate-400 hover:text-slate-200"
                >
                  {drawerOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            {drawerOpen && (
              <div className="h-44 overflow-y-auto p-3 font-mono text-xs custom-scrollbar">
                {drawerTab === 'terminal' ? (
                  <div>
                    {executionOutput.stdout && (
                      <pre className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {executionOutput.stdout}
                      </pre>
                    )}
                    {executionOutput.stderr && (
                      <pre className="text-rose-400 mt-2 whitespace-pre-wrap leading-relaxed">
                        {executionOutput.stderr}
                      </pre>
                    )}
                  </div>
                ) : (
                  <div className="h-full bg-white rounded-lg overflow-hidden border border-white/20">
                    <iframe
                      title="Web Live Sandbox"
                      srcDoc={previewHtml}
                      sandbox="allow-scripts"
                      className="w-full h-full border-0"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 3. AI Assistant Suite Panel (Right - 4 Cols) */}
        <div className="lg:col-span-4 rounded-2xl bg-navy-900/90 border border-white/10 flex flex-col overflow-hidden">
          
          {/* AI Mode Tabs Bar */}
          <div className="flex items-center justify-between border-b border-white/10 bg-navy-950 p-1.5 overflow-x-auto custom-scrollbar">
            {[
              { id: 'generate', label: 'Generate', icon: Sparkles },
              { id: 'explain', label: 'Explain', icon: FileCode2 },
              { id: 'debug', label: 'Debug', icon: Bug },
              { id: 'optimize', label: 'Optimize', icon: Zap },
              { id: 'chat', label: 'Chat', icon: MessageSquare },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = aiTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setAiTab(tab.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600/30 text-cyan-300 border border-cyan-500/40 shadow-glow-blue'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-navy-850'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* AI Panel Body */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            
            {/* TAB 1: CODE GENERATION */}
            {aiTab === 'generate' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Describe requirements in natural language:
                  </label>
                  <textarea
                    rows={4}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Build an asynchronous rate-limited batch queue in TypeScript with exponential backoff..."
                    className="w-full p-2.5 rounded-xl bg-navy-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 custom-scrollbar"
                  />
                </div>

                {/* Code Type Chips */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">Target Structure:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'component', label: 'UI Component' },
                      { id: 'function', label: 'Utility Function' },
                      { id: 'api', label: 'REST API Route' },
                      { id: 'tests', label: 'Unit Tests' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setGenType(t.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                          genType === t.id
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-navy-850 text-slate-400 hover:text-slate-200 border border-white/5'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerateCode}
                  disabled={isAiLoading || !aiPrompt.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs transition-all shadow-glow-blue disabled:opacity-50"
                >
                  {isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isAiLoading ? 'Synthesizing Code...' : 'Generate Code'}</span>
                </button>

                {/* Generated Output Preview */}
                {generatedOutput && (
                  <div className="mt-4 p-3 rounded-xl bg-navy-950 border border-cyan-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-cyan-400">Generated Code Result</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleInsertCode(generatedOutput.code, 'replace_selection')}
                          className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-[10px] text-cyan-300 font-medium"
                        >
                          Insert at Cursor
                        </button>
                        <button
                          onClick={() => handleInsertCode(generatedOutput.code, 'append')}
                          className="px-2 py-0.5 rounded bg-navy-800 hover:bg-navy-750 text-[10px] text-slate-300 font-medium"
                        >
                          Append
                        </button>
                      </div>
                    </div>
                    <pre className="p-2.5 rounded-lg bg-navy-900 text-slate-200 text-xs font-mono max-h-56 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                      {generatedOutput.code}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CODE EXPLANATION */}
            {aiTab === 'explain' && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-navy-950 border border-white/10">
                  <span className="text-xs font-semibold text-slate-300 block mb-1">Target Code:</span>
                  <p className="text-xs text-slate-400 font-mono truncate">
                    {editorSelection
                      ? `Selected lines (${editorSelection.split('\n').length} lines)`
                      : `Entire active file: ${activeFilePath}`}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">Explanation Depth:</span>
                  <div className="flex gap-2">
                    {[
                      { id: 'detailed', label: 'Technical & Complexity' },
                      { id: 'beginner', label: 'Beginner-Friendly' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setExplainMode(m.id)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${
                          explainMode === m.id
                            ? 'bg-blue-600/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-navy-950 text-slate-400 border-white/10'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleExplainCode}
                  disabled={isAiLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-glow-blue disabled:opacity-50"
                >
                  {isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileCode2 className="w-4 h-4" />}
                  <span>{isAiLoading ? 'Analyzing Code Structure...' : 'Explain Code'}</span>
                </button>

                {explanationOutput && (
                  <div className="mt-4 p-3 rounded-xl bg-navy-950 border border-purple-500/30 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto custom-scrollbar">
                    {explanationOutput}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CODE DEBUGGING */}
            {aiTab === 'debug' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Error Message:</label>
                  <input
                    type="text"
                    value={debugError}
                    onChange={(e) => setDebugError(e.target.value)}
                    placeholder="e.g. TypeError: Cannot read properties of undefined..."
                    className="w-full px-2.5 py-2 rounded-xl bg-navy-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/60"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Stack Trace (optional):</label>
                  <textarea
                    rows={2}
                    value={debugStack}
                    onChange={(e) => setDebugStack(e.target.value)}
                    placeholder="Paste stack trace..."
                    className="w-full p-2.5 rounded-xl bg-navy-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/60 custom-scrollbar font-mono text-[11px]"
                  />
                </div>

                <button
                  onClick={handleDebugCode}
                  disabled={isAiLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-semibold text-xs transition-all shadow-glow-blue disabled:opacity-50"
                >
                  {isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bug className="w-4 h-4" />}
                  <span>{isAiLoading ? 'Diagnosing Error...' : 'Diagnose & Fix Bug'}</span>
                </button>

                {debugOutput && (
                  <div className="mt-4 p-3 rounded-xl bg-navy-950 border border-rose-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-rose-400">Diagnosis & Fix</span>
                      <button
                        onClick={() => handleInsertCode(debugOutput.correctedCode, 'overwrite')}
                        className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-medium"
                      >
                        Apply Fix to File
                      </button>
                    </div>
                    <div className="p-2.5 rounded-lg bg-navy-900 text-xs text-slate-200 whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">
                      {debugOutput.analysis}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: CODE OPTIMIZATION */}
            {aiTab === 'optimize' && (
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-semibold text-slate-300 block mb-1.5">Optimization Focus:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'all', label: 'All Dimensions' },
                      { id: 'performance', label: 'Performance & Speed' },
                      { id: 'readability', label: 'Clean Code & Types' },
                      { id: 'security', label: 'Security & Sanitization' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setOptimizeFocus(f.id)}
                        className={`p-2 rounded-xl text-xs font-medium border text-left transition-all ${
                          optimizeFocus === f.id
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-navy-950 text-slate-400 border-white/10 hover:bg-navy-850'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleOptimizeCode}
                  disabled={isAiLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-navy-950 font-bold text-xs transition-all shadow-glow-blue disabled:opacity-50"
                >
                  {isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                  <span>{isAiLoading ? 'Evaluating Optimization...' : 'Optimize Code'}</span>
                </button>

                {optimizeOutput && (
                  <div className="mt-4 p-3 rounded-xl bg-navy-950 border border-amber-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-400">Optimization Report</span>
                      <button
                        onClick={() => handleInsertCode(optimizeOutput.optimizedCode, 'overwrite')}
                        className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-medium"
                      >
                        Replace in Editor
                      </button>
                    </div>
                    <div className="p-2.5 rounded-lg bg-navy-900 text-xs text-slate-200 whitespace-pre-wrap max-h-56 overflow-y-auto custom-scrollbar">
                      {optimizeOutput.analysis}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: CODING CHAT ASSISTANT */}
            {aiTab === 'chat' && (
              <div className="flex flex-col h-full space-y-3">
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[420px] custom-scrollbar">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-blue-600/30 text-cyan-200 border border-blue-500/40 ml-4'
                          : 'bg-navy-950 text-slate-200 border border-white/10 mr-4'
                      }`}
                    >
                      <div className="font-semibold text-[10px] text-slate-400 mb-1">
                        {msg.role === 'user' ? 'You' : 'NOVA Coding Companion'}
                      </div>
                      <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>

                <form onSubmit={handleSendChatMessage} className="flex gap-2 pt-2 border-t border-white/10">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about this code, architecture, or edge cases..."
                    className="flex-1 px-3 py-2 rounded-xl bg-navy-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                  />
                  <button
                    type="submit"
                    disabled={isAiLoading || !chatInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-bold text-xs transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
