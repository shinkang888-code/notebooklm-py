"""FastAPI backend wrapping notebooklm-py for Studio-style web UI.

Uses NOTEBOOKLM_STORAGE_PATH env for auth (default: ~/.notebooklm/storage_state.json).
Run `notebooklm login` once before using the web app.
"""

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, StreamingResponse
from pydantic import BaseModel

# Optional: load notebooklm from parent repo (install with: pip install -e ../..)
try:
    from notebooklm import NotebookLMClient
    from notebooklm.paths import get_storage_path as _get_storage_path
except ImportError:
    NotebookLMClient = None
    _get_storage_path = None


def get_storage_path():
    if _get_storage_path:
        return _get_storage_path()
    return Path.home() / ".notebooklm" / "storage_state.json"


def get_storage_path_from_env() -> Path | None:
    path = os.environ.get("NOTEBOOKLM_STORAGE_PATH")
    if path:
        return Path(path).expanduser().resolve()
    return get_storage_path()


@asynccontextmanager
async def get_client():
    if NotebookLMClient is None:
        raise HTTPException(
            status_code=503,
            detail="notebooklm-py not installed. Run: pip install -e ../..",
        )
    storage = get_storage_path_from_env() or get_storage_path()
    if not storage or not storage.exists():
        raise HTTPException(
            status_code=401,
            detail="Not logged in. Run 'notebooklm login' and set NOTEBOOKLM_STORAGE_PATH if needed.",
        )
    client = await NotebookLMClient.from_storage(path=str(storage))
    async with client:
        yield client


# --- Pydantic models ---


class NotebookCreate(BaseModel):
    title: str


class NotebookRename(BaseModel):
    title: str


class SourceAddUrl(BaseModel):
    url: str


class SourceAddText(BaseModel):
    title: str
    text: str


class ChatAsk(BaseModel):
    question: str
    conversation_id: str | None = None
    source_ids: list[str] | None = None


class GenerateAudio(BaseModel):
    format: str | None = "deep_dive"
    length: str | None = "medium"
    language: str | None = "en"


class GenerateVideo(BaseModel):
    format: str | None = "overview"
    style: str | None = "classic"


class GenerateReport(BaseModel):
    format: str | None = "briefing_doc"


class GenerateQuiz(BaseModel):
    quantity: str | None = "5"
    difficulty: str | None = "medium"


class ResearchStart(BaseModel):
    query: str
    source: str | None = "web"
    mode: str | None = "fast"


# --- App ---

app = FastAPI(
    title="NotebookLM Studio API",
    description="REST API for notebooklm-py (Google NotebookLM automation)",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _serialize_notebook(nb):
    return {"id": nb.id, "title": nb.title, "created_at": getattr(nb, "created_at", None)}


def _serialize_source(s):
    return {
        "id": s.id,
        "title": getattr(s, "title", None) or getattr(s, "name", ""),
        "url": getattr(s, "url", None),
        "status": getattr(s, "status", None),
    }


def _serialize_artifact(a):
    kind = getattr(a, "kind", None)
    type_str = str(kind) if kind else getattr(a, "artifact_type", "") or ""
    return {
        "id": a.id,
        "title": getattr(a, "title", None) or "",
        "type": type_str,
        "status": getattr(a, "status", None),
    }


# --- Notebooks ---


@app.get("/api/notebooks")
async def notebooks_list():
    async with get_client() as client:
        notebooks = await client.notebooks.list()
        return [_serialize_notebook(nb) for nb in notebooks]


@app.post("/api/notebooks")
async def notebooks_create(body: NotebookCreate):
    async with get_client() as client:
        nb = await client.notebooks.create(body.title)
        return _serialize_notebook(nb)


@app.get("/api/notebooks/{notebook_id}")
async def notebooks_get(notebook_id: str):
    async with get_client() as client:
        nb = await client.notebooks.get(notebook_id)
        return _serialize_notebook(nb)


@app.patch("/api/notebooks/{notebook_id}")
async def notebooks_rename(notebook_id: str, body: NotebookRename):
    async with get_client() as client:
        await client.notebooks.rename(notebook_id, body.title)
        nb = await client.notebooks.get(notebook_id)
        return _serialize_notebook(nb)


@app.delete("/api/notebooks/{notebook_id}")
async def notebooks_delete(notebook_id: str):
    async with get_client() as client:
        await client.notebooks.delete(notebook_id)
        return {"ok": True}


# --- Sources ---


@app.get("/api/notebooks/{notebook_id}/sources")
async def sources_list(notebook_id: str):
    async with get_client() as client:
        sources = await client.sources.list(notebook_id)
        return [_serialize_source(s) for s in sources]


@app.post("/api/notebooks/{notebook_id}/sources/url")
async def sources_add_url(notebook_id: str, body: SourceAddUrl):
    async with get_client() as client:
        src = await client.sources.add_url(notebook_id, body.url)
        return _serialize_source(src)


@app.post("/api/notebooks/{notebook_id}/sources/text")
async def sources_add_text(notebook_id: str, body: SourceAddText):
    async with get_client() as client:
        src = await client.sources.add_text(notebook_id, body.title, body.text)
        return _serialize_source(src)


@app.delete("/api/notebooks/{notebook_id}/sources/{source_id}")
async def sources_delete(notebook_id: str, source_id: str):
    async with get_client() as client:
        await client.sources.delete(notebook_id, source_id)
        return {"ok": True}


# --- Chat ---


@app.post("/api/notebooks/{notebook_id}/chat/ask")
async def chat_ask(notebook_id: str, body: ChatAsk):
    async with get_client() as client:
        result = await client.chat.ask(
            notebook_id,
            body.question,
            conversation_id=body.conversation_id,
            source_ids=body.source_ids,
        )
        return {
            "answer": result.answer,
            "conversation_id": result.conversation_id,
            "sources": getattr(result, "sources", []),
        }


@app.get("/api/notebooks/{notebook_id}/chat/history")
async def chat_history(notebook_id: str):
    async with get_client() as client:
        history = await client.chat.get_history(notebook_id)
        # get_history returns list[tuple[str, str]] (question, answer)
        out = [
            {"question": q, "answer": a}
            for q, a in (history or [])
        ]
        return out


# --- Artifacts ---


@app.get("/api/notebooks/{notebook_id}/artifacts")
async def artifacts_list(notebook_id: str):
    async with get_client() as client:
        artifacts = await client.artifacts.list(notebook_id)
        return [_serialize_artifact(a) for a in artifacts]


@app.post("/api/notebooks/{notebook_id}/artifacts/audio")
async def artifacts_generate_audio(notebook_id: str, body: GenerateAudio | None = None):
    body = body or GenerateAudio()
    async with get_client() as client:
        status = await client.artifacts.generate_audio(
            notebook_id,
            language=body.language or "en",
        )
        return {"task_id": status.task_id, "status": "started"}


@app.post("/api/notebooks/{notebook_id}/artifacts/video")
async def artifacts_generate_video(notebook_id: str, body: GenerateVideo | None = None):
    async with get_client() as client:
        status = await client.artifacts.generate_video(notebook_id)
        return {"task_id": status.task_id, "status": "started"}


@app.post("/api/notebooks/{notebook_id}/artifacts/report")
async def artifacts_generate_report(notebook_id: str, body: GenerateReport | None = None):
    async with get_client() as client:
        status = await client.artifacts.generate_report(notebook_id)
        return {"task_id": status.task_id, "status": "started"}


@app.post("/api/notebooks/{notebook_id}/artifacts/quiz")
async def artifacts_generate_quiz(notebook_id: str, body: GenerateQuiz | None = None):
    async with get_client() as client:
        status = await client.artifacts.generate_quiz(notebook_id)
        return {"task_id": status.task_id, "status": "started"}


@app.post("/api/notebooks/{notebook_id}/artifacts/flashcards")
async def artifacts_generate_flashcards(notebook_id: str, body: GenerateQuiz | None = None):
    async with get_client() as client:
        status = await client.artifacts.generate_flashcards(notebook_id)
        return {"task_id": status.task_id, "status": "started"}


@app.post("/api/notebooks/{notebook_id}/artifacts/mind-map")
async def artifacts_generate_mind_map(notebook_id: str):
    async with get_client() as client:
        status = await client.artifacts.generate_mind_map(notebook_id)
        return {"task_id": status.task_id, "status": "started"}


@app.post("/api/notebooks/{notebook_id}/artifacts/slide-deck")
async def artifacts_generate_slide_deck(notebook_id: str):
    async with get_client() as client:
        status = await client.artifacts.generate_slide_deck(notebook_id)
        return {"task_id": status.task_id, "status": "started"}


@app.post("/api/notebooks/{notebook_id}/artifacts/infographic")
async def artifacts_generate_infographic(notebook_id: str):
    async with get_client() as client:
        status = await client.artifacts.generate_infographic(notebook_id)
        return {"task_id": status.task_id, "status": "started"}


@app.get("/api/notebooks/{notebook_id}/artifacts/{artifact_id}/download")
async def artifacts_download(
    notebook_id: str,
    artifact_id: str,
    format: str = Query("default", description="e.g. mp3, mp4, pdf, json"),
):
    async with get_client() as client:
        artifacts = await client.artifacts.list(notebook_id)
        art = next((a for a in artifacts if a.id == artifact_id), None)
        if not art:
            raise HTTPException(404, "Artifact not found")
        kind = getattr(art, "kind", None)
        art_type = str(kind) if kind else getattr(art, "artifact_type", "") or ""
        # Route to appropriate download method and return stream
        if "audio" in art_type.lower():
            data, filename, mime = await client.artifacts.download_audio(artifact_id, notebook_id)
        elif "video" in art_type.lower():
            data, filename, mime = await client.artifacts.download_video(artifact_id, notebook_id)
        elif "report" in art_type.lower() or "study" in art_type.lower():
            data, filename, mime = await client.artifacts.download_report(
                artifact_id, notebook_id
            )
        elif "quiz" in art_type.lower():
            data, filename, mime = await client.artifacts.download_quiz(
                artifact_id, notebook_id, export_type=format or "json"
            )
        elif "flashcard" in art_type.lower():
            data, filename, mime = await client.artifacts.download_flashcards(
                artifact_id, notebook_id, export_type=format or "json"
            )
        elif "infographic" in art_type.lower():
            data, filename, mime = await client.artifacts.download_infographic(
                artifact_id, notebook_id
            )
        elif "slide" in art_type.lower():
            data, filename, mime = await client.artifacts.download_slide_deck(
                artifact_id, notebook_id, export_type=format or "pdf"
            )
        elif "mind" in art_type.lower():
            data, filename, mime = await client.artifacts.download_mind_map(
                artifact_id, notebook_id
            )
        else:
            raise HTTPException(400, f"Download not implemented for type: {art_type}")
        return StreamingResponse(
            iter([data] if isinstance(data, bytes) else [data.encode()]),
            media_type=mime or "application/octet-stream",
            headers={"Content-Disposition": f'attachment; filename="{filename or "download"}"'},
        )


# --- Research ---


@app.post("/api/notebooks/{notebook_id}/research/start")
async def research_start(notebook_id: str, body: ResearchStart):
    async with get_client() as client:
        result = await client.research.start(
            notebook_id, body.query, source=body.source, mode=body.mode
        )
        return result or {"status": "started"}


@app.get("/api/notebooks/{notebook_id}/research/status")
async def research_status(notebook_id: str):
    async with get_client() as client:
        result = await client.research.poll(notebook_id)
        return result


# --- Notes ---


@app.get("/api/notebooks/{notebook_id}/notes")
async def notes_list(notebook_id: str):
    async with get_client() as client:
        notes = await client.notes.list(notebook_id)
        return [{"id": n.id, "title": getattr(n, "title", ""), "content": getattr(n, "content", "")} for n in notes]


@app.post("/api/notebooks/{notebook_id}/notes")
async def notes_create(notebook_id: str, title: str = Query(...), content: str = Query("")):
    async with get_client() as client:
        note = await client.notes.create(notebook_id, title=title, content=content)
        return {"id": note.id, "title": getattr(note, "title", title), "content": getattr(note, "content", content)}


# --- Auth check ---


@app.get("/api/auth/status")
async def auth_status():
    storage = get_storage_path_from_env() or get_storage_path()
    if not storage or not storage.exists():
        return {"logged_in": False, "message": "Run 'notebooklm login' first."}
    return {"logged_in": True, "storage_path": str(storage)}


@app.get("/")
async def root():
    return RedirectResponse(url="/index.html")
