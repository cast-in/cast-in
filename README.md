# Cast-In

배우와 캐스팅 담당자를 연결하는 캐스팅 플랫폼입니다. 배우는 공고를 탐색하고 지원 내역과 메시지를 관리하고, 캐스팅 담당자는 공고와 지원자 상태를 관리합니다.

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4, Base UI 기반 UI 컴포넌트, shadcn CLI
- Supabase Auth, PostgreSQL, Realtime, Storage
- Server Components, Server Actions, Supabase RLS 중심 권한 제어

## Requirements

- Node.js 20 이상
- pnpm 9.15.4
- Supabase CLI
- Supabase 프로젝트 또는 로컬 Supabase

## Environment

`.env.local.example`을 기준으로 `.env.local`을 만듭니다.

```bash
cp .env.local.example .env.local
```

필수 값:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

구형 Supabase 프로젝트는 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 대신 `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 사용할 수 있습니다. `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용입니다. 브라우저에 노출되는 `NEXT_PUBLIC_` 접두어를 붙이면 안 됩니다.

## Development

```bash
pnpm install
pnpm dev
```

앱은 [http://localhost:3333](http://localhost:3333)에서 실행됩니다.

주요 스크립트:

```bash
pnpm dev          # Next 개발 서버, 3333 포트
pnpm build        # production build
pnpm start        # production 서버, 3333 포트
pnpm lint         # ESLint
pnpm audit --prod # production dependency audit
```

## Supabase

마이그레이션은 `supabase/migrations`에 있습니다. 현재 원격 프로젝트는 `20260525030000_private_attachments.sql`까지 적용된 상태를 기준으로 합니다.

원격 DB에 로컬 마이그레이션을 적용:

```bash
pnpm dlx supabase@latest db push
```

적용 상태 확인:

```bash
pnpm dlx supabase@latest migration list
```

Auth 설정은 `supabase/config.toml` 기준입니다.

- site URL: `http://localhost:3333`
- redirect URL: `/auth/callback`
- 이메일 confirmation 활성화
- 비밀번호 8자 이상, 영문과 숫자 포함
- TOTP MFA 활성화

Storage bucket 중 `avatars`, `portfolio`, `job-media`, `attachments`는 private입니다. 앱은 DB에 저장된 기존 public storage URL 또는 private path를 서버/클라이언트 조회 계층에서 signed URL로 변환해 렌더링합니다.

## Seed Data

발표용 더미 데이터는 서버 전용 키가 필요합니다.

```bash
node --env-file=.env.local scripts/seed.mjs
node --env-file=.env.local scripts/seed.mjs --reset
node --env-file=.env.local scripts/seed.mjs --avatars-only
```

## Security Notes

보안/아키텍처 점검과 처리 현황은 [docs/security-audit.md](docs/security-audit.md)에 기록합니다.

현재 반영된 주요 보안 기준:

- PII 컬럼은 브라우저 select 권한에서 제외
- draft/closed 공고와 지원 질문은 RLS에서 노출 제한
- 지원, 대화방, 메시지는 Server Action 검증과 RLS 조건을 맞춤
- 메시지 update는 `read_at`만 허용
- 지원/메시지 알림 트리거는 사용자 알림 설정을 확인
- 메시지/지원서 첨부는 private bucket path만 저장하고 signed URL로 렌더링
- 외부 링크는 `http:`/`https:`만 허용
- Supabase storage URL은 origin, bucket, 사용자 폴더를 검증
- `next.config.ts`에 CSP, referrer policy, frame 차단, permissions policy, production HSTS 적용

## Product Status

구현됨:

- 이메일/비밀번호 로그인, 회원가입, 비밀번호 재설정
- 역할 선택 온보딩과 배우/캐스팅 프로필
- 공고 등록, 검색, 상세, 지원, 지원자 상태 변경
- 배우 지원 현황과 결과 확정 전 지원 철회
- 1:1 메시지, 첨부, Realtime 수신, 읽음 처리
- 인앱 알림
- 설정: 활동 모드, 알림 수신 설정, 비밀번호 재설정 메일, 계정 삭제
- 배우 포트폴리오, 공고 미디어, 지원서 첨부 업로드
- 북마크와 역할별 대시보드
- `/talents` 추천순: 프로필/공고 조건 기반 규칙 점수와 매칭 이유

남은 주요 작업:

- 추천 고도화: 북마크/지원 로그/조회 이력 반영
- 공고 수정 화면의 미디어/지원 질문 편집
- 운영 배포 체크리스트와 테스트 보강
