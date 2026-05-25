import type { ReactNode } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
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
import { formatDate, formatDeadline } from "@/lib/format";
import {
  formatJobAudienceLabel,
  formatJobRoleType,
} from "@/lib/job-filter-options";
import { getJobAvailabilityLabel, isJobAccepting } from "@/lib/job-status";
import { getViewerProfile } from "@/lib/queries/viewer";
import { cn } from "@/lib/utils";
import { ActorApplicationSort } from "./actor-application-sort";

const ACTOR_APPLICATION_PAGE_SIZE = 7;

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
  const actorFilter = parseActorApplicationFilter(status);
  const actorSort = parseActorApplicationSort(asString(params.sort));
  const actorPage = parsePage(params.page);

  return activeRole === "casting" ? (
    <CastingJobsPage filter={jobFilter} />
  ) : (
    <ActorJobsPage filter={actorFilter} page={actorPage} sort={actorSort} />
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
              "grid size-9 place-items-center rounded-md border text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
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
