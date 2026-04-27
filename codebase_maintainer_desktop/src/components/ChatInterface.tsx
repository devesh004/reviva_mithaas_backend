import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  FileCode2,
  Loader2,
  Zap,
  Bug,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Wrench,
  ShieldCheck,
  MapPin,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  api,
  type SourceReference,
  type AgentStep,
} from '../services/api';
import { CodeModal } from './CodeModal';
import './ChatInterface.css';

// ── Types ────────────────────────────────────────────────────────────────────

type QueryMode = 'simple' | 'agentic' | 'debug';

interface DebugData {
  errorType: string;
  errorMessage: string;
  fileReferences: { file: string; line?: number }[];
  rootCause: string;
  fileReference: { file: string; line?: number; snippet?: string } | null;
  fixSuggestion: string;
  codeExample: string;
  prevention: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: QueryMode;
  plan?: string[];
  steps?: AgentStep[];
  debugData?: DebugData;
  references?: SourceReference[];
  isError?: boolean;
}

interface SelectedFile {
  file: string;
  displayName: string;
  snippet?: string;
  language?: string;
}

interface ChatInterfaceProps {
  namespace: string;
}

// ── Mode config ───────────────────────────────────────────────────────────────

const MODES: { id: QueryMode; label: string; icon: React.ReactNode; placeholder: string; loadingText: string }[] = [
  {
    id: 'simple',
    label: 'Ask',
    icon: <MessageSquare size={13} />,
    placeholder: "Ask about the codebase… e.g. 'What does AuthService do?'",
    loadingText: 'Analyzing codebase…',
  },
  {
    id: 'agentic',
    label: 'Explore',
    icon: <Zap size={13} />,
    placeholder: "Explore in depth… e.g. 'Explain the auth flow end-to-end'",
    loadingText: 'Running multi-step analysis…',
  },
  {
    id: 'debug',
    label: 'Debug',
    icon: <Bug size={13} />,
    placeholder: 'Paste an error or stack trace…',
    loadingText: 'Debugging error…',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function ChatInterface({ namespace }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: 'How can I help you with this codebase? Choose a mode below — **Ask** for quick questions, **Explore** for deep analysis, or **Debug** to diagnose errors.',
    },
  ]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<QueryMode>('simple');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Reset textarea height when input is cleared programmatically
  useEffect(() => {
    if (!input && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input]);

  const activeModeConfig = MODES.find(m => m.id === mode)!;

  const toggleSteps = (msgId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      next.has(msgId) ? next.delete(msgId) : next.add(msgId);
      return next;
    });
  };

  const openFileModal = (ref: SourceReference) => {
    setSelectedFile({
      file: ref.file,
      displayName: ref.displayName,
      snippet: ref.snippet,
      language: ref.language,
    });
  };

  // ── Send handler ────────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      mode,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      if (mode === 'debug') {
        const res = await api.debugAsk(userText, namespace, sessionId);
        if (res.sessionId) setSessionId(res.sessionId);

        const debugData: DebugData = {
          errorType: res.parsedError.errorType,
          errorMessage: res.parsedError.errorMessage,
          fileReferences: res.parsedError.fileReferences,
          rootCause: res.rootCause,
          fileReference: res.fileReference,
          fixSuggestion: res.fixSuggestion,
          codeExample: res.codeExample,
          prevention: res.prevention,
        };

        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            mode: 'debug',
            content: '',
            debugData,
            references: res.sourcesUsed ?? [],
          },
        ]);
      } else {
        const res = await api.agentAsk(userText, namespace, sessionId);
        if (res.sessionId) setSessionId(res.sessionId);

        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            mode: res.mode,
            content: res.answer,
            plan: res.plan,
            steps: res.steps,
            references: res.sourcesUsed ?? [],
          },
        ]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Sorry, I encountered an error: ${msg}`,
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Renderers ────────────────────────────────────────────────────────────────

  const renderModeBadge = (msgMode: QueryMode) => {
    const cfg = MODES.find(m => m.id === msgMode);
    if (!cfg) return null;
    return (
      <span className={`mode-badge mode-badge-${msgMode}`}>
        {cfg.icon}
        {cfg.label}
      </span>
    );
  };

  const renderSources = (refs: SourceReference[]) => {
    if (!refs.length) return null;
    return (
      <div className="sources-section">
        <div className="sources-label">
          <FileCode2 size={13} />
          Sources Referenced
        </div>
        <div className="sources-chips">
          {refs.map((ref, idx) => (
            <button
              key={idx}
              className="source-chip"
              title={ref.relativePath}
              onClick={() => openFileModal(ref)}
            >
              <FileCode2 size={12} />
              <span className="chip-name">{ref.displayName}</span>
              <span className="chip-path">{ref.relativePath}</span>
              {ref.language && <span className="chip-lang">{ref.language}</span>}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderAgenticSteps = (msg: Message) => {
    if (!msg.plan?.length && !msg.steps?.length) return null;
    const expanded = expandedSteps.has(msg.id);
    const stepCount = msg.steps?.length ?? msg.plan?.length ?? 0;

    return (
      <div className="steps-panel">
        <button
          className="steps-toggle"
          onClick={() => toggleSteps(msg.id)}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <Zap size={13} />
          {expanded ? 'Hide' : 'Show'} reasoning ({stepCount} step{stepCount !== 1 ? 's' : ''})
        </button>

        {expanded && (
          <div className="steps-list">
            {(msg.steps ?? msg.plan?.map(p => ({ task: p, findings: '', sources: [] })) ?? []).map(
              (step, idx) => (
                <div key={idx} className="step-item">
                  <div className="step-header">
                    <span className="step-number">{idx + 1}</span>
                    <span className="step-task">{step.task}</span>
                  </div>
                  {step.findings && (
                    <div className="step-findings">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{step.findings}</ReactMarkdown>
                    </div>
                  )}
                  {step.sources?.length > 0 && (
                    <div className="step-sources">
                      {step.sources.map((src, si) => (
                        <button
                          key={si}
                          className="source-chip source-chip-sm"
                          onClick={() => openFileModal(src)}
                        >
                          <FileCode2 size={10} />
                          <span className="chip-name">{src.displayName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ),
            )}
          </div>
        )}
      </div>
    );
  };

  const renderDebugPanel = (d: DebugData) => (
    <div className="debug-panel">
      <div className="debug-parsed-error">
        <span className="debug-error-type">{d.errorType}</span>
        {d.errorMessage && <span className="debug-error-msg">{d.errorMessage}</span>}
      </div>

      <div className="debug-section">
        <div className="debug-section-header">
          <AlertTriangle size={14} className="debug-icon-root" />
          Root Cause
        </div>
        <p className="debug-section-body">{d.rootCause}</p>
      </div>

      {d.fileReference && (
        <div className="debug-section">
          <div className="debug-section-header">
            <MapPin size={14} className="debug-icon-file" />
            File Reference
          </div>
          <div className="debug-file-ref">
            <span className="debug-file-name">{d.fileReference.file}</span>
            {d.fileReference.line && (
              <span className="debug-line-badge">line {d.fileReference.line}</span>
            )}
          </div>
          {d.fileReference.snippet && (
            <pre className="debug-snippet"><code>{d.fileReference.snippet}</code></pre>
          )}
        </div>
      )}

      <div className="debug-section">
        <div className="debug-section-header">
          <Wrench size={14} className="debug-icon-fix" />
          Fix Suggestion
        </div>
        <p className="debug-section-body">{d.fixSuggestion}</p>
        {d.codeExample && (
          <pre className="debug-snippet debug-snippet-fix"><code>{d.codeExample}</code></pre>
        )}
      </div>

      {d.prevention && (
        <div className="debug-section">
          <div className="debug-section-header">
            <ShieldCheck size={14} className="debug-icon-prevent" />
            Prevention
          </div>
          <p className="debug-section-body">{d.prevention}</p>
        </div>
      )}
    </div>
  );

  const renderMessage = (msg: Message) => {
    const isDebug = msg.mode === 'debug' && msg.debugData;
    const isAgentic = msg.mode === 'agentic';

    return (
      <div
        key={msg.id}
        className={`message-bubble message-${msg.role} ${msg.isError ? 'message-error' : ''}`}
      >
        {/* Mode badge (assistant only, when mode is set) */}
        {msg.role === 'assistant' && msg.mode && renderModeBadge(msg.mode)}

        {/* Agentic plan steps (collapsed by default) */}
        {isAgentic && renderAgenticSteps(msg)}

        {/* Debug structured panel */}
        {isDebug ? (
          renderDebugPanel(msg.debugData!)
        ) : (
          /* Regular markdown answer */
          msg.content && (
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            </div>
          )
        )}

        {/* Source chips */}
        {msg.references && renderSources(msg.references)}
      </div>
    );
  };

  // ── JSX ──────────────────────────────────────────────────────────────────────

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map(renderMessage)}

        {isLoading && (
          <div className="message-bubble message-assistant message-loading">
            <Loader2 size={16} className="spin-anim" />
            <span>{activeModeConfig.loadingText}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        {/* Mode selector */}
        <div className="mode-selector">
          {MODES.map(m => (
            <button
              key={m.id}
              className={`mode-tab ${mode === m.id ? 'mode-tab-active' : ''}`}
              onClick={() => setMode(m.id)}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>

        <div className="chat-input-box">
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            placeholder={activeModeConfig.placeholder}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={1}
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      <CodeModal
        isOpen={!!selectedFile}
        filePath={selectedFile?.file || ''}
        displayName={selectedFile?.displayName}
        snippet={selectedFile?.snippet}
        language={selectedFile?.language}
        onClose={() => setSelectedFile(null)}
      />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-anim { animation: spin 1s linear infinite; }
        .message-error {
          border-color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.1) !important;
        }
      `}</style>
    </div>
  );
}
