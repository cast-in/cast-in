import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { JobCard } from "@/components/features/job-card";
import { JobSearchPanel } from "@/components/features/job-search-panel";
import { PageContainer } from "@/components/page-container";
import { Pagination } from "@/components/features/pagination";
import {
  JOB_AGE_GROUP_OPTIONS,
  JOB_PLATFORM_OPTIONS,
  JOB_ROLE_TYPE_OPTIONS,
  JOB_TARGET_GENDER_OPTIONS,
} from "@/lib/job-filter-options";
import { listBookmarkedTargetIds } from "@/lib/queries/bookmarks";
import { searchOpenJobs } from "@/lib/queries/jobs";
import { getViewerProfile } from "@/lib/queries/viewer";

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

function asStrings(raw: string | string[] | undefined) {
  const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function asOptions(raw: string | string[] | undefined, options: readonly string[]) {
  return asStrings(raw).filter((value) => options.includes(value));
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { activeRole } = await getViewerProfile();
  if (activeRole === "actor") redirect("/talents");
  if (activeRole !== "casting") redirect("/dashboard");

  const sp = await searchParams;
  const q = asString(sp.q);
  const region = asStrings(sp.region);
  const genre = asStrings(sp.genre);
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
  const status = asString(sp.status);
  const jobState = status === "closed" || status === "all" ? status : "active";
  const page = parsePage(sp.page);

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
  const bookmarkedIds = await listBookmarkedTargetIds(
    "job",
    items.map((job) => job.id),
  );
  const redirectTo = buildDiscoverPath({
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
      region.length ||
      genre.length ||
      roleType.length ||
      targetGender.length ||
      targetAgeGroup.length ||
      platform.length ||
      jobState !== "active",
  );
  const recommendedJobs = items.slice(0, 5);

  return (
    <PageContainer size="wide" className="space-y-8">
      <CastingJobsHero />

      <JobSearchPanel
        action="/discover"
        resetHref="/discover"
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
                href="/discover"
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
                <h2 className="text-2xl font-extrabold tracking-normal text-primary">
                  맞춤 공고
                </h2>
                <p className="mt-2 text-xs font-medium text-primary/80">
                  최근 공고 기준으로 먼저 보여드려요
                </p>
              </div>
              <div className="-mx-5 flex gap-5 overflow-x-auto px-5 pb-2 md:-mx-8 md:px-8">
                {recommendedJobs.map((job) => (
                  <JobCard
                    key={`recommended-${job.id}`}
                    job={job}
                    bookmarked={bookmarkedIds.has(job.id)}
                    redirectTo={redirectTo}
                    detailHref={`/jobs/${job.id}?from=discover`}
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
                  detailHref={`/jobs/${job.id}?from=discover`}
                />
              ))}
            </div>
          </section>
        </>
      )}

      <Pagination
        basePath="/discover"
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

function CastingJobsHero() {
  return (
    <section className="rounded-[28px] bg-[linear-gradient(110deg,#071832,#0f5f4b)] px-7 py-8 text-white ring-1 ring-foreground/10 md:px-9 md:py-9">
      <Badge color="primary" variant="soft-outline">
        Casting Calls
      </Badge>
      <h1 className="mt-5 text-3xl font-extrabold tracking-normal md:text-4xl">
        공고 탐색
      </h1>
      <p className="mt-4 text-sm font-medium leading-7 text-secondary-foreground/75 md:text-base">
        공개된 캐스팅 공고를 탐색하고 시장 흐름을 확인해보세요.
      </p>
    </section>
  );
}

type QueryValue = string | number | readonly string[] | undefined;

function buildDiscoverPath(params: Record<string, QueryValue>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      const normalized = String(item ?? "").trim();
      if (!normalized) continue;
      if (key === "page" && normalized === "1") continue;
      if (key === "status" && normalized === "active") continue;
      if (key === "sort" && normalized === "latest") continue;
      query.append(key, normalized);
    }
  }
  const qs = query.toString();
  return qs ? `/discover?${qs}` : "/discover";
}
