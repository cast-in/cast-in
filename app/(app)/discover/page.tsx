import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  listActorPreviews,
  listMyApplicationsWithJobs,
  listMyJobsWithCounts,
  listOpenJobsPreview,
} from "@/lib/queries/jobs";
import { getViewerProfile } from "@/lib/queries/viewer";

function formatDeadline(iso: string | null) {
  if (!iso) return "상시모집";
  const deadline = new Date(iso);
  return `${deadline.getMonth() + 1}월 ${deadline.getDate()}일 마감`;
}

export default async function DiscoverPage() {
  const { activeRole } = await getViewerProfile();

  if (!activeRole) return null;

  return activeRole === "casting" ? (
    <CastingDiscoverPage />
  ) : (
    <ActorDiscoverPage />
  );
}

async function CastingDiscoverPage() {
  let actors: Awaited<ReturnType<typeof listActorPreviews>> = [];
  let jobs: Awaited<ReturnType<typeof listMyJobsWithCounts>> = [];
  let errorMessage: string | null = null;

  try {
    [actors, jobs] = await Promise.all([
      listActorPreviews(6),
      listMyJobsWithCounts(),
    ]);
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "인재 정보를 불러오지 못했어요.";
  }

  const openProjects = jobs.filter((job) => job.status === "open").length;
  const reviewingCount = jobs.reduce((sum, job) => sum + job.reviewing_count, 0);
  const applicantCount = jobs.reduce((sum, job) => sum + job.applicant_count, 0);

  return (
    <section className="space-y-8">
      <HeroCard
        title="인재 찾기"
        description="진행 중인 프로젝트를 기준으로 추천 배우를 확인하고 다음으로 볼 후보를 빠르게 추려요."
      />

      {errorMessage && <ErrorCard message={errorMessage} />}

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard label="진행 중 프로젝트" value={openProjects} />
        <SummaryCard label="검토 중인 인재" value={reviewingCount} />
        <SummaryCard label="전체 지원자" value={applicantCount} />
      </div>

      <section className="space-y-3">
        <SectionHeader
          title="추천 배우"
          ctaHref="/talents"
          ctaLabel="배우 탐색 보기"
        />

        {actors.length === 0 ? (
          <EmptyCard message="아직 보여줄 배우가 없어요. 배우 탐색에서 직접 찾아보세요." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {actors.map((actor) => (
              <Card key={actor.id} className="h-full">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold">{actor.name}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {actor.region ?? "지역 미등록"}
                        {actor.age ? ` · ${actor.age}세` : ""}
                      </div>
                    </div>
                    <Badge variant="secondary">추천</Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(actor.genres.length > 0 ? actor.genres : ["장르 준비 중"]).map(
                      (genre) => (
                        <Badge key={genre} variant="outline">
                          {genre}
                        </Badge>
                      ),
                    )}
                  </div>

                  <Link
                    href="/talents"
                    className={buttonVariants({ variant: "secondary", size: "sm" })}
                  >
                    배우 탐색에서 보기
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

async function ActorDiscoverPage() {
  let openJobs: Awaited<ReturnType<typeof listOpenJobsPreview>> = [];
  let applications: Awaited<ReturnType<typeof listMyApplicationsWithJobs>> = [];
  let errorMessage: string | null = null;

  try {
    [openJobs, applications] = await Promise.all([
      listOpenJobsPreview(6),
      listMyApplicationsWithJobs(),
    ]);
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "오디션 정보를 불러오지 못했어요.";
  }

  const reviewingCount = applications.filter(
    (application) => application.status === "reviewing",
  ).length;
  const messageCount = applications.filter(
    (application) => application.last_message_at,
  ).length;

  return (
    <section className="space-y-8">
      <HeroCard
        title="둘러보기"
        description="내 프로필에 맞는 추천 오디션과 지원 흐름을 같은 화면에서 확인해요."
      />

      {errorMessage && <ErrorCard message={errorMessage} />}

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard label="추천 오디션" value={openJobs.length} />
        <SummaryCard label="검토 중인 지원" value={reviewingCount} />
        <SummaryCard label="메시지 연결" value={messageCount} />
      </div>

      <section className="space-y-3">
        <SectionHeader
          title="추천 오디션"
          ctaHref="/talents"
          ctaLabel="오디션 탐색 보기"
        />

        {openJobs.length === 0 ? (
          <EmptyCard message="지금 바로 지원할 공고가 없어요. 잠시 후 다시 확인해주세요." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {openJobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="block">
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="space-y-3 p-5">
                    {job.genre ? (
                      <Badge variant="secondary">{job.genre}</Badge>
                    ) : null}
                    <div className="font-semibold">{job.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {job.region ?? "-"} · {formatDeadline(job.deadline)}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

function HeroCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="border-none bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
      <CardHeader className="p-8">
        <CardTitle className="text-3xl md:text-4xl">{title}</CardTitle>
        <CardDescription className="max-w-2xl text-base">
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function SectionHeader({
  title,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <Link
        href={ctaHref}
        className={buttonVariants({ variant: "link", size: "sm" })}
      >
        {ctaLabel} →
      </Link>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl font-bold tracking-tight">
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="p-8 text-center text-muted-foreground">
        {message}
      </CardContent>
    </Card>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
      {message}
    </div>
  );
}
