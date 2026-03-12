import { FileText, Link, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Source } from "../api";
import { api } from "../api";

type Props = { notebookId: string };

export function SourcesPanel({ notebookId }: Props) {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMode, setAddMode] = useState<"none" | "url" | "text">("none");
  const [urlInput, setUrlInput] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const list = await api.sources.list(notebookId);
      setSources(list);
    } catch {
      setSources([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [notebookId]);

  const handleAddUrl = async () => {
    if (!urlInput.trim()) return;
    try {
      await api.sources.addUrl(notebookId, urlInput.trim());
      setUrlInput("");
      setAddMode("none");
      load();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleAddText = async () => {
    if (!textTitle.trim() || !textContent.trim()) return;
    try {
      await api.sources.addText(notebookId, textTitle.trim(), textContent.trim());
      setTextTitle("");
      setTextContent("");
      setAddMode("none");
      load();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleDelete = async (sourceId: string) => {
    if (!confirm("이 소스를 제거할까요?")) return;
    try {
      await api.sources.delete(notebookId, sourceId);
      load();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="flex flex-col min-h-0">
      <div className="p-3 border-b border-surface-200 flex-shrink-0">
        <h2 className="text-sm font-medium text-surface-700 mb-2">소스</h2>
        {addMode === "none" && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setAddMode("url")}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-surface-200 text-surface-600 hover:border-accent hover:text-accent text-xs"
            >
              <Link className="w-3.5 h-3.5" />
              URL
            </button>
            <button
              type="button"
              onClick={() => setAddMode("text")}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-surface-200 text-surface-600 hover:border-accent hover:text-accent text-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              텍스트
            </button>
          </div>
        )}
        {addMode === "url" && (
          <div className="space-y-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddUrl}
                className="flex-1 py-1.5 bg-accent text-white rounded-lg text-sm hover:bg-accent-hover"
              >
                추가
              </button>
              <button type="button" onClick={() => setAddMode("none")} className="px-3 text-surface-500 text-sm">
                취소
              </button>
            </div>
          </div>
        )}
        {addMode === "text" && (
          <div className="space-y-2">
            <input
              type="text"
              value={textTitle}
              onChange={(e) => setTextTitle(e.target.value)}
              placeholder="제목"
              className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
            />
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="내용 붙여넣기..."
              rows={3}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none resize-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddText}
                className="flex-1 py-1.5 bg-accent text-white rounded-lg text-sm hover:bg-accent-hover"
              >
                추가
              </button>
              <button type="button" onClick={() => setAddMode("none")} className="px-3 text-surface-500 text-sm">
                취소
              </button>
            </div>
          </div>
        )}
      </div>
      <ul className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          <li className="text-sm text-surface-500 py-4 text-center">불러오는 중...</li>
        ) : sources.length === 0 ? (
          <li className="text-sm text-surface-500 py-4 text-center">소스가 없습니다. URL 또는 텍스트를 추가하세요.</li>
        ) : (
          sources.map((s) => (
            <li
              key={s.id}
              className="group flex items-start gap-2 p-2 rounded-lg hover:bg-surface-50 border border-transparent hover:border-surface-200"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-800 truncate">{s.title || "제목 없음"}</p>
                {s.url && (
                  <p className="text-xs text-surface-500 truncate" title={s.url}>
                    {s.url}
                  </p>
                )}
                {s.status && (
                  <span className="text-xs text-surface-400">{s.status}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(s.id)}
                className="p-1 rounded text-surface-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition"
                title="삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
