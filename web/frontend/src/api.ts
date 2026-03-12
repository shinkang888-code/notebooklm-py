const API_BASE = import.meta.env.VITE_API_URL || "";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail?: string }).detail || res.statusText);
  }
  return res.json() as Promise<T>;
}

export type Notebook = { id: string; title: string; created_at?: string };
export type Source = { id: string; title: string; url?: string; status?: string };
export type Artifact = { id: string; title: string; type: string; status?: string };
export type Note = { id: string; title: string; content: string };

export const api = {
  auth: {
    status: () => request<{ logged_in: boolean; message?: string }>("/api/auth/status"),
  },
  notebooks: {
    list: () => request<Notebook[]>("/api/notebooks"),
    create: (title: string) =>
      request<Notebook>("/api/notebooks", {
        method: "POST",
        body: JSON.stringify({ title }),
      }),
    get: (id: string) => request<Notebook>(`/api/notebooks/${id}`),
    rename: (id: string, title: string) =>
      request<Notebook>(`/api/notebooks/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      }),
    delete: (id: string) =>
      request<{ ok: boolean }>(`/api/notebooks/${id}`, { method: "DELETE" }),
  },
  sources: {
    list: (notebookId: string) =>
      request<Source[]>(`/api/notebooks/${notebookId}/sources`),
    addUrl: (notebookId: string, url: string) =>
      request<Source>(`/api/notebooks/${notebookId}/sources/url`, {
        method: "POST",
        body: JSON.stringify({ url }),
      }),
    addText: (notebookId: string, title: string, text: string) =>
      request<Source>(`/api/notebooks/${notebookId}/sources/text`, {
        method: "POST",
        body: JSON.stringify({ title, text }),
      }),
    delete: (notebookId: string, sourceId: string) =>
      request<{ ok: boolean }>(
        `/api/notebooks/${notebookId}/sources/${sourceId}`,
        { method: "DELETE" }
      ),
  },
  chat: {
    ask: (
      notebookId: string,
      question: string,
      conversationId?: string
    ) =>
      request<{ answer: string; conversation_id: string; sources?: unknown[] }>(
        `/api/notebooks/${notebookId}/chat/ask`,
        {
          method: "POST",
          body: JSON.stringify({ question, conversation_id: conversationId }),
        }
      ),
    history: (notebookId: string) =>
      request<{ question: string; answer: string }[]>(
        `/api/notebooks/${notebookId}/chat/history`
      ),
  },
  artifacts: {
    list: (notebookId: string) =>
      request<Artifact[]>(`/api/notebooks/${notebookId}/artifacts`),
    generateAudio: (notebookId: string, language = "en") =>
      request<{ task_id: string; status: string }>(
        `/api/notebooks/${notebookId}/artifacts/audio`,
        {
          method: "POST",
          body: JSON.stringify({ language }),
        }
      ),
    generateVideo: (notebookId: string) =>
      request<{ task_id: string; status: string }>(
        `/api/notebooks/${notebookId}/artifacts/video`,
        { method: "POST", body: "{}" }
      ),
    generateReport: (notebookId: string) =>
      request<{ task_id: string; status: string }>(
        `/api/notebooks/${notebookId}/artifacts/report`,
        { method: "POST", body: "{}" }
      ),
    generateQuiz: (notebookId: string) =>
      request<{ task_id: string; status: string }>(
        `/api/notebooks/${notebookId}/artifacts/quiz`,
        { method: "POST", body: "{}" }
      ),
    generateFlashcards: (notebookId: string) =>
      request<{ task_id: string; status: string }>(
        `/api/notebooks/${notebookId}/artifacts/flashcards`,
        { method: "POST", body: "{}" }
      ),
    generateMindMap: (notebookId: string) =>
      request<{ task_id: string; status: string }>(
        `/api/notebooks/${notebookId}/artifacts/mind-map`,
        { method: "POST", body: "{}" }
      ),
    generateSlideDeck: (notebookId: string) =>
      request<{ task_id: string; status: string }>(
        `/api/notebooks/${notebookId}/artifacts/slide-deck`,
        { method: "POST", body: "{}" }
      ),
    generateInfographic: (notebookId: string) =>
      request<{ task_id: string; status: string }>(
        `/api/notebooks/${notebookId}/artifacts/infographic`,
        { method: "POST", body: "{}" }
      ),
    downloadUrl: (notebookId: string, artifactId: string, format?: string) =>
      `${API_BASE}/api/notebooks/${notebookId}/artifacts/${artifactId}/download${format ? `?format=${encodeURIComponent(format)}` : ""}`,
  },
  research: {
    start: (notebookId: string, query: string, source = "web", mode = "fast") =>
      request<{ status: string }>(`/api/notebooks/${notebookId}/research/start`, {
        method: "POST",
        body: JSON.stringify({ query, source, mode }),
      }),
    status: (notebookId: string) =>
      request<unknown>(`/api/notebooks/${notebookId}/research/status`),
  },
  notes: {
    list: (notebookId: string) =>
      request<Note[]>(`/api/notebooks/${notebookId}/notes`),
    create: (notebookId: string, title: string, content: string) =>
      request<Note>(`/api/notebooks/${notebookId}/notes?title=${encodeURIComponent(title)}&content=${encodeURIComponent(content)}`, {
        method: "POST",
      }),
  },
};
