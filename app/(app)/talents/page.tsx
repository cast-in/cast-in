import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { BookmarkButton } from "@/components/features/bookmark-button";
import { PageContainer } from "@/components/page-container";
import { Pagination } from "@/components/features/pagination";
import { SearchFilterBar } from "@/components/features/search-filter-bar";
import { formatDeadline, formatDeadlineSignal } from "@/lib/format";
import { getJobAvailabilityLabel, isJobAccepting } from "@/lib/job-status";
import { listBookmarkedTargetIds } from "@/lib/queries/bookmarks";
import type { ActorPreview, OpenJobPreview } from "@/lib/queries/jobs";
import { searchActors, searchOpenJobs } from "@/lib/queries/jobs";
import { getViewerProfile } from "@/lib/queries/viewer";

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

function asGender(raw: string | string[] | undefined) {
  const value = asString(raw);
  return value === "male" || value === "female" ? value : "";
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
            variant="secondary"
            className="absolute left-3 top-3 bg-background/85 backdrop-blur"
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
            <Badge key={g} variant="outline">
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
  const jobHref = `/jobs/${job.id}`;

  return (
    <Card className="h-full gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
      <div className="relative isolate">
        <Link
          href={jobHref}
          className="group block aspect-[4/3] bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <JobPostingPreview />
          <Badge
            variant={accepting ? "default" : "secondary"}
            className="absolute left-3 top-3 bg-background/85 text-foreground backdrop-blur"
          >
            {deadlineSignal}
          </Badge>
        </Link>
        <BookmarkButton
          targetType="job"
          targetId={job.id}
          bookmarked={bookmarked}
          redirectTo={redirectTo}
          compact
          className="absolute right-3 top-3 z-10 bg-background/85 backdrop-blur hover:bg-background"
        />
      </div>
      <CardContent className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={jobHref}
            className="min-w-0 flex-1 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <CardTitle className="line-clamp-2 text-lg">{job.title}</CardTitle>
          </Link>
          <div className="shrink-0 whitespace-nowrap pt-0.5 text-right text-sm text-muted-foreground">
            {getJobAvailabilityLabel(job)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{job.genre ?? "장르 미정"}</Badge>
          <Badge variant="outline">{job.region ?? "지역 협의"}</Badge>
        </div>
        <p className="mt-auto text-sm text-muted-foreground">
          {formatDeadline(job.deadline)}
        </p>
      </CardContent>
    </Card>
  );
}

function JobPostingPreview() {
  return (
    <div className="h-full w-full overflow-hidden bg-muted transition-transform duration-200 group-hover:scale-[1.02]" />
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
    <div className="flex h-full w-full items-center justify-center overflow-hidden bg-muted text-5xl font-semibold text-muted-foreground transition-transform duration-200 group-hover:scale-[1.02]">
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
