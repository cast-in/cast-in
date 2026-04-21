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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageContainer } from "@/components/page-container";
import {
  listMyApplicationsWithJobs,
  listMyJobsWithCounts,
} from "@/lib/queries/jobs";
import { getJobAvailabilityLabel, isJobAccepting } from "@/lib/job-status";
import { getViewerProfile } from "@/lib/queries/viewer";
import type { ApplicationStatus } from "@/types/enums";

const APPLICATION_STATUS_LABEL: Record<
  ApplicationStatus,
  {
    text: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  pending: { text: "대기", variant: "secondary" },
  reviewing: { text: "검토중", variant: "default" },
  pass: { text: "합격", variant: "default" },
  hold: { text: "보류", variant: "outline" },
  reject: { text: "반려", variant: "destructive" },
};

function formatDeadline(iso: string | null) {
  if (!iso) return "상시모집";
  const deadline = new Date(iso);
  return `${deadline.getMonth() + 1}월 ${deadline.getDate()}일 마감`;
}

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
      return job.status !== "draft" && (job.status === "closed" || !isJobAccepting(job));
    }
    return job.status === "draft";
  });

  return (
    <PageContainer
      pageTitle="공고 관리"
      description="내가 올린 공고와 지원자 현황을 한눈에 확인해요."
      actions={
        <Link href="/jobs/new" className={buttonVariants()}>
          새 공고 만들기
        </Link>
      }
    >
      {errorMessage && <ErrorCard message={errorMessage} />}

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard label="전체 지원자" value={totalApplicants} />
        <SummaryCard label="검토중" value={totalChecked} />
        <SummaryCard label="합격" value={totalPass} />
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
              variant: filter === value ? "default" : "outline",
              size: "sm",
            })}
          >
            {label}
          </Link>
        ))}
      </div>

      <Card>
        {filteredJobs.length === 0 ? (
          <CardContent className="p-10 text-center text-muted-foreground">
            {errorMessage
              ? "잠시 후 다시 시도해주세요."
              : "조건에 맞는 공고가 없어요."}
          </CardContent>
        ) : (
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
                    <Badge
                      variant={isJobAccepting(job) ? "default" : "secondary"}
                    >
                      {getJobAvailabilityLabel(job)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {job.applicant_count} / {job.reviewing_count} / {job.pass_count}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/jobs/${job.id}`}
                        className={buttonVariants({
                          variant: "secondary",
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
        )}
      </Card>
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
    <PageContainer
      pageTitle="지원 관리"
      description="지원한 공고의 상태와 최근 대화 흐름을 확인하고 다음 액션을 준비해요."
    >
      {errorMessage && <ErrorCard message={errorMessage} />}

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard label="지원 완료" value={applications.length} />
        <SummaryCard label="검토중" value={reviewingCount} />
        <SummaryCard label="합격" value={passCount} />
      </div>

      <Card>
        {applications.length === 0 ? (
          <CardContent className="p-10 text-center text-muted-foreground">
            {errorMessage
              ? "잠시 후 다시 시도해주세요."
              : "아직 지원한 공고가 없어요. 오디션 탐색에서 공고를 확인해보세요."}
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>공고명</TableHead>
                <TableHead>지원 메모</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>최근 메시지</TableHead>
                <TableHead>상세</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell className="font-medium">
                    <div>{application.job_title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {application.job_region ?? "-"} ·{" "}
                      {formatDeadline(application.deadline)}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {application.memo ?? "메모 없음"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={APPLICATION_STATUS_LABEL[application.status].variant}>
                      {APPLICATION_STATUS_LABEL[application.status].text}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {application.last_message_at
                      ? new Date(application.last_message_at).toLocaleDateString()
                      : "새 메시지 없음"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/jobs/${application.job_id}`}
                        className={buttonVariants({
                          variant: "secondary",
                          size: "sm",
                        })}
                      >
                        공고 보기
                      </Link>
                      <Link
                        href={`/messages?job=${application.job_id}`}
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
        )}
      </Card>

      {applications.length > 0 ? (
        <Card>
          <CardHeader>
            <CardDescription>지금 확인할 상태</CardDescription>
            <CardTitle className="text-xl">대기 {pendingCount}건</CardTitle>
          </CardHeader>
        </Card>
      ) : null}
    </PageContainer>
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

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
      {message}
    </div>
  );
}
