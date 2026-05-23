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
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageContainer } from "@/components/page-container";
import type { ApplicationWithJob } from "@/lib/queries/jobs";
import {
  listMyApplicationsWithJobs,
  listMyJobsWithCounts,
} from "@/lib/queries/jobs";
import { ErrorNotice } from "@/components/ui/error-notice";
import { APPLICATION_STATUS_META } from "@/lib/application-status";
import { formatDate, formatDeadline } from "@/lib/format";
import { getJobAvailabilityLabel, isJobAccepting } from "@/lib/job-status";
import { getViewerProfile } from "@/lib/queries/viewer";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { activeRole } = await getViewerProfile();
  if (!activeRole) return null;
  const { status } = await searchParams;
  const jobFilter =
    status === "closed" || status === "draft" || status === "open"
      ? status
      : "all";

  return activeRole === "casting" ? (
    <CastingJobsPage filter={jobFilter} />
  ) : (
    <ActorJobsPage />
  );
}

async function CastingJobsPage({
  filter,
}: {
  filter: "all" | "open" | "closed" | "draft";
}) {
  let jobs: Awaited<ReturnType<typeof listMyJobsWithCounts>> = [];
  let errorMessage: string | null = null;

  try {
    jobs = await listMyJobsWithCounts();
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "공고 목록을 불러오지 못했어요.";
  }

  const totalApplicants = jobs.reduce((sum, job) => sum + job.applicant_count, 0);
  const totalChecked = jobs.reduce((sum, job) => sum + job.reviewing_count, 0);
  const totalPass = jobs.reduce((sum, job) => sum + job.pass_count, 0);
  const filteredJobs = jobs.filter((job) => {
    if (filter === "all") return true;
    if (filter === "open") return isJobAccepting(job);
    if (filter === "closed") {
      return (
        job.status !== "draft" &&
        (job.status === "closed" || !isJobAccepting(job))
      );
    }
    return job.status === "draft";
  });

  return (
    <PageContainer
      pageTitle="공고 관리"
      actions={
        <Link href="/jobs/new" className={buttonVariants()}>
          새 공고 만들기
        </Link>
      }
    >
      {errorMessage && <ErrorNotice message={errorMessage} />}

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="전체 지원자" value={totalApplicants} />
        <StatCard label="검토 중" value={totalChecked} />
        <StatCard label="합격" value={totalPass} />
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ["all", "전체"],
          ["open", "모집중"],
          ["closed", "마감/종료"],
          ["draft", "임시저장"],
        ].map(([value, label]) => (
          <Link
            key={value}
            href={value === "all" ? "/jobs" : `/jobs?status=${value}`}
            className={buttonVariants({
              color: filter === value ? "primary" : "neutral",
              variant: filter === value ? "fill" : "outline",
              size: "sm",
            })}
          >
            {label}
          </Link>
        ))}
      </div>

      {filteredJobs.length === 0 ? (
        <EmptyState
          title={
            errorMessage
              ? "공고를 보여줄 수 없어요"
              : "조건에 맞는 공고가 없어요"
          }
          description={errorMessage ? "잠시 후 다시 확인해주세요." : undefined}
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>공고명</TableHead>
                <TableHead>장르</TableHead>
                <TableHead>지역</TableHead>
                <TableHead>마감</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>지원/검토/합격</TableHead>
                <TableHead>액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-primary hover:underline"
                    >
                      {job.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {job.genre ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {job.region ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDeadline(job.deadline)}
                  </TableCell>
                  <TableCell>
                    <Badge color={isJobAccepting(job) ? "primary" : "secondary"}>
                      {getJobAvailabilityLabel(job)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {job.applicant_count} / {job.reviewing_count} /{" "}
                    {job.pass_count}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/jobs/${job.id}`}
                        className={buttonVariants({
                          color: "secondary",
                          size: "sm",
                        })}
                      >
                        상세
                      </Link>
                      <Link
                        href={`/messages?job=${job.id}`}
                        className={buttonVariants({ size: "sm" })}
                      >
                        메시지
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </PageContainer>
  );
}

async function ActorJobsPage() {
  let applications: Awaited<ReturnType<typeof listMyApplicationsWithJobs>> = [];
  let errorMessage: string | null = null;

  try {
    applications = await listMyApplicationsWithJobs();
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "지원 내역을 불러오지 못했어요.";
  }

  const pendingCount = applications.filter(
    (application) => application.status === "pending",
  ).length;
  const reviewingCount = applications.filter(
    (application) => application.status === "reviewing",
  ).length;
  const passCount = applications.filter(
    (application) => application.status === "pass",
  ).length;

  return (
    <PageContainer pageTitle="지원 관리">
      {errorMessage && <ErrorNotice message={errorMessage} />}

      <div className="grid gap-3 md:grid-cols-3">
        <StatusInsightCard
          title={`${applications.length}건 지원했어요`}
          description="최근 지원한 공고부터 보여드려요."
        />
        <StatusInsightCard
          title={`${reviewingCount}건 검토 중이에요`}
          description="캐스팅팀이 프로필을 확인하고 있어요."
        />
        <StatusInsightCard
          title={
            passCount > 0 ? `${passCount}건 합격했어요` : "결과를 기다리고 있어요"
          }
          description="상태가 바뀌면 알림으로 알려드려요."
        />
      </div>

      {applications.length === 0 ? (
        <EmptyState
          title={
            errorMessage
              ? "지원 내역을 보여줄 수 없어요"
              : "아직 지원한 공고가 없어요"
          }
          description={
            errorMessage
              ? "잠시 후 다시 확인해주세요."
              : "공고를 둘러보고 마음에 드는 역할에 지원해보세요."
          }
          action={
            !errorMessage ? (
              <Link
                href="/talents"
                className={buttonVariants({ color: "secondary", size: "sm" })}
              >
                공고 찾기
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-3">
          {applications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      )}

      {applications.length > 0 ? (
        <StatCard label="다음에 볼 지원" value={`대기 ${pendingCount}건`} />
      ) : null}
    </PageContainer>
  );
}

function StatusInsightCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="min-h-28">
      <CardHeader className="gap-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function ApplicationCard({
  application,
}: {
  application: ApplicationWithJob;
}) {
  const statusMeta = APPLICATION_STATUS_META[application.status];

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="line-clamp-2 text-lg">
              {application.job_title}
            </CardTitle>
            <CardDescription>
              {application.job_region ?? "지역 협의"} ·{" "}
              {application.job_genre ?? "장르 미정"} ·{" "}
              {formatDeadline(application.deadline)}
            </CardDescription>
          </div>
          <Badge
            color={statusMeta.color}
            variant={statusMeta.variant}
            className="shrink-0"
          >
            {statusMeta.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ApplicationProgress status={application.status} />

        <div className="grid gap-2 rounded-lg bg-muted/40 p-3 text-sm md:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">지원일</p>
            <p className="mt-1">{formatDate(application.created_at)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">최근 대화</p>
            <p className="mt-1">
              {application.last_message_at
                ? formatDate(application.last_message_at)
                : "아직 대화가 없어요"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              내가 남긴 말
            </p>
            <p className="mt-1 line-clamp-1">
              {application.memo ?? "남긴 말이 없어요"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/jobs/${application.job_id}`}
            className={buttonVariants({ color: "secondary", size: "sm" })}
          >
            자세히 보기
          </Link>
          <Link
            href={`/messages?job=${application.job_id}`}
            className={buttonVariants({ size: "sm" })}
          >
            대화 보기
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function ApplicationProgress({
  status,
}: {
  status: ApplicationWithJob["status"];
}) {
  const currentStep =
    status === "pending"
      ? 0
      : status === "reviewing" || status === "hold"
        ? 1
        : 2;
  const steps = ["지원", "검토", "결과"] as const;

  return (
    <ol aria-label="지원 진행 단계" className="grid grid-cols-3 gap-2">
      {steps.map((step, index) => {
        const active = index <= currentStep;
        return (
          <li key={step} className="space-y-2">
            <div
              className={
                active ? "h-1.5 rounded-full bg-primary" : "h-1.5 rounded-full bg-muted"
              }
            />
            <p
              className={
                active
                  ? "text-xs font-medium text-foreground"
                  : "text-xs text-muted-foreground"
              }
            >
              {step}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
