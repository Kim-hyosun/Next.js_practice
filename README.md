# blahx2

익명 질문 서비스

## 주요 기능

- 이벤트를 생성한 뒤 익명으로 질문을 등록합니다.
- 이벤트 생성한 사용자는 이벤트를 마감할 수 있습니다.
- 사용자는 등록된 질문에 좋아요를 클릭할 수 있습니다.
  - 한번 좋아요 클릭한 뒤 2번 좋아요할 수 없습니다.
- 익명 질문은 최대 300자까지만 지원합니다.

## 개발 환경

- Node.js >= 24 (`.nvmrc`)
- pnpm 9.x

```bash
nvm use
pnpm install
pnpm dev
```

## .env 파일 템플릿 (`.env.local`)

```env
# Firebase Web (public — NEXT_PUBLIC_ 접두사 필수)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN={projectId}.firebaseapp.com

# Firebase Admin (server-only)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...

# SSR fetch baseUrl
PROTOCOL=http
HOST=localhost
PORT=3000

# Thumbnail (dev only)
LOCAL_CHROME_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
```
