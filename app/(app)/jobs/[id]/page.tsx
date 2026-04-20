import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getJob,
  getMyApplicationForJob,
  listApplicants,
} from "@/lib/queries/jobs";
import { getViewerProfile } from "@/lib/queries/viewer";
import type { ApplicationStatus } from "@/types/enums";

const STATUS: Record<
  ApplicationStatus,
  { text: string; variant: "default" | "secondary" | "outline" | "destructive" }
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

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { activeRole } = await getViewerProfile();
  if (!activeRole) return null;

  let job: Awaited<ReturnType<typeof getJob>> = null;
  let errorMessage: string | null = null;

  try {
    job = await getJob(id);
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "공고 정보를 불러오지 못했어요.";
  }

  if (!job && !errorMessage) notFound();

  if (activeRole === "actor") {
    let application: Awaited<ReturnType<typeof getMyApplicationForJob>> = null;

    try {
      application = await getMyApplicationForJob(id);
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "지원 상태를 불러오지 못했어요.";
    }

    return (
      <section className="space-y-6">
        <Link
          href="/talents"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          ← 오디션 탐색
        </Link>

        {errorMessage && <ErrorCard message={errorMessage} />}

        {job ? (
          <>
            <JobSummary job={job} subtitle="오디션 상세" />

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">내 지원 상태</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {application ? (
                  <>
                    <Badge variant={STATUS[application.status].variant}>
                      {STATUS[application.status].text}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      지원 메모: {application.memo ?? "메모 없음"}
                    </div>
                    <Link href={`/messages?job=${job.id}`} className={buttonVariants()}>
                      메시지 보기
                    </Link>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    아직 이 공고에 지원하지 않았어요.
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </section>
    );
  }

  let applicants: Awaited<ReturnType<typeof listApplicants>> = [];
  try {
    if (job) applicants = await listApplicants(id);
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "지원자 정보를 불러오지 못했어요.";
  }

  return (
    <section className="space-y-6">
      <Link
        href="/jobs"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        ← 공고 목록
      </Link>

      {errorMessage && <ErrorCard message={errorMessage} />}

      {job ? (
        <>
          <JobSummary job={job} subtitle={`지원자 ${applicants.length}명`} />

          <Card>
            {applicants.length === 0 ? (
              <CardContent className="p-10 text-center text-muted-foreground">
                아직 지원자가 없어요.
              </CardContent>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>지원 사유</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applicants.map((applicant) => (
                    <TableRow key={applicant.id}>
                      <TableCell className="font-medium">
                        {applicant.actor_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {applicant.memo ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS[applicant.status].variant}>
                          {STATUS[applicant.status].text}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/messages?applicant=${applicant.actor_id}`}
                          className={buttonVariants({ size: "sm" })}
                        >
                          메시지
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </>
      ) : null}
    </section>
  );
}

function JobSummary({
  job,
  subtitle,
}: {
  job: NonNullable<Awaited<ReturnType<typeof getJob>>>;
  subtitle: string;
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {job.genre ?? "-"} · {job.region ?? "-"}
      </div>
      <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
      <p className="text-sm text-muted-foreground">
        {formatDeadline(job.deadline)} · {subtitle}
      </p>
      {job.description ? (
        <p className="mt-3 whitespace-pre-wrap">{job.description}</p>
      ) : null}
      {job.requirements.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {job.requirements.map((requirement) => (
            <Badge key={requirement} variant="secondary">
              {requirement}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
      {message}
    </div>
  );
}
