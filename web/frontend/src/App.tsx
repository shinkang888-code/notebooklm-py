import { useEffect, useState } from "react";
import type { Notebook } from "./api";
import { api } from "./api";
import { ChatPanel } from "./components/ChatPanel";
import { LoginBanner } from "./components/LoginBanner";
import { NotebookSidebar } from "./components/NotebookSidebar";
import { SourcesPanel } from "./components/SourcesPanel";
import { StudioPanel } from "./components/StudioPanel";

export default function App() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [currentNotebookId, setCurrentNotebookId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    api.auth.status().then((r) => setLoggedIn(r.logged_in)).catch(() => setLoggedIn(false));
  }, []);

  const loadNotebooks = async () => {
    try {
      const list = await api.notebooks.list();
      setNotebooks(list);
      if (list.length && !currentNotebookId) setCurrentNotebookId(list[0].id);
    } catch {
      setNotebooks([]);
    }
  };

  useEffect(() => {
    if (loggedIn) loadNotebooks();
  }, [loggedIn]);

  if (loggedIn === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-100">
        <div className="animate-pulse text-surface-500">연결 확인 중...</div>
      </div>
    );
  }

  if (!loggedIn) {
    return <LoginBanner />;
  }

  const currentNotebook = notebooks.find((n) => n.id === currentNotebookId);

  return (
    <div className="h-screen flex flex-col bg-surface-100">
      {/* Top bar */}
      <header className="flex-shrink-0 h-12 px-4 flex items-center justify-between border-b border-surface-200 bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            className="p-2 rounded-lg hover:bg-surface-100 text-surface-600"
            aria-label={sidebarCollapsed ? "사이드바 열기" : "사이드바 닫기"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="font-semibold text-surface-900">NotebookLM Studio</h1>
          {currentNotebook && (
            <span className="text-sm text-surface-500 truncate max-w-[200px]" title={currentNotebook.title}>
              {currentNotebook.title}
            </span>
          )}
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Left: Notebooks + Sources (collapsible) */}
        <aside
          className={`${
            sidebarCollapsed ? "w-0 overflow-hidden" : "w-80"
          } flex-shrink-0 border-r border-surface-200 bg-white flex flex-col transition-all duration-200`}
        >
          <NotebookSidebar
            notebooks={notebooks}
            currentId={currentNotebookId}
            onSelect={setCurrentNotebookId}
            onRefresh={loadNotebooks}
            onRename={() => loadNotebooks()}
            onDelete={() => {
              if (currentNotebookId) setCurrentNotebookId(null);
              loadNotebooks();
            }}
          />
          {currentNotebookId && (
            <div className="flex-1 min-h-0 border-t border-surface-200 flex flex-col">
              <SourcesPanel notebookId={currentNotebookId} />
            </div>
          )}
        </aside>

        {/* Center: Chat */}
        <main className="flex-1 min-w-0 flex flex-col bg-surface-50">
          {currentNotebookId ? (
            <ChatPanel notebookId={currentNotebookId} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-surface-500">
              노트북을 선택하거나 새로 만드세요.
            </div>
          )}
        </main>

        {/* Right: Studio */}
        <aside className="w-96 flex-shrink-0 border-l border-surface-200 bg-white flex flex-col overflow-hidden">
          {currentNotebookId ? (
            <StudioPanel notebookId={currentNotebookId} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-surface-500 text-sm p-4">
              스튜디오는 노트북 선택 후 이용할 수 있습니다.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
