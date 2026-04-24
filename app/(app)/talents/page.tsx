import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { BookmarkButton } from "@/components/features/bookmark-button";
import { PageContainer } from "@/components/page-container";
import { Pagination } from "@/components/features/pagination";
import { SearchFilterBar } from "@/components/features/search-filter-bar";
import { formatDeadline, formatDeadlineSignal } from "@/lib/format";
import { getJobAvailabilityLabel, isJobAccepting } from "@/lib/job-status";
import { listBookmarkedTargetIds } from "@/lib/queries/bookmarks";
import type { OpenJobPreview } from "@/lib/queries/jobs";
import { searchActors, searchOpenJobs } from "@/lib/queries/jobs";
import { getViewerProfile } from "@/lib/queries/viewer";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

function parsePage(raw: string | string[] | undefined) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value ?? "1");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

function asString(raw: string | string[] | undefined) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() ?? "";
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
  const page = parsePage(sp.page);

  if (activeRole === "casting") {
    return <CastingTalentsPage q={q} region={region} genre={genre} page={page} />;
  }

  const sort = asString(sp.sort) === "latest" ? "latest" : "deadline";
  const status = asString(sp.status);
  const jobState = status === "closed" || status === "all" ? status : "active";
  return (
    <ActorTalentsPage
      q={q}
      region={region}
      genre={genre}
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
  page,
}: {
  q: string;
  region: string;
  genre: string;
  page: number;
}) {
  const { items, total } = await searchActors({
    q,
    region,
    genre,
    page,
    pageSize: PAGE_SIZE,
  });
  const bookmarkedIds = await listBookmarkedTargetIds(
    "actor",
    items.map((actor) => actor.id),
  );
  const redirectTo = buildTalentsPath({ q, region, genre, page });

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
      />

      {items.length === 0 ? (
        <EmptyState
          title={
            q || region || genre
              ? "조건에 맞는 배우가 없어요"
              : "아직 탐색할 배우가 없어요"
          }
          description={q || region || genre ? "검색어나 필터를 바꿔보세요." : undefined}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((actor) => (
            <Card key={actor.id} className="h-full">
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <AvatarPreview
                      name={actor.name}
                      avatarUrl={actor.avatar_url}
                    />
                    <div className="min-w-0">
                      <Badge variant="secondary" className="mb-2 w-fit">
                        배우
                      </Badge>
                      <CardTitle>{actor.name}</CardTitle>
                    </div>
                  </div>
                  <BookmarkButton
                    targetType="actor"
                    targetId={actor.id}
                    bookmarked={bookmarkedIds.has(actor.id)}
                    redirectTo={redirectTo}
                    className="shrink-0"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {actor.region ?? "지역 미등록"}
                  {actor.age ? ` · ${actor.age}세` : ""}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(actor.genres.length > 0 ? actor.genres : ["장르 준비 중"]).map(
                    (g) => (
                      <Badge key={g} variant="outline">
                        {g}
                      </Badge>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Pagination
        basePath="/talents"
        params={{ q, region, genre }}
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
  sort,
  jobState,
  page,
}: {
  q: string;
  region: string;
  genre: string;
  sort: "deadline" | "latest";
  jobState: "active" | "closed" | "all";
  page: number;
}) {
  const { items, total } = await searchOpenJobs({
    q,
    region,
    genre,
    sort,
    jobState,
    page,
    pageSize: PAGE_SIZE,
  });
  const bookmarkedIds = await listBookmarkedTargetIds(
    "job",
    items.map((job) => job.id),
  );
  const redirectTo = buildTalentsPath({
    q,
    region,
    genre,
    sort,
    status: jobState,
    page,
  });

  return (
    <PageContainer pageTitle="공고 찾기">
      <SearchFilterBar
        action="/talents"
        searchField={{
          name: "q",
          label: "공고 검색",
          placeholder: "작품명이나 역할을 검색해요",
          defaultValue: q,
        }}
        filters={[
          {
            name: "region",
            label: "지역",
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="talents-status" className="sr-only">
                공고 상태
              </label>
              <Select
                id="talents-status"
                name="status"
                defaultValue={jobState}
              >
                <option value="active">지원 가능한 공고</option>
                <option value="closed">마감된 공고</option>
                <option value="all">전체 공고</option>
              </Select>
            </div>
            <div>
              <label htmlFor="talents-sort" className="sr-only">
                정렬
              </label>
              <Select id="talents-sort" name="sort" defaultValue={sort}>
                <option value="deadline">마감 임박순</option>
                <option value="latest">최신 등록순</option>
              </Select>
            </div>
          </div>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title={
            q || region || genre
              ? "조건에 맞는 공고가 없어요"
              : "지금 볼 수 있는 공고가 없어요"
          }
          description={
            q || region || genre
              ? "검색어를 줄이거나 필터를 바꿔보세요."
              : "새 공고가 올라오면 여기에서 볼 수 있어요."
          }
          action={
            q || region || genre || jobState !== "active" || sort !== "deadline" ? (
              <Link
                href="/talents"
                className={buttonVariants({ variant: "secondary", size: "sm" })}
              >
                필터 초기화
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((job) => (
            <ActorJobCard
              key={job.id}
              job={job}
              bookmarked={bookmarkedIds.has(job.id)}
              redirectTo={redirectTo}
            />
          ))}
        </div>
      )}

      <Pagination
        basePath="/talents"
        params={{ q, region, genre, sort, status: jobState }}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
      />
    </PageContainer>
  );
}

function ActorJobCard({
  job,
  bookmarked,
  redirectTo,
}: {
  job: OpenJobPreview;
  bookmarked: boolean;
  redirectTo: string;
}) {
  const accepting = isJobAccepting(job);
  const deadlineSignal = formatDeadlineSignal(job.deadline);

  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <Badge variant={accepting ? "default" : "secondary"} className="w-fit">
            {deadlineSignal}
          </Badge>
          <BookmarkButton
            targetType="job"
            targetId={job.id}
            bookmarked={bookmarked}
            redirectTo={redirectTo}
            compact
            className="-mt-2 -mr-2 shrink-0"
          />
        </div>
        <div className="space-y-2">
          <CardTitle className="line-clamp-2 text-lg">{job.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {job.region ?? "지역 협의"} · {job.genre ?? "장르 미정"}
          </p>
        </div>
      </CardHeader>
      <CardContent className="mt-auto space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <DecisionPill label="상태" value={getJobAvailabilityLabel(job)} />
          <DecisionPill label="마감" value={formatDeadline(job.deadline)} />
        </div>
        <Link
          href={`/jobs/${job.id}`}
          className={cn(
            buttonVariants({ variant: accepting ? "default" : "secondary", size: "sm" }),
            "w-full",
          )}
        >
          자세히 보기
        </Link>
      </CardContent>
    </Card>
  );
}

function DecisionPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2">
      <div className="text-[0.72rem] font-medium text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 truncate font-medium">{value}</div>
    </div>
  );
}

function AvatarPreview({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  return (
    <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted text-sm font-semibold text-muted-foreground">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={`${name} 프로필 사진`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        getAvatarFallback(name)
      )}
    </div>
  );
}

function getAvatarFallback(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "U";
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
    query.set(key, normalized);
  }
  const qs = query.toString();
  return qs ? `/talents?${qs}` : "/talents";
}
