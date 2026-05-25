import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, ChevronRight, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorNotice } from "@/components/ui/error-notice";
import { BackButton } from "@/components/features/back-button";
import { PageContainer } from "@/components/page-container";
import { formatDeadline } from "@/lib/format";
import {
  formatJobAgeGroupsLabel,
  formatJobGenderLabel,
  formatJobPlatformsLabel,
  formatJobRoleType,
} from "@/lib/job-filter-options";
import { getJobAvailabilityLabel, isJobAccepting } from "@/lib/job-status";
import {
  getJob,
  getJobDetailMeta,
  getMyApplicationForJob,
  listJobApplicationQuestions,
  listApplicants,
  type JobDetailMeta,
} from "@/lib/queries/jobs";
import { getViewerProfile } from "@/lib/queries/viewer";
import { cn } from "@/lib/utils";
import { ApplyForm } from "./apply-form";
import { ApplicantsTable } from "./applicants-table";
import { closeJobAction } from "./actions";

type Job = NonNullable<Awaited<ReturnType<typeof getJob>>>;

const fallbackJobMedia = [
  "/job-posters/sample-1.png",
  "/job-posters/sample-2.png",
  "/job-posters/sample-1.png",
] as const;

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const source = Array.isArray(sp.from) ? sp.from[0] : sp.from;
  const fromDiscover = source === "discover";
  const { user, activeRole } = await getViewerProfile();
  if (!activeRole) return null;

  let job: Awaited<ReturnType<typeof getJob>> = null;
  let detailMeta: JobDetailMeta | null = null;
  let errorMessage: string | null = null;

  try {
    job = await getJob(id);
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "공고 정보를 불러오지 못했어요.";
  }

  if (!job && !errorMessage) notFound();

  if (job) {
    try {
      detailMeta = await getJobDetailMeta(job);
    } catch (error) {
      errorMessage =
        error instanceof Error
          ? error.message
          : "공고 상세 정보를 불러오지 못했어요.";
      detailMeta = getFallbackDetailMeta();
    }
  }

  if (activeRole === "actor") {
    let application: Awaited<ReturnType<typeof getMyApplicationForJob>> = null;
    let applicationQuestions: Awaited<
      ReturnType<typeof listJobApplicationQuestions>
    > = [];
    let applicationLoaded = true;

    try {
      [application, applicationQuestions] = await Promise.all([
        getMyApplicationForJob(id),
        listJobApplicationQuestions(id),
      ]);
    } catch (error) {
      applicationLoaded = false;
      errorMessage =
        error instanceof Error ? error.message : "지원 상태를 불러오지 못했어요.";
    }

    return (
      <PageContainer size="wide" className="space-y-6">
        {errorMessage && !job ? <BackButton fallbackHref="/talents" /> : null}
        {errorMessage && <ErrorNotice message={errorMessage} />}

        {job && detailMeta ? (
          <JobDetailView
            job={job}
            detailMeta={detailMeta}
            backFallbackHref="/talents"
            canApply={!application && applicationLoaded && isJobAccepting(job)}
            applied={Boolean(application)}
            applicationQuestions={applicationQuestions}
          />
        ) : null}
      </PageContainer>
    );
  }

  const isOwnJob = Boolean(job && user?.id === job.casting_id);
  let applicants: Awaited<ReturnType<typeof listApplicants>> = [];
  if (isOwnJob) {
    try {
      applicants = await listApplicants(id);
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "지원자 정보를 불러오지 못했어요.";
    }
  }

  return (
    <PageContainer size="wide" className="space-y-6">
      {errorMessage && !job ? <BackButton fallbackHref="/jobs" /> : null}
      {errorMessage && <ErrorNotice message={errorMessage} />}

      {job && detailMeta ? (
        <>
          <JobDetailView
            job={job}
            detailMeta={{
              ...detailMeta,
              applicant_count: isOwnJob
                ? applicants.length || detailMeta.applicant_count
                : detailMeta.applicant_count,
            }}
            backFallbackHref={fromDiscover || !isOwnJob ? "/discover" : "/jobs"}
            contextLabel={isOwnJob ? `지원자 ${applicants.length}명` : undefined}
            actionSlot={isOwnJob ? <CastingOwnerActions job={job} /> : null}
          />

          {isOwnJob ? (
            applicants.length === 0 ? (
              <EmptyState
                title="아직 지원자가 없어요"
                description="공고가 노출되면 지원자 현황이 이곳에 쌓여요."
              />
            ) : (
              <Card className="rounded-3xl py-0 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
                <div className="p-5">
                  <ApplicantsTable applicants={applicants} />
                </div>
              </Card>
            )
          ) : null}
        </>
      ) : null}
    </PageContainer>
  );
}

function JobDetailView({
  job,
  detailMeta,
  backFallbackHref,
  contextLabel,
  canApply,
  applied,
  actionSlot,
  applicationQuestions = [],
}: {
  job: Job;
  detailMeta: JobDetailMeta;
  backFallbackHref: string;
  contextLabel?: string;
  canApply?: boolean;
  applied?: boolean;
  applicationQuestions?: Awaited<ReturnType<typeof listJobApplicationQuestions>>;
  actionSlot?: ReactNode;
}) {
  const resolvedActionSlot =
    actionSlot === undefined
      ? getActorActionSlot({
          job,
          canApply: Boolean(canApply),
          applied: Boolean(applied),
          applicationQuestions,
        })
      : actionSlot;

  return (
    <div className="space-y-6">
      <JobHero
        job={job}
        backFallbackHref={backFallbackHref}
        contextLabel={contextLabel}
        actionSlot={resolvedActionSlot}
      />

      <CastingManagerCard
        castingId={job.casting_id}
        detailMeta={detailMeta}
      />

      <JobStatsStrip job={job} detailMeta={detailMeta} />

      <div className="grid gap-6 lg:grid-cols-2">
        <DetailCard title="기본 정보">
          <JobInfoList
            items={[
              {
                label: "제작사/브랜드",
                value: job.production_name ?? "미등록",
              },
              {
                label: "지역",
                value: job.region ?? "지역 협의",
              },
              {
                label: "장르",
                value: job.genre ?? "장르 미정",
              },
              {
                label: "플랫폼/채널",
                value: formatJobPlatformsLabel(job.platforms),
              },
              {
                label: "마감",
                value: formatDeadline(job.deadline),
              },
            ]}
          />
        </DetailCard>

        <DetailCard title="모집 조건">
          <JobInfoList
            items={[
              {
                label: "역할명",
                value: job.role_name ?? "역할명 협의",
              },
              {
                label: "역할",
                value: formatJobRoleType(job.role_type),
              },
              {
                label: "성별 / 나이",
                value: `${formatJobGenderLabel(job.target_genders)} · ${formatJobAgeTargetLabel(job)}`,
              },
              {
                label: "출연료",
                value: job.fee_text ?? "협의",
              },
              {
                label: "촬영 일정",
                value: job.shooting_schedule ?? "일정 협의",
              },
            ]}
          />
        </DetailCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DetailCard title="모집 내용">
          <p className="whitespace-pre-wrap text-sm font-medium leading-8 text-foreground/75 md:text-base">
            {job.description?.trim() || "아직 상세 설명이 없어요."}
          </p>
        </DetailCard>

        <DetailCard title="기타 조건">
          {job.requirements.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {job.requirements.map((requirement) => (
                <Badge
                  key={requirement}
                  color="primary"
                  variant="soft-outline"
                  className="h-8 rounded-full px-3"
                >
                  {requirement}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              등록된 필요 조건이 없어요.
            </p>
          )}
        </DetailCard>
      </div>

      <DetailCard title="이미지 및 영상">
        <JobMediaGallery job={job} />
      </DetailCard>
    </div>
  );
}

function JobHero({
  job,
  backFallbackHref,
  contextLabel,
  actionSlot,
}: {
  job: Job;
  backFallbackHref: string;
  contextLabel?: string;
  actionSlot: ReactNode;
}) {
  const accepting = isJobAccepting(job);
  const statusLabel = getJobAvailabilityLabel(job);

  return (
    <section className="rounded-[28px] bg-[linear-gradient(112deg,#06172f,#0c5d48)] px-5 py-6 text-white shadow-[0_28px_80px_rgba(15,23,42,0.18)] md:px-8 md:py-8">
      <div className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-4 md:items-center">
          <Link
            href={backFallbackHref}
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/40"
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
            <span className="sr-only">이전 화면으로 돌아가기</span>
          </Link>
          <div className="min-w-0">
            <h1 className="text-balance text-3xl font-extrabold tracking-normal md:text-4xl">
              {job.title}
            </h1>
            <span
              className={cn(
                "mt-3 inline-flex items-center gap-2 text-sm font-bold",
                accepting ? "text-primary" : "text-white/65",
              )}
              aria-label={`공고 상태: ${statusLabel}`}
            >
              <span className="size-2 rounded-full bg-current" aria-hidden="true" />
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {contextLabel ? (
            <span className="text-sm font-bold text-white/70">{contextLabel}</span>
          ) : null}
          {actionSlot}
        </div>
      </div>
    </section>
  );
}

function getActorActionSlot({
  job,
  canApply,
  applied,
  applicationQuestions,
}: {
  job: Job;
  canApply: boolean;
  applied: boolean;
  applicationQuestions: Awaited<ReturnType<typeof listJobApplicationQuestions>>;
}) {
  return canApply ? (
    <ApplyForm
      jobId={job.id}
      questions={applicationQuestions}
      className="h-11 rounded-xl px-7 text-base font-bold sm:w-auto"
    />
  ) : (
    <Button
      type="button"
      disabled
      className="h-11 rounded-xl px-7 text-base font-bold sm:w-auto"
    >
      {applied ? "지원 완료" : "지원 마감"}
    </Button>
  );
}

function CastingOwnerActions({ job }: { job: Job }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Link
        href={`/jobs/${job.id}/edit`}
        className={buttonVariants({
          color: "neutral",
          variant: "soft-outline",
          className: "h-11 rounded-xl px-5 text-base font-bold",
        })}
      >
        공고 수정
      </Link>
      {job.status !== "closed" && job.status !== "draft" ? (
        <form action={closeJobAction}>
          <input type="hidden" name="job_id" value={job.id} />
          <Button
            type="submit"
            color="destructive"
            variant="soft-outline"
            className="h-11 w-full rounded-xl px-5 text-base font-bold"
          >
            공고 마감
          </Button>
        </form>
      ) : null}
    </div>
  );
}

function CastingManagerCard({
  castingId,
  detailMeta,
}: {
  castingId: string;
  detailMeta: JobDetailMeta;
}) {
  const companyLabel = detailMeta.casting_company_name ?? "소속 미등록";

  return (
    <section className="rounded-3xl bg-card p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] ring-1 ring-foreground/10 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-extrabold tracking-normal">
          캐스팅 담당자
        </h2>
        <Link
          href={`/castings/${castingId}`}
          className={buttonVariants({
            color: "neutral",
            variant: "ghost",
            size: "sm",
            className: "self-start sm:self-auto",
          })}
        >
          프로필 보러 가기
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      <div className="mt-5">
        <div className="flex items-center gap-4">
          <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-gray-100 text-gray-400 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:ring-gray-700">
            {detailMeta.casting_avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={detailMeta.casting_avatar_url}
                alt={`${detailMeta.casting_name} 프로필 사진`}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound aria-hidden="true" className="size-7 stroke-[1.6]" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold">{detailMeta.casting_name}</p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              {companyLabel} · 캐스팅 담당자 · 등록 공고{" "}
              {detailMeta.casting_job_count.toLocaleString("ko-KR")}건
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function JobStatsStrip({
  job,
  detailMeta,
}: {
  job: Job;
  detailMeta: JobDetailMeta;
}) {
  return (
    <section className="grid gap-3 rounded-3xl bg-card p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)] ring-1 ring-foreground/10 sm:grid-cols-2 lg:grid-cols-5">
      <StatCell
        label="총 지원자"
        value={`${detailMeta.applicant_count.toLocaleString("ko-KR")}명`}
      />
      <StatCell label="마감일" value={formatDeadlineDate(job.deadline)} />
      <StatCell label="장르" value={job.genre ?? "미정"} />
      <StatCell label="지역" value={job.region ?? "협의"} />
      <StatCell label="상태" value={getJobAvailabilityLabel(job)} />
    </section>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <dl className="rounded-2xl bg-muted/35 px-4 py-3">
      <dt className="text-xs font-bold text-muted-foreground">{label}</dt>
      <dd className="mt-2 truncate text-xl font-extrabold tracking-normal">
        {value}
      </dd>
    </dl>
  );
}

function DetailCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="gap-0 rounded-3xl py-0 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
      <section className="p-5 md:p-6">
        <h2 className="text-2xl font-extrabold tracking-normal">{title}</h2>
        <div className="mt-5">{children}</div>
      </section>
    </Card>
  );
}

type JobInfoItem = {
  label: string;
  value: string;
};

function JobInfoList({ items }: { items: JobInfoItem[] }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="min-w-0 rounded-2xl bg-muted/35 p-4">
          <dt className="text-xs font-bold text-muted-foreground">
            {item.label}
          </dt>
          <dd className="mt-1 break-words text-sm font-bold leading-6">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function JobMediaGallery({ job }: { job: Job }) {
  const mediaUrls = getJobMediaUrls(job);

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(16rem,0.55fr)]">
      <MediaTile
        src={mediaUrls[0]}
        alt={`${job.title} 대표 이미지`}
        className="aspect-[16/9]"
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <MediaTile src={mediaUrls[1]} alt={`${job.title} 참고 이미지 1`} />
        <MediaTile src={mediaUrls[2]} alt={`${job.title} 참고 이미지 2`} />
      </div>
    </div>
  );
}

function MediaTile({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl bg-muted ring-1 ring-foreground/10",
        className ?? "aspect-[16/9]",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover object-center"
        loading="lazy"
      />
    </div>
  );
}

function getJobMediaUrls(job: Job) {
  const mediaUrls = job.media_urls.filter((url) => url.trim().length > 0);
  const urls = mediaUrls.length > 0 ? [...mediaUrls] : [...fallbackJobMedia];

  while (urls.length < 3) {
    urls.push(fallbackJobMedia[urls.length % fallbackJobMedia.length]);
  }

  return urls.slice(0, 3);
}

function formatDeadlineDate(iso: string | null) {
  return formatDeadline(iso).replace(" 마감", "");
}

function formatJobAgeTargetLabel(
  job: Pick<Job, "target_age_groups" | "target_age_min" | "target_age_max">,
) {
  if (job.target_age_min !== null && job.target_age_max !== null) {
    return `${job.target_age_min}~${job.target_age_max}세`;
  }
  if (job.target_age_min !== null) return `${job.target_age_min}세 이상`;
  if (job.target_age_max !== null) return `${job.target_age_max}세 이하`;
  return formatJobAgeGroupsLabel(job.target_age_groups);
}

function getFallbackDetailMeta(): JobDetailMeta {
  return {
    applicant_count: 0,
    casting_avatar_url: null,
    casting_company_name: null,
    casting_contact: null,
    casting_intro: null,
    casting_job_count: 0,
    casting_name: "캐스팅 담당자",
  };
}
