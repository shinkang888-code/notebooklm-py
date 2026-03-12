import {
  FileAudio,
  FileImage,
  FileText,
  Image,
  Layers,
  MessageCircle,
  Download,
  RefreshCw,
  Video,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Artifact } from "../api";
import { api } from "../api";

type Props = { notebookId: string };

const TILES = [
  {
    id: "audio",
    label: "오디오 개요",
    icon: FileAudio,
    color: "bg-violet-500",
    generate: (nbId: string) => api.artifacts.generateAudio(nbId),
  },
  {
    id: "video",
    label: "비디오 개요",
    icon: Video,
    color: "bg-rose-500",
    generate: (nbId: string) => api.artifacts.generateVideo(nbId),
  },
  {
    id: "report",
    label: "리포트",
    icon: FileText,
    color: "bg-amber-500",
    generate: (nbId: string) => api.artifacts.generateReport(nbId),
  },
  {
    id: "mind-map",
    label: "마인드맵",
    icon: Layers,
    color: "bg-emerald-500",
    generate: (nbId: string) => api.artifacts.generateMindMap(nbId),
  },
  {
    id: "quiz",
    label: "퀴즈",
    icon: MessageCircle,
    color: "bg-sky-500",
    generate: (nbId: string) => api.artifacts.generateQuiz(nbId),
  },
  {
    id: "flashcards",
    label: "플래시카드",
    icon: Image,
    color: "bg-teal-500",
    generate: (nbId: string) => api.artifacts.generateFlashcards(nbId),
  },
  {
    id: "slide-deck",
    label: "슬라이드",
    icon: Layers,
    color: "bg-indigo-500",
    generate: (nbId: string) => api.artifacts.generateSlideDeck(nbId),
  },
  {
    id: "infographic",
    label: "인포그래픽",
    icon: FileImage,
    color: "bg-pink-500",
    generate: (nbId: string) => api.artifacts.generateInfographic(nbId),
  },
] as const;

export function StudioPanel({ notebookId }: Props) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.artifacts.list(notebookId);
      setArtifacts(list);
    } catch {
      setArtifacts([]);
    } finally {
      setLoading(false);
    }
  }, [notebookId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerate = async (tileId: string) => {
    const tile = TILES.find((t) => t.id === tileId);
    if (!tile || generating) return;
    setGenerating(tileId);
    try {
      await tile.generate(notebookId);
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setGenerating(null);
    }
  };

  const downloadUrl = (artifact: Artifact) =>
    api.artifacts.downloadUrl(notebookId, artifact.id);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-surface-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-surface-800">스튜디오</h2>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="p-1.5 rounded-lg text-surface-500 hover:bg-surface-100 hover:text-surface-700 disabled:opacity-50"
            title="새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {TILES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleGenerate(t.id)}
              disabled={!!generating}
              className={`flex items-center gap-2 p-3 rounded-xl border border-surface-200 bg-white hover:border-accent hover:bg-accent/5 transition ${generating ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <span className={`p-1.5 rounded-lg ${t.color} text-white`}>
                <t.icon className="w-4 h-4" />
              </span>
              <span className="text-xs font-medium text-surface-700 text-left truncate flex-1">
                {t.label}
              </span>
              {generating === t.id && (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-surface-400 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <h3 className="text-xs font-medium text-surface-500 mb-2">생성된 콘텐츠</h3>
        {loading && artifacts.length === 0 ? (
          <p className="text-sm text-surface-500 py-4 text-center">불러오는 중...</p>
        ) : artifacts.length === 0 ? (
          <p className="text-sm text-surface-500 py-4 text-center">
            위 타일을 눌러 오디오, 비디오, 퀴즈 등을 생성하세요.
          </p>
        ) : (
          <ul className="space-y-2">
            {artifacts.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-2 p-3 rounded-lg bg-surface-50 border border-surface-100 hover:border-surface-200"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-800 truncate">
                    {a.title || "제목 없음"}
                  </p>
                  <p className="text-xs text-surface-500">{a.type || a.id}</p>
                </div>
                <a
                  href={downloadUrl(a)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-surface-500 hover:bg-surface-200 hover:text-accent"
                  title="다운로드"
                >
                  <Download className="w-4 h-4" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
