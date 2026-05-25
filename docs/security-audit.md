# Security and Architecture Audit

작성일: 2026-05-25

이 문서는 현재 코드베이스 기준으로 확인한 보안, 아키텍처, 미구현/미흡 기능을 정리한 작업 메모다. 한 번에 전부 고치기보다, 아래 우선순위대로 하나씩 처리하는 것을 전제로 작성했다.

## 검증 요약

- 2026-05-25 초기 점검
  - `pnpm lint`: 통과
  - `pnpm build`: 통과
  - `pnpm audit --prod`: 실패
  - 총 26건: high 9, moderate 14, low 3
- 2026-05-25 추천 처리 순서 반영 후
  - `pnpm audit --prod`: 통과
  - `pnpm lint`: 통과
  - `pnpm build`: 통과
- 2026-05-25 추천 로직 1차 구현 후
  - `pnpm lint`: 통과
  - `pnpm build`: 통과
  - `pnpm audit --prod`: 통과
  - 브라우저 검증: `/talents` 추천순 옵션, 매칭 점수/이유 표시, 콘솔 error 0건.

## 처리 현황

- 완료: dependency audit 정리
  - `next`, `eslint-config-next`를 `16.2.6`으로 업데이트.
  - `@supabase/ssr`, `@supabase/supabase-js`를 최신 패치로 업데이트.
  - `shadcn`을 production dependency에서 devDependency로 이동.
  - `postcss@8.5.10` override 추가.
- 완료: PII/RLS 공개 범위 축소
  - `profiles.email`, `casting_profiles.contact`, `casting_profiles.biz_number`를 브라우저 select 대상에서 제외.
  - 공개 actor/casting 화면에서 이메일/연락처 조회 및 표시 제거.
  - 본인 casting 연락처 조회는 `get_my_casting_profile_private()` RPC로 분리.
- 완료: 공고/지원 질문 RLS 강화
  - actor는 open/마감 전 공고 중심으로 읽고, casting owner와 기존 지원자는 필요한 공고를 읽을 수 있게 분리.
  - 지원 질문은 읽을 수 있는 공고에만 노출.
- 완료: 지원/대화/메시지 RLS 정렬
  - 지원 insert 정책에 open/마감/필수 질문 답변 검증을 추가.
  - job 대화방 생성은 actor 지원 여부 또는 casting owner 조건을 DB에서 확인.
  - `chat_rooms` 직접 update 권한 제거.
  - `messages` insert/update 컬럼 권한을 제한하고, update는 `read_at`만 허용.
- 완료: URL/storage 검증 강화
  - 외부 링크는 `http:`/`https:`만 허용.
  - avatar/portfolio URL은 현재 Supabase public storage origin, bucket, 사용자 폴더를 검증.
  - avatar 업로드 클라이언트 제한을 bucket 제한과 같은 5MB로 맞춤.
- 완료: 프로필 편집 저장 안정성 개선
  - 프로필 편집 action의 주요 write error를 확인.
  - 배우 credits/awards 교체를 `replace_my_actor_showcase()` RPC로 묶어 delete 후 insert 실패 위험을 줄임.
  - 저장 시 기존 visibility를 유지.
- 완료: 더미/미흡 기능 문구 정리
  - 실제 추천 로직이 아닌 영역의 `맞춤/추천` 문구를 현재 동작에 맞게 변경.
  - 동작 없는 메시지 옵션 버튼 제거.
- 완료: Supabase migration 원격 적용
  - `20260525000000`부터 `20260525030000`까지 pending migration을 원격 DB에 push.
  - anon smoke test에서 `profiles.email`은 `42501` 권한 오류, anon open jobs는 0건 노출 확인.
- 완료: Auth 설정 강화
  - Supabase `site_url`과 redirect URL을 dev port `3333` 기준으로 정리.
  - 비밀번호 정책을 8자 이상 + 영문/숫자로 강화하고 Server Action 검증도 맞춤.
  - 이메일 confirmation, secure password change, TOTP MFA를 원격 Auth config에 반영.
  - auth callback의 `next` 파라미터를 내부 경로만 허용하도록 정규화.
- 완료: Service role 경계
  - `lib/queries/brand-logos.ts`에 `server-only`를 추가.
- 완료: 보안 헤더
  - `Content-Security-Policy`, `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy` 추가.
  - production에서는 `Strict-Transport-Security`도 적용.
- 완료: 지원 철회 기능
  - 배우 지원 목록에 `pending`/`reviewing`/`hold` 상태에서만 지원 철회 UI 추가.
  - `applications` delete RLS를 같은 상태 조건으로 제한.
  - 지원 철회 시 캐스팅 계정에 `application_withdrawn` 알림 생성.
- 완료: 공개 media bucket 축소
  - `avatars`, `portfolio`, `job-media` bucket을 private으로 전환.
  - 서버 조회 계층에서 기존 public storage URL을 signed URL로 변환해 렌더링.
  - 공고 media 저장 action에서 현재 사용자 `job-media` 경로만 허용.
- 완료: README/PRD 갱신
  - create-next-app 기본 README를 현재 실행 방법, env, Supabase migration, 보안 기준 중심으로 교체.
  - PRD의 Next 15/Google OAuth/API Routes 기준 내용을 Next 16, email/password, Server Actions, RLS/signed storage 기준으로 갱신.
  - 가입 화면 비밀번호 안내 문구를 실제 정책과 맞춤.
- 완료: 설정 화면 1차 고도화
  - `notification_settings` 테이블과 RLS를 추가하고, 지원/메시지 알림 트리거가 사용자 설정을 존중하도록 변경.
  - 설정 화면에서 지원 알림/메시지 알림 저장, 비밀번호 재설정 메일 발송, 로그아웃, 계정 삭제 진입을 제공.
  - 계정 삭제는 `삭제` 확인 문구를 요구하고, auth user 삭제 전 사용자 소유 storage object 정리를 시도.
  - 브라우저 검증: `/settings` 렌더링, 알림 설정 저장 성공 메시지, 계정 삭제 확인 모달, 콘솔 error 0건.
- 완료: 메시지/지원서 첨부 1차 구현
  - `attachments` bucket을 private으로 추가하고 메시지방 참여자, 지원자 본인, 해당 공고 캐스팅 담당자 기준으로 storage RLS를 제한.
  - 메시지 `attachments` 컬럼에 대한 insert grant를 열고, 메시지 화면에서 파일 업로드/전송/렌더링을 지원.
  - `applications.attachments` 컬럼을 추가하고, 지원서 제출 모달에서 첨부 파일을 함께 저장.
  - 캐스팅 지원자 테이블에서 지원서 첨부를 signed URL로 확인할 수 있게 변경.
  - signed URL은 10분 TTL로 발급하고 DB에는 bucket path와 파일 메타데이터만 저장.
- 완료: 실제 추천 로직 1차 구현
  - 배우 프로필의 장르/지역/성별/나이/특기/이미지 태그/경력을 공고 조건과 비교하는 규칙 기반 점수를 추가.
  - 캐스팅 계정은 본인 활성 공고 조건에 가까운 배우를 추천순으로 정렬.
  - 배우 계정은 본인 프로필과 가까운 공고를 추천순으로 정렬.
  - `/talents` 검색 UI에 추천순과 매칭 점수/이유를 노출.

남은 별도 작업:

- 공고 수정 화면의 미디어/지원 질문 편집, 프로필 공개 범위 UI, 추천 고도화.

## P0 - 바로 고칠 것

### 1. RLS가 공개 범위를 과하게 열고 있음

관련 파일:

- `supabase/migrations/20260415131833_init.sql`
- `lib/queries/jobs.ts`
- `lib/queries/castings.ts`

문제:

- `profiles`가 `using (true)`로 전체 공개라서 이메일이 과하게 노출될 수 있음.
- `actor_profiles`, `casting_profiles`, `portfolio`도 전체 공개 정책이 있음.
- 앱 쿼리에서는 `visibility = public` 필터를 일부 걸지만, DB RLS 자체가 이를 강제하지 않음.
- `getActorDetail`은 `profiles.email`을 함께 조회하고, 프로필 상세에서 이메일이 노출될 수 있음.

해야 할 일:

- 공개 프로필 조회용 view/RPC를 별도로 만들거나 RLS에서 공개 가능한 컬럼만 노출되도록 구조 변경.
- 이메일, 연락처 같은 PII는 소유자 또는 명시적으로 허용된 관계에서만 읽히게 제한.
- 앱 쿼리 필터에 의존하지 말고 DB 정책에서 `visibility`를 강제.

### 2. draft/closed 공고와 지원 질문이 노출될 수 있음

관련 파일:

- `supabase/migrations/20260415131833_init.sql`
- `supabase/migrations/20260525010000_job_upload_form_fields.sql`
- `lib/queries/jobs.ts`

문제:

- `jobs readable by authenticated`가 모든 인증 사용자의 전체 공고 조회를 허용함.
- `getJob(id)`는 상태/소유자 검사를 하지 않고 RLS에 의존함.
- `job_application_questions`가 인증 사용자 전체에게 읽힘.
- 결과적으로 draft 공고나 내부 지원 질문이 노출될 수 있음.

해야 할 일:

- actor는 `status = 'open'`이고 마감 전인 공고만 읽도록 제한.
- casting owner는 본인 공고 전체를 읽을 수 있게 분리.
- 지원 질문도 공개 가능한 공고 또는 공고 소유자에게만 노출.

### 3. Server Action 검증과 RLS 검증이 불일치함

관련 파일:

- `app/(app)/jobs/[id]/actions.ts`
- `app/(app)/messages/message-room.tsx`
- `supabase/migrations/20260415131833_init.sql`

문제:

- `applyToJobAction`은 공고 상태, 마감, 필수 질문을 검사하지만 RLS는 `actor_id = auth.uid()`만 확인함.
- 클라이언트에서 Supabase를 직접 호출하면 Server Action 검증을 우회할 여지가 있음.
- actor가 `startJobConversationAction`에서 해당 공고에 실제 지원했는지 확인하지 않고 대화방을 만들 수 있음.
- `chat_rooms insert participant` 정책은 참여자면 직접 방을 만들 수 있어 도메인 규칙이 약함.

해야 할 일:

- 지원 생성 정책에 공고 상태/마감/role 조건을 DB 레벨로 추가.
- 대화방 생성은 Server Action/RPC 중심으로 묶고, RLS에서도 "지원/공고 소유 관계"를 확인.
- actor가 공고 대화를 시작할 때 해당 공고 지원 여부를 검사.

### 4. 메시지 update 정책이 너무 넓음

관련 파일:

- `supabase/migrations/20260415131833_init.sql`
- `app/(app)/messages/message-room.tsx`

문제:

- `messages update recipient (read_at)` 정책이 이름과 달리 `read_at`만 제한하지 않음.
- 현재 참여자는 메시지 row의 다른 컬럼까지 직접 수정할 수 있는 위험이 있음.

해야 할 일:

- 읽음 처리는 별도 RPC로 만들거나, RLS/trigger로 `read_at`만 변경 가능하게 제한.
- 메시지 본문, sender, room_id, attachments는 생성 이후 클라이언트가 수정하지 못하게 막기.

## P1 - 빠르게 고칠 것

### 1. dependency audit 정리

관련 파일:

- `package.json`

문제:

- `next@16.2.3`에 high advisory가 있음.
- `shadcn` CLI가 production `dependencies`에 들어가 prod audit 범위를 넓힘.
- Supabase realtime 경유 `ws`, `hono`, `qs`, `brace-expansion` 등 취약점이 audit에 잡힘.

해야 할 일:

- `next`를 `>=16.2.6`으로 업데이트.
- `shadcn`을 제거하거나 `devDependencies`로 이동.
- lockfile 갱신 후 `pnpm audit --prod`, `pnpm lint`, `pnpm build` 재검증.

### 2. Auth 설정 강화

관련 파일:

- `supabase/config.toml`
- `app/(public)/login/actions.ts`
- `app/auth/callback/route.ts`

문제:

- Supabase local `site_url`은 `3000`인데 앱 개발 포트는 `3333`.
- 최소 비밀번호 길이가 6이고 `password_requirements`가 비어 있음.
- 이메일 confirmation이 꺼져 있음.
- `auth/callback`의 `next` 파라미터를 내부 경로로 정규화하는 방어가 약함.

해야 할 일:

- 실제 개발/배포 URL에 맞게 redirect URL 정리.
- 비밀번호 정책 강화.
- 운영 환경에서는 이메일 confirmation 활성화 검토.
- `next`는 `/...` 형태의 내부 경로만 허용하고 `//`, 외부 URL, 이상한 scheme 차단.

### 3. URL 입력 검증 강화

관련 파일:

- `app/(app)/profile/edit/actions.ts`
- `app/(app)/profile/showcase/actions.ts`
- `app/(app)/profile/avatar-actions.ts`
- `app/(app)/profile/portfolio/actions.ts`

문제:

- `normalizeUrl`, `normalizeHref`가 scheme이 있는 URL을 거의 그대로 허용함.
- `javascript:` 같은 위험한 scheme이 social/credit href에 들어갈 수 있음.
- avatar/portfolio URL은 `http` 시작 여부만 검사해서 외부 임의 URL도 저장 가능.

해야 할 일:

- 외부 링크는 `http:`와 `https:`만 허용.
- avatar/portfolio는 Supabase storage origin/bucket/path를 검증.
- 잘못된 URL은 저장하지 않고 사용자에게 명확한 에러 반환.

### 4. Service role 사용 경계 명확화

관련 파일:

- `lib/queries/brand-logos.ts`

문제:

- `SUPABASE_SERVICE_ROLE_KEY`를 사용하는 모듈에 `server-only` 보호가 없음.
- 현재는 서버 페이지에서만 import되지만, 실수로 클라이언트 번들 경계에 들어가면 위험함.

해야 할 일:

- `import "server-only"` 추가.
- 가능하면 service role 없이 public bucket/list 정책 또는 서버 전용 API로 좁히기.

### 5. 프로필 편집 저장 안정성

관련 파일:

- `app/(app)/profile/edit/actions.ts`

문제:

- 여러 Supabase update/insert/delete 결과의 에러를 확인하지 않음.
- credits/awards는 전체 삭제 후 재삽입 구조라 중간 실패 시 데이터 손실 위험이 있음.
- 저장 시 `visibility: "public"`으로 강제되어 비공개 설정이 풀릴 수 있음.

해야 할 일:

- 모든 write 결과의 error를 확인하고 실패 시 중단.
- 가능하면 RPC/transaction으로 묶기.
- visibility는 기존 값 유지 또는 UI 입력값으로만 변경.

## P2 - 다음 단계에서 정리할 것

### 1. storage bucket 공개 범위 재검토

관련 파일:

- `supabase/migrations/20260421000000_portfolio_storage.sql`
- `supabase/migrations/20260421010000_avatars_storage.sql`
- `supabase/migrations/20260525010000_job_upload_form_fields.sql`
- `supabase/migrations/20260525024000_private_media_storage.sql`
- `supabase/migrations/20260525030000_private_attachments.sql`
- `lib/supabase/storage-url.ts`

문제:

- portfolio, avatars, job-media bucket이 public임.
- 공개 프로필/공고용 파일이면 맞을 수 있지만, 지원서 첨부나 비공개 프로필과 연결될 경우 범위가 과함.
- `HeroAvatarUploader` 크기 제한 불일치는 2026-05-25에 5MB로 수정함.
- 2026-05-25에 기존 public URL 저장 구조는 유지하되, bucket을 private으로 전환하고 렌더링 시 signed URL을 발급하도록 변경함.
- 2026-05-25에 메시지/지원서 첨부용 `attachments` bucket을 private으로 추가하고 scoped RLS를 적용함.

해야 할 일:

- 장기적으로 DB에는 public URL 대신 `bucket/path` 저장 구조로 전환 검토.

### 2. 보안 헤더/CSP 검토

관련 파일:

- `next.config.ts`

문제:

- 초기 점검 당시 별도 보안 헤더/CSP 설정이 없었음.
- 2026-05-25에 CSP, referrer policy, content type 차단, frame 차단, permissions policy, production HSTS를 추가함.

해야 할 일:

- 외부 이미지/스크립트 도메인 목록을 실제 사용처 기준으로 정리.
- production 배포 URL과 외부 연동 도메인이 확정되면 CSP를 재점검.

## 더미/미구현/미흡 기능

### 1. 추천 기능 1차 구현 완료

관련 파일:

- `app/(app)/talents/page.tsx`
- `components/features/actor-card.tsx`
- `components/features/job-card.tsx`
- `lib/queries/jobs.ts`
- `lib/recommendations.ts`

문제:

- 초기 점검 당시 실제 추천 로직은 없었고, `맞춤/추천`처럼 보이는 문구만 일부 있었음.
- 2026-05-25에 태그/지역/장르/성별/나이/경력 기반 규칙 점수와 추천순 정렬을 추가함.

해야 할 일:

- 북마크/지원 로그, 조회 이력, 캐스팅별 가중치를 반영하는 추천 고도화는 후속 작업으로 분리.
- 추천 후보가 많아지면 SQL/RPC 또는 materialized score 구조로 이동 검토.

### 2. 메시지 기능이 PRD 대비 일부 부족함

관련 파일:

- `app/(app)/messages/message-room.tsx`
- `supabase/migrations/20260525030000_private_attachments.sql`

문제:

- 초기 점검 당시 메시지는 본문 전송만 구현되어 있었고, `attachments` 컬럼은 UI/업로드 플로우가 없었음.
- 2026-05-25에 실질 동작이 없던 "대화 옵션" 버튼은 제거함.
- 2026-05-25에 메시지 첨부 업로드/전송/렌더링을 추가함.
- 지원자 상태 패널, 진행 상태 변경 UI가 없음.

해야 할 일:

- 옵션 메뉴가 필요하면 차단/신고/알림 설정 등 실제 기능 연결.
- 공고/지원서 컨텍스트가 있는 대화방에는 지원 상태 패널 추가.

### 3. 설정 화면 1차 확장 완료

관련 파일:

- `app/(app)/settings/page.tsx`
- `app/(app)/settings/actions.ts`
- `supabase/migrations/20260525025000_notification_settings.sql`

문제:

- 초기 점검 당시 활동 모드 변경과 로그아웃 중심이었음.
- 테마 설정은 플래그로 숨겨져 있었고, 알림/계정 관리 기능이 부족했음.
- 2026-05-25에 인앱 알림 설정, 비밀번호 재설정 메일, 계정 삭제 확인 플로우를 추가함.

해야 할 일:

- 이메일/푸시 알림 채널을 도입할 때 `notification_settings` 스키마 확장.
- MFA 관리 UI가 필요하면 Supabase Auth factor 관리 플로우 별도 설계.

### 4. 배우 프로필 편집 UI가 일부 숨겨져 있음

관련 파일:

- `app/(app)/profile/edit/repeatable-profile-lists.tsx`
- `app/(app)/profile/edit/actions.ts`
- `app/onboarding/profile/profile-form.tsx`

문제:

- credit href, award organization 입력이 hidden 필드로만 있음.
- visibility UI는 onboarding 확장 폼에는 있으나 actor custom edit 화면에는 제대로 드러나지 않음.
- 저장 action은 visibility를 public으로 강제함.

해야 할 일:

- 편집 화면에서 실제 수정 가능한 필드와 저장 action을 맞추기.
- 숨겨진 필드가 필요 없으면 제거하고, 필요하면 UI 추가.

### 5. 지원 취소 기능 UI/action이 없음

관련 파일:

- `supabase/migrations/20260415131833_init.sql`
- `supabase/migrations/20260525023000_application_withdrawal.sql`
- `app/(app)/jobs/actions.ts`
- `app/(app)/jobs/withdraw-application-dialog.tsx`

문제:

- RLS에는 `applications delete actor self`가 있지만, 실제 취소/철회 action이나 UI를 찾지 못함.
- 2026-05-25에 결과 확정 전 상태의 지원 철회 UI/action과 DB 정책을 추가함.

해야 할 일:

- 상세 공고 화면에서도 같은 철회 액션을 노출할지 결정.
- 철회된 지원서 이력을 별도 감사 로그로 남길지 결정.

### 6. README와 PRD/구현 상태가 맞지 않음

관련 파일:

- `README.md`
- `package.json`
- `docs/PRD.md` 또는 현재 PRD 문서가 있다면 해당 파일

문제:

- README는 기본 create-next-app 내용에 가까움.
- PRD에는 Next 15, SWR, Google OAuth, API Routes 등이 언급되지만 실제 구현은 Next 16, Supabase email/password, Server Actions 중심임.
- 2026-05-25에 README와 PRD를 현재 구현 기준으로 갱신함.

해야 할 일:

- production 배포 URL이 정해지면 README/PRD의 Supabase redirect URL과 운영 체크리스트를 갱신.

## 추천 처리 순서

완료한 순서:

1. dependency audit: `next` 업데이트, `shadcn` dependency 정리
2. PII/RLS: profiles, actor/casting profile, portfolio 공개 정책 재설계
3. jobs/questions RLS: draft/closed 공고 및 지원 질문 노출 차단
4. applications/chat/messages RLS: Server Action 검증과 DB 정책 일치
5. URL/storage 검증: 위험 scheme과 외부 임의 storage URL 차단
6. profile edit 안정성: error handling, transaction/RPC, visibility 유지
7. 미구현 기능 문구 정리: 추천/메시지/지원 취소
8. 설정 화면 1차 확장: 알림 설정, 비밀번호 재설정, 계정 삭제
9. 메시지/지원서 첨부 1차 구현: private attachment bucket, RLS, signed URL 렌더링
10. 실제 추천 로직 1차 구현: 태그/지역/장르/성별/나이/경력 기반 규칙 점수

다음 순서:

1. 공고 수정 화면 확장: 미디어/지원 질문 수정
2. 프로필 공개 범위 UI 정리
3. 추천 고도화: 북마크/지원 로그/조회 이력 반영
4. 테스트 보강: Server Action, RLS smoke, 주요 브라우저 플로우
