import Link from "next/link";
import {
  ArrowDownRight,
  SlidersHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ActorCard } from "@/components/features/actor-card";
import { ActorSearchPanel } from "@/components/features/actor-search-panel";
import { JobCard } from "@/components/features/job-card";
import { JobSearchPanel } from "@/components/features/job-search-panel";
import { PageContainer } from "@/components/page-container";
import { Pagination } from "@/components/features/pagination";
import {
  ACTOR_HEIGHT_RANGE_OPTIONS,
  ACTOR_NATIONALITY_OPTIONS,
} from "@/lib/actor-filter-options";
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
import { searchCastingActors, searchOpenJobs } from "@/lib/queries/jobs";
import { getViewerProfile } from "@/lib/queries/viewer";

const PAGE_SIZE = 12;
const JOB_PAGE_SIZE = 12;

function parsePage(raw: string | string[] | undefined) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value ?? "1");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

function asString(raw: string | string[] | undefined) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() ?? "";
}

function asStrings(raw: string | string[] | undefined) {
  const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return uniqueNonEmpty(values);
}

function asGenderOptions(raw: string | string[] | undefined) {
  return asOptions(raw, ["male", "female"]);
}

function asOptions(raw: string | string[] | undefined, options: readonly string[]) {
  return uniqueNonEmpty(Array.isArray(raw) ? raw : raw ? [raw] : []).filter((value) =>
    options.includes(value),
  );
}

function uniqueNonEmpty(values: readonly string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
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
  const region = asStrings(sp.region);
  const genre = asStrings(sp.genre);
  const gender = asGenderOptions(sp.gender);
  const skill = asStrings(sp.skill);
  const actorAgeGroup = asOptions(
    sp.age_group,
    JOB_AGE_GROUP_OPTIONS.map((option) => option.value),
  );
  const heightRange = asOptions(
    sp.height,
    ACTOR_HEIGHT_RANGE_OPTIONS.map((option) => option.value),
  );
  const nationality = asOptions(sp.nationality, ACTOR_NATIONALITY_OPTIONS);
  const roleType = asOptions(sp.role, JOB_ROLE_TYPE_OPTIONS);
  const targetGender = asOptions(
    sp.target_gender,
    JOB_TARGET_GENDER_OPTIONS.map((option) => option.value),
  );
  const targetAgeGroup = asOptions(
    sp.age_group,
    JOB_AGE_GROUP_OPTIONS.map((option) => option.value),
  );
  const platform = asOptions(sp.platform, JOB_PLATFORM_OPTIONS);
  const page = parsePage(sp.page);

  if (activeRole === "casting") {
    const rawActorSort = asString(sp.sort);
    const actorSort =
      rawActorSort === "name" || rawActorSort === "latest"
        ? rawActorSort
        : "recommended";
    return (
      <CastingTalentsPage
        ageGroup={actorAgeGroup}
        q={q}
        region={region}
        genre={genre}
        gender={gender}
        heightRange={heightRange}
        nationality={nationality}
        page={page}
        skill={skill}
        sort={actorSort}
      />
    );
  }

  const rawJobSort = asString(sp.sort);
  const sort =
    rawJobSort === "deadline" || rawJobSort === "latest"
      ? rawJobSort
      : "recommended";
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
  ageGroup,
  q,
  region,
  genre,
  gender,
  heightRange,
  nationality,
  page,
  skill,
  sort,
}: {
  ageGroup: string[];
  q: string;
  region: string[];
  genre: string[];
  gender: string[];
  heightRange: string[];
  nationality: string[];
  page: number;
  skill: string[];
  sort: "recommended" | "latest" | "name";
}) {
  const hasFilters = Boolean(
    q ||
      region.length ||
      genre.length ||
      gender.length ||
      ageGroup.length ||
      heightRange.length ||
      nationality.length ||
      skill.length,
  );
  const { items, total } = await searchCastingActors({
    ageGroup,
    q,
    region,
    genre,
    gender,
    heightRange,
    nationality,
    skill,
    sort,
    page,
    pageSize: PAGE_SIZE,
  });
  const [bookmarkedIds, savedActorCount] = await Promise.all([
    listBookmarkedTargetIds(
      "actor",
      items.map((actor) => actor.id),
    ),
    countBookmarkedTargets("actor").catch(() => 0),
  ]);
  return (
    <PageContainer size="wide" className="space-y-8">
      <CastingActorsHero savedActorCount={savedActorCount} />

      <ActorSearchPanel
        action="/talents"
        resetHref="/talents"
        searchLabel="배우 검색"
        values={{
          ageGroup,
          gender,
          genre,
          heightRange,
          nationality,
          q,
          region,
          skill,
          sort,
        }}
      />

      <section>
        <div className="mb-5 flex items-end gap-3">
          <h2 className="text-2xl font-extrabold tracking-normal">
            {sort === "recommended" ? "추천 배우" : "전체 배우"}
          </h2>
          <span className="text-2xl font-extrabold text-primary">
            {total.toLocaleString("ko-KR")}
          </span>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title={
              hasFilters
                ? "조건에 맞는 배우가 없어요"
                : "아직 탐색할 배우가 없어요"
            }
            description={hasFilters ? "검색어나 필터를 바꿔보세요." : undefined}
            action={
              hasFilters ? (
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
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((actor) => (
              <ActorCard
                key={actor.id}
                actor={actor}
                bookmarked={bookmarkedIds.has(actor.id)}
              />
            ))}
          </div>
        )}
      </section>

      <Pagination
        basePath="/talents"
        params={{
          age_group: ageGroup,
          q,
          region,
          genre,
          gender,
          height: heightRange,
          nationality,
          skill,
          sort: sort === "recommended" ? undefined : sort,
        }}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
      />
    </PageContainer>
  );
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
  region: string[];
  genre: string[];
  roleType: string[];
  targetGender: string[];
  targetAgeGroup: string[];
  platform: string[];
  sort: "recommended" | "deadline" | "latest";
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
  const hasFilters = Boolean(
    q ||
      region.length ||
      genre.length ||
      roleType.length ||
      targetGender.length ||
      targetAgeGroup.length ||
      platform.length ||
      jobState !== "active",
  );
  const featuredJobs = items.slice(0, 5);

  return (
    <PageContainer size="wide" className="space-y-8">
      <ActorJobsHero savedJobCount={savedJobCount} />

      <JobSearchPanel
        action="/talents"
        resetHref="/talents"
        searchLabel="공고 검색"
        showRecommendedSort
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
            hasFilters || sort !== "recommended" ? (
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
          {featuredJobs.length > 0 ? (
            <section className="rounded-xl bg-primary-soft px-5 py-7 ring-1 ring-primary/10 md:px-8">
              <div className="mb-5">
                <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-normal text-primary">
                  <SlidersHorizontal aria-hidden="true" className="size-6" />
                  먼저 볼 공고
                </h2>
                <p className="mt-2 text-xs font-medium text-primary/80">
                  {sort === "recommended"
                    ? "프로필과 가까운 공고를 먼저 보여줘요."
                    : "검색 결과에서 먼저 확인할 공고예요."}
                </p>
              </div>
              <div className="-mx-5 flex gap-5 overflow-x-auto px-5 pb-2 md:-mx-8 md:px-8">
                {featuredJobs.map((job) => (
                  <JobCard
                    key={`featured-${job.id}`}
                    job={job}
                    bookmarked={bookmarkedIds.has(job.id)}
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

function CastingActorsHero({ savedActorCount }: { savedActorCount: number }) {
  return (
    <section className="rounded-[28px] bg-[linear-gradient(110deg,#071832,#0f5f4b)] px-7 py-8 text-white ring-1 ring-foreground/10 md:px-9 md:py-9">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge color="primary" variant="soft-outline">
            Talent Search
          </Badge>
          <h1 className="mt-5 text-3xl font-extrabold tracking-normal md:text-4xl">
            배우 탐색
          </h1>
          <p className="mt-4 text-sm font-medium leading-7 text-secondary-foreground/75 md:text-base">
            작품과 배역에 어울리는 배우를 조건별로 찾아보세요.
          </p>
        </div>

        <Link
          href="/bookmarks"
          className="group flex w-full max-w-[11rem] items-end justify-between rounded-[18px] border border-white/16 bg-white/10 px-5 py-4 text-left transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/40"
        >
          <span>
            <span className="block text-xs font-bold text-slate-300">
              저장한 배우
            </span>
            <span className="mt-2 block text-2xl font-bold">
              {savedActorCount.toLocaleString("ko-KR")}
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

function ActorJobsHero({ savedJobCount }: { savedJobCount: number }) {
  return (
    <section className="rounded-[28px] bg-[linear-gradient(110deg,#071832,#0f5f4b)] px-7 py-8 text-white ring-1 ring-foreground/10 md:px-9 md:py-9">
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
