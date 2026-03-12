# NotebookLM Studio Web

Google NotebookLM 스튜디오 스타일의 웹 UI입니다. [notebooklm-py](https://github.com/teng-lin/notebooklm-py)를 REST API로 래핑하고, 3열 레이아웃(소스 | 채팅 | 스튜디오)으로 노트북·소스·채팅·아티팩트 생성을 제공합니다.

## 기능

- **노트북**: 생성, 목록, 이름 변경, 삭제
- **소스**: URL·텍스트 추가, 목록, 삭제
- **채팅**: 질문/답변, 대화 이어하기
- **스튜디오**: 오디오·비디오·리포트·퀴즈·플래시카드·마인드맵·슬라이드·인포그래픽 생성, 다운로드

## 사전 요구사항

1. **notebooklm-py 설치 및 로그인**

   ```bash
   # 프로젝트 루트에서
   pip install -e ".[all]"
   playwright install chromium
   notebooklm login
   ```

2. **백엔드 의존성** (프로젝트 루트에서 notebooklm-py 사용)

   ```bash
   cd web/backend
   pip install -r requirements.txt
   pip install -e ../..   # 루트에서 notebooklm-py 에디터블 설치
   ```

## 실행 방법

### 1. 백엔드 (FastAPI)

```bash
cd web/backend
# Windows
set NOTEBOOKLM_STORAGE_PATH=%USERPROFILE%\.notebooklm\storage_state.json
uvicorn main:app --reload --host 127.0.0.1 --port 8000

# Linux/macOS
export NOTEBOOKLM_STORAGE_PATH=~/.notebooklm/storage_state.json
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

기본값은 `~/.notebooklm/storage_state.json` 이므로, `notebooklm login` 후 경로를 바꾸지 않았다면 환경 변수 생략 가능합니다.

### 2. 프론트엔드 (Vite)

```bash
cd web/frontend
npm install
npm run dev
```

브라우저에서 http://localhost:5173 를 엽니다. API는 프록시로 http://127.0.0.1:8000 으로 연결됩니다.

### 한 번에 실행 (두 터미널)

- 터미널 1: `cd web/backend && uvicorn main:app --reload --port 8000`
- 터미널 2: `cd web/frontend && npm run dev`

## 배포

- **백엔드**: 동일 서버에서 `uvicorn main:app --host 0.0.0.0 --port 8000` 실행. `NOTEBOOKLM_STORAGE_PATH`로 저장소 경로 지정.
- **프론트엔드**: `npm run build` 후 `dist/`를 정적 호스팅. API URL은 `VITE_API_URL`로 지정 (예: `https://api.example.com`).

## 디렉터리 구조

```
web/
├── README.md          # 이 파일
├── backend/
│   ├── main.py        # FastAPI 앱 (notebooklm-py 래핑)
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── api.ts
        ├── index.css
        └── components/
            ├── LoginBanner.tsx
            ├── NotebookSidebar.tsx
            ├── SourcesPanel.tsx
            ├── ChatPanel.tsx
            └── StudioPanel.tsx
```
