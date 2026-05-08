import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorNotice } from "@/components/ui/error-notice";
import { BackButton } from "@/components/features/back-button";
import { BookmarkButton } from "@/components/features/bookmark-button";
import { PageContainer } from "@/components/page-container";
import { formatDeadline } from "@/lib/format";
import { getJobAvailabilityLabel, isJobAccepting } from "@/lib/job-status";
import { listBookmarkedTargetIds } from "@/lib/queries/bookmarks";
import {
  getJob,
  getMyApplicationForJob,
  listApplicants,
} from "@/lib/queries/jobs";
import { getViewerProfile } from "@/lib/queries/viewer";
import { ApplyForm } from "./apply-form";
import { ApplicantsTable } from "./applicants-table";
import { JobConversationButton } from "./job-conversation-button";

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

    return (
      <PageContainer className={job ? "pb-28" : undefined}>
        {errorMessage && !job ? <BackButton fallbackHref="/talents" /> : null}
        {errorMessage && <ErrorNotice message={errorMessage} />}

        {job ? (
          <>
            <JobDetailHeader
              job={job}
              bookmarked={bookmarkedJobIds.has(job.id)}
              backFallbackHref="/talents"
              showBookmark={false}
            />

            <JobDetailBody job={job} />

            <JobActionBar
              jobId={job.id}
              bookmarked={bookmarkedJobIds.has(job.id)}
              canApply={!application && isJobAccepting(job)}
              applied={Boolean(application)}
            />
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
      {errorMessage && !job ? <BackButton fallbackHref="/jobs" /> : null}
      {errorMessage && <ErrorNotice message={errorMessage} />}

      {job ? (
        <>
          <JobDetailHeader
            job={job}
            bookmarked={bookmarkedJobIds.has(job.id)}
            backFallbackHref="/jobs"
            contextLabel={`지원자 ${applicants.length}명`}
            showBookmark
          />

          <JobDetailBody job={job} />

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

function JobDetailHeader({
  job,
  bookmarked,
  backFallbackHref,
  contextLabel,
  showBookmark = true,
}: {
  job: NonNullable<Awaited<ReturnType<typeof getJob>>>;
  bookmarked: boolean;
  backFallbackHref: string;
  contextLabel?: string;
  showBookmark?: boolean;
}) {
  return (
    <header>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="shrink-0">
            <BackButton fallbackHref={backFallbackHref} />
          </div>
          <h1 className="min-w-0 text-balance text-2xl font-bold leading-tight md:text-3xl">
            {job.title}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {contextLabel ? (
            <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
              {contextLabel}
            </span>
          ) : null}
          <JobStatusIndicator
            accepting={isJobAccepting(job)}
            label={getJobAvailabilityLabel(job)}
          />
          {showBookmark ? (
            <BookmarkButton
              targetType="job"
              targetId={job.id}
              bookmarked={bookmarked}
              redirectTo={`/jobs/${job.id}`}
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}

function JobStatusIndicator({
  accepting,
  label,
}: {
  accepting: boolean;
  label: string;
}) {
  return (
    <span
      className={
        accepting
          ? "inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700"
          : "inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
      }
      aria-label={`공고 상태: ${label}`}
    >
      <span className="size-2 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
}

function JobDetailBody({
  job,
}: {
  job: NonNullable<Awaited<ReturnType<typeof getJob>>>;
}) {
  return (
    <div className="space-y-5">
      <section className="rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">기본 정보</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <JobFact label="지역" value={job.region ?? "협의"} />
          <JobFact label="장르" value={job.genre ?? "미정"} />
          <JobFact label="마감" value={formatDeadline(job.deadline)} />
        </dl>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">모집 내용</h2>
        <p className="mt-4 whitespace-pre-wrap text-base leading-7 text-foreground/85">
          {job.description?.trim() || "아직 상세 설명이 없어요."}
        </p>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">필요 조건</h2>
        {job.requirements.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {job.requirements.map((requirement) => (
              <Badge key={requirement} color="secondary" className="h-8 px-3">
                {requirement}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            등록된 필요 조건이 없어요.
          </p>
        )}
      </section>
    </div>
  );
}

function JobFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold">{value}</dd>
    </div>
  );
}

function JobActionBar({
  jobId,
  bookmarked,
  canApply,
  applied,
}: {
  jobId: string;
  bookmarked: boolean;
  canApply: boolean;
  applied: boolean;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:justify-end">
        <BookmarkButton
          targetType="job"
          targetId={jobId}
          bookmarked={bookmarked}
          redirectTo={`/jobs/${jobId}`}
          compact
          className="size-12 rounded-xl border border-border bg-background hover:bg-muted"
        />
        <JobConversationButton
          jobId={jobId}
          iconOnly
          ariaLabel="문의하기"
          className="size-12 rounded-xl border-border bg-background text-foreground hover:bg-muted"
        />
        {canApply ? (
          <ApplyForm
            jobId={jobId}
            className="h-12 flex-1 text-base sm:w-44 sm:flex-none"
          />
        ) : (
          <Button
            type="button"
            disabled
            className="h-12 flex-1 text-base sm:w-44 sm:flex-none"
          >
            {applied ? "지원 완료" : "지원 마감"}
          </Button>
        )}
      </div>
    </div>
  );
}
