# waggle (익명 질문 서비스)

자기 페이지에 누구나 익명으로 질문을 남길 수 있고, 본인은 답변/거부할 수 있는 SNS 형식.

---

## 주요 기능

- Google 계정으로 로그인 → 본인 전용 페이지(`/[screenName]`)가 자동 생성됨
- 다른 사용자가 그 페이지에 **익명으로 질문 등록** (로그인 없이 가능, 최대 300자)
- 페이지 주인이 질문에 **답변** 작성 / **비공개 처리(deny)** 가능
- 질문에 **좋아요** 클릭 (계정당 1회 제한)
- 질문 카드의 **OG 썸네일 이미지**를 Playwright + Chromium으로 동적 생성
- SSR로 페이지 진입 즉시 데이터가 박힌 상태로 응답 (공유 링크 미리보기 친화)

---

## 기술 스택

### Framework / Runtime

- **Next.js 15.5** (Pages Router — `app/` 미사용)
- **React 19**
- **TypeScript 5.7**
- **Node.js ≥ 24** (`.nvmrc`)
- **pnpm 9.15**

### UI

- **Chakra UI v2** + Emotion (CSS-in-JS)
- **framer-motion** (애니메이션)
- **react-textarea-autosize** (자동 높이 조절 입력)

### Data / Backend

- **Firebase (Web SDK)** — 클라이언트 인증 (Google OAuth)
- **Firebase Admin SDK** — 서버 사이드 Firestore 접근 (API routes에서만)
- **TanStack Query v5** — 서버 상태 캐싱
- **Axios** — HTTP 클라이언트
- **AJV** — API 요청 body의 JSON Schema 검증

### 부가

- **Playwright Core** + **@sparticuz/chromium** — 서버리스 환경 호환 썸네일 생성
- **dayjs** — 날짜 포맷팅

---

## 폴더 구조

```txt
📦 Next.js_practice
├── 📂 pages                    # Next.js Pages Router (라우팅 + API routes 한 폴더)
│   ├── _app.tsx                # 전역 Provider 조합 (Chakra, QueryClient, AuthContext)
│   ├── _document.tsx           # HTML document 커스터마이즈 (Emotion SSR 등)
│   ├── index.tsx               # / — 홈 (로그인 진입점)
│   ├── [screenName]/
│   │   ├── index.tsx           # /:screenName — 본인/타인 페이지 (질문 작성 + 목록)
│   │   └── [messageId].tsx     # /:screenName/:messageId — 단일 질문 상세
│   ├── open-graph-img.tsx      # OG 썸네일이 캡처하는 렌더용 페이지
│   └── 📂 api                  # 서버 라우트
│       ├── hello.ts
│       ├── members.add.ts              # 가입 (Firebase auth 콜백 후 멤버 등록)
│       ├── user.info/[screenName].ts   # 사용자 정보 조회
│       ├── messages.add.ts             # 익명 질문 등록
│       ├── messages.add.reply.ts       # 답변 등록
│       ├── messages.list.ts            # 질문 목록
│       ├── messages.info.ts            # 단일 질문 조회
│       ├── messages.deny.ts            # 질문 비공개 처리
│       └── thumbnail.ts                # 동적 썸네일 생성 (Playwright)
│
├── 📂 components               # UI 부품
│   ├── GNB.tsx                         # 글로벌 내비 바
│   ├── service_layout.tsx              # 페이지 공통 레이아웃 (GNB + meta)
│   ├── google_login_button.tsx
│   ├── message_item.tsx                # 질문 카드 (좋아요, 답변, 거부 액션)
│   ├── full_page_spinner.tsx
│   ├── more_btn_icon.tsx
│   └── print_text.tsx                  # 줄바꿈 보존 텍스트 렌더
│
├── 📂 models                   # 데이터 레이어
│   ├── firebase_client.ts              # Firebase Web SDK 초기화
│   ├── firebase_admin.ts               # Firebase Admin SDK 초기화 (server-only)
│   ├── in_auth_user.ts                 # 인증 사용자 타입 (UI에서 다루는 shape)
│   ├── member/member.model.ts          # 멤버 도메인 모델
│   └── message/                        # 메시지 도메인
│       ├── in_message.ts               # 클라이언트 타입
│       └── message.model.ts            # 서버 모델 (Firestore CRUD)
│
├── 📂 controllers              # API 비즈니스 로직 (pages/api에서 호출)
│   ├── member.ctrl.ts                  # 멤버 등록·조회 핸들러
│   ├── message.ctrl.ts                 # 메시지 등록·답변·거부·목록 핸들러
│   ├── 📂 error                        # 에러 타입과 핸들러
│   │   ├── bad_request_error.ts
│   │   ├── custom_server_error.ts
│   │   ├── check_support_method.ts     # 허용 HTTP 메서드 검사
│   │   └── handle_error.ts             # 통합 에러 응답 변환
│   └── 📂 json_schema
│       └── post_message_req.ts         # 질문 등록 요청 스키마 (AJV)
│
├── 📂 hooks
│   └── use_firebase_auth.ts            # Firebase 인증 상태 구독 훅
│
├── 📂 contexts
│   └── auth_user.context.tsx           # 로그인 사용자 전역 컨텍스트
│
├── 📂 utils
│   └── convert_date_to_string.ts
│
├── 📂 styles                   # 글로벌 스타일
├── 📂 public                   # 정적 자산
├── next.config.js              # reactStrictMode만 활성
└── tsconfig.json               # `@/*` → 루트 path alias
```

---

## 아키텍처 한눈에

```
브라우저 ──┐
          │  (Firebase Auth: Google OAuth)
          ↓
   AuthUserContext ──── useFirebaseAuth (구독)
          │
          ↓
   page (SSR or CSR)
          │
          ├── TanStack Query ──► axios ──► /pages/api/* ──► controllers/* ──► models/* (Firebase Admin)
          │                                                                          │
          │                                                                          ↓
          │                                                                     Firestore
          │
          └── components/* (Chakra UI)
```

- **클라이언트 인증**은 Firebase Web SDK → 토큰을 axios 헤더에 실어 API 호출
- **서버 데이터 접근**은 API routes에서만 Firebase Admin으로 Firestore 직접 접근. 클라이언트는 Admin에 손대지 않음
- **요청 검증**은 controllers/json_schema의 AJV 스키마로 일원화. 잘못된 body는 `BadRequestError`로 변환되어 `handle_error`가 일관된 에러 응답으로 직렬화

---

## 라우트 / 화면 구성

| URL | 페이지 | 역할 |
|---|---|---|
| `/` | `pages/index.tsx` | 홈. 미로그인 시 Google 로그인 버튼, 로그인 후 본인 페이지로 이동 |
| `/[screenName]` | `pages/[screenName]/index.tsx` | 사용자 페이지. 익명 질문 입력 폼 + 질문 목록 |
| `/[screenName]/[messageId]` | `pages/[screenName]/[messageId].tsx` | 단일 질문 상세 (공유 링크 진입점, OG 메타 박힘) |
| `/open-graph-img` | `pages/open-graph-img.tsx` | `/api/thumbnail` 이 Playwright로 캡처하는 렌더 전용 페이지 (직접 접근하지 않음) |

### 주요 API

| Method | URL | 컨트롤러 |
|---|---|---|
| POST | `/api/members.add` | `member.ctrl.add` — 로그인 후 멤버 등록 |
| GET  | `/api/user.info/[screenName]` | 사용자 정보 |
| POST | `/api/messages.add` | 익명 질문 등록 (AJV 검증) |
| POST | `/api/messages.add.reply` | 답변 등록 (페이지 주인만) |
| POST | `/api/messages.deny` | 질문 비공개 처리 (페이지 주인만) |
| GET  | `/api/messages.list` | 질문 목록 (페이지네이션) |
| GET  | `/api/messages.info` | 단일 질문 조회 |
| GET  | `/api/thumbnail` | `/open-graph-img` 캡처해 PNG 반환 |

---

## 개발 환경

```bash
nvm use         # Node.js 24.15.0
pnpm install
pnpm dev        # http://localhost:3000
```

### 그 외 스크립트

```bash
pnpm build       # 프로덕션 빌드
pnpm start       # 빌드 결과 실행
pnpm lint        # next lint
pnpm type-check  # tsc --noEmit
```

---

## .env 파일 템플릿 (`.env.local`)

```env
# Firebase Web (public — NEXT_PUBLIC_ 접두사 필수)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN={projectId}.firebaseapp.com

# Firebase Admin (server-only — 절대 NEXT_PUBLIC_ 금지)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...

# SSR fetch baseUrl (getServerSideProps에서 자기 자신 호출 시 사용)
PROTOCOL=http
HOST=localhost
PORT=3000

# Thumbnail (dev only — 로컬 Chrome 경로. 배포 시엔 @sparticuz/chromium 사용)
LOCAL_CHROME_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
```

---

## 주요 규칙

- **익명 질문 최대 300자** — AJV 스키마 (`controllers/json_schema/post_message_req.ts`)에서 강제
- **좋아요 1인 1회** — 클라이언트 + 서버 양쪽에서 체크
- **답변·거부 권한** — 페이지 주인(=screenName 소유자)만 가능. Firebase Admin이 token 검증 후 매칭
- **Firebase Admin은 server-only** — `pages/api` 외부에서 import 금지 (번들에 비밀키 박힘)

---

## 참고

- Next.js Pages Router: https://nextjs.org/docs/pages
- Firebase: https://firebase.google.com/docs
- TanStack Query: https://tanstack.com/query/latest
- Chakra UI v2: https://v2.chakra-ui.com/
- AJV: https://ajv.js.org/
