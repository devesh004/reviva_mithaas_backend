const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export interface IngestResponse {
  message: string;
  source: string;
  namespace: string;
  filesProcessed: number;
  chunksStored: number;
}

export interface SourceReference {
  file: string;
  displayName: string;
  relativePath: string;
  snippet?: string;
  language?: string;
}

export interface ChatResponse {
  question: string;
  answer: string;
  namespace: string;
  sourcesUsed: SourceReference[];
  sessionId: string;
}

// ── Agentic response ────────────────────────────────────────────────────────

export interface AgentStep {
  task: string;
  findings: string;
  sources: SourceReference[];
}

export interface AgentResponse {
  mode: 'simple' | 'agentic' | 'debug';
  question: string;
  plan?: string[];
  steps?: AgentStep[];
  answer: string;
  sourcesUsed: SourceReference[];
  sessionId: string;
  namespace: string;
}

// ── Debug response ──────────────────────────────────────────────────────────

export interface DebugFileRef {
  file: string;
  line?: number;
  snippet?: string;
}

export interface DebugResponse {
  mode: 'debug';
  error: string;
  parsedError: {
    errorType: string;
    errorMessage: string;
    fileReferences: { file: string; line?: number }[];
  };
  rootCause: string;
  fileReference: DebugFileRef | null;
  fixSuggestion: string;
  codeExample: string;
  prevention: string;
  sourcesUsed: SourceReference[];
  sessionId: string;
  namespace: string;
}

// ── API client ──────────────────────────────────────────────────────────────

export const api = {
  async ingestCodebase(source: string, namespace: string): Promise<IngestResponse> {
    const res = await fetch(`${API_URL}/ingestion/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, namespace }),
    });
    if (!res.ok) throw new Error(`Ingestion failed: ${res.statusText}`);
    return res.json();
  },

  async askQuestion(
    question: string,
    namespace?: string,
    sessionId?: string,
  ): Promise<ChatResponse> {
    const body: Record<string, unknown> = { question };
    if (namespace) body.namespace = namespace;
    if (sessionId) body.sessionId = sessionId;

    const res = await fetch(`${API_URL}/chat/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Chat failed: ${res.statusText}`);
    return res.json();
  },

  /** Auto-detecting agentic endpoint (simple / agentic / debug). */
  async agentAsk(
    query: string,
    namespace?: string,
    sessionId?: string,
  ): Promise<AgentResponse> {
    const body: Record<string, unknown> = { query };
    if (namespace) body.namespace = namespace;
    if (sessionId) body.sessionId = sessionId;

    const res = await fetch(`${API_URL}/agent/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Agent request failed: ${res.statusText}`);
    return res.json();
  },

  /** Explicit debug endpoint — always runs in debug mode. */
  async debugAsk(
    error: string,
    namespace?: string,
    sessionId?: string,
  ): Promise<DebugResponse> {
    const body: Record<string, unknown> = { error };
    if (namespace) body.namespace = namespace;
    if (sessionId) body.sessionId = sessionId;

    const res = await fetch(`${API_URL}/agent/debug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Debug request failed: ${res.statusText}`);
    return res.json();
  },

  async getNamespaces(): Promise<{ namespace: string; projectName: string }[]> {
    const res = await fetch(`${API_URL}/chat/namespaces`);
    if (!res.ok) throw new Error(`Failed to fetch namespaces: ${res.statusText}`);
    return res.json();
  },
};
