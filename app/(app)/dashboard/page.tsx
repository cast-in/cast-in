import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  ClipboardCheck,
  MessageCircle,
  Pencil,
  Plus,
  type LucideIcon,
  UserCheck,
  UsersRound,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";
import { PageContainer } from "@/components/page-container";
import {
  listMyApplicationsWithJobs,
  listMyJobsWithCounts,
  listOpenJobsPreview,
} from "@/lib/queries/jobs";
import { getViewerProfile } from "@/lib/queries/viewer";
import { formatDeadline, formatDeadlineSignal } from "@/lib/format";

type CastingDashboardJob = Awaited<ReturnType<typeof listMyJobsWithCounts>>[number];
type ActorDashboardJob = Awaited<ReturnType<typeof listOpenJobsPreview>>[number];
type ActorDashboardApplication = Awaited<
  ReturnType<typeof listMyApplicationsWithJobs>
>[number];

export default async function DashboardPage() {
  const { activeRole } = await getViewerProfile();

  if (!activeRole) return null;

  return activeRole === "casting" ? (
    <CastingDashboardPage />
  ) : (
    <ActorDashboardPage />
  );
}

async function CastingDashboardPage() {
  let jobs: Awaited<ReturnType<typeof listMyJobsWithCounts>> = [];
  let errorMessage: string | null = null;

  try {
    jobs = await listMyJobsWithCounts();
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "대시보드 정보를 불러오지 못했어요.";
  }

  const dashboard = getCastingDashboard(jobs);

  return (
    <PageContainer
      pageTitle="대시보드"
      actions={
        <Link href="/jobs/new" className={buttonVariants({ size: "sm" })}>
          <Plus aria-hidden="true" />
          공고 올리기
        </Link>
      }
    >
      {errorMessage && <ErrorNotice message={errorMessage} />}

      <div className="grid gap-3 md:grid-cols-3">
        <DashboardMetricCard
          href="/jobs"
          label="진행 중 공고"
          value={`${dashboard.openProjects}건`}
          description={
            dashboard.closingSoonCount > 0
              ? `${dashboard.closingSoonCount}건이 7일 안에 마감돼요`
              : "마감 임박 공고는 없어요"
          }
          ctaLabel="공고 관리"
          icon={BriefcaseBusiness}
        />
        <DashboardMetricCard
          href="/jobs"
          label="검토할 지원자"
          value={`${dashboard.actionableApplicants}명`}
          description={`대기 ${dashboard.pendingCount}명 · 검토 ${dashboard.reviewingCount}명`}
          ctaLabel="지원자 보기"
          icon={ClipboardCheck}
        />
        <DashboardMetricCard
          href="/jobs"
          label="전체 지원자"
          value={`${dashboard.applicantCount}명`}
          description={`합격 ${dashboard.passCount}명 · 보류 ${dashboard.holdCount}명`}
          ctaLabel="공고별 보기"
          icon={UsersRound}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <ApplicantFlowCard dashboard={dashboard} />
        <ClosingJobsCard jobs={dashboard.closingSoonJobs} />
      </div>

      <ActorExplorePanel />
    </PageContainer>
  );
}

function DashboardMetricCard({
  href,
  label,
  value,
  description,
  ctaLabel,
  icon: Icon,
}: {
  href: string;
  label: string;
  value: string;
  description: string;
  ctaLabel: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl outline-none transition-transform focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="h-full min-h-36 transition-shadow hover:shadow-md">
        <CardHeader className="gap-3">
          <div className="flex items-start justify-between gap-3">
            <CardDescription>{label}</CardDescription>
            <span className="rounded-lg bg-primary/10 p-2 text-primary">
              <Icon aria-hidden="true" className="size-4" />
            </span>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight tabular-nums">
            {value}
          </CardTitle>
          <p className="text-xs leading-5 text-muted-foreground">{description}</p>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            {ctaLabel}
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </span>
        </CardHeader>
      </Card>
    </Link>
  );
}

function ApplicantFlowCard({
  dashboard,
}: {
  dashboard: CastingDashboardSummary;
}) {
  const items = [
    { label: "대기", value: dashboard.pendingCount },
    { label: "검토", value: dashboard.reviewingCount },
    { label: "합격", value: dashboard.passCount },
    { label: "보류", value: dashboard.holdCount },
    { label: "반려", value: dashboard.rejectCount },
  ];

  return (
    <section aria-labelledby="applicant-flow-title">
      <Card className="h-full">
        <CardHeader className="gap-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardDescription>지원자 현황</CardDescription>
              <CardTitle id="applicant-flow-title" className="text-xl">
                지금 처리할 흐름
              </CardTitle>
            </div>
            <UserCheck aria-hidden="true" className="size-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {items.map((item) => (
              <div key={item.label} className="rounded-lg bg-muted/50 px-3 py-3">
                <dt className="text-xs font-medium text-muted-foreground">
                  {item.label}
                </dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums">
                  {item.value}명
                </dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge color="secondary">
              검토 필요 {dashboard.actionableApplicants}명
            </Badge>
            <span>대기와 검토 상태를 먼저 확인해요.</span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function ClosingJobsCard({ jobs }: { jobs: CastingDashboardJob[] }) {
  return (
    <section aria-labelledby="closing-jobs-title">
      <Card className="h-full">
        <CardHeader className="gap-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardDescription>마감 관리</CardDescription>
              <CardTitle id="closing-jobs-title" className="text-xl">
                마감 임박 공고
              </CardTitle>
            </div>
            <CalendarClock
              aria-hidden="true"
              className="size-5 text-muted-foreground"
            />
          </div>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              7일 안에 마감되는 공고가 없어요.
            </p>
          ) : (
            <ul className="space-y-2">
              {jobs.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {job.title}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        지원자 {job.applicant_count}명 · {formatDeadline(job.deadline)}
                      </span>
                    </span>
                    <Badge color="secondary" className="shrink-0">
                      {formatDeadlineSignal(job.deadline)}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function ActorExplorePanel() {
  return (
    <section aria-labelledby="actor-explore-title">
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h2 id="actor-explore-title" className="text-xl font-semibold tracking-tight">
              추천 배우
            </h2>
            <p className="text-sm text-muted-foreground">
              조건에 맞는 배우 후보는 배우 탐색에서 확인해요.
            </p>
          </div>
          <Link
            href="/talents"
            className={buttonVariants({ color: "secondary", size: "sm" })}
          >
            배우 탐색 보기
            <ArrowRight aria-hidden="true" />
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}

type CastingDashboardSummary = {
  openProjects: number;
  closingSoonCount: number;
  closingSoonJobs: CastingDashboardJob[];
  applicantCount: number;
  pendingCount: number;
  reviewingCount: number;
  actionableApplicants: number;
  passCount: number;
  holdCount: number;
  rejectCount: number;
};

function getCastingDashboard(
  jobs: CastingDashboardJob[],
): CastingDashboardSummary {
  const closingSoonJobs = getClosingSoonJobs(jobs);
  const pendingCount = jobs.reduce((sum, job) => sum + job.pending_count, 0);
  const reviewingCount = jobs.reduce((sum, job) => sum + job.reviewing_count, 0);

  return {
    openProjects: jobs.filter((job) => job.status === "open").length,
    closingSoonCount: closingSoonJobs.length,
    closingSoonJobs,
    applicantCount: jobs.reduce((sum, job) => sum + job.applicant_count, 0),
    pendingCount,
    reviewingCount,
    actionableApplicants: pendingCount + reviewingCount,
    passCount: jobs.reduce((sum, job) => sum + job.pass_count, 0),
    holdCount: jobs.reduce((sum, job) => sum + job.hold_count, 0),
    rejectCount: jobs.reduce((sum, job) => sum + job.reject_count, 0),
  };
}

function getClosingSoonJobs(jobs: CastingDashboardJob[]) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const oneWeekLater = new Date(startOfToday);
  oneWeekLater.setDate(oneWeekLater.getDate() + 7);

  return jobs
    .filter((job) => {
      if (job.status !== "open" || !job.deadline) return false;
      const deadline = new Date(job.deadline);
      if (Number.isNaN(deadline.getTime())) return false;
      return deadline >= startOfToday && deadline <= oneWeekLater;
    })
    .sort(
      (a, b) =>
        new Date(a.deadline ?? 0).getTime() -
        new Date(b.deadline ?? 0).getTime(),
    )
    .slice(0, 3);
}

async function ActorDashboardPage() {
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
      error instanceof Error ? error.message : "대시보드 정보를 불러오지 못했어요.";
  }

  const dashboard = getActorDashboard(openJobs, applications);

  return (
    <PageContainer
      pageTitle="대시보드"
      actions={
        <Link href="/profile" className={buttonVariants({ size: "sm" })}>
          <Pencil aria-hidden="true" />
          프로필 관리
        </Link>
      }
    >
      {errorMessage && <ErrorNotice message={errorMessage} />}

      <div className="grid gap-3 md:grid-cols-3">
        <DashboardMetricCard
          href="/talents"
          label="지원 가능한 공고"
          value={`${dashboard.openJobCount}건`}
          description={
            dashboard.closingSoonCount > 0
              ? `${dashboard.closingSoonCount}건이 7일 안에 마감돼요`
              : "오늘 확인할 마감 임박 공고는 없어요"
          }
          ctaLabel="공고 찾기"
          icon={BriefcaseBusiness}
        />
        <DashboardMetricCard
          href="/jobs"
          label="진행 중 지원"
          value={`${dashboard.activeApplications}건`}
          description={`대기 ${dashboard.pendingCount}건 · 검토 ${dashboard.reviewingCount}건`}
          ctaLabel="내 지원 보기"
          icon={ClipboardCheck}
        />
        <DashboardMetricCard
          href="/messages"
          label="대화 중"
          value={`${dashboard.messageCount}건`}
          description="최근 메시지가 있는 지원을 확인해요"
          ctaLabel="메시지 보기"
          icon={MessageCircle}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <ActorApplicationFlowCard dashboard={dashboard} />
        <ActorClosingJobsCard jobs={dashboard.closingSoonJobs} />
      </div>

      <JobExplorePanel />
    </PageContainer>
  );
}

function ActorApplicationFlowCard({
  dashboard,
}: {
  dashboard: ActorDashboardSummary;
}) {
  const items = [
    { label: "대기", value: dashboard.pendingCount },
    { label: "검토", value: dashboard.reviewingCount },
    { label: "합격", value: dashboard.passCount },
    { label: "보류", value: dashboard.holdCount },
    { label: "반려", value: dashboard.rejectCount },
  ];

  return (
    <section aria-labelledby="actor-application-flow-title">
      <Card className="h-full">
        <CardHeader className="gap-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardDescription>지원 현황</CardDescription>
              <CardTitle id="actor-application-flow-title" className="text-xl">
                내 지원 흐름
              </CardTitle>
            </div>
            <UserCheck aria-hidden="true" className="size-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {items.map((item) => (
              <div key={item.label} className="rounded-lg bg-muted/50 px-3 py-3">
                <dt className="text-xs font-medium text-muted-foreground">
                  {item.label}
                </dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums">
                  {item.value}건
                </dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge color="secondary">
              진행 중 {dashboard.activeApplications}건
            </Badge>
            <span>상태가 바뀌면 알림으로 알려드려요.</span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function ActorClosingJobsCard({ jobs }: { jobs: ActorDashboardJob[] }) {
  return (
    <section aria-labelledby="actor-closing-jobs-title">
      <Card className="h-full">
        <CardHeader className="gap-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardDescription>공고 체크</CardDescription>
              <CardTitle id="actor-closing-jobs-title" className="text-xl">
                마감 임박 공고
              </CardTitle>
            </div>
            <CalendarClock
              aria-hidden="true"
              className="size-5 text-muted-foreground"
            />
          </div>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              7일 안에 마감되는 공고가 없어요.
            </p>
          ) : (
            <ul className="space-y-2">
              {jobs.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {job.title}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {[job.region, job.genre].filter(Boolean).join(" · ") || "정보 미등록"}
                      </span>
                    </span>
                    <Badge color="secondary" className="shrink-0">
                      {formatDeadlineSignal(job.deadline)}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function JobExplorePanel() {
  return (
    <section aria-labelledby="job-explore-title">
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h2 id="job-explore-title" className="text-xl font-semibold tracking-tight">
              공고 찾기
            </h2>
            <p className="text-sm text-muted-foreground">
              조건에 맞는 공고는 공고 찾기에서 확인해요.
            </p>
          </div>
          <Link
            href="/talents"
            className={buttonVariants({ color: "secondary", size: "sm" })}
          >
            공고 찾기
            <ArrowRight aria-hidden="true" />
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}

type ActorDashboardSummary = {
  openJobCount: number;
  closingSoonCount: number;
  closingSoonJobs: ActorDashboardJob[];
  pendingCount: number;
  reviewingCount: number;
  passCount: number;
  holdCount: number;
  rejectCount: number;
  activeApplications: number;
  messageCount: number;
};

function getActorDashboard(
  jobs: ActorDashboardJob[],
  applications: ActorDashboardApplication[],
): ActorDashboardSummary {
  const closingSoonJobs = getActorClosingSoonJobs(jobs);
  const pendingCount = applications.filter((app) => app.status === "pending").length;
  const reviewingCount = applications.filter((app) => app.status === "reviewing").length;
  const holdCount = applications.filter((app) => app.status === "hold").length;

  return {
    openJobCount: jobs.length,
    closingSoonCount: closingSoonJobs.length,
    closingSoonJobs,
    pendingCount,
    reviewingCount,
    passCount: applications.filter((app) => app.status === "pass").length,
    holdCount,
    rejectCount: applications.filter((app) => app.status === "reject").length,
    activeApplications: pendingCount + reviewingCount + holdCount,
    messageCount: applications.filter((app) => app.last_message_at).length,
  };
}

function getActorClosingSoonJobs(jobs: ActorDashboardJob[]) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const oneWeekLater = new Date(startOfToday);
  oneWeekLater.setDate(oneWeekLater.getDate() + 7);

  return jobs
    .filter((job) => {
      if (job.status !== "open" || !job.deadline) return false;
      const deadline = new Date(job.deadline);
      if (Number.isNaN(deadline.getTime())) return false;
      return deadline >= startOfToday && deadline <= oneWeekLater;
    })
    .sort(
      (a, b) =>
        new Date(a.deadline ?? 0).getTime() -
        new Date(b.deadline ?? 0).getTime(),
    )
    .slice(0, 3);
}
