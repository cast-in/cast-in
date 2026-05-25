# Cast-In PRD

> 배우와 캐스팅 담당자를 연결하는 캐스팅 플랫폼

작성일: 2026-05-25  
현재 구현 기준으로 갱신했다. 초기 와이어프레임 기준 문서에서 달라진 기술 스택과 구현 상태를 반영한다.

## 1. 서비스 개요

- 한 줄 정의: 배우 프로필 탐색부터 공고 등록, 지원자 관리, 메시지까지 이어지는 캐스팅 플랫폼
- 핵심 사용자
  - 캐스팅 담당자: 배우 탐색, 공고 등록, 지원자 상태 관리, 메시지
  - 배우/모델: 공고 탐색, 지원, 지원 현황 관리, 메시지
- 핵심 가치: 같은 IA 안에서 역할에 따라 다른 업무 흐름 제공
  - 캐스팅: 인재를 찾고 지원자를 관리
  - 배우: 공고를 찾고 지원을 관리

## 2. 기술 스택

| 영역 | 현재 기준 |
|---|---|
| 언어 | TypeScript |
| 프레임워크 | Next.js 16 App Router |
| 런타임 UI | React 19 |
| 스타일 | Tailwind CSS 4 |
| UI 컴포넌트 | Base UI 기반 로컬 컴포넌트, shadcn CLI |
| 인증 | Supabase Auth email/password |
| 서버 로직 | Server Components, Server Actions, Route Handler |
| DB | Supabase PostgreSQL |
| 권한 | Supabase RLS, 컬럼 grant, DB 함수/트리거 |
| 실시간 | Supabase Realtime |
| 파일 저장 | Supabase Storage private buckets + signed URL |
| 배포 후보 | Vercel |

## 3. IA와 역할별 화면

공통 네비게이션은 역할에 따라 의미가 달라진다.

| 탭 | 캐스팅 계정 | 배우 계정 |
|---|---|---|
| `/dashboard` | 공고/지원자 요약 | 지원 현황/공고 요약 |
| `/talents` | 배우 탐색 | 공고 탐색 |
| `/jobs` | 공고 관리, 지원자 상태 관리 | 내 지원 현황, 지원 철회 |
| `/messages` | 배우와 대화 | 캐스팅 담당자와 대화 |
| `/profile` | 회사/담당자 프로필 | 배우 프로필, 포트폴리오 |
| `/settings` | 활동 모드, 알림 설정, 비밀번호 재설정, 로그아웃, 계정 삭제 | 활동 모드, 알림 설정, 비밀번호 재설정, 로그아웃, 계정 삭제 |

## 4. 구현 현황

### Public/Auth

- `/`: 랜딩 및 공개 배우 쇼케이스
- `/login`: 이메일/비밀번호 로그인, 비밀번호 재설정
- `/signup`: 이메일 회원가입, 개인정보/마케팅 동의
- `/auth/callback`: Supabase Auth callback, 내부 `next` 경로만 허용
- `/onboarding/role`, `/onboarding/profile`: 역할 선택과 초기 프로필 저장

현재 정책:

- 비밀번호는 8자 이상, 영문과 숫자 포함
- 이메일 confirmation, secure password change 활성화
- TOTP MFA 설정은 Supabase config에 활성화

### 캐스팅 계정

- `/dashboard`: 공고/지원자 요약, 배우 탐색 진입
- `/talents`: 배우 검색, 필터, 정렬, 프로필 상세
- `/talents/[actorId]`: 배우 상세, 북마크, 메시지 시작
- `/jobs`: 공고 목록, 지원자 보드, 지원 상태 변경, 메시지 딥링크
- `/jobs/new`: 공고 등록, 공고 미디어 업로드, 지원 질문 등록
- `/jobs/[id]`: 공고 상세, 공고 닫기, 지원자 테이블
- `/jobs/[id]/edit`: 공고 기본 정보 수정
- `/profile`: 회사 프로필

미흡/후속:

- 추천은 프로필/공고 조건 기반 규칙 점수로 1차 구현됨. 북마크/지원 로그 반영은 후속
- 오디션 일정/캘린더 없음
- 회사 인증/사업자 검증 없음
- 공고 수정 화면에서 미디어/지원 질문 수정은 제한적

### 배우 계정

- `/dashboard`: 지원 현황과 공고 요약
- `/talents`: 공고 검색, 필터, 정렬
- `/jobs/[id]`: 공고 상세, 지원, 메시지 시작
- `/jobs`: 최근 6개월 지원 내역, 상태 필터, 메시지 딥링크, 결과 확정 전 지원 철회
- `/profile`: 배우 프로필, 포트폴리오
- `/profile/edit`: 배우 정보, 대표 이미지/영상, 경력/수상 편집
- `/profile/portfolio`: 포트폴리오 업로드/삭제
- 지원서 제출 시 PDF, 이미지, 영상 첨부

지원 철회 정책:

- 배우 본인만 철회 가능
- `pending`, `reviewing`, `hold` 상태만 철회 가능
- `pass`, `reject`처럼 결과가 확정된 지원은 철회 불가
- 철회 후 기존 메시지방은 유지
- 캐스팅 담당자에게 `application_withdrawn` 알림 생성

미흡/후속:

- 프로필 공개 범위 UI는 더 정리 필요
- 저장한 공고 중심의 배우 대시보드 고도화 필요

### 메시지/알림

- `/messages`: 채팅방 목록, 방별 메시지, Realtime insert/update 구독
- 메시지 첨부 파일 업로드/렌더링
- 읽음 처리는 `messages.read_at`만 업데이트
- 메시지 생성 시 상대방에게 알림 생성
- `/notifications`: 알림 목록, 단건/전체 읽음 처리
- `/settings`: 지원 알림과 메시지 알림 수신 여부 설정

미흡/후속:

- 차단/신고 없음
- 메시지 화면의 지원 상태 패널 없음

### 설정

- `/settings`: 활동 모드 변경
- 지원 알림/메시지 알림 수신 설정 저장
- 비밀번호 재설정 메일 발송
- 로그아웃
- 계정 삭제 확인 플로우

설정 정책:

- `notification_settings`는 사용자 본인만 읽고 수정
- 지원 접수/상태 변경/철회 알림과 새 메시지 알림은 수신 설정을 확인한 뒤 생성
- 계정 삭제는 `삭제` 확인 문구 입력을 요구
- 계정 삭제 시 auth user 삭제 전 사용자 소유 storage object 정리를 시도

미흡/후속:

- 이메일/푸시 알림 채널 없음
- MFA 관리 UI 없음

## 5. 데이터 모델

주요 테이블:

```text
profiles
  id, role, name, email, avatar_url, consent fields

actor_profiles
  user_id, bio, birth_date, gender, region, genres[], skills[],
  image_tags[], nationalities[], height_cm, weight_kg, visibility, social_links

casting_profiles
  user_id, company_name, biz_number, contact, intro

portfolio_items
  id, actor_id, type[image|video], url, caption, created_at

actor_credits / actor_awards / actor_profile_views

jobs
  id, casting_id, title, description, production_name, role_name,
  genre, region, deadline, status, media_urls[], application fields

job_application_questions
  id, job_id, label, required, sort_order

applications
  id, job_id, actor_id, memo, casting_memo, status, answers, attachments, timestamps

bookmarks
  user_id, target_type[actor|job], target_id

chat_rooms
  id, job_id, actor_id, casting_id, last_message_at

messages
  id, room_id, sender_id, body, attachments, read_at

notifications
  user_id, type, payload, read_at

notification_settings
  user_id, application_notifications_enabled, message_notifications_enabled,
  created_at, updated_at
```

## 6. 보안/권한 기준

현재 반영된 기준:

- `profiles.email`, `casting_profiles.contact`, `casting_profiles.biz_number`는 브라우저 select 대상에서 제외
- 공개 프로필/포트폴리오는 actor visibility와 RLS 기준으로 제한
- actor는 open/마감 전 공고를 중심으로 읽고, casting owner와 기존 지원자는 필요한 공고를 읽을 수 있음
- 지원 질문은 읽을 수 있는 공고에만 노출
- 지원 생성은 DB 레벨에서 공고 상태, 마감, 필수 답변 조건 검증
- 대화방 생성은 실제 지원 관계 또는 공고 소유 관계를 DB에서 확인
- `chat_rooms` 직접 update 권한 제거
- `messages` update는 `read_at` 컬럼만 허용
- 알림 트리거는 `notification_settings` 수신 설정을 확인
- Storage `avatars`, `portfolio`, `job-media`, `attachments` bucket은 private
- 렌더링은 서버/클라이언트 조회 계층에서 signed URL로 변환
- 첨부 파일 DB row에는 signed URL이 아니라 private storage path와 파일 메타데이터만 저장
- 외부 링크는 `http:`/`https:`만 허용
- auth callback의 `next`는 내부 경로만 허용
- 보안 헤더: CSP, Referrer-Policy, X-Content-Type-Options, X-Frame-Options, Permissions-Policy, production HSTS

보안 점검 기록은 `docs/security-audit.md`에 유지한다.

## 7. Supabase 구성

Auth:

- site URL: `http://localhost:3333`
- redirect URL: `http://localhost:3333/auth/callback`, `http://127.0.0.1:3333/auth/callback`
- email confirmation 활성화
- secure password change 활성화
- minimum password length: 8
- password requirements: letters + digits
- TOTP MFA 활성화

Storage:

- `avatars`: private, 이미지 5MB
- `portfolio`: private, 이미지/영상 50MB
- `job-media`: private, 이미지/영상 100MB
- `attachments`: private, PDF/이미지/영상 50MB
- `brand-logos`: public, 서버 전용 service role 조회

마이그레이션:

- 원격 DB는 `20260525030000_private_attachments.sql`까지 적용된 상태를 기준으로 한다.

## 8. 구현 우선순위

완료:

- 인증/온보딩/역할 분기
- 프로필 등록/편집
- 공고 등록/검색/상세
- 지원/지원자 관리/상태 변경
- 지원 철회
- 1:1 메시지, 첨부, 읽음 처리
- 인앱 알림
- 설정 화면 1차 확장
- 지원서 첨부
- Storage 업로드와 signed URL 렌더링
- 보안/RLS 1차 하드닝

다음 우선순위:

1. 공고 수정 화면에서 미디어/지원 질문 수정 지원
2. 프로필 공개 범위 UI 정리
3. 추천 고도화: 북마크/지원 로그/조회 이력 반영
4. 테스트 보강: Server Action, RLS smoke, 주요 브라우저 플로우
5. README/PRD 외 운영 문서 최신화

## 9. 실행/운영 체크리스트

- [x] Next.js 16 + TS + Tailwind 4 구성
- [x] Supabase Auth email/password 구성
- [x] Supabase migration 관리
- [x] RLS 정책 작성 및 원격 적용
- [x] Storage private bucket 전환
- [x] security audit 문서화
- [x] 설정 화면 1차 확장
- [x] 메시지/지원서 첨부 1차 구현
- [x] 규칙 기반 추천 로직 1차 구현
- [ ] Vercel 프로젝트 연결과 production env 등록
- [ ] production Supabase redirect URL 추가
- [ ] 이메일 SMTP production provider 설정
- [ ] 운영 seed/fixture 전략 분리
- [ ] PR 템플릿과 배포 체크리스트 추가

## 10. 결정 필요한 포인트

- 추천 고도화: 북마크/지원 로그/조회 이력을 어떤 가중치로 포함할지
- 첨부 signed URL TTL: 현재 10분으로 충분한지
- 계정 삭제: soft delete와 auth user delete 범위
- 회사 인증: 사업자등록번호 검증 시점과 수동 승인 여부
- 알림 채널: 인앱만 유지할지, 이메일/푸시까지 확장할지
- 결제/유료 플랜: 캐스팅 계정 과금 모델

## 11. 참고

- 와이어프레임 원본: `~/Repos/cast-in-wireframe`
- 보안 점검 문서: `docs/security-audit.md`
