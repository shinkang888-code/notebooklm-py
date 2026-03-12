import { Send } from "lucide-react";
import { useCallback, useState } from "react";
import { api } from "../api";

type Props = { notebookId: string };

type Turn = { question: string; answer: string };

export function ChatPanel({ notebookId }: Props) {
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const send = useCallback(async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setLoading(true);
    try {
      const res = await api.chat.ask(notebookId, q, conversationId ?? undefined);
      setTurns((prev) => [...prev, { question: q, answer: res.answer }]);
      setConversationId(res.conversation_id);
    } catch (e) {
      setTurns((prev) => [...prev, { question: q, answer: `오류: ${(e as Error).message}` }]);
    } finally {
      setLoading(false);
    }
  }, [notebookId, input, conversationId, loading]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {turns.length === 0 && (
          <div className="text-center text-surface-500 py-12">
            <p className="text-sm">노트북 소스를 바탕으로 질문하세요.</p>
            <p className="text-xs mt-1">예: 이 문서의 요약을 알려줘 / 핵심 개념을 설명해줘</p>
          </div>
        )}
        {turns.map((t, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-accent text-white px-4 py-2 text-sm">
                {t.question}
              </div>
            </div>
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white border border-surface-200 px-4 py-3 text-sm text-surface-800 shadow-sm">
                <div className="whitespace-pre-wrap">{t.answer}</div>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-surface-100 px-4 py-2 text-sm text-surface-500">
              답변 생성 중...
            </div>
          </div>
        )}
      </div>
      <div className="flex-shrink-0 p-4 border-t border-surface-200 bg-white">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="노트북에 대해 질문하세요..."
            className="flex-1 px-4 py-3 border border-surface-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent outline-none text-surface-900"
            disabled={loading}
          />
          <button
            type="button"
            onClick={send}
            disabled={loading || !input.trim()}
            className="p-3 rounded-xl bg-accent text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="전송"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
