export function LoginBanner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-100 to-surface-200 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-surface-200 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-accent"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-surface-900 mb-2">로그인이 필요합니다</h1>
        <p className="text-surface-600 text-sm mb-6">
          이 웹 앱은 notebooklm-py 인증을 사용합니다. 터미널에서 한 번 로그인한 뒤 이 페이지를 새로고침하세요.
        </p>
        <ol className="text-left text-sm text-surface-600 space-y-2 mb-6 bg-surface-50 rounded-lg p-4 border border-surface-200">
          <li>1. 터미널을 열고 프로젝트 루트에서:</li>
          <li className="font-mono text-accent bg-surface-100 px-2 py-1 rounded">
            notebooklm login
          </li>
          <li>2. 브라우저가 열리면 Google 계정으로 로그인하세요.</li>
          <li>3. 로그인 후 이 페이지를 새로고침하세요.</li>
        </ol>
        <p className="text-xs text-surface-500">
          백엔드가 기본 경로(~/.notebooklm/storage_state.json)를 사용합니다.
          다른 경로를 쓰려면 <code className="bg-surface-100 px-1 rounded">NOTEBOOKLM_STORAGE_PATH</code> 환경 변수를 설정하세요.
        </p>
      </div>
    </div>
  );
}
