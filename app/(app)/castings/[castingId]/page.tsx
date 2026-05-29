/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronDown,
  ExternalLink,
  FileImage,
  Play,
  Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SurfaceCard } from "@/components/ui/surface-card";
import { PageContainer } from "@/components/page-container";
import { formatDeadline } from "@/lib/format";
import {
  formatJobRoleType,
  getPrimaryJobPlatform,
} from "@/lib/job-filter-options";
import { normalizeJobMediaUrls } from "@/lib/job-media";
import { getJobAvailabilityLabel, isJobAccepting } from "@/lib/job-status";
import { getCastingProfileDetail } from "@/lib/queries/castings";
import { getViewerProfile } from "@/lib/queries/viewer";
import { cn } from "@/lib/utils";
import { startCastingConversationAction } from "./actions";

type CastingProfile = NonNullable<
  Awaited<ReturnType<typeof getCastingProfileDetail>>
>;
type CastingJob = CastingProfile["jobs"][number];

const sectionCardClassName = "rounded-[22px] px-5 py-6 md:px-7 md:py-7";

export default async function CastingProfilePage({
  params,
}: {
  params: Promise<{ castingId: string }>;
}) {
  const { castingId } = await params;
  const [casting, viewer] = await Promise.all([
    getCastingProfileDetail(castingId),
    getViewerProfile(),
  ]);

  if (!casting) notFound();

  const activeJobs = casting.jobs.filter((job) => isJobAccepting(job));
  const activityRegion = formatActivityRegion(casting.jobs);
  const mediaUrls = getCastingMediaUrls(casting.jobs);
  const heroImageUrl = casting.avatar_url ?? mediaUrls[0] ?? null;
  const canMessage =
    viewer.activeRole === "actor" && viewer.profile?.id !== casting.id;

  return (
    <PageContainer size="wide" className="space-y-5">
      <CastingHero
        casting={casting}
        activityRegion={activityRegion}
        heroImageUrl={heroImageUrl}
        canMessage={canMessage}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <BasicInfoCard casting={casting} activityRegion={activityRegion} />

          <WorkVideoSection jobs={casting.jobs} />

          <ImageSection mediaUrls={mediaUrls} />

          <ProjectsCard jobs={casting.jobs} />
        </div>

        <aside className="space-y-5">
          <RecruitingJobsCard jobs={activeJobs} />
        </aside>
      </div>
    </PageContainer>
  );
}

function CastingHero({
  casting,
  activityRegion,
  heroImageUrl,
  canMessage,
}: {
  casting: CastingProfile;
  activityRegion: string;
  heroImageUrl: string | null;
  canMessage: boolean;
}) {
  const intro =
    casting.intro?.trim() ||
    "회사 소개를 아직 입력하지 않았어요. 어떤 프로젝트를 주로 진행하는지부터 남겨보세요.";

  return (
    <section className="relative overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_74%_24%,rgba(34,197,94,0.58),rgba(187,247,208,0.9)_42%,rgba(240,253,244,0.95)_100%)] p-5 shadow-sm ring-1 ring-border/70 md:p-10">
      <div className="grid gap-7 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-end">
        <Portrait
          title={casting.company_name}
          imageUrl={heroImageUrl}
          fallbackLabel="캐스팅 프로필 이미지 없음"
        />

        <div className="min-w-0 lg:pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-4xl font-bold tracking-normal text-foreground md:text-5xl">
              {casting.company_name}
            </h1>
            <Badge
              color="primary"
              className="h-8 rounded-full px-5 text-sm text-primary-foreground"
            >
              캐스팅
            </Badge>
          </div>

          <p className="mt-6 text-sm font-medium text-foreground/75 md:text-base">
            {activityRegion} · 등록 공고{" "}
            {casting.job_count.toLocaleString("ko-KR")}건
          </p>

          <p className="mt-8 max-w-[46rem] text-sm font-medium leading-8 text-foreground/70 md:text-base">
            {intro}
          </p>
        </div>
      </div>

      {canMessage ? (
        <div className="mt-7 flex justify-end">
          <form action={startCastingConversationAction}>
            <input type="hidden" name="casting_id" value={casting.id} />
            <button
              type="submit"
              aria-label="메시지 보내기"
              className={cn(
                buttonVariants({
                  color: "neutral",
                  variant: "ghost",
                  size: "icon-lg",
                }),
                "rounded-full border-white/35 bg-white/20 text-white shadow-sm backdrop-blur hover:bg-white/30 hover:text-white",
              )}
            >
              <Send aria-hidden="true" className="size-4" />
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}

function Portrait({
  title,
  imageUrl,
  fallbackLabel,
}: {
  title: string;
  imageUrl: string | null;
  fallbackLabel: string;
}) {
  return (
    <div className="aspect-[3/4] w-full max-w-[300px] overflow-hidden rounded-lg bg-gray-50 shadow-sm ring-1 ring-gray-100">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${title} 대표 이미지`}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="grid h-full place-items-center bg-gray-50 text-gray-300">
          <FileImage aria-hidden="true" className="size-16 stroke-[1.35]" />
          <span className="sr-only">{fallbackLabel}</span>
        </div>
      )}
    </div>
  );
}

function BasicInfoCard({
  casting,
  activityRegion,
}: {
  casting: CastingProfile;
  activityRegion: string;
}) {
  return (
    <SurfaceCard className={sectionCardClassName}>
      <SectionHeader title="기본 정보" />

      <dl className="mt-5 grid gap-3 md:grid-cols-2">
        <InfoCell label="회사명" value={casting.company_name} />
        <InfoCell label="담당자" value={casting.name} />
        <InfoCell label="활동지역" value={activityRegion} />
        <InfoCell
          label="등록 공고"
          value={`${casting.job_count.toLocaleString("ko-KR")}건`}
        />
      </dl>
    </SurfaceCard>
  );
}

function WorkVideoSection({ jobs }: { jobs: CastingJob[] }) {
  const jobsWithMedia = jobs
    .map((job) => ({ job, thumbnail: getJobMediaUrl(job) }))
    .filter(
      (item): item is { job: CastingJob; thumbnail: string } =>
        item.thumbnail !== null,
    );
  const visibleJobs = jobsWithMedia.slice(0, 2);

  return (
    <SurfaceCard className={sectionCardClassName}>
      <SectionHeader title="대표 작품 영상" />

      {visibleJobs.length === 0 ? (
        <EmptyState label="대표 작품 영상으로 보여줄 공고가 없어요." />
      ) : (
        <>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {visibleJobs.map(({ job, thumbnail }) => (
              <VideoTile key={job.id} job={job} thumbnail={thumbnail} />
            ))}
          </div>

          {jobsWithMedia.length > 2 ? <MoreLink href="#casting-projects" /> : null}
        </>
      )}
    </SurfaceCard>
  );
}

function VideoTile({
  job,
  thumbnail,
}: {
  job: CastingJob;
  thumbnail: string;
}) {
  return (
    <Link
      href={`/jobs/${job.id}?from=discover`}
      aria-label={`${job.title} 공고 보기`}
      className="group relative aspect-video overflow-hidden rounded-xl bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <img
        src={thumbnail}
        alt={`${job.title} 대표 영상 썸네일`}
        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
        loading="lazy"
      />
      <span className="absolute inset-0 bg-black/18 transition group-hover:bg-black/10" />
      <span className="absolute left-1/2 top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
        <Play aria-hidden="true" className="ml-0.5 size-5 fill-current" />
      </span>
      <Badge
        color="neutral"
        size="sm"
        className="absolute left-3 top-3 bg-background/85 text-foreground backdrop-blur"
      >
        대표
      </Badge>
    </Link>
  );
}

function ImageSection({ mediaUrls }: { mediaUrls: string[] }) {
  const visibleUrls = mediaUrls.slice(0, 3);

  return (
    <SurfaceCard className={sectionCardClassName}>
      <SectionHeader title="대표 이미지" />

      {visibleUrls.length === 0 ? (
        <EmptyState label="대표 이미지가 없어요." />
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleUrls.map((url, index) => (
              <figure
                key={`${url}-${index}`}
                className="relative aspect-square overflow-hidden rounded-xl bg-muted"
              >
                <img
                  src={url}
                  alt={`대표 이미지 ${index + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <Badge
                  color="neutral"
                  size="sm"
                  className="absolute left-3 top-3 bg-background/85 text-foreground backdrop-blur"
                >
                  대표
                </Badge>
              </figure>
            ))}
          </div>

          {mediaUrls.length > 3 ? <MoreLink href="#casting-projects" /> : null}
        </>
      )}
    </SurfaceCard>
  );
}

function ProjectsCard({ jobs }: { jobs: CastingJob[] }) {
  return (
    <SurfaceCard id="casting-projects" className={sectionCardClassName}>
      <SectionHeader title="프로젝트" />

      {jobs.length === 0 ? (
        <EmptyState label="등록된 프로젝트가 없어요." />
      ) : (
        <>
          <ul className="mt-5 divide-y divide-border">
            {jobs.slice(0, 4).map((job) => (
              <li
                key={job.id}
                className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-3 py-4"
              >
                <time className="text-sm font-bold text-foreground">
                  {formatJobYear(job)}
                </time>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{job.title}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {[job.genre, formatJobRoleType(job.role_type)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <Link
                  href={`/jobs/${job.id}?from=discover`}
                  className={cn(
                    buttonVariants({
                      color: "primary",
                      variant: "soft",
                      size: "xs",
                    }),
                    "rounded-full px-4",
                  )}
                >
                  보러가기
                  <ExternalLink aria-hidden="true" className="size-3" />
                </Link>
              </li>
            ))}
          </ul>

          {jobs.length > 4 ? <MoreLink href="/discover" /> : null}
        </>
      )}
    </SurfaceCard>
  );
}

function RecruitingJobsCard({ jobs }: { jobs: CastingJob[] }) {
  return (
    <SurfaceCard className={cn(sectionCardClassName, "min-h-[34rem]")}>
      <SectionHeader title="현재 모집 중 공고" />

      {jobs.length === 0 ? (
        <div className="mt-5 grid min-h-64 place-items-center rounded-xl bg-muted/25 px-5 py-8 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            지금 모집 중인 공고가 없어요.
          </p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {jobs.slice(0, 5).map((job) => (
            <li key={job.id}>
              <Link
                href={`/jobs/${job.id}?from=discover`}
                className="block rounded-2xl bg-muted/35 p-4 transition hover:bg-muted/55 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 text-sm font-bold leading-6">
                    {job.title}
                  </p>
                  <Badge color="primary" variant="soft-outline" size="sm">
                    {getJobAvailabilityLabel(job)}
                  </Badge>
                </div>
                <p className="mt-3 text-xs font-medium text-muted-foreground">
                  {[job.genre, job.region, formatDeadline(job.deadline)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="mt-3 text-sm font-black text-primary">
                  {getPrimaryJobPlatform(job.platforms)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SurfaceCard>
  );
}

function SectionHeader({
  title,
  eyebrow,
}: {
  title: string;
  eyebrow?: string;
}) {
  return (
    <div className="min-w-0">
      {eyebrow ? (
        <p className="mb-1 text-sm font-medium text-muted-foreground">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="truncate text-2xl font-bold tracking-normal">{title}</h2>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-muted/35 px-4 py-4">
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className="mt-2 truncate text-sm font-semibold text-foreground">
        {value}
      </dd>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="mt-5 grid min-h-36 place-items-center rounded-xl bg-muted/25 px-5 py-8 text-center">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function MoreLink({ href }: { href: string }) {
  return (
    <div className="mt-5 flex justify-center">
      <Link
        href={href}
        className="inline-flex h-9 items-center gap-2 px-3 text-sm font-bold text-foreground/75 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        더보기
        <ChevronDown aria-hidden="true" className="size-4" />
      </Link>
    </div>
  );
}

function formatActivityRegion(jobs: CastingJob[]) {
  const regions = Array.from(
    new Set(
      jobs
        .map((job) => job.region?.trim())
        .filter((region): region is string => Boolean(region)),
    ),
  );

  if (regions.length === 0) return "활동 지역 미등록";
  return regions.slice(0, 3).join(", ");
}

function getCastingMediaUrls(jobs: CastingJob[]) {
  return jobs.flatMap((job) => normalizeJobMediaUrls(job.media_urls));
}

function getJobMediaUrl(job: CastingJob) {
  return normalizeJobMediaUrls(job.media_urls)[0] ?? null;
}

function formatJobYear(job: CastingJob) {
  const rawDate = job.deadline ?? job.created_at;
  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? "-" : String(date.getFullYear());
}
