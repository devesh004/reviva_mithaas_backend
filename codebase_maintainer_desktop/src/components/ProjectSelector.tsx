import { GitBranch, Plus } from 'lucide-react';
import './ProjectSelector.css';

interface Project {
  id: string;
  name: string;
  type: 'github';
  namespace: string;
}

interface ProjectSelectorProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
}

export function ProjectSelector({ projects, activeProjectId, onSelectProject, onNewProject }: ProjectSelectorProps) {
  return (
    <aside className="sidebar">
      <div className="ps-header">
        <div className="ps-header-left">
          <span className="ps-title">Workspaces</span>
          <button className="btn-ghost" onClick={onNewProject} title="New Project" style={{ padding: '4px' }}>
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="ps-list">
        {projects.map((project) => (
          <div
            key={project.id}
            className={`ps-item ${activeProjectId === project.id ? 'active' : ''}`}
            onClick={() => onSelectProject(project.id)}
          >
            <GitBranch className="ps-item-icon" />
            <span className="ps-item-name">{project.name}</span>
          </div>
        ))}

        {projects.length === 0 && (
          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No projects ingested yet.<br/>Click + to add one.
          </div>
        )}
      </div>

      <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid var(--border-light)' }}>
        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onNewProject}>
          <Plus size={18} /> Add Project
        </button>
      </div>
    </aside>
  );
}
