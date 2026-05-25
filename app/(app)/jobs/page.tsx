import type { ReactNode } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageContainer } from "@/components/page-container";
import type {
  Applicant,
  ApplicationWithJob,
  JobWithCounts,
} from "@/lib/queries/jobs";
import {
  listApplicants,
  listMyApplicationsWithJobs,
  listMyJobsWithCounts,
} from "@/lib/queries/jobs";
import { ErrorNotice } from "@/components/ui/error-notice";
import { formatDate, formatDeadline } from "@/lib/format";
import {
  formatJobAudienceLabel,
  formatJobRoleType,
} from "@/lib/job-filter-options";
import { getJobAvailabilityLabel, isJobAccepting } from "@/lib/job-status";
import { getViewerProfile } from "@/lib/queries/viewer";
import { cn } from "@/lib/utils";
import type { ApplicationStatus } from "@/types/enums";
import { ApplicationStatusSelect } from "./application-status-select";
import { ActorApplicationSort } from "./actor-application-sort";
import { JobConversationButton } from "./[id]/job-conversation-button";

const CASTING_APPLICANT_PAGE_SIZE = 4;
const ACTOR_APPLICATION_PAGE_SIZE = 7;

type CastingJobFilter = "all" | "open" | "closed" | "draft";
type CastingApplicantFilter = "all" | "reviewing" | "pass" | "hold" | "reject";
type ActorApplicationFilter =
  | "all"
  | "pending"
  | "reviewing"
  | "pass"
  | "reject";
type ActorApplicationSortValue = "latest" | "oldest";

const fallbackJobPosterImages = [
  "/job-posters/sample-1.png",
  "/job-posters/sample-2.png",
] as const;

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { activeRole } = await getViewerProfile();
  if (!activeRole) return null;
  const params = await searchParams;
  const status = asString(params.status);
  const jobFilter =
    status === "closed" || status === "draft" || status === "open"
      ? status
      : "all";
  const selectedJobId = asString(params.job);
  const castingApplicantFilter = parseCastingApplicantFilter(
    asString(params.application_status),
  );
  const castingApplicantPage = parsePage(params.applicant_page);
  const actorFilter = parseActorApplicationFilter(status);
  const actorSort = parseActorApplicationSort(asString(params.sort));
  const actorPage = parsePage(params.page);

  return activeRole === "casting" ? (
    <CastingJobsPage
      filter={jobFilter}
      selectedJobId={selectedJobId}
      applicantFilter={castingApplicantFilter}
      applicantPage={castingApplicantPage}
    />
  ) : (
    <ActorJobsPage filter={actorFilter} page={actorPage} sort={actorSort} />
  );
}

async function CastingJobsPage({
  filter,
  selectedJobId,
  applicantFilter,
  applicantPage,
}: {
  filter: CastingJobFilter;
  selectedJobId: string;
  applicantFilter: CastingApplicantFilter;
  applicantPage: number;
}) {
  let jobs: Awaited<ReturnType<typeof listMyJobsWithCounts>> = [];
  let applicants: Awaited<ReturnType<typeof listApplicants>> = [];
  let errorMessage: string | null = null;

  try {
    jobs = await listMyJobsWithCounts();
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "공고 목록을 불러오지 못했어요.";
  }

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
  const selectedJob =
    filteredJobs.find((job) => job.id === selectedJobId) ??
    filteredJobs[0] ??
    null;

  if (selectedJob) {
    try {
      applicants = await listApplicants(selectedJob.id);
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "지원자 정보를 불러오지 못했어요.";
    }
  }

  const applicantFilterOptions = getCastingApplicantFilterOptions(applicants);
  const filteredApplicants = applicants.filter((applicant) =>
    matchesCastingApplicantFilter(applicant.status, applicantFilter),
  );
  const totalApplicantPages = Math.max(
    1,
    Math.ceil(filteredApplicants.length / CASTING_APPLICANT_PAGE_SIZE),
  );
  const currentApplicantPage = Math.min(applicantPage, totalApplicantPages);
  const startIndex = (currentApplicantPage - 1) * CASTING_APPLICANT_PAGE_SIZE;
  const visibleApplicants = filteredApplicants.slice(
    startIndex,
    startIndex + CASTING_APPLICANT_PAGE_SIZE,
  );

  return (
    <PageContainer
      pageTitle="공고 관리"
      size="wide"
      className="max-w-[1500px] pb-16 pt-4 md:pt-8"
      actions={
        <>
          <Link
            href="/jobs?status=draft"
            className={buttonVariants({
              color: "neutral",
              variant: "outline",
              className: "border-foreground/20",
            })}
          >
            임시저장
          </Link>
          <Link
            href="/jobs/new"
            className={buttonVariants({
              color: "primary",
              variant: "fill",
            })}
          >
            <Plus aria-hidden="true" className="size-4" />
            공고 올리기
          </Link>
        </>
      }
    >
      {errorMessage && <ErrorNotice message={errorMessage} />}

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.9fr)]">
        <CastingJobList
          jobs={filteredJobs}
          selectedJobId={selectedJob?.id ?? null}
          filter={filter}
        />
        <CastingApplicantBoard
          selectedJob={selectedJob}
          applicants={visibleApplicants}
          applicantFilter={applicantFilter}
          applicantFilterOptions={applicantFilterOptions}
          currentPage={currentApplicantPage}
          totalApplicants={filteredApplicants.length}
          totalPages={totalApplicantPages}
          filter={filter}
        />
      </div>
    </PageContainer>
  );
}

function CastingJobList({
  jobs,
  selectedJobId,
  filter,
}: {
  jobs: JobWithCounts[];
  selectedJobId: string | null;
  filter: CastingJobFilter;
}) {
  return (
    <Card className="h-[680px] gap-0 rounded-2xl py-0">
      <section className="flex h-full min-h-0 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold tracking-normal">나의 공고</h2>
          {filter !== "all" ? (
            <Link
              href="/jobs"
              className="text-sm font-bold text-primary hover:underline"
            >
              전체 보기
            </Link>
          ) : null}
        </div>

        <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
          {jobs.length === 0 ? (
            <div className="grid h-full place-items-center">
              <EmptyState
                title="공고가 없어요"
                description="공고를 올리면 지원자 현황을 한곳에서 볼 수 있어요."
                className="min-h-0 bg-transparent py-0 ring-0"
              />
            </div>
          ) : (
            <ul className="space-y-3">
              {jobs.map((job) => (
                <li key={job.id}>
                  <Link
                    href={buildCastingJobsHref({
                      filter,
                      selectedJobId: job.id,
                      applicantFilter: "all",
                      applicantPage: 1,
                    })}
                    aria-current={selectedJobId === job.id ? "page" : undefined}
                    className={cn(
                      "grid grid-cols-[5.75rem_minmax(0,1fr)_auto] items-center gap-4 rounded-xl border p-3 transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      selectedJobId === job.id
                        ? "border-primary bg-primary-soft/60"
                        : "border-transparent hover:bg-muted/60",
                    )}
                  >
                    <JobPoster job={job} />
                    <span className="min-w-0">
                      <span className="line-clamp-2 text-base font-extrabold leading-snug">
                        {job.title}
                      </span>
                      <span className="mt-2 block text-sm font-medium text-muted-foreground">
                        {formatCastingJobMeta(job)}
                      </span>
                    </span>
                    <JobStatusBadge job={job} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </Card>
  );
}

function CastingApplicantBoard({
  selectedJob,
  applicants,
  applicantFilter,
  applicantFilterOptions,
  currentPage,
  totalApplicants,
  totalPages,
  filter,
}: {
  selectedJob: JobWithCounts | null;
  applicants: Applicant[];
  applicantFilter: CastingApplicantFilter;
  applicantFilterOptions: {
    value: CastingApplicantFilter;
    label: string;
    count: number;
  }[];
  currentPage: number;
  totalApplicants: number;
  totalPages: number;
  filter: CastingJobFilter;
}) {
  return (
    <Card className="min-h-[680px] gap-0 rounded-2xl py-0">
      <section className="flex min-h-[680px] flex-col p-5">
        <h2 className="text-xl font-extrabold tracking-normal">
          지원 상태별로 보기
        </h2>

        {selectedJob ? (
          <>
            <nav aria-label="지원 상태 필터" className="mt-6">
              <ul className="flex flex-wrap items-center gap-2">
                {applicantFilterOptions.map((option) => {
                  const active = option.value === applicantFilter;

                  return (
                    <li key={option.value}>
                      <Link
                        href={buildCastingJobsHref({
                          filter,
                          selectedJobId: selectedJob.id,
                          applicantFilter: option.value,
                          applicantPage: 1,
                        })}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                          active
                            ? "bg-primary-soft text-primary"
                            : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                        )}
                      >
                        <span>{option.label}</span>
                        <span>{option.count}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="mt-6 flex-1 space-y-3">
              {applicants.length === 0 ? (
                <EmptyState
                  title="조건에 맞는 지원자가 없어요"
                  description="다른 상태 필터를 선택해보세요."
                />
              ) : (
                applicants.map((applicant) => (
                  <CastingApplicantCard
                    key={applicant.id}
                    applicant={applicant}
                  />
                ))
              )}
            </div>

            <CastingApplicantsPagination
              selectedJobId={selectedJob.id}
              filter={filter}
              applicantFilter={applicantFilter}
              page={currentPage}
              total={totalApplicants}
              totalPages={totalPages}
            />
          </>
        ) : (
          <div className="grid flex-1 place-items-center">
            <EmptyState
              title="공고가 없어요"
              description="먼저 공고를 올려 지원자를 받아보세요."
              className="min-h-0 bg-transparent py-0 ring-0"
            />
          </div>
        )}
      </section>
    </Card>
  );
}

function CastingApplicantCard({ applicant }: { applicant: Applicant }) {
  const facts = getApplicantFacts(applicant);
  const tags = getApplicantTags(applicant);

  return (
    <article className="grid gap-4 rounded-xl border border-border bg-card p-4 md:grid-cols-[7.5rem_minmax(0,1fr)_auto] md:items-center">
      <ActorPortrait applicant={applicant} />

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="text-2xl font-extrabold tracking-normal">
            {applicant.actor_name}
          </h3>
          {facts.length > 0 ? (
            <p className="text-sm font-medium text-muted-foreground">
              {facts.join(" · ")}
            </p>
          ) : null}
        </div>

        <p className="mt-2 text-sm font-medium text-muted-foreground">
          지원 날짜: {formatApplicantSubmittedAt(applicant.created_at)}
        </p>

        {tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge
                key={tag}
                color="neutral"
                variant="soft-outline"
                className="h-6 rounded-full px-2.5"
              >
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/talents/${applicant.actor_id}`}
            className={buttonVariants({
              color: "neutral",
              variant: "outline",
              size: "sm",
              className: "min-w-28 rounded-lg font-bold",
            })}
          >
            프로필 보기
          </Link>
          <JobConversationButton
            jobId={applicant.job_id}
            actorId={applicant.actor_id}
            label="메시지"
            size="sm"
            color="neutral"
            variant="outline"
            className="min-w-24 rounded-lg font-bold"
          />
        </div>
      </div>

      <div className="flex justify-start md:justify-end">
        <ApplicationStatusSelect
          applicationId={applicant.id}
          applicantName={applicant.actor_name}
          initialStatus={applicant.status}
          className="min-w-36"
        />
      </div>
    </article>
  );
}

function CastingApplicantsPagination({
  selectedJobId,
  filter,
  applicantFilter,
  page,
  total,
  totalPages,
}: {
  selectedJobId: string;
  filter: CastingJobFilter;
  applicantFilter: CastingApplicantFilter;
  page: number;
  total: number;
  totalPages: number;
}) {
  if (total === 0) return null;

  const items = getPaginationItems(page, totalPages);

  return (
    <nav
      aria-label={`지원자 페이지, 총 ${total}명`}
      className="mt-4 flex items-center justify-center gap-2"
    >
      <PaginationLink
        href={buildCastingJobsHref({
          filter,
          selectedJobId,
          applicantFilter,
          applicantPage: Math.max(1, page - 1),
        })}
        disabled={page <= 1}
        label="이전 페이지"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
      </PaginationLink>

      {items.map((item, index) =>
        item === "ellipsis" ? (
          <span
            key={`casting-ellipsis-${index}`}
            className="grid size-9 place-items-center text-sm font-medium text-muted-foreground"
            aria-hidden="true"
          >
            ...
          </span>
        ) : (
          <Link
            key={item}
            href={buildCastingJobsHref({
              filter,
              selectedJobId,
              applicantFilter,
              applicantPage: item,
            })}
            aria-current={page === item ? "page" : undefined}
            className={cn(
              "grid size-9 place-items-center rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              page === item
                ? "border-primary bg-primary text-white"
                : "border-border bg-card text-foreground hover:bg-muted",
            )}
          >
            {item}
          </Link>
        ),
      )}

      <PaginationLink
        href={buildCastingJobsHref({
          filter,
          selectedJobId,
          applicantFilter,
          applicantPage: Math.min(totalPages, page + 1),
        })}
        disabled={page >= totalPages}
        label="다음 페이지"
      >
        <ChevronRight aria-hidden="true" className="size-4" />
      </PaginationLink>
    </nav>
  );
}

function JobPoster({ job }: { job: JobWithCounts }) {
  return (
    <span className="block size-[5.75rem] overflow-hidden rounded-md bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getJobPosterSrc(job)}
        alt={`${job.title} 대표 이미지`}
        className="h-full w-full object-cover object-center"
        loading="lazy"
      />
    </span>
  );
}

function ActorPortrait({ applicant }: { applicant: Applicant }) {
  return (
    <div className="size-[7.5rem] overflow-hidden rounded-md bg-muted">
      {applicant.actor_avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={applicant.actor_avatar_url}
          alt={`${applicant.actor_name} 프로필 사진`}
          className="h-full w-full object-cover object-center"
          loading="lazy"
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-3xl font-extrabold text-muted-foreground">
          {getInitial(applicant.actor_name)}
        </div>
      )}
    </div>
  );
}

function JobStatusBadge({ job }: { job: JobWithCounts }) {
  if (job.status === "draft") {
    return (
      <Badge color="neutral" variant="soft-outline" className="shrink-0">
        임시저장
      </Badge>
    );
  }

  return (
    <Badge
      color={isJobAccepting(job) ? "primary" : "destructive"}
      variant={isJobAccepting(job) ? "soft" : "soft-outline"}
      className="shrink-0"
    >
      {getJobAvailabilityLabel(job)}
    </Badge>
  );
}

function getCastingApplicantFilterOptions(applicants: Applicant[]) {
  const reviewingCount = applicants.filter((applicant) =>
    isReviewingApplicationStatus(applicant.status),
  ).length;

  return [
    { value: "all", label: "전체", count: applicants.length },
    { value: "reviewing", label: "검토 중", count: reviewingCount },
    {
      value: "pass",
      label: "합격",
      count: applicants.filter((applicant) => applicant.status === "pass")
        .length,
    },
    {
      value: "hold",
      label: "보류",
      count: applicants.filter((applicant) => applicant.status === "hold")
        .length,
    },
    {
      value: "reject",
      label: "반려",
      count: applicants.filter((applicant) => applicant.status === "reject")
        .length,
    },
  ] satisfies {
    value: CastingApplicantFilter;
    label: string;
    count: number;
  }[];
}

function matchesCastingApplicantFilter(
  status: ApplicationStatus,
  filter: CastingApplicantFilter,
) {
  if (filter === "all") return true;
  if (filter === "reviewing") return isReviewingApplicationStatus(status);
  return status === filter;
}

function isReviewingApplicationStatus(status: ApplicationStatus) {
  return status === "pending" || status === "reviewing";
}

function buildCastingJobsHref({
  filter,
  selectedJobId,
  applicantFilter,
  applicantPage,
}: {
  filter: CastingJobFilter;
  selectedJobId?: string | null;
  applicantFilter?: CastingApplicantFilter;
  applicantPage?: number;
}) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("status", filter);
  if (selectedJobId) params.set("job", selectedJobId);
  if (applicantFilter && applicantFilter !== "all") {
    params.set("application_status", applicantFilter);
  }
  if (applicantPage && applicantPage > 1) {
    params.set("applicant_page", String(applicantPage));
  }
  const query = params.toString();
  return query ? `/jobs?${query}` : "/jobs";
}

function formatCastingJobMeta(job: JobWithCounts) {
  return [
    job.genre ?? "장르 미정",
    normalizeRegionLabel(job.region),
    formatDeadline(job.deadline),
  ]
    .filter(Boolean)
    .join(" · ");
}

function getApplicantFacts(applicant: Applicant) {
  return [
    applicant.actor_age !== null ? `${applicant.actor_age}세` : null,
    getGenderLabel(applicant.actor_gender),
    normalizeRegionLabel(applicant.actor_region),
    applicant.actor_height_cm !== null ? `${applicant.actor_height_cm}cm` : null,
    applicant.actor_weight_kg !== null ? `${applicant.actor_weight_kg}kg` : null,
  ].filter((value): value is string => Boolean(value));
}

function getApplicantTags(applicant: Applicant) {
  return [
    ...applicant.actor_image_tags,
    ...applicant.actor_genres,
    ...applicant.actor_skills,
  ]
    .filter(Boolean)
    .slice(0, 4);
}

function formatApplicantSubmittedAt(iso: string | null) {
  if (!iso) return "-";
  return formatNumericDate(iso);
}

function getJobPosterSrc(job: JobWithCounts) {
  const mediaUrl = job.media_urls.find(
    (url) => !/\.(mp4|mov|webm)(?:$|\?)/i.test(url),
  );
  if (mediaUrl) return mediaUrl;

  const sum = Array.from(job.id).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0,
  );
  return fallbackJobPosterImages[sum % fallbackJobPosterImages.length];
}

function getGenderLabel(value: string | null) {
  if (value === "male") return "남성";
  if (value === "female") return "여성";
  if (value === "other") return "기타";
  return value?.trim() || null;
}

function getInitial(name: string) {
  return name.trim().slice(0, 1) || "?";
}

async function ActorJobsPage({
  filter,
  page,
  sort,
}: {
  filter: ActorApplicationFilter;
  page: number;
  sort: ActorApplicationSortValue;
}) {
  let applications: Awaited<ReturnType<typeof listMyApplicationsWithJobs>> = [];
  let errorMessage: string | null = null;

  try {
    applications = await listMyApplicationsWithJobs({
      since: getSixMonthsAgoIso(),
    });
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "지원 내역을 불러오지 못했어요.";
  }

  const pendingCount = applications.filter(
    (application) => application.status === "pending",
  ).length;
  const reviewingCount = applications.filter(
    (application) =>
      application.status === "reviewing" || application.status === "hold",
  ).length;
  const passCount = applications.filter(
    (application) => application.status === "pass",
  ).length;
  const rejectCount = applications.filter(
    (application) => application.status === "reject",
  ).length;
  const filteredApplications = applications.filter((application) =>
    matchesActorApplicationFilter(application, filter),
  );
  const sortedApplications = [...filteredApplications].sort((a, b) => {
    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();
    return sort === "oldest" ? aTime - bTime : bTime - aTime;
  });
  const totalPages = Math.max(
    1,
    Math.ceil(sortedApplications.length / ACTOR_APPLICATION_PAGE_SIZE),
  );
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ACTOR_APPLICATION_PAGE_SIZE;
  const visibleApplications = sortedApplications.slice(
    startIndex,
    startIndex + ACTOR_APPLICATION_PAGE_SIZE,
  );
  const filterOptions = [
    { value: "all", label: "전체", count: applications.length },
    { value: "pending", label: "대기", count: pendingCount },
    { value: "reviewing", label: "검토 중", count: reviewingCount },
    { value: "pass", label: "합격", count: passCount },
    { value: "reject", label: "불합격", count: rejectCount },
  ] satisfies {
    value: ActorApplicationFilter;
    label: string;
    count: number;
  }[];

  return (
    <PageContainer size="wide" className="pb-16 pt-4 md:pt-8">
      {errorMessage && <ErrorNotice message={errorMessage} />}

      <header className="space-y-5">
        <div className="space-y-3">
          <h1 className="text-balance text-3xl font-bold tracking-normal text-foreground md:text-4xl">
            내 지원 현황
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            최근 6개월 이내의 지원 내역만 확인할 수 있어요
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <nav aria-label="지원 상태 필터" className="pb-1">
            <ul className="flex flex-wrap items-center gap-2 sm:gap-3">
              {filterOptions.map((option) => {
                const active = option.value === filter;
                return (
                  <li key={option.value}>
                    <Link
                      href={buildActorApplicationsHref({
                        filter: option.value,
                        page: 1,
                        sort,
                      })}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        active
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border bg-card text-foreground hover:bg-muted",
                      )}
                    >
                      <span>{option.label}</span>
                      <span>{option.count}건</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <ActorApplicationSort value={sort} />
        </div>
      </header>

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
      ) : visibleApplications.length === 0 ? (
        <EmptyState
          title="조건에 맞는 지원 내역이 없어요"
          description="다른 상태 필터로 지원 내역을 확인해보세요."
          action={
            <Link
              href={buildActorApplicationsHref({
                filter: "all",
                page: 1,
                sort,
              })}
              className={buttonVariants({ color: "secondary", size: "sm" })}
            >
              전체 보기
            </Link>
          }
        />
      ) : (
        <section aria-label="지원 내역" className="space-y-5">
          {visibleApplications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </section>
      )}

      <ActorApplicationsPagination
        filter={filter}
        page={currentPage}
        sort={sort}
        total={sortedApplications.length}
        totalPages={totalPages}
      />
    </PageContainer>
  );
}

function ApplicationCard({
  application,
}: {
  application: ApplicationWithJob;
}) {
  const status = getActorApplicationStatus(application.status);
  const posterSrc = getApplicationPosterSrc(application);
  const detailItems = [
    application.job_genre ?? "장르 미정",
    normalizeRegionLabel(application.job_region),
    formatJobRoleType(application.job_role_type),
    formatJobAudienceLabel({
      targetAgeGroups: application.job_target_age_groups,
      targetGenders: application.job_target_genders,
    }),
  ];

  return (
    <article className="grid min-h-[140px] gap-6 rounded-xl border border-border bg-card px-5 py-5 ring-1 ring-foreground/[0.03] md:grid-cols-[minmax(310px,1.15fr)_minmax(320px,1fr)] md:items-center lg:grid-cols-[minmax(360px,1.15fr)_minmax(330px,0.95fr)_minmax(210px,0.7fr)_auto] lg:px-8">
      <div className="flex min-w-0 items-center gap-4">
        <div className="size-24 shrink-0 overflow-hidden rounded-md bg-muted">
          {/* Remote Supabase media URLs are user content, so this keeps the existing app pattern of native image rendering. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={posterSrc}
            alt={`${application.job_title} 대표 이미지`}
            className="h-full w-full object-cover object-center"
            loading="lazy"
          />
        </div>

        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/jobs/${application.job_id}`}
              className="line-clamp-2 rounded-md text-lg font-bold leading-snug text-foreground outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {application.job_title}
            </Link>
            <span
              className={cn(
                "inline-flex h-6 shrink-0 items-center rounded-full border px-2 text-xs font-bold",
                status.className,
              )}
            >
              {status.label}
            </span>
          </div>

          <p className="line-clamp-1 text-sm font-medium text-muted-foreground md:text-base">
            {detailItems.join(" · ")}
          </p>

          <p className="text-sm font-medium text-muted-foreground">
            지원일{" "}
            <time
              dateTime={application.created_at}
              className="text-foreground"
            >
              {formatNumericDate(application.created_at)}
            </time>
          </p>
        </div>
      </div>

      <ApplicationProgress application={application} />

      <div className="min-w-0 space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <p className="font-bold text-muted-foreground">최근 메시지</p>
          {application.unread_message_count > 0 ? (
            <Badge size="sm" color="primary" variant="soft-outline">
              안 읽음 {application.unread_message_count}
            </Badge>
          ) : null}
        </div>
        <p className="line-clamp-2 font-medium leading-relaxed text-foreground">
          {application.last_message_body ?? "아직 대화가 없어요."}
        </p>
        {application.last_message_at ? (
          <time
            dateTime={application.last_message_at}
            className="block text-xs font-medium text-muted-foreground"
          >
            {formatDate(application.last_message_at)}
          </time>
        ) : null}
      </div>

      <div className="flex items-center justify-start lg:justify-end">
        <Link
          href={`/messages?job=${application.job_id}`}
          className={cn(
            buttonVariants({
              color: "primary",
              variant: "outline",
              size: "sm",
            }),
            "h-10 px-4 font-bold",
          )}
        >
          메시지 보기
        </Link>
      </div>
    </article>
  );
}

function ApplicationProgress({
  application,
}: {
  application: ApplicationWithJob;
}) {
  const reviewActive =
    application.status === "reviewing" ||
    application.status === "hold" ||
    application.status === "pass" ||
    application.status === "reject";
  const resultActive =
    application.status === "pass" || application.status === "reject";
  const resultTone = application.status === "reject" ? "destructive" : "primary";
  const steps = [
    {
      label: "지원 완료",
      date: application.created_at,
      active: true,
      tone: "primary",
    },
    {
      label: resultActive ? "검토 완료" : reviewActive ? "검토 중" : "검토",
      date: reviewActive ? application.updated_at : null,
      active: reviewActive,
      tone: "primary",
    },
    {
      label: resultActive ? "결과 확인" : "결과",
      date: resultActive ? application.updated_at : null,
      active: resultActive,
      tone: resultTone,
    },
  ] as const;

  return (
    <ol
      aria-label={`${application.job_title} 지원 진행 단계`}
      className="grid grid-cols-3 gap-0"
    >
      {steps.map((step, index) => {
        const nextStep = steps[index + 1];
        return (
          <li
            key={step.label}
            className="relative flex min-w-0 flex-col items-center gap-2 text-center"
          >
            {nextStep ? (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-1/2 top-2.5 h-0.5 w-full",
                  nextStep.active
                    ? nextStep.tone === "destructive"
                      ? "bg-destructive"
                      : "bg-primary"
                    : step.active
                      ? "bg-primary/20"
                      : "bg-muted",
                )}
              />
            ) : null}
            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 grid size-5 place-items-center rounded-full border",
                step.active
                  ? step.tone === "destructive"
                    ? "border-destructive bg-destructive text-white"
                    : "border-primary bg-primary text-white"
                  : "border-muted bg-muted text-muted-foreground",
              )}
            >
              {step.active ? <Check className="size-3.5 stroke-[3]" /> : null}
            </span>
            <span className="space-y-0.5 text-[0.72rem] font-bold leading-tight text-foreground">
              <span className="block">{step.label}</span>
              {step.date ? (
                <time
                  dateTime={step.date}
                  className="block font-medium text-muted-foreground"
                >
                  {formatMonthDay(step.date)}
                </time>
              ) : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function ActorApplicationsPagination({
  filter,
  page,
  sort,
  total,
  totalPages,
}: {
  filter: ActorApplicationFilter;
  page: number;
  sort: ActorApplicationSortValue;
  total: number;
  totalPages: number;
}) {
  if (total === 0) return null;

  const items = getPaginationItems(page, totalPages);

  return (
    <nav
      aria-label={`지원 내역 페이지, 총 ${total}건`}
      className="flex items-center justify-center gap-2 pt-10"
    >
      <PaginationLink
        href={buildActorApplicationsHref({
          filter,
          page: Math.max(1, page - 1),
          sort,
        })}
        disabled={page <= 1}
        label="이전 페이지"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
      </PaginationLink>

      {items.map((item, index) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="grid size-9 place-items-center text-sm font-medium text-muted-foreground"
            aria-hidden="true"
          >
            ...
          </span>
        ) : (
          <Link
            key={item}
            href={buildActorApplicationsHref({ filter, page: item, sort })}
            aria-current={page === item ? "page" : undefined}
            className={cn(
              "grid size-9 place-items-center rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              page === item
                ? "border-primary bg-primary text-white"
                : "border-border bg-card text-foreground hover:bg-muted",
            )}
          >
            {item}
          </Link>
        ),
      )}

      <PaginationLink
        href={buildActorApplicationsHref({
          filter,
          page: Math.min(totalPages, page + 1),
          sort,
        })}
        disabled={page >= totalPages}
        label="다음 페이지"
      >
        <ChevronRight aria-hidden="true" className="size-4" />
      </PaginationLink>
    </nav>
  );
}

function PaginationLink({
  children,
  disabled,
  href,
  label,
}: {
  children: ReactNode;
  disabled: boolean;
  href: string;
  label: string;
}) {
  const className = cn(
    "grid size-9 place-items-center rounded-md border border-border bg-card text-foreground transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 hover:bg-muted",
    disabled && "pointer-events-none opacity-45",
  );

  if (disabled) {
    return (
      <span aria-disabled="true" aria-label={label} className={className}>
        {children}
      </span>
    );
  }

  return (
    <Link href={href} aria-label={label} className={className}>
      {children}
    </Link>
  );
}

function matchesActorApplicationFilter(
  application: ApplicationWithJob,
  filter: ActorApplicationFilter,
) {
  if (filter === "all") return true;
  if (filter === "reviewing") {
    return application.status === "reviewing" || application.status === "hold";
  }
  return application.status === filter;
}

function getActorApplicationStatus(status: ApplicationWithJob["status"]) {
  if (status === "pending") {
    return {
      label: "대기",
      className: "border-blue-500 bg-blue-50 text-blue-600",
    };
  }
  if (status === "reviewing") {
    return {
      label: "검토 중",
      className: "border-primary bg-primary-soft text-primary",
    };
  }
  if (status === "hold") {
    return {
      label: "보류",
      className: "border-border bg-muted text-muted-foreground",
    };
  }
  if (status === "pass") {
    return {
      label: "합격",
      className: "border-primary bg-primary-soft text-primary",
    };
  }
  return {
    label: "불합격",
    className: "border-destructive bg-destructive/10 text-destructive",
  };
}

function getApplicationPosterSrc(application: ApplicationWithJob) {
  const mediaUrl = application.job_media_urls.find(
    (url) => !/\.(mp4|mov|webm)(?:$|\?)/i.test(url),
  );
  if (mediaUrl) return mediaUrl;

  const sum = Array.from(application.job_id).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0,
  );
  return fallbackJobPosterImages[sum % fallbackJobPosterImages.length];
}

function buildActorApplicationsHref({
  filter,
  page,
  sort,
}: {
  filter: ActorApplicationFilter;
  page: number;
  sort: ActorApplicationSortValue;
}) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("status", filter);
  if (sort !== "latest") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/jobs?${query}` : "/jobs";
}

function parseCastingApplicantFilter(value: string): CastingApplicantFilter {
  if (
    value === "reviewing" ||
    value === "pass" ||
    value === "hold" ||
    value === "reject"
  ) {
    return value;
  }
  return "all";
}

function getPaginationItems(page: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  if (page <= 3) return [1, 2, 3, "ellipsis", totalPages] as const;
  if (page >= totalPages - 2) {
    return [1, "ellipsis", totalPages - 2, totalPages - 1, totalPages] as const;
  }
  return [1, "ellipsis", page, "ellipsis", totalPages] as const;
}

function parseActorApplicationFilter(value: string): ActorApplicationFilter {
  if (
    value === "pending" ||
    value === "reviewing" ||
    value === "pass" ||
    value === "reject"
  ) {
    return value;
  }
  return "all";
}

function parseActorApplicationSort(value: string): ActorApplicationSortValue {
  return value === "oldest" ? "oldest" : "latest";
}

function parsePage(raw: string | string[] | undefined) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const page = Number(value ?? "1");
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function asString(raw: string | string[] | undefined) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() ?? "";
}

function normalizeRegionLabel(region: string | null) {
  if (!region) return "지역 협의";
  return region.split("·")[0]?.trim() || region;
}

function formatNumericDate(iso: string | null) {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(
    date.getDate(),
  )}`;
}

function formatMonthDay(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${pad2(date.getMonth() + 1)}.${pad2(date.getDate())}`;
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function getSixMonthsAgoIso() {
  const date = new Date();
  date.setMonth(date.getMonth() - 6);
  return date.toISOString();
}
