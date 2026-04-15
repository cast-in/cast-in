# Cast-In PRD (Product Requirements Document)

> 배우와 캐스팅을 연결하는 매칭 플랫폼
> 기준 와이어프레임: `~/Repos/cast-in-wireframe` (팀원이 바이브코딩으로 제작)

---

## 1. 서비스 개요

- **한 줄 정의:** 배우 프로필 탐색부터 공고 등록, 지원자 관리, 메시지까지 이어지는 캐스팅 플랫폼
- **핵심 사용자:**
  1. **캐스팅 담당자** (제작사/에이전시) — 인재 탐색 & 지원자 관리
  2. **배우/모델** — 오디션 탐색 & 지원 관리
- **핵심 가치:** 같은 IA(네비 4탭)에서 역할에 따라 다른 맥락 제공
  - 캐스팅: "인재를 찾고 지원자를 관리"
  - 배우: "공고를 찾고 지원을 관리"

---

## 2. 기술 스택 (확정)

| 영역 | 선택 |
|---|---|
| 언어 | TypeScript |
| 프레임워크 | Next.js 15 (App Router) |
| UI | shadcn/ui + Tailwind CSS + v0.dev |
| 데이터 패칭 | SWR |
| 인증 | Supabase Auth (Google OAuth) |
| 백엔드 | Next.js API Routes (Route Handlers) |
| DB | Supabase PostgreSQL |
| 파일 저장 | Supabase Storage |
| 배포 | Vercel |
| 협업 | GitHub |

---

## 3. 사용자 역할 & 화면 매핑

와이어프레임 기준 네비 4탭 구조는 공통, 역할(`casting | actor`)에 따라 콘텐츠가 분기됨.

| 탭 | 캐스팅 계정 | 배우 계정 |
|---|---|---|
| `discover` | 인재 찾기 (추천 배우) | 둘러보기 (추천 오디션) |
| `talents` | 배우 탐색 (카드) | 오디션 탐색 (카드) |
| `jobs` | 공고 관리 (지원자 테이블) | 지원 관리 (내 지원 테이블) |
| `profile` | 프로필 관리 (회사) | 프로필 (배우 + 포트폴리오) |

공통 보조 화면: `messages`, `settings`

---

## 4. 페이지별 기능 명세

### 4.1 Public (비로그인)

#### [L-1] 랜딩 `/`
- 브랜드 소개 히어로 + 프리뷰 카드(대시보드 미리보기)
- CTA: 로그인 / 회원가입
- **필요 기능:** 정적 페이지, 라우팅

#### [L-2] 로그인 `/login`
- **Google 로그인 단일 버튼** (Supabase Auth)
- (Phase 2) 이메일/비밀번호 로그인
- **필요 기능:** Supabase Google OAuth, 세션 미들웨어

#### [L-3] 회원가입 `/signup`
- Google 로그인과 동일 진입점 (Supabase가 자동 계정 생성)
- 첫 로그인 시 온보딩으로 리다이렉트

#### [L-4] 온보딩 `/onboarding/role`, `/onboarding/profile`
> 와이어프레임의 회원가입 폼에서 "직업 유형 선택"을 별도 스텝으로 분리
- 역할 선택: **배우 | 캐스팅**
- 기본 프로필 입력 (역할별로 다름)
- **필요 기능:** 프로필 없을 시 강제 리다이렉트, 역할 저장

---

### 4.2 캐스팅 계정

#### [C-1] 인재 찾기 (`/discover`)
- 진행 중인 프로젝트 리스트 → 선택 시 해당 프로젝트 기준 추천 인재
- 보관함 요약(저장 배우 수, 최근 추가, 리스트 분류)
- 추천 배우 카드(사진/이름/배지/메타/보관 토글)
- **필요 기능:**
  - 프로젝트(공고) CRUD
  - 추천 알고리즘 (MVP: 공고 요건 ↔ 배우 태그 교집합 스코어)
  - 배우 보관함 저장/해제
  - 배지: 추천/신규/체크됨/검토중 상태 관리

#### [C-2] 배우 탐색 (`/talents`)
- 검색바(배우명/작품명/키워드)
- 필터 칩: 장르, 연령대, 지역, 성별
- 정렬: 최근순/추천순/보관순
- 카드형/리스트형 전환
- **필요 기능:**
  - 검색 인덱스 (MVP: Postgres full-text)
  - 다중 필터 쿼리, 무한 스크롤
  - 프로필 상세 모달/페이지
  - 보관함 다중 리스트 (브랜드별/드라마별)

#### [C-3] 공고 관리 (`/jobs`)
- 공고 목록 + 요약(지원자/체크/합격 카운트)
- **지원자 테이블:** 이름 / 지원 사유 / 진행 상태 / 최근 메시지 / 프로필 링크 / 액션
- 상태 배지: 검토중/합격/대기/보류
- 액션: 메시지(→ messages 딥링크), 체크, 일정 확인, 보류
- **필요 기능:**
  - 공고 CRUD, 상태(모집중/마감)
  - 지원자 상태 머신 (대기 → 검토중 → 합격/반려/보류)
  - 지원자별 내부 메모
  - 메시지 화면 딥링크 (지원자 컨텍스트 전달)
  - 오디션 일정 관리 (캘린더 연동 여부는 Phase 3)

#### [C-4] 프로필 관리 (`/profile`)
- 회사 프로필: 회사명, 담당자, 사업자 정보, 연락처, 진행 공고, 프로젝트 이력
- 포트폴리오 갤러리
- 계정 관리 바로가기 (메시지/설정/알림)
- **필요 기능:**
  - 회사 프로필 편집 폼
  - 이미지 업로드 (Supabase Storage)
  - 사업자등록번호 검증(선택)

---

### 4.3 배우 계정

#### [A-1] 둘러보기 (`/discover`)
- 내 프로필 기반 추천 오디션
- 지원 현황 요약 (지원 완료/검토중/메시지)
- 공고 카드(저장 토글)
- **필요 기능:** 역방향 추천(배우 태그 → 공고 매칭), 저장한 공고

#### [A-2] 오디션 탐색 (`/talents`)
- 검색(브랜드/장르/지역/키워드) + 필터 칩
- 정렬: **마감 임박순 기본**
- **필요 기능:** 공고 검색 인덱스, 마감일 기반 정렬, 저장

#### [A-3] 지원 관리 (`/jobs`)
- 내 지원 테이블: 공고명 / 지원 메모 / 상태 / 최근 메시지 / 상세
- 상태: 검토중/대기/미팅 제안 등
- **필요 기능:** 지원 내역 조회, 지원 취소(정책 결정 필요), 상태 변경 알림

#### [A-4] 프로필 (`/profile`)
- 기본 정보(이름/연령/지역/장르), 키/특기/활동 지역, 자기소개, 대표 경력
- 포트폴리오 관리 (광고 스틸/프로필 사진/출연 장면)
- 바로가기: 메시지/설정/포트폴리오 관리
- **필요 기능:**
  - 프로필 편집 폼(태그 기반)
  - 이미지/영상 업로드, 썸네일 생성
  - 공개 범위 설정 (settings와 연결)

---

### 4.4 공통 보조 화면

#### [S-1] 메시지 (`/messages`)
- 3분할 레이아웃: 채팅방 리스트 / 대화창 / (캐스팅 한정) 지원자 관리 사이드
- 채팅방 헤더: 상대 이름 + 상태 배지 + 연결 공고
- 말풍선 left/right, 입력창
- 캐스팅 사이드 패널: 지원자 상태 변경, 지원자 목록 딥링크
- **필요 기능:**
  - **Supabase Realtime** 으로 실시간 메시지
  - 읽음 처리, 미확인 카운트
  - 공고-지원자-채팅방 3자 연결 스키마
  - 첨부파일(포트폴리오·자료)
  - 상태 변경을 채팅에서 바로 수행

#### [S-2] 설정 (`/settings`)
- 계정 관리: 정보 수정 / 비밀번호 변경 / 알림 설정 / 로그아웃
- (배우) 포트폴리오 공개 범위
- 알림: 지원 결과 / 새 메시지 / (배우) 추천 공고 / (캐스팅) 마케팅
- **필요 기능:** 알림 토글 저장, 푸시/이메일 발송 채널, 탈퇴

---

## 5. 데이터 모델 초안

```
User (Supabase auth.users 연결)
 id, email, role[actor|casting], name, createdAt
 ├─ ActorProfile (userId, age, region, genres[], height, skills, bio, visibility)
 │   └─ PortfolioItem (actorId, type[image|video], url, caption)
 └─ CastingProfile (userId, companyName, bizNumber, contact, intro)

Job (id, castingId, title, description, requirements[], deadline, status, createdAt)
Application (id, jobId, actorId, memo, status[pending|reviewing|pass|hold|reject], createdAt)
Bookmark (userId, targetType[actor|job], targetId)  -- 양방향 보관함
ChatRoom (id, jobId, actorId, castingId, lastMessageAt)
Message (id, roomId, senderId, body, attachments[], readAt)
Notification (userId, type, payload, readAt)
```

### Supabase 활용 포인트
- **RLS(Row Level Security)** 로 권한 제어 → 백엔드 로직 최소화
  - 배우는 자기 application만 조회
  - 캐스팅은 자기 job의 application만 조회
- **Supabase Realtime** → 메시지 구현 (별도 Pusher/WS 불필요)
- **Storage 버킷 분리**: `avatars`, `portfolios`, `job-attachments` — 각각 정책 설정
- **DB 함수/트리거**: 지원자 상태 변경 시 알림 insert, 메시지 unread 카운트

---

## 6. 구현 우선순위

### Phase 1 (MVP, 필수)
1. 회원가입/로그인 + 역할 분기 (Google OAuth)
2. 온보딩 (역할 선택 + 기본 프로필)
3. 프로필(배우/회사) 등록 & 포트폴리오 업로드
4. 공고 등록 + 목록/검색
5. 지원 기능 + 지원자 테이블(상태 변경)
6. 1:1 메시지 (Supabase Realtime)

### Phase 2
7. 보관함(bookmark), 필터·정렬
8. 추천 로직(태그 매칭)
9. 알림(이메일/인앱)
10. 이메일/비밀번호 로그인 추가

### Phase 3
11. 읽음 처리 / 미확인 카운트 고도화
12. 오디션 일정 관리(캘린더 연동)
13. 포트폴리오 공개 범위·프라이버시
14. 관리자 어드민(신고/검수)
15. 결제/유료 플랜

---

## 7. 폴더 구조 제안

```
cast-in/
├── app/
│   ├── (public)/
│   │   ├── page.tsx              # 랜딩
│   │   └── login/page.tsx
│   ├── (onboarding)/
│   │   ├── role/page.tsx         # Google 로그인 후 역할 선택
│   │   └── profile/page.tsx      # 최초 프로필 입력
│   ├── (app)/
│   │   ├── discover/page.tsx
│   │   ├── talents/page.tsx
│   │   ├── jobs/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── messages/page.tsx
│   │   └── settings/page.tsx
│   └── api/                      # 복잡 로직만 (대부분 RLS로 처리)
├── components/
│   ├── ui/                       # shadcn 컴포넌트
│   └── features/
│       ├── jobs/
│       ├── talents/
│       └── messages/
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # 브라우저용
│   │   ├── server.ts             # 서버 컴포넌트용
│   │   └── middleware.ts         # 세션 갱신
│   └── swr/
└── types/
    └── database.ts               # supabase gen types 자동 생성
```

### 서버 vs 클라이언트 컴포넌트 원칙
- **서버 컴포넌트:** 초기 렌더 데이터 (프로필, 공고 상세 — SEO·LCP 중요)
- **SWR (클라이언트):** 자주 갱신 (메시지, 지원자 상태, 알림 카운트)

---

## 8. 초기 세팅 체크리스트

- [ ] Supabase 프로젝트 생성
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Google OAuth 클라이언트 등록 → Supabase Auth Provider 연결
- [ ] Vercel 프로젝트 연결 + env 등록
- [ ] `supabase` CLI로 migration 관리
- [ ] `supabase gen types typescript` 로 타입 자동 생성
- [ ] Next.js 15 + TS + Tailwind + shadcn `init`
- [ ] SWR 세팅
- [ ] GitHub 레포 + PR 템플릿

---

## 9. MVP 1주차 작업 순서

1. Next.js 15 + TS + Tailwind + shadcn 초기화, Vercel 연결
2. Supabase 프로젝트 + Google Auth + 미들웨어 세션
3. DB 스키마 마이그레이션 (User/Profile/Job/Application/Bookmark/Message)
4. RLS 정책 작성
5. 온보딩(역할 선택 + 기본 프로필)
6. 공고 등록 + 목록 (캐스팅)
7. 공고 검색 + 지원 (배우)
8. 지원자 테이블 + 상태 변경
9. 메시지 (Realtime)
10. Storage 업로드 (포트폴리오)

---

## 10. 기획 시 결정 필요한 포인트

- [ ] **이메일 로그인 포함 여부** — MVP는 Google 단일 권장, Phase 2로 이메일 추가
- [ ] **검색 엔진** — Postgres full-text로 시작, 규모 커지면 재검토
- [ ] **추천 알고리즘** — 규칙 기반(태그 교집합)부터. ML은 데이터 쌓인 후
- [ ] **지원 취소 정책** — 배우가 지원 후 철회 가능 여부
- [ ] **결제/유료 플랜** — 캐스팅 측 과금 모델 정의
- [ ] **신원 인증** — 배우 신원, 캐스팅 회사 사업자 인증 필요 여부
- [ ] **모바일 대응 범위** — 현재 와이어는 데스크톱, 반응형 수준 확정
- [ ] **v0.dev 활용 방식** — 와이어프레임 스크린샷 첨부해 스타일 일관성 유지

---

## 11. 참고

- 와이어프레임 원본: `~/Repos/cast-in-wireframe`
  - `index.html`, `app.js`, `styles.css` — 역할 분기 및 화면 구조 레퍼런스
- 브랜드 색상/톤: 와이어프레임 `styles.css` 참고
