import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { BookmarkButton } from "@/components/features/bookmark-button";
import { formatDeadline, formatDeadlineDday } from "@/lib/format";
import {
  formatJobAudienceLabel,
  formatJobRoleType,
  getPrimaryJobPlatform,
} from "@/lib/job-filter-options";
import { getJobPosterSrc } from "@/lib/job-media";
import { isJobAccepting } from "@/lib/job-status";
import type { OpenJobPreview } from "@/lib/queries/jobs";
import { cn } from "@/lib/utils";

export function JobCard({
  job,
  bookmarked = false,
  compact = false,
  detailHref,
  showBookmark = true,
}: {
  job: OpenJobPreview;
  bookmarked?: boolean;
  compact?: boolean;
  detailHref?: string;
  showBookmark?: boolean;
}) {
  const accepting = isJobAccepting(job);
  const deadlineSignal = formatDeadlineDday(job.deadline);
  const jobHref = detailHref ?? `/jobs/${job.id}`;
  const statusLabel = accepting ? "지원 가능" : "지원 마감";
  const posterSrc = getJobPosterSrc(job);
  const primaryPlatform = getPrimaryJobPlatform(job.platforms);

  return (
    <Card
      className={cn(
        "h-full gap-0 overflow-hidden py-0",
        "min-w-0",
      )}
    >
      <div className="relative isolate">
        <Link
          href={jobHref}
          className={cn(
            "group block bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            compact ? "h-[169px]" : "aspect-[1.22/1]",
          )}
        >
          <JobPostingPreview title={job.title} src={posterSrc} />
          <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
            <Badge
              color="neutral"
              variant="outline"
              size="md"
              className="bg-card/90 backdrop-blur"
            >
              {deadlineSignal}
            </Badge>
          </div>
        </Link>
        {showBookmark ? (
          <BookmarkButton
            targetType="job"
            targetId={job.id}
            bookmarked={bookmarked}
            compact
            icon="heart"
            className={cn(
              "absolute right-3 top-3 z-10 rounded-full border-white/60 bg-white/35 text-white/60 shadow-[0_10px_30px_rgba(15,23,42,0.18)] backdrop-blur-md hover:bg-white/45",
              "aria-[pressed=true]:border-primary aria-[pressed=true]:bg-primary-soft aria-[pressed=true]:text-primary aria-[pressed=true]:shadow-none aria-[pressed=true]:hover:bg-primary/15",
              "size-10",
            )}
          />
        ) : null}
      </div>
      <CardContent
        className={cn(
          "flex flex-1 flex-col",
          compact ? "gap-3 p-3" : "gap-5 p-4",
        )}
      >
        <div className="flex items-end justify-between gap-3">
          <Link
            href={jobHref}
            className="min-w-0 flex-1 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <CardTitle
              className={cn(
                "truncate font-medium tracking-normal",
                compact ? "text-sm" : "text-lg",
              )}
            >
              {job.title}
            </CardTitle>
          </Link>
          <div
            className={cn(
              "shrink-0 whitespace-nowrap text-right font-medium",
              accepting ? "text-primary" : "text-muted-foreground",
              compact ? "text-xs" : "text-sm",
            )}
          >
            {statusLabel}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge color="neutral" variant="outline" size="sm">
            {job.genre ?? "장르 미정"}
          </Badge>
          <Badge color="neutral" variant="outline" size="sm">
            {normalizeRegionLabel(job.region)}
          </Badge>
          <Badge color="neutral" variant="outline" size="sm">
            {formatJobRoleType(job.role_type)}
          </Badge>
          <Badge color="neutral" variant="outline" size="sm">
            {formatJobAudienceLabel({
              targetGenders: job.target_genders,
              targetAgeGroups: job.target_age_groups,
            })}
          </Badge>
        </div>
        <div
          className={cn(
            "mt-auto flex items-center justify-between text-muted-foreground",
            compact ? "text-xs" : "text-sm",
          )}
        >
          <p>{formatDeadline(job.deadline)}</p>
          <PlatformMark platform={primaryPlatform} compact={compact} />
        </div>
      </CardContent>
    </Card>
  );
}

const PLATFORM_LOGOS: Record<
  string,
  {
    alt: string;
    className?: string;
    compactClassName?: string;
    height: number;
    src: string;
    width: number;
  }
> = {
  "넷플릭스": {
    alt: "넷플릭스",
    height: 277,
    src: "/platform-logos/netflix.svg",
    width: 1024,
  },
  "디즈니+": {
    alt: "디즈니+",
    height: 565,
    src: "/platform-logos/disney-plus.svg",
    width: 1033,
  },
  티빙: {
    alt: "티빙",
    className: "h-[13px] w-[53px]",
    compactClassName: "h-[11px] w-[43px]",
    height: 36,
    src: "/platform-logos/tving.svg",
    width: 142,
  },
  웨이브: {
    alt: "웨이브",
    height: 24,
    src: "/platform-logos/wavve.svg",
    width: 108,
  },
};

function PlatformMark({
  platform,
  compact,
}: {
  platform: string;
  compact: boolean;
}) {
  const logo = PLATFORM_LOGOS[platform];

  if (!logo) {
    return (
      <span
        className={cn(
          "shrink-0 whitespace-nowrap text-right font-black text-primary",
          compact ? "text-sm" : "text-base",
        )}
      >
        {platform}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-end",
        compact ? "h-4 w-16" : "h-5 w-20",
        compact ? logo.compactClassName : logo.className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo.src}
        alt={logo.alt}
        width={logo.width}
        height={logo.height}
        className="block max-h-full max-w-full object-contain"
        loading="lazy"
      />
    </span>
  );
}

function JobPostingPreview({
  title,
  src,
}: {
  title: string;
  src: string | null;
}) {
  if (!src) {
    return (
      <div className="grid h-full w-full place-items-center bg-muted text-xs font-medium text-muted-foreground">
        이미지 없음
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden bg-muted transition-transform duration-200 group-hover:scale-[1.02]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${title} 포스터`}
        className="h-full w-full object-cover object-center"
        loading="lazy"
      />
    </div>
  );
}

function normalizeRegionLabel(region: string | null) {
  if (!region) return "지역 협의";
  return region.split("·")[0]?.trim() || region;
}
