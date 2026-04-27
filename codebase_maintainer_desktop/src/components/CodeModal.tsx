import { X, FileCode2, AlertCircle } from 'lucide-react';
import './CodeModal.css';

interface CodeModalProps {
  isOpen: boolean;
  filePath: string;
  displayName?: string;
  snippet?: string;
  language?: string;
  onClose: () => void;
}

export function CodeModal({ isOpen, filePath, displayName, snippet, language, onClose }: CodeModalProps) {
  if (!isOpen) return null;

  const title = displayName || filePath.split(/[/\\]/).pop() || filePath;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <FileCode2 size={18} />
            {title}
            {language && <span className="modal-lang-badge">{language}</span>}
          </div>
          <button className="btn-ghost modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {snippet ? (
            <pre className="code-block">
              <code>{snippet}</code>
            </pre>
          ) : (
            <div className="empty-snippet-state">
              <AlertCircle size={32} className="empty-icon" />
              <h3>Snippet Unavailable</h3>
              <p>The backend didn't provide the code snippet for this reference.</p>
              <div className="empty-path-badge">{filePath}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
