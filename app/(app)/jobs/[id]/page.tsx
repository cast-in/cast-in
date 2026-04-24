import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorNotice } from "@/components/ui/error-notice";
import { BookmarkButton } from "@/components/features/bookmark-button";
import { PageContainer } from "@/components/page-container";
import { APPLICATION_STATUS_META } from "@/lib/application-status";
import { formatDeadline } from "@/lib/format";
import { getJobAvailabilityLabel, isJobAccepting } from "@/lib/job-status";
import { listBookmarkedTargetIds } from "@/lib/queries/bookmarks";
import {
  getJob,
  getMyApplicationForJob,
  listApplicants,
} from "@/lib/queries/jobs";
import { getViewerProfile } from "@/lib/queries/viewer";
import { cn } from "@/lib/utils";
import { ApplyForm } from "./apply-form";
import { ApplicantsTable } from "./applicants-table";

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
  const bookmarkedJobIds = job
    ? await listBookmarkedTargetIds("job", [job.id])
    : new Set<string>();

  if (activeRole === "actor") {
    let application: Awaited<ReturnType<typeof getMyApplicationForJob>> = null;

    try {
      application = await getMyApplicationForJob(id);
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "지원 상태를 불러오지 못했어요.";
    }

    const canApply = Boolean(job && !application && isJobAccepting(job));

    return (
      <PageContainer className={canApply ? "pb-24 md:pb-0" : undefined}>
        <Link
          href="/talents"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          ← 공고 찾기
        </Link>

        {errorMessage && <ErrorNotice message={errorMessage} />}

        {job ? (
          <>
            <JobSummary
              job={job}
              subtitle="공고 상세"
              bookmarked={bookmarkedJobIds.has(job.id)}
            />

            <Card id="apply-section" className="scroll-mt-24">
              <CardHeader>
                <CardTitle className="text-xl">
                  {application
                    ? "지원했어요"
                    : isJobAccepting(job)
                      ? "지원해볼까요?"
                      : "지원 기간이 끝났어요"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {application ? (
                  <>
                    <Badge variant={APPLICATION_STATUS_META[application.status].variant}>
                      {APPLICATION_STATUS_META[application.status].label}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      내가 남긴 말: {application.memo ?? "남긴 말이 없어요"}
                    </div>
                    <Link href={`/messages?job=${job.id}`} className={buttonVariants()}>
                      대화 보기
                    </Link>
                  </>
                ) : isJobAccepting(job) ? (
                  <ApplyForm jobId={job.id} />
                ) : (
                  <div className="text-sm text-muted-foreground">
                    마감된 공고예요. 저장해두면 나중에 다시 볼 수 있어요.
                  </div>
                )}
              </CardContent>
            </Card>

            {canApply ? (
              <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-4 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
                <Link
                  href="#apply-section"
                  className={cn(buttonVariants({ size: "lg" }), "w-full")}
                >
                  지원하고 대화 시작하기
                </Link>
              </div>
            ) : null}
          </>
        ) : null}
      </PageContainer>
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
    <PageContainer>
      <Link
        href="/jobs"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        ← 공고 목록
      </Link>

      {errorMessage && <ErrorNotice message={errorMessage} />}

      {job ? (
        <>
          <JobSummary
            job={job}
            subtitle={`지원자 ${applicants.length}명`}
            bookmarked={bookmarkedJobIds.has(job.id)}
          />

          {applicants.length === 0 ? (
            <EmptyState
              title="아직 지원자가 없어요"
              description="공고가 노출되면 지원자 현황이 이곳에 쌓여요."
            />
          ) : (
            <Card>
              <ApplicantsTable applicants={applicants} />
            </Card>
          )}
        </>
      ) : null}
    </PageContainer>
  );
}

function JobSummary({
  job,
  subtitle,
  bookmarked,
}: {
  job: NonNullable<Awaited<ReturnType<typeof getJob>>>;
  subtitle: string;
  bookmarked: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant={isJobAccepting(job) ? "default" : "secondary"}>
              {getJobAvailabilityLabel(job)}
            </Badge>
          </div>
        </div>
        <BookmarkButton
          targetType="job"
          targetId={job.id}
          bookmarked={bookmarked}
          redirectTo={`/jobs/${job.id}`}
        />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
      <p className="text-sm text-muted-foreground">
        {formatDeadline(job.deadline)} · {subtitle}
      </p>
      <dl className="grid gap-2 pt-2 sm:grid-cols-3">
        <JobSummaryMetric label="지역" value={job.region ?? "협의"} />
        <JobSummaryMetric label="장르" value={job.genre ?? "미정"} />
        <JobSummaryMetric label="마감" value={formatDeadline(job.deadline)} />
      </dl>
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

function JobSummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card p-3 ring-1 ring-border/70">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
