import Link from "next/link";
import {
  ArrowDownRight,
  FileImage,
  SlidersHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { BookmarkButton } from "@/components/features/bookmark-button";
import { JobCard } from "@/components/features/job-card";
import { JobSearchPanel } from "@/components/features/job-search-panel";
import { PageContainer } from "@/components/page-container";
import { Pagination } from "@/components/features/pagination";
import { SearchFilterBar } from "@/components/features/search-filter-bar";
import {
  JOB_AGE_GROUP_OPTIONS,
  JOB_PLATFORM_OPTIONS,
  JOB_ROLE_TYPE_OPTIONS,
  JOB_TARGET_GENDER_OPTIONS,
} from "@/lib/job-filter-options";
import {
  countBookmarkedTargets,
  listBookmarkedTargetIds,
} from "@/lib/queries/bookmarks";
import type { ActorPreview } from "@/lib/queries/jobs";
import { searchActors, searchOpenJobs } from "@/lib/queries/jobs";
import { getViewerProfile } from "@/lib/queries/viewer";

const PAGE_SIZE = 12;
const JOB_PAGE_SIZE = 8;

function parsePage(raw: string | string[] | undefined) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value ?? "1");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

function asString(raw: string | string[] | undefined) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() ?? "";
}

function asGender(raw: string | string[] | undefined) {
  const value = asString(raw);
  return value === "male" || value === "female" ? value : "";
}

function asOption(raw: string | string[] | undefined, options: readonly string[]) {
  const value = asString(raw);
  return options.includes(value) ? value : "";
}

export default async function TalentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { activeRole } = await getViewerProfile();
  if (!activeRole) return null;

  const sp = await searchParams;
  const q = asString(sp.q);
  const region = asString(sp.region);
  const genre = asString(sp.genre);
  const gender = asGender(sp.gender);
  const roleType = asOption(sp.role, JOB_ROLE_TYPE_OPTIONS);
  const targetGender = asOption(
    sp.target_gender,
    JOB_TARGET_GENDER_OPTIONS.map((option) => option.value),
  );
  const targetAgeGroup = asOption(
    sp.age_group,
    JOB_AGE_GROUP_OPTIONS.map((option) => option.value),
  );
  const platform = asOption(sp.platform, JOB_PLATFORM_OPTIONS);
  const page = parsePage(sp.page);

  if (activeRole === "casting") {
    return (
      <CastingTalentsPage
        q={q}
        region={region}
        genre={genre}
        gender={gender}
        page={page}
      />
    );
  }

  const sort = asString(sp.sort) === "deadline" ? "deadline" : "latest";
  const status = asString(sp.status);
  const jobState = status === "closed" || status === "all" ? status : "active";
  return (
    <ActorTalentsPage
      q={q}
      region={region}
      genre={genre}
      roleType={roleType}
      targetGender={targetGender}
      targetAgeGroup={targetAgeGroup}
      platform={platform}
      sort={sort}
      jobState={jobState}
      page={page}
    />
  );
}

async function CastingTalentsPage({
  q,
  region,
  genre,
  gender,
  page,
}: {
  q: string;
  region: string;
  genre: string;
  gender: "" | "male" | "female";
  page: number;
}) {
  const hasFilters = Boolean(q || region || genre || gender);
  const { items, total } = await searchActors({
    q,
    region,
    genre,
    gender: gender || undefined,
    page,
    pageSize: PAGE_SIZE,
  });
  const bookmarkedIds = await listBookmarkedTargetIds(
    "actor",
    items.map((actor) => actor.id),
  );
  const redirectTo = buildTalentsPath({ q, region, genre, gender, page });

  return (
    <PageContainer pageTitle="배우 탐색">
      <SearchFilterBar
        action="/talents"
        searchField={{
          name: "q",
          label: "이름 검색",
          placeholder: "이름으로 검색",
          defaultValue: q,
        }}
        filters={[
          {
            name: "region",
            label: "활동 지역",
            placeholder: "지역 (예: 서울)",
            defaultValue: region,
          },
          {
            name: "genre",
            label: "장르",
            placeholder: "장르 (예: 드라마)",
            defaultValue: genre,
          },
        ]}
        extras={
          <div>
            <label htmlFor="talents-gender" className="sr-only">
              성별
            </label>
            <Select id="talents-gender" name="gender" defaultValue={gender}>
              <option value="">성별 전체</option>
              <option value="female">여성</option>
              <option value="male">남성</option>
            </Select>
          </div>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title={
            hasFilters
              ? "조건에 맞는 배우가 없어요"
              : "아직 탐색할 배우가 없어요"
          }
          description={hasFilters ? "검색어나 필터를 바꿔보세요." : undefined}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((actor) => (
            <ActorTalentCard
              key={actor.id}
              actor={actor}
              bookmarked={bookmarkedIds.has(actor.id)}
              redirectTo={redirectTo}
            />
          ))}
        </div>
      )}

      <Pagination
        basePath="/talents"
        params={{ q, region, genre, gender }}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
      />
    </PageContainer>
  );
}

function ActorTalentCard({
  actor,
  bookmarked,
  redirectTo,
}: {
  actor: ActorPreview;
  bookmarked: boolean;
  redirectTo: string;
}) {
  const actorHref = `/talents/${actor.id}`;
  const actorMeta = getActorCardMeta(actor);

  return (
    <Card className="h-full gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
      <div className="relative isolate">
        <Link
          href={actorHref}
          className="group block aspect-[4/5] bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ActorPortraitPreview name={actor.name} avatarUrl={actor.avatar_url} />
          <Badge
            color="secondary"
            variant="soft-outline"
            className="absolute left-3 top-3"
          >
            배우
          </Badge>
        </Link>
        <BookmarkButton
          targetType="actor"
          targetId={actor.id}
          bookmarked={bookmarked}
          redirectTo={redirectTo}
          compact
          className="absolute right-3 top-3 z-10 bg-background/85 backdrop-blur hover:bg-background"
        />
      </div>
      <CardContent className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={actorHref}
            className="min-w-0 flex-1 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <CardTitle className="truncate text-lg">{actor.name}</CardTitle>
          </Link>
          <div className="shrink-0 whitespace-nowrap pt-0.5 text-right text-sm text-muted-foreground">
            {actorMeta}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(actor.genres.length > 0 ? actor.genres : ["장르 준비 중"]).map((g) => (
            <Badge key={g} color="neutral" variant="outline">
              {g}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function getActorCardMeta(actor: ActorPreview) {
  const age = actor.age !== null ? `${actor.age}세` : "나이 미등록";
  return `${age} · ${getGenderLabel(actor.gender)}`;
}

function getGenderLabel(value: string | null) {
  if (value === "male") return "남성";
  if (value === "female") return "여성";
  return value?.trim() || "성별 미등록";
}

async function ActorTalentsPage({
  q,
  region,
  genre,
  roleType,
  targetGender,
  targetAgeGroup,
  platform,
  sort,
  jobState,
  page,
}: {
  q: string;
  region: string;
  genre: string;
  roleType: string;
  targetGender: string;
  targetAgeGroup: string;
  platform: string;
  sort: "deadline" | "latest";
  jobState: "active" | "closed" | "all";
  page: number;
}) {
  const { items, total } = await searchOpenJobs({
    q,
    region,
    genre,
    roleType,
    targetGender,
    targetAgeGroup,
    platform,
    sort,
    jobState,
    page,
    pageSize: JOB_PAGE_SIZE,
  });
  const [bookmarkedIds, savedJobCount] = await Promise.all([
    listBookmarkedTargetIds(
      "job",
      items.map((job) => job.id),
    ),
    countBookmarkedTargets("job").catch(() => 0),
  ]);
  const redirectTo = buildTalentsPath({
    q,
    region,
    genre,
    role: roleType,
    target_gender: targetGender,
    age_group: targetAgeGroup,
    platform,
    sort,
    status: jobState,
    page,
  });
  const hasFilters = Boolean(
    q ||
      region ||
      genre ||
      roleType ||
      targetGender ||
      targetAgeGroup ||
      platform ||
      jobState !== "active",
  );
  const recommendedJobs = items.slice(0, 5);

  return (
    <PageContainer size="wide" className="space-y-8">
      <ActorJobsHero savedJobCount={savedJobCount} />

      <JobSearchPanel
        action="/talents"
        resetHref="/talents"
        searchLabel="공고 검색"
        values={{
          q,
          region,
          genre,
          roleType,
          targetGender,
          targetAgeGroup,
          platform,
          sort,
          jobState,
        }}
      />

      {items.length === 0 ? (
        <EmptyState
          title={
            hasFilters
              ? "조건에 맞는 공고가 없어요"
              : "지금 볼 수 있는 공고가 없어요"
          }
          description={
            hasFilters
              ? "검색어를 줄이거나 필터를 바꿔보세요."
              : "새 공고가 올라오면 여기에서 볼 수 있어요."
          }
          action={
            hasFilters || sort !== "latest" ? (
              <Link
                href="/talents"
                className={buttonVariants({ color: "secondary", size: "sm" })}
              >
                필터 초기화
              </Link>
            ) : null
          }
        />
      ) : (
        <>
          {recommendedJobs.length > 0 ? (
            <section className="rounded-xl bg-primary-soft px-5 py-7 ring-1 ring-primary/10 md:px-8">
              <div className="mb-5">
                <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-normal text-primary">
                  <SlidersHorizontal aria-hidden="true" className="size-6" />
                  맞춤 공고
                </h2>
                <p className="mt-2 text-xs font-medium text-primary/80">
                  교환님의 프로필을 바탕으로 추천드려요
                </p>
              </div>
              <div className="-mx-5 flex gap-5 overflow-x-auto px-5 pb-2 md:-mx-8 md:px-8">
                {recommendedJobs.map((job) => (
                  <JobCard
                    key={`recommended-${job.id}`}
                    job={job}
                    bookmarked={bookmarkedIds.has(job.id)}
                    redirectTo={redirectTo}
                    compact
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <div className="mb-5 flex items-end gap-3">
              <h2 className="text-2xl font-extrabold tracking-normal">전체 공고</h2>
              <span className="text-2xl font-extrabold text-primary">
                {total.toLocaleString("ko-KR")}
              </span>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  bookmarked={bookmarkedIds.has(job.id)}
                  redirectTo={redirectTo}
                />
              ))}
            </div>
          </section>
        </>
      )}

      <Pagination
        basePath="/talents"
        params={{
          q,
          region,
          genre,
          role: roleType,
          target_gender: targetGender,
          age_group: targetAgeGroup,
          platform,
          sort,
          status: jobState,
        }}
        page={page}
        pageSize={JOB_PAGE_SIZE}
        total={total}
      />
    </PageContainer>
  );
}

function ActorJobsHero({ savedJobCount }: { savedJobCount: number }) {
  return (
    <section className="rounded-[28px] bg-[linear-gradient(110deg,#071832,#0f5f4b)] px-7 py-8 text-white shadow-[0_28px_70px_rgba(15,23,42,0.18)] md:px-9 md:py-9">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge
            color="primary"
            variant="soft-outline"
          >
            Casting Calls
          </Badge>
          <h1 className="mt-5 text-3xl font-extrabold tracking-normal md:text-4xl">
            공고 탐색
          </h1>
          <p className="mt-4 text-sm font-medium leading-7 text-secondary-foreground/75 md:text-base">
            원하는 공고를 탐색하고,
            <br />
            저장한 작품은 오른쪽 후보 패널에서 바로 관리하세요.
          </p>
        </div>

        <Link
          href="/bookmarks"
          className="group flex w-full max-w-[11rem] items-end justify-between rounded-[18px] border border-white/16 bg-white/10 px-5 py-4 text-left transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/40"
        >
          <span>
            <span className="block text-xs font-bold text-slate-300">
              저장한 공고 보러 가기
            </span>
            <span className="mt-2 block text-2xl font-bold">
              {savedJobCount.toLocaleString("ko-KR")}
            </span>
          </span>
          <ArrowDownRight
            aria-hidden="true"
            className="size-6 transition group-hover:translate-x-0.5 group-hover:translate-y-0.5"
          />
        </Link>
      </div>
    </section>
  );
}

function ActorPortraitPreview({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden bg-muted text-muted-foreground transition-transform duration-200 group-hover:scale-[1.02]">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={`${name} 프로필 사진`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <>
          <FileImage aria-hidden="true" className="size-12 stroke-[1.35]" />
          <span className="sr-only">{name} 프로필 사진 없음</span>
        </>
      )}
    </div>
  );
}

function buildTalentsPath(
  params: Record<string, string | number | undefined>,
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const normalized = String(value ?? "").trim();
    if (!normalized) continue;
    if (key === "page" && normalized === "1") continue;
    if (key === "status" && normalized === "active") continue;
    if (key === "sort" && normalized === "latest") continue;
    query.set(key, normalized);
  }
  const qs = query.toString();
  return qs ? `/talents?${qs}` : "/talents";
}
