import { useState, useEffect } from 'react';
import { Layers } from 'lucide-react';
import { ProjectSelector } from './components/ProjectSelector';
import { ProjectInput } from './components/ProjectInput';
import { ChatInterface } from './components/ChatInterface';
import { api } from './services/api';
import './App.css';

interface Project {
  id: string;
  name: string;
  type: 'github';
  namespace: string;
}

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const data = await api.getNamespaces();
        const serverProjects: Project[] = data.map((sp) => ({
          id: sp.namespace,
          name: sp.projectName,
          type: 'github',
          namespace: sp.namespace
        }));
        setProjects(serverProjects);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      }
    }
    fetchProjects();
  }, []);

  const handleIngestSuccess = (type: 'github', _path: string, namespace: string) => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: namespace,
      type,
      namespace
    };

    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
  };

  const activeProject = projects.find(p => p.id === activeProjectId);

  return (
    <div className="app-container">
      {/* Sidebar Project Selector */}
      <ProjectSelector
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={(id: string) => setActiveProjectId(id)}
        onNewProject={() => setActiveProjectId(null)}
      />

      {/* Main Workspace Area */}
      <main className="main-content">
        <header className="header">
          <div className="header-title">
            <Layers size={20} />
            {activeProject ? activeProject.name : 'Ingest Codebase'}
          </div>
        </header>

        {activeProject ? (
          <ChatInterface key={activeProject.id} namespace={activeProject.namespace} />
        ) : (
          <ProjectInput onIngestSuccess={handleIngestSuccess} />
        )}
      </main>
    </div>
  );
}

export default App;
