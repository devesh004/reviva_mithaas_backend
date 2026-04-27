import { useState } from 'react';
import { GitBranch, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import './ProjectInput.css';

interface ProjectInputProps {
  onIngestSuccess: (type: 'github', path: string, namespace: string) => void;
}

export function ProjectInput({ onIngestSuccess }: ProjectInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const getNamespace = (path: string) => {
    const parts = path.split('/').filter(Boolean);
    return parts[parts.length - 1] || 'repo';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setErrorMsg('');
    setIsIngesting(true);
    
    // We only support GitHub repos now
    const namespace = getNamespace(inputValue.trim());

    try {
      await api.ingestCodebase(inputValue.trim(), namespace);
      onIngestSuccess('github', inputValue.trim(), namespace);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during ingestion.');
      console.error(err);
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="project-input-container">
      <div className="pi-hero">
        <h1 className="pi-hero-title">Codebase Maintainer</h1>
        <p className="pi-hero-subtitle">
          Ingest any codebase to chat, understand, and navigate architecture instantly.
          Enter a repository URL to get started.
        </p>
      </div>

      <div className="glass-panel pi-form-card">
        <form onSubmit={handleSubmit}>
          <div className="pi-input-group">
            <label className="pi-label">Repository URL</label>
            <div className="pi-input-wrapper">
              <span className="pi-input-icon">
                <GitBranch size={20} />
              </span>
              <input
                type="text"
                className="input-field animate-pulse-glow"
                style={{ animationIterationCount: '1' }}
                placeholder="https://github.com/user/repo"
                value={inputValue}
                onChange={(e) => { setInputValue(e.target.value); setErrorMsg(''); }}
                disabled={isIngesting}
                autoFocus
              />
            </div>
          </div>

          {errorMsg && (
            <div className="error-message" style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} /> {errorMsg}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary pi-submit-btn" 
            disabled={!inputValue.trim() || isIngesting}
            style={{ 
              opacity: (!inputValue.trim() || isIngesting) ? 0.7 : 1, 
              cursor: (!inputValue.trim() || isIngesting) ? 'not-allowed' : 'pointer' 
            }}
          >
            {isIngesting ? (
              <>
                <Loader2 size={18} className="spin-anim" style={{ animation: 'spin 1s linear infinite' }} />
                Ingesting...
              </>
            ) : (
              <>
                Ingest Codebase
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
