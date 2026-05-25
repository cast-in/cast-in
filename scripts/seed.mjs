// 발표용 더미 데이터 시드 스크립트.
//
// 실행:
//   node --env-file=.env.local scripts/seed.mjs
//   node --env-file=.env.local scripts/seed.mjs --reset          # 기존 seed 유저 제거 후 재생성
//   node --env-file=.env.local scripts/seed.mjs --avatars-only   # 기존 seed 유저의 avatar_url만 갱신
//
// 필요: SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL in .env.local

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY 가 필요해요.");
  process.exit(1);
}

const SEED_EMAIL_PREFIX = "seed-";
const SEED_DOMAIN = "cast-in.dev";
const SEED_PASSWORD = "seedPass123!";

const args = new Set(process.argv.slice(2));
const RESET = args.has("--reset");
const AVATARS_ONLY = args.has("--avatars-only");

function actorAvatarUrl() {
  // 배우 기본 샘플 사진은 품질 편차가 커서 비워둔다.
  // 발표용 커스텀 배우 사진은 DB/Storage에 별도로 반영한다.
  return null;
}
function castingAvatarUrl() {
  // 회사명 이니셜보다 담당자 이름 fallback이 자연스러워서 기본 이미지는 비워둔다.
  return null;
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ───────────── 데이터 풀 ─────────────
const surnames = ["김","이","박","최","정","강","조","윤","장","임","한","오","신","서","배","홍","문","고","남","류","안","전","백","유","노","송","심","곽","구","도","손","우","염","현","공","탁","원","양","추","진","차","맹","표"];
const givenM = ["민재","준혁","도윤","서준","도현","지후","민준","재현","예준","건우","재호","도훈","시우","정우","지훈","태린","해린","하율","시호","정민","유건","재호","도영","수혁","민석","건호","태호","현우","승민","지완"];
const givenF = ["서연","유진","하늘","지아","예린","소희","유나","은비","채원","은서","하윤","수아","지원","가은","민서","하린","서윤","주아","다은","지연","예원","다경","예빈","시윤","다인","소민","지안","지우","해린","아린"];

const regions = ["서울","서울 · 강남","서울 · 마포","서울 · 성수","서울 · 용산","경기 · 고양","경기 · 성남","경기 · 수원","인천","부산","대구","광주","대전","제주","전국"];
const nationalities = ["Republic of Korea","United States","Japan","China","Canada"];
const allGenres = ["드라마","영화","광고","뮤지컬","예능","웹드라마","뮤직비디오","다큐멘터리","연극","숏폼","시트콤"];
const allSkills = ["보컬","댄스","승마","영어","일본어","중국어","펜싱","기타","피아노","발레","액션","방송 진행","MC","태권도","수영","서핑","스킨스쿠버","드럼","색소폰","바이올린","합기도","복싱"];
const allImageTags = ["시크함","소년미","청량함","따뜻함","도시적","강렬함","자연스러움","고급스러움","반전 매력","차분함","밝은 에너지","신뢰감"];
const jobRoleTypes = ["주연","조연","단역","엑스트라","더빙 / 내레이션"];
const jobTargetGenders = ["female","male"];
const jobTargetAgeGroups = ["10s","20s","30s","40s","50s_plus"];
const jobPlatforms = ["넷플릭스","디즈니+","티빙","웨이브","독립 영화"];
const jobFees = ["협의", "회차당 30만원", "회차당 50만원", "촬영 전체 120만원", "내부 규정에 따름"];
const jobSchedules = [
  "2026년 6월 중 2회차",
  "2026년 7월 ~ 8월",
  "오디션 후 일정 협의",
  "주말 포함 3회차 촬영",
  "프로덕션 일정에 따라 협의",
];
const jobMediaUrls = [
  "/job-posters/sample-1.png",
  "/job-posters/sample-2.png",
];

const creditTemplates = [
  { title: "영화 〈D.P〉", role: "조연" },
  { title: "OTT 드라마 〈서울 나이트〉", role: "단역" },
  { title: "웹드라마 〈하우스 오브 19〉", role: "주연" },
  { title: "뮤직비디오 〈오늘의 바다〉", role: "주연" },
  { title: "연극 〈가벼운 거짓말〉", role: "앙상블" },
  { title: "브랜드 필름 〈도시의 오후〉", role: "모델" },
];

const awardTemplates = [
  { title: "남우주연상", organization: "서울독립영화제" },
  { title: "여우주연상", organization: "단편영화제" },
  { title: "신인연기상", organization: "청춘영화상" },
  { title: "우수연기상", organization: "대학로 연극제" },
  { title: "베스트 퍼포먼스", organization: "웹콘텐츠 어워즈" },
];

const actorBios = [
  "감정의 결을 섬세하게 담아내는 배우입니다.",
  "액션과 코미디 양쪽 다 즐겁게 해요.",
  "매체 경험은 아직 적지만 무대에서 충분히 단련됐습니다.",
  "광고와 드라마를 오가며 꾸준히 활동 중입니다.",
  "낮은 톤과 특유의 눈빛이 강점이에요.",
  "또래 대비 성숙한 역할이 많이 들어와요.",
  "뮤지컬 앙상블 5년, 요즘은 매체 도전 중입니다.",
  "학생부터 20대 후반까지 폭넓게 소화할 수 있어요.",
  "스릴러·느와르 분위기가 잘 어울린다는 이야기를 자주 들어요.",
  "밝고 에너지 있는 캐릭터를 주로 맡아왔어요.",
  "단편·독립영화 중심으로 필모를 쌓고 있습니다.",
  "유튜브 콘텐츠 호스트 2년, 카메라 앞이 편해요.",
];

const actorSeeds = [
  { name: "박예원", gender: "female", height_cm: 167 },
  { name: "정하윤", gender: "female", height_cm: 157 },
  { name: "구도현", gender: "male", height_cm: 176 },
  { name: "임해린", gender: "female", height_cm: 164 },
  { name: "배서준", gender: "male", height_cm: 180 },
  { name: "도소민", gender: "female", height_cm: 174 },
  { name: "김하늘", gender: "female", height_cm: 170 },
  { name: "배채원", gender: "female", height_cm: 166 },
  { name: "김도현", gender: "male", height_cm: 178 },
  { name: "박민서", gender: "female", height_cm: 166 },
  { name: "안지원", gender: "female", height_cm: 164 },
  { name: "맹지연", gender: "female", height_cm: 169 },
  { name: "원수아", gender: "female", height_cm: 162 },
  { name: "정유진", gender: "female", height_cm: 168 },
  { name: "현주아", gender: "female", height_cm: 170 },
  { name: "문지후", gender: "male", height_cm: 177 },
  { name: "정민서", gender: "female", height_cm: 156 },
  { name: "현하늘", gender: "female", height_cm: 170 },
  { name: "송현우", gender: "male", height_cm: 178 },
  { name: "한아린", gender: "female", height_cm: 167 },
  { name: "임지훈", gender: "male", height_cm: 177 },
  { name: "배주아", gender: "female", height_cm: 158 },
  { name: "염은서", gender: "female", height_cm: 165 },
  { name: "홍태준", gender: "male", height_cm: 181 },
  { name: "홍유진", gender: "female", height_cm: 167 },
  { name: "곽건우", gender: "male", height_cm: 188 },
  { name: "문도윤", gender: "male", height_cm: 174 },
  { name: "양승민", gender: "male", height_cm: 179 },
  { name: "유시윤", gender: "female", height_cm: 168 },
  { name: "표예린", gender: "female", height_cm: 170 },
  { name: "현태호", gender: "male", height_cm: 178 },
  { name: "표시호", gender: "male", height_cm: 174 },
  { name: "송지후", gender: "male", height_cm: 176 },
  { name: "우하린", gender: "female", height_cm: 159 },
  { name: "배하늘", gender: "female", height_cm: 164 },
  { name: "백지연", gender: "female", height_cm: 159 },
  { name: "표준혁", gender: "male", height_cm: 177 },
  { name: "김도윤", gender: "male", height_cm: 179 },
  { name: "송태준", gender: "male", height_cm: 181 },
  { name: "홍다은", gender: "female", height_cm: 168 },
  { name: "이도훈", gender: "male", height_cm: 176 },
  { name: "맹재호", gender: "male", height_cm: 188 },
  { name: "문은서", gender: "female", height_cm: 168 },
  { name: "이지완", gender: "male", height_cm: 174 },
  { name: "전예빈", gender: "female", height_cm: 162 },
  { name: "우다인", gender: "female", height_cm: 167 },
  { name: "노예원", gender: "female", height_cm: 166 },
  { name: "차정우", gender: "male", height_cm: 183 },
  { name: "남지아", gender: "female", height_cm: 167 },
  { name: "손재호", gender: "male", height_cm: 178 },
  { name: "정민석", gender: "male", height_cm: 172 },
  { name: "문시우", gender: "male", height_cm: 178 },
  { name: "조주아", gender: "female", height_cm: 159 },
  { name: "신예빈", gender: "female", height_cm: 157 },
  { name: "안하린", gender: "female", height_cm: 155 },
  { name: "배가은", gender: "female", height_cm: 166 },
  { name: "손시우", gender: "male", height_cm: 176 },
  { name: "안은비", gender: "female", height_cm: 170 },
  { name: "차도영", gender: "male", height_cm: 175 },
  { name: "안서윤", gender: "female", height_cm: 167 },
];

const castingIntros = [
  "OTT 드라마와 극장 영화를 중심으로 캐스팅을 진행하고 있어요.",
  "신인 발굴에 진심인 캐스팅 팀입니다. 첫 오디션 환영.",
  "광고·브랜드 필름 캐스팅 전문. 글로벌 브랜드 다수 진행.",
  "웹드라마 중심, 숏폼·세로형 콘텐츠도 함께 다룹니다.",
  "뮤지컬·연극 중심 캐스팅. 매체 콜라보도 늘려가는 중.",
  "한류 콘텐츠 수출을 염두에 둔 기획 캐스팅이 많아요.",
  "넷플릭스·티빙 등 OTT 오리지널 중심으로 일합니다.",
  "CF·프로모션 영상 중심. 빠른 진행이 필요한 촬영이 많아요.",
];

const castingCompanies = [
  { name: "스튜디오드래곤캐스팅", contactLead: "김다은" },
  { name: "넥서스 캐스팅", contactLead: "이유미" },
  { name: "아우라 엔터테인먼트", contactLead: "박주원" },
  { name: "에이프릴 픽쳐스", contactLead: "최도현" },
  { name: "캐스트인 스튜디오", contactLead: "정하늘" },
  { name: "리얼타임 크리에이티브", contactLead: "강서연" },
  { name: "블루프린트 미디어", contactLead: "조지호" },
  { name: "세븐엑스 캐스팅", contactLead: "윤세아" },
  { name: "플레이그라운드 엔터", contactLead: "장민재" },
  { name: "어센틱 픽쳐스", contactLead: "임예린" },
  { name: "메이드 미디어", contactLead: "한도윤" },
  { name: "카니발 캐스팅", contactLead: "오채원" },
  { name: "라이브 프로덕션", contactLead: "신유나" },
  { name: "네이처 엔터", contactLead: "서재현" },
  { name: "시그널 스튜디오", contactLead: "배은서" },
];

const jobTemplates = [
  { title: "단편영화 〈{name}의 여름〉 남주 오디션", genre: "영화", description: "러닝타임 25분 내외 단편. 20대 중반 주연, 감정 연기 비중 큼. 촬영 5일 예정." },
  { title: "OTT 드라마 〈서울 나이트〉 조연 캐스팅", genre: "드라마", description: "글로벌 OTT 오리지널 드라마 시즌1. 조연 3명 공개모집. 연기 경력 1년 이상 우대." },
  { title: "웹드라마 〈하우스 오브 19〉 신인 주연", genre: "웹드라마", description: "10대 후반~20대 초반 주연. 뉴미디어 경험 환영, 매체 경력 필수 아님." },
  { title: "자동차 브랜드 런칭 CF 모델", genre: "광고", description: "30대 초·중반 남녀 각 1명. 해외 촬영 가능자 우대. 모델료 별도 협의." },
  { title: "뮤지컬 〈그림자의 방〉 앙상블 8명", genre: "뮤지컬", description: "전 회차 출연 가능자. 보컬·댄스 필수. 3개월 공연 일정." },
  { title: "시니컬 코미디 광고 모델 2명", genre: "광고", description: "20대 후반 코믹 연기 가능자. 2박 3일 촬영." },
  { title: "패션 브랜드 SS 비주얼 캠페인", genre: "광고", description: "스틸 · 영상 동시 촬영. 런웨이 경험 있으면 우대." },
  { title: "유튜브 오리지널 예능 고정 패널", genre: "예능", description: "매주 1회 녹화, 에너제틱한 리액션 환영. 6개월 시즌 계약." },
  { title: "스릴러 독립영화 〈밤의 둘레〉 조연", genre: "영화", description: "저예산 독립영화. 대사 비중 크지 않지만 분위기 연기 중요." },
  { title: "SBS 드라마 〈청춘 이력서〉 단역 10명", genre: "드라마", description: "회당 1~2씬. 대학생·직장인 단역. 연기 경력 무관." },
  { title: "브랜드 다큐 〈사람의 자리〉 내레이션", genre: "다큐멘터리", description: "낮고 차분한 보이스. 스튜디오 녹음 하루." },
  { title: "음악 뮤비 〈오늘의 바다〉 여주인공", genre: "뮤직비디오", description: "인디 밴드 신곡 뮤비. 20대 여배우, 자연스러운 연기." },
  { title: "세로형 숏폼 시리즈 〈19:00 퇴근〉 주연", genre: "숏폼", description: "1분 내외 에피소드 10편. 생활 연기 중심." },
  { title: "대학로 연극 〈가벼운 거짓말〉 앙상블", genre: "연극", description: "3개월 장기 공연. 주 5회 공연 가능자." },
  { title: "시트콤 〈우리 집에 왜 왔니〉 고정 역할", genre: "시트콤", description: "가족 시트콤 고정 캐릭터. 밝은 에너지 선호." },
  { title: "글로벌 뷰티 브랜드 바이럴 영상", genre: "광고", description: "SNS 바이럴용 15~30초 영상 5편. 2030 여성." },
  { title: "OTT 스릴러 〈침묵의 밤〉 주연급 조연", genre: "드라마", description: "시즌1 전체 출연. 중요 조연 1명 오디션." },
  { title: "공익 캠페인 영상 내레이터", genre: "광고", description: "따뜻한 톤의 보이스. 스크립트 30초." },
  { title: "게임 실사 광고 액션 스턴트", genre: "광고", description: "액션 경력 필수. 와이어 경험 우대." },
  { title: "드라마 〈서울 바캉스〉 학생 단역 다수", genre: "드라마", description: "10대 후반, 교복 신 위주. 방학 기간 촬영." },
];

const castingMemoTemplates = [
  "캐스팅 회의에서 인상적이었던 후보.",
  "톤이 작품과 잘 맞음. 2차 미팅 제안 예정.",
  "프로필만 보고는 애매. 직접 만나봐야 할 듯.",
  "레퍼런스 영상 더 요청하기.",
  "밝은 톤 좋음. 다른 작품 후보로도 담기.",
  null,
  null,
];

const applicantMemos = [
  "연락 주시면 편한 시간에 맞춰 오디션 참여 가능합니다.",
  "제 스페셜은 액션과 무술입니다. 스턴트 경험 있어요.",
  "드라마·광고 활동 이력 첨부드렸습니다.",
  "자기소개 영상 보내드릴 수 있어요.",
  "작품 방향성에 관심이 많습니다. 꼭 함께하고 싶어요.",
  null,
];

const messageTemplates = [
  "안녕하세요, 지원서 잘 받았습니다.",
  "오디션 일정 조율해볼 수 있을까요?",
  "네, 가능한 시간대 공유드릴게요.",
  "프로필 영상 링크 한 번 더 공유 가능할까요?",
  "다음 주 수요일 오후 2시 어떠세요?",
  "좋습니다, 장소는 어디인가요?",
  "강남 캐스팅 룸입니다. 자세한 안내는 메일로 드릴게요.",
  "감사합니다. 준비해서 찾아뵙겠습니다.",
  "참고로 대본 샘플 미리 공유드릴게요.",
  "잘 받았습니다. 열심히 준비할게요.",
];

// ───────────── 유틸 ─────────────
let rng = 0x1a2b3c4d;
function random() {
  rng = (rng * 1664525 + 1013904223) >>> 0;
  return rng / 0x100000000;
}
function pick(arr) {
  return arr[Math.floor(random() * arr.length)];
}
function pickMany(arr, min, max) {
  const count = min + Math.floor(random() * (max - min + 1));
  const pool = [...arr];
  const out = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}
function koreanName(preferGender) {
  const given = preferGender === "male" ? givenM : preferGender === "female" ? givenF : random() < 0.5 ? givenM : givenF;
  return pick(surnames) + pick(given);
}
function randomBirthDate() {
  const year = 1985 + Math.floor(random() * 25); // 1985~2009 (15~40세)
  const month = 1 + Math.floor(random() * 12);
  const day = 1 + Math.floor(random() * 27);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function randomHeightCm(gender) {
  if (gender === "male") return 168 + Math.floor(random() * 21);
  if (gender === "female") return 155 + Math.floor(random() * 21);
  return 155 + Math.floor(random() * 34);
}
function randomWeightKg(gender) {
  if (gender === "male") return 58 + Math.floor(random() * 25);
  if (gender === "female") return 44 + Math.floor(random() * 18);
  return 45 + Math.floor(random() * 30);
}
function randomFutureOrPastISO() {
  // 80%는 앞으로 1~60일, 20%는 지난 1~30일(마감된 공고)
  const offsetDays = random() < 0.8 ? 1 + Math.floor(random() * 60) : -(1 + Math.floor(random() * 30));
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(23, 59, 0, 0);
  return { iso: d.toISOString(), isPast: offsetDays < 0 };
}
function inferJobRoleType(text) {
  if (text.includes("주연")) return "주연";
  if (text.includes("조연")) return "조연";
  if (text.includes("단역")) return "단역";
  if (text.includes("엑스트라")) return "엑스트라";
  if (text.includes("내레이션") || text.includes("내레이터")) return "더빙 / 내레이션";
  return pick(jobRoleTypes);
}
function inferJobTargetGenders(text) {
  if (text.includes("여주") || text.includes("여배우") || text.includes("여성")) {
    return ["female"];
  }
  if (text.includes("남주") || text.includes("남자") || text.includes("남성")) {
    return ["male"];
  }
  return pickMany(jobTargetGenders, 1, 2);
}
function inferJobTargetAgeGroups(text) {
  const groups = [];
  if (text.includes("10대")) groups.push("10s");
  if (text.includes("20대") || text.includes("2030")) groups.push("20s");
  if (text.includes("30대") || text.includes("2030")) groups.push("30s");
  if (text.includes("40대")) groups.push("40s");
  if (text.includes("50대")) groups.push("50s_plus");
  return groups.length > 0 ? groups : pickMany(jobTargetAgeGroups, 1, 2);
}
function inferJobPlatforms(text, genre) {
  if (text.includes("넷플릭스")) return ["넷플릭스"];
  if (text.includes("디즈니")) return ["디즈니+"];
  if (text.includes("티빙")) return ["티빙"];
  if (text.includes("웨이브")) return ["웨이브"];
  if (genre === "영화" || text.includes("독립영화")) return ["독립 영화"];
  return [pick(jobPlatforms)];
}
function seedEmail(role, i) {
  return `${SEED_EMAIL_PREFIX}${role}-${String(i).padStart(2, "0")}@${SEED_DOMAIN}`;
}

// ───────────── reset ─────────────
async function deleteSeedUsers() {
  let page = 1;
  let deleted = 0;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error("listUsers 실패: " + error.message);
    const seedUsers = data.users.filter((u) => (u.email ?? "").startsWith(SEED_EMAIL_PREFIX));
    for (const u of seedUsers) {
      const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
      if (delErr) console.warn(`⚠ 유저 삭제 실패(${u.email}):`, delErr.message);
      else deleted += 1;
    }
    if (data.users.length < 200) break;
    page += 1;
  }
  console.log(`🧹 기존 seed 유저 ${deleted}명 제거 완료 (profiles / applications / jobs / ... 는 cascade 로 정리됨)`);
}

// ───────────── 유저 생성 ─────────────
async function createUser(email, name, role) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: SEED_PASSWORD,
    email_confirm: true,
    user_metadata: { name, role, seed: true },
  });
  if (error) throw new Error(`auth.createUser(${email}) 실패: ${error.message}`);
  return data.user.id;
}

async function upsertProfile({ id, role, name, email, avatar_url }) {
  const { error } = await supabase
    .from("profiles")
    .upsert({ id, role, name, email, avatar_url });
  if (error) throw new Error(`profiles upsert(${email}) 실패: ${error.message}`);
}

async function insertActorProfile(userId, opts) {
  const { error } = await supabase.from("actor_profiles").insert({
    user_id: userId,
    birth_date: opts.birth_date,
    gender: opts.gender,
    region: opts.region,
    height_cm: opts.height_cm,
    weight_kg: opts.weight_kg,
    nationalities: opts.nationalities,
    affiliation: opts.affiliation,
    genres: opts.genres,
    skills: opts.skills,
    image_tags: opts.image_tags,
    bio: opts.bio,
    visibility: "public",
  });
  if (error) throw new Error(`actor_profiles insert 실패: ${error.message}`);
}

async function insertActorShowcase(actorId) {
  const creditCount = 2 + Math.floor(random() * 3);
  const creditRows = pickMany(creditTemplates, creditCount, creditCount).map((item, index) => ({
    actor_id: actorId,
    year: 2021 + Math.floor(random() * 5),
    title: item.title,
    role: item.role,
    sort_order: index,
  }));

  const { error: creditError } = await supabase.from("actor_credits").insert(creditRows);
  if (creditError) throw new Error(`actor_credits insert 실패: ${creditError.message}`);

  if (random() > 0.55) return;

  const awardCount = 1 + Math.floor(random() * 2);
  const awardRows = pickMany(awardTemplates, awardCount, awardCount).map((item, index) => ({
    actor_id: actorId,
    year: 2021 + Math.floor(random() * 5),
    title: item.title,
    organization: item.organization,
    sort_order: index,
  }));

  const { error: awardError } = await supabase.from("actor_awards").insert(awardRows);
  if (awardError) throw new Error(`actor_awards insert 실패: ${awardError.message}`);
}

async function insertCastingProfile(userId, opts) {
  const { error } = await supabase.from("casting_profiles").insert({
    user_id: userId,
    company_name: opts.company_name,
    contact: opts.contact,
    intro: opts.intro,
  });
  if (error) throw new Error(`casting_profiles insert 실패: ${error.message}`);
}

// ───────────── 아바타만 패치 ─────────────
async function patchAvatarsOnly() {
  let page = 1;
  let updated = 0;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error("listUsers 실패: " + error.message);
    const seedUsers = data.users.filter((u) => (u.email ?? "").startsWith(SEED_EMAIL_PREFIX));

    for (const u of seedUsers) {
      const email = u.email;
      const role = u.user_metadata?.role;
      let avatar_url = null;
      if (role === "actor") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", u.id)
          .maybeSingle();
        if (profile?.avatar_url && !profile.avatar_url.includes("pravatar.cc")) continue;
        avatar_url = actorAvatarUrl(email);
      } else if (role === "casting") {
        avatar_url = castingAvatarUrl();
      } else {
        continue;
      }
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ avatar_url })
        .eq("id", u.id);
      if (upErr) console.warn(`⚠ avatar update 실패(${email}):`, upErr.message);
      else updated += 1;
    }

    if (data.users.length < 200) break;
    page += 1;
  }
  console.log(`🖼  아바타 업데이트 완료: ${updated}명`);
}

// ───────────── 메인 ─────────────
async function main() {
  console.log(`🚀 Supabase: ${SUPABASE_URL}`);
  if (AVATARS_ONLY) {
    await patchAvatarsOnly();
    return;
  }
  if (RESET) await deleteSeedUsers();

  // 1. 캐스팅 유저
  console.log(`\n👔 캐스팅 ${castingCompanies.length}명 생성...`);
  const castings = [];
  for (let i = 0; i < castingCompanies.length; i++) {
    const { name: company, contactLead } = castingCompanies[i];
    const email = seedEmail("casting", i + 1);
    const id = await createUser(email, contactLead, "casting");
    await upsertProfile({ id, role: "casting", name: contactLead, email, avatar_url: castingAvatarUrl(company) });
    await insertCastingProfile(id, {
      company_name: company,
      contact: `010-${1000 + Math.floor(random() * 8999)}-${1000 + Math.floor(random() * 8999)}`,
      intro: pick(castingIntros),
    });
    castings.push({ id, name: contactLead, company });
    process.stdout.write(".");
  }
  console.log(` ✓`);

  // 2. 배우 유저
  const ACTOR_COUNT = 60;
  console.log(`\n🎭 배우 ${ACTOR_COUNT}명 생성...`);
  const actors = [];
  const usedNames = new Set();
  for (let i = 0; i < ACTOR_COUNT; i++) {
    const actorSeed = actorSeeds[i];
    const gender = actorSeed?.gender ?? (random() < 0.5 ? "male" : "female");
    let name = actorSeed?.name ?? koreanName(gender);
    if (!actorSeed) {
      let tries = 0;
      while (usedNames.has(name) && tries < 10) {
        name = koreanName(gender);
        tries++;
      }
    }
    usedNames.add(name);

    const email = seedEmail("actor", i + 1);
    const id = await createUser(email, name, "actor");
    await upsertProfile({ id, role: "actor", name, email, avatar_url: actorAvatarUrl(email) });
    await insertActorProfile(id, {
      birth_date: randomBirthDate(),
      gender,
      region: pick(regions),
      height_cm: actorSeed?.height_cm ?? randomHeightCm(gender),
      weight_kg: actorSeed?.weight_kg ?? randomWeightKg(gender),
      nationalities: random() < 0.92 ? ["Republic of Korea"] : pickMany(nationalities, 1, 2),
      affiliation: random() < 0.72 ? "프리랜서" : pick(["에이전시 소속", "소속사 협의 중"]),
      genres: pickMany(allGenres, 1, 4),
      skills: pickMany(allSkills, 1, 5),
      image_tags: pickMany(allImageTags, 1, 3),
      bio: pick(actorBios),
    });
    await insertActorShowcase(id);
    actors.push({ id, name, email });
    process.stdout.write(".");
  }
  console.log(` ✓`);

  // 3. 공고 생성 (캐스팅당 1~4개, 총 ~40)
  console.log(`\n📢 공고 생성...`);
  const jobs = [];
  const statuses = ["open", "open", "open", "open", "closed", "draft"]; // 가중치
  for (const c of castings) {
    const count = 1 + Math.floor(random() * 4);
    for (let k = 0; k < count; k++) {
      const tpl = pick(jobTemplates);
      const title = tpl.title.replace("{name}", pick(["여름","겨울","봄","이방인","낯선 이"]));
      const jobText = `${title} ${tpl.description}`;
      const { iso: deadline, isPast } = randomFutureOrPastISO();
      const rawStatus = pick(statuses);
      const status = isPast && rawStatus === "open" ? "closed" : rawStatus;

      const { data, error } = await supabase
        .from("jobs")
        .insert({
          casting_id: c.id,
          title,
          description: tpl.description,
          fee_text: pick(jobFees),
          genre: tpl.genre,
          media_urls: jobMediaUrls,
          region: pick(regions),
          deadline,
          requirements: pickMany(["연기 경력", "보컬", "영어", "승마", "운전 면허", "해외 촬영 가능"], 0, 3),
          role_type: inferJobRoleType(jobText),
          shooting_schedule: pick(jobSchedules),
          target_genders: inferJobTargetGenders(jobText),
          target_age_groups: inferJobTargetAgeGroups(jobText),
          platforms: inferJobPlatforms(jobText, tpl.genre),
          status,
        })
        .select("id, status, deadline")
        .single();
      if (error) throw new Error(`jobs insert 실패: ${error.message}`);
      jobs.push({ id: data.id, casting_id: c.id, status: data.status, deadline: data.deadline, title });
    }
    process.stdout.write(".");
  }
  console.log(` ✓ (${jobs.length}개)`);

  // 4. 지원 + 채팅방 + 메시지
  console.log(`\n📝 지원 + 채팅방 + 메시지 생성...`);
  const appStatuses = ["pending", "pending", "reviewing", "reviewing", "pass", "hold", "reject"];
  let appCount = 0;
  let msgCount = 0;
  for (const job of jobs) {
    if (job.status === "draft") continue;
    const applicants = pickMany(actors, 2, 8);
    for (const actor of applicants) {
      const status = pick(appStatuses);
      const memo = pick(applicantMemos);
      const castingMemo = status !== "pending" ? pick(castingMemoTemplates) : null;

      const { error: appErr } = await supabase.from("applications").insert({
        job_id: job.id,
        actor_id: actor.id,
        memo,
        casting_memo: castingMemo,
        status,
      });
      if (appErr) {
        if (!appErr.message.includes("duplicate")) {
          console.warn("⚠ application 실패:", appErr.message);
        }
        continue;
      }
      appCount += 1;

      // 채팅방
      const { data: room, error: roomErr } = await supabase
        .from("chat_rooms")
        .upsert(
          { job_id: job.id, actor_id: actor.id, casting_id: job.casting_id },
          { onConflict: "job_id,actor_id,casting_id" },
        )
        .select("id")
        .single();
      if (roomErr) {
        console.warn("⚠ chat_room 실패:", roomErr.message);
        continue;
      }

      // 메시지: 지원 메모 먼저 → 랜덤하게 2~5 턴
      const turns = 2 + Math.floor(random() * 4);
      const participants = [actor.id, job.casting_id];
      let cursor = Date.now() - (turns + 1) * 1000 * 60 * 60;

      if (memo) {
        cursor += 1000 * 60 * 5;
        const { error: mErr } = await supabase.from("messages").insert({
          room_id: room.id,
          sender_id: actor.id,
          body: memo,
          created_at: new Date(cursor).toISOString(),
        });
        if (!mErr) msgCount += 1;
      }

      for (let t = 0; t < turns; t++) {
        cursor += 1000 * 60 * (10 + Math.floor(random() * 120));
        const sender = participants[t % 2 === 0 ? 1 : 0];
        const body = pick(messageTemplates);
        const { error: mErr } = await supabase.from("messages").insert({
          room_id: room.id,
          sender_id: sender,
          body,
          created_at: new Date(cursor).toISOString(),
        });
        if (!mErr) msgCount += 1;
      }
    }
    process.stdout.write(".");
  }
  console.log(` ✓ (지원 ${appCount}, 메시지 ${msgCount})`);

  // 5. 북마크
  console.log(`\n🔖 북마크 생성...`);
  let bookmarkCount = 0;
  // 캐스팅 → 배우 북마크
  for (const c of castings) {
    const targets = pickMany(actors, 2, 6);
    for (const t of targets) {
      const { error } = await supabase.from("bookmarks").insert({
        user_id: c.id,
        target_type: "actor",
        target_id: t.id,
        list_name: "기본",
      });
      if (!error) bookmarkCount += 1;
    }
  }
  // 배우 → 공고 북마크
  const activeJobs = jobs.filter((j) => j.status === "open");
  for (const a of actors) {
    if (random() > 0.5) continue;
    const targets = pickMany(activeJobs, 1, 4);
    for (const t of targets) {
      const { error } = await supabase.from("bookmarks").insert({
        user_id: a.id,
        target_type: "job",
        target_id: t.id,
        list_name: "기본",
      });
      if (!error) bookmarkCount += 1;
    }
  }
  console.log(`✓ (${bookmarkCount}개)`);

  console.log(`\n✅ 완료.
  - 캐스팅 ${castings.length}명
  - 배우 ${actors.length}명
  - 공고 ${jobs.length}개
  - 지원 ${appCount}건
  - 메시지 ${msgCount}개
  - 북마크 ${bookmarkCount}개

💡 로그인 계정 예시:
  casting: ${castings[0] ? seedEmail("casting", 1) : "-"} / ${SEED_PASSWORD}
  actor:   ${actors[0] ? seedEmail("actor", 1) : "-"} / ${SEED_PASSWORD}`);
}

main().catch((e) => {
  console.error("\n❌ 실패:", e);
  process.exit(1);
});
