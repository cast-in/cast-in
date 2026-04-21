import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookmarkButton } from "@/components/features/bookmark-button";
import { PageContainer } from "@/components/page-container";
import { Pagination } from "@/components/features/pagination";
import { SearchFilterBar } from "@/components/features/search-filter-bar";
import { getJobAvailabilityLabel, isJobAccepting } from "@/lib/job-status";
import { listBookmarkedTargetIds } from "@/lib/queries/bookmarks";
import { searchActors, searchOpenJobs } from "@/lib/queries/jobs";
import { getViewerProfile } from "@/lib/queries/viewer";

const PAGE_SIZE = 12;

function formatDeadline(iso: string | null) {
  if (!iso) return "상시모집";
  const deadline = new Date(iso);
  return `${deadline.getMonth() + 1}월 ${deadline.getDate()}일 마감`;
}

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
    <PageContainer
      pageTitle="배우 탐색"
      description="프로필 카드 중심으로 배우를 비교하고 다음으로 볼 후보를 빠르게 추려요."
    >
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
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {q || region || genre
              ? "조건에 맞는 배우가 없어요."
              : "아직 탐색할 배우가 없어요."}
          </CardContent>
        </Card>
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
  const redirectTo = buildTalentsPath({ q, region, genre, sort, status: jobState, page });

  return (
    <PageContainer
      pageTitle="오디션 탐색"
      description="브랜드, 장르, 지역 기준으로 공고를 비교하고 바로 상세를 확인해요."
    >
      <SearchFilterBar
        action="/talents"
        searchField={{
          name: "q",
          label: "공고 검색",
          placeholder: "제목·내용 검색",
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
            <select
              name="status"
              defaultValue={jobState}
              aria-label="공고 상태"
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="active">모집중만</option>
              <option value="closed">마감/종료</option>
              <option value="all">전체</option>
            </select>
            <select
              name="sort"
              defaultValue={sort}
              aria-label="정렬"
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="deadline">마감 임박순</option>
              <option value="latest">최신 등록순</option>
            </select>
          </div>
        }
      />

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {q || region || genre
              ? "조건에 맞는 공고가 없어요."
              : "지금 탐색할 오디션이 없어요."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((job) => (
            <Card key={job.id} className="h-full">
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={isJobAccepting(job) ? "default" : "secondary"}
                      className="w-fit"
                    >
                      {getJobAvailabilityLabel(job)}
                    </Badge>
                    {job.genre ? (
                      <Badge variant="secondary" className="w-fit">
                        {job.genre}
                      </Badge>
                    ) : null}
                  </div>
                  <BookmarkButton
                    targetType="job"
                    targetId={job.id}
                    bookmarked={bookmarkedIds.has(job.id)}
                    redirectTo={redirectTo}
                    className="shrink-0"
                  />
                </div>
                <CardTitle>{job.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {job.region ?? "-"} · {formatDeadline(job.deadline)}
                </div>
                <Link
                  href={`/jobs/${job.id}`}
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  공고 보기
                </Link>
              </CardContent>
            </Card>
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
