import { FileText, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Notebook } from "../api";
import { api } from "../api";

type Props = {
  notebooks: Notebook[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onRefresh: () => void;
  onRename: () => void;
  onDelete: () => void;
};

export function NotebookSidebar({
  notebooks,
  currentId,
  onSelect,
  onRefresh,
  onRename,
  onDelete,
}: Props) {
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      await api.notebooks.create(newTitle.trim());
      setNewTitle("");
      setCreating(false);
      onRefresh();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleRename = async (id: string) => {
    if (!renameTitle.trim()) {
      setRenameId(null);
      return;
    }
    try {
      await api.notebooks.rename(id, renameTitle.trim());
      setRenameId(null);
      setRenameTitle("");
      onRename();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 노트북을 삭제할까요?")) return;
    try {
      await api.notebooks.delete(id);
      setMenuId(null);
      onDelete();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-surface-200">
        <h2 className="text-sm font-medium text-surface-700 mb-2">노트북</h2>
        {creating ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="노트북 이름"
              className="flex-1 px-3 py-2 border border-surface-200 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-accent outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={handleCreate}
              className="px-3 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-hover"
            >
              만들기
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="px-2 text-surface-500 hover:text-surface-700"
            >
              취소
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-surface-300 text-surface-600 hover:border-accent hover:text-accent text-sm"
          >
            <Plus className="w-4 h-4" />
            새 노트북
          </button>
        )}
      </div>
      <ul className="flex-1 overflow-y-auto p-2">
        {notebooks.map((nb) => (
          <li key={nb.id} className="relative group">
            {renameId === nb.id ? (
              <div className="flex gap-2 p-2">
                <input
                  type="text"
                  value={renameTitle}
                  onChange={(e) => setRenameTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename(nb.id);
                    if (e.key === "Escape") setRenameId(null);
                  }}
                  className="flex-1 px-2 py-1 text-sm border rounded outline-none focus:ring-1 ring-accent"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleRename(nb.id)}
                  className="text-sm text-accent"
                >
                  저장
                </button>
                <button type="button" onClick={() => setRenameId(null)} className="text-sm text-surface-500">
                  취소
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onSelect(nb.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm truncate ${
                    currentId === nb.id
                      ? "bg-accent/10 text-accent font-medium"
                      : "text-surface-700 hover:bg-surface-100"
                  }`}
                >
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{nb.title}</span>
                </button>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    type="button"
                    onClick={() => {
                      setRenameId(nb.id);
                      setRenameTitle(nb.title);
                      setMenuId(null);
                    }}
                    className="p-1 rounded text-surface-500 hover:text-accent hover:bg-surface-100"
                    title="이름 변경"
                  >
                    이름 변경
                  </button>
                  <button
                    type="button"
                    onClick={() => (menuId === nb.id ? setMenuId(null) : setMenuId(nb.id))}
                    className="p-1 rounded text-surface-500 hover:text-red-600 hover:bg-red-50"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {menuId === nb.id && (
                  <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 z-10">
                    <button
                      type="button"
                      onClick={() => handleDelete(nb.id)}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
