import Link from "next/link";
import { ArrowLeft, Bookmark } from "lucide-react";
import { ActorCard } from "@/components/features/actor-card";
import { ActorSearchPanel } from "@/components/features/actor-search-panel";
import { JobCard } from "@/components/features/job-card";
import { JobSearchPanel } from "@/components/features/job-search-panel";
import { Pagination } from "@/components/features/pagination";
import { PageContainer } from "@/components/page-container";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
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
  listMyBookmarkedActors,
  listMyBookmarkedJobs,
} from "@/lib/queries/bookmarks";
import { getViewerProfile } from "@/lib/queries/viewer";

const BOOKMARK_JOB_PAGE_SIZE = 12;
const BOOKMARK_ACTOR_PAGE_SIZE = 8;

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

export default async function BookmarksPage({
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
  const page = parsePage(sp.page);

  if (activeRole === "casting") {
    const gender = asGenderOptions(sp.gender);
    const ageGroup = asOptions(
      sp.age_group,
      JOB_AGE_GROUP_OPTIONS.map((option) => option.value),
    );
    const heightRange = asOptions(
      sp.height,
      ACTOR_HEIGHT_RANGE_OPTIONS.map((option) => option.value),
    );
    const nationality = asOptions(sp.nationality, ACTOR_NATIONALITY_OPTIONS);
    const skill = asStrings(sp.skill);
    const sort = asString(sp.sort) === "name" ? "name" : "latest";

    return (
      <SavedActorsPage
        ageGroup={ageGroup}
        gender={gender}
        genre={genre}
        heightRange={heightRange}
        nationality={nationality}
        page={page}
        q={q}
        region={region}
        skill={skill}
        sort={sort}
      />
    );
  }

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
  const sort = asString(sp.sort) === "deadline" ? "deadline" : "latest";

  return (
    <SavedJobsPage
      genre={genre}
      page={page}
      platform={platform}
      q={q}
      region={region}
      roleType={roleType}
      sort={sort}
      targetAgeGroup={targetAgeGroup}
      targetGender={targetGender}
    />
  );
}

async function SavedJobsPage({
  genre,
  page,
  platform,
  q,
  region,
  roleType,
  sort,
  targetAgeGroup,
  targetGender,
}: {
  genre: string[];
  page: number;
  platform: string[];
  q: string;
  region: string[];
  roleType: string[];
  sort: "deadline" | "latest";
  targetAgeGroup: string[];
  targetGender: string[];
}) {
  const { items, total } = await listMyBookmarkedJobs({
    q,
    region,
    genre,
    roleType,
    targetGender,
    targetAgeGroup,
    platform,
    sort,
    jobState: "all",
    page,
    pageSize: BOOKMARK_JOB_PAGE_SIZE,
  });
  const hasFilters = Boolean(
    q ||
      region.length ||
      genre.length ||
      roleType.length ||
      targetGender.length ||
      targetAgeGroup.length ||
      platform.length,
  );

  return (
    <PageContainer size="wide" className="space-y-8">
      <SavedJobsHero />

      <JobSearchPanel
        action="/bookmarks"
        resetHref="/bookmarks"
        searchLabel="저장 공고 검색"
        values={{
          q,
          region,
          genre,
          roleType,
          targetGender,
          targetAgeGroup,
          platform,
          sort,
        }}
      />

      <section>
        <div className="mb-5 flex items-end gap-3">
          <h2 className="text-2xl font-extrabold tracking-normal">저장한 공고</h2>
          <span className="text-2xl font-extrabold text-primary">
            {total.toLocaleString("ko-KR")}
          </span>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title={
              hasFilters
                ? "조건에 맞는 저장 공고가 없어요"
                : "아직 저장한 공고가 없어요"
            }
            description={
              hasFilters
                ? "검색어나 필터를 바꿔보세요."
                : "관심 있는 공고를 저장하면 여기에서 바로 다시 볼 수 있어요."
            }
            action={
              hasFilters ? (
                <Link
                  href="/bookmarks"
                  className={buttonVariants({ color: "secondary", size: "sm" })}
                >
                  필터 초기화
                </Link>
              ) : (
                <Link
                  href="/talents"
                  className={buttonVariants({ color: "secondary", size: "sm" })}
                >
                  공고 찾기
                </Link>
              )
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                bookmarked
              />
            ))}
          </div>
        )}
      </section>

      <Pagination
        basePath="/bookmarks"
        params={{
          q,
          region,
          genre,
          role: roleType,
          target_gender: targetGender,
          age_group: targetAgeGroup,
          platform,
          sort: sort === "latest" ? undefined : sort,
        }}
        page={page}
        pageSize={BOOKMARK_JOB_PAGE_SIZE}
        total={total}
      />
    </PageContainer>
  );
}

async function SavedActorsPage({
  ageGroup,
  gender,
  genre,
  heightRange,
  nationality,
  page,
  q,
  region,
  skill,
  sort,
}: {
  ageGroup: string[];
  gender: string[];
  genre: string[];
  heightRange: string[];
  nationality: string[];
  page: number;
  q: string;
  region: string[];
  skill: string[];
  sort: "latest" | "name";
}) {
  const { items, total } = await listMyBookmarkedActors({
    ageGroup,
    gender,
    genre,
    heightRange,
    nationality,
    q,
    region,
    skill,
    sort,
    page,
    pageSize: BOOKMARK_ACTOR_PAGE_SIZE,
  });
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

  return (
    <PageContainer size="wide" className="space-y-8">
      <SavedActorsHero />

      <ActorSearchPanel
        action="/bookmarks"
        resetHref="/bookmarks"
        searchLabel="저장 배우 검색"
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
          <h2 className="text-2xl font-extrabold tracking-normal">저장한 배우</h2>
          <span className="text-2xl font-extrabold text-primary">
            {total.toLocaleString("ko-KR")}
          </span>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title={
              hasFilters
                ? "조건에 맞는 저장 배우가 없어요"
                : "아직 저장한 배우가 없어요"
            }
            description={
              hasFilters
                ? "검색어나 필터를 바꿔보세요."
                : "관심 있는 배우를 저장하면 여기에서 바로 다시 볼 수 있어요."
            }
            action={
              hasFilters ? (
                <Link
                  href="/bookmarks"
                  className={buttonVariants({ color: "secondary", size: "sm" })}
                >
                  필터 초기화
                </Link>
              ) : (
                <Link
                  href="/talents"
                  className={buttonVariants({ color: "secondary", size: "sm" })}
                >
                  배우 찾기
                </Link>
              )
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((actor) => (
              <ActorCard
                key={actor.id}
                actor={actor}
                bookmarked
              />
            ))}
          </div>
        )}
      </section>

      <Pagination
        basePath="/bookmarks"
        params={{
          age_group: ageGroup,
          gender,
          genre,
          height: heightRange,
          nationality,
          q,
          region,
          skill,
          sort: sort === "latest" ? undefined : sort,
        }}
        page={page}
        pageSize={BOOKMARK_ACTOR_PAGE_SIZE}
        total={total}
      />
    </PageContainer>
  );
}

function SavedJobsHero() {
  return (
    <section className="rounded-[28px] bg-[linear-gradient(110deg,#071832,#0f5f4b)] px-7 py-8 text-white ring-1 ring-foreground/10 md:px-9 md:py-9">
      <Link
        href="/talents"
        className="inline-flex size-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/40"
      >
        <ArrowLeft aria-hidden="true" className="size-5" />
        <span className="sr-only">공고 탐색으로 돌아가기</span>
      </Link>
      <h1 className="mt-5 text-3xl font-extrabold tracking-normal md:text-4xl">
        저장한 공고
      </h1>
      <p className="mt-4 text-sm font-medium leading-7 text-secondary-foreground/75 md:text-base">
        저장한 공고를 확인하고, 지금 바로 지원해보세요.
      </p>
    </section>
  );
}

function SavedActorsHero() {
  return (
    <section className="rounded-[28px] bg-[linear-gradient(110deg,#071832,#0f5f4b)] px-7 py-8 text-white ring-1 ring-foreground/10 md:px-9 md:py-9">
      <Link
        href="/talents"
        className="inline-flex size-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/40"
      >
        <ArrowLeft aria-hidden="true" className="size-5" />
        <span className="sr-only">배우 탐색으로 돌아가기</span>
      </Link>
      <h1 className="mt-5 text-3xl font-extrabold tracking-normal md:text-4xl">
        저장한 배우
      </h1>
      <p className="mt-4 text-sm font-medium leading-7 text-secondary-foreground/75 md:text-base">
        저장한 배우에게 메시지를 보내고, 캐스팅을 제안해보세요.
      </p>
    </section>
  );
}
