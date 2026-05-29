import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { BookmarkButton } from "@/components/features/bookmark-button";
import { formatDeadline, formatDeadlineSignal } from "@/lib/format";
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
  bookmarked,
  redirectTo,
  compact = false,
  detailHref,
}: {
  job: OpenJobPreview;
  bookmarked: boolean;
  redirectTo: string;
  compact?: boolean;
  detailHref?: string;
}) {
  const accepting = isJobAccepting(job);
  const deadlineSignal = formatDeadlineSignal(job.deadline);
  const jobHref = detailHref ?? `/jobs/${job.id}`;
  const statusLabel = accepting ? "지원 가능" : "지원 마감";
  const posterSrc = getJobPosterSrc(job);
  const primaryPlatform = getPrimaryJobPlatform(job.platforms);
  const matchScore = job.match_score ?? 0;
  const matchReasons = job.match_reasons?.slice(0, compact ? 1 : 2) ?? [];

  return (
    <Card
      className={cn(
        "h-full gap-0 overflow-hidden py-0",
        compact ? "w-[222px] shrink-0" : "min-w-0",
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
            {matchScore > 0 ? (
              <Badge
                color="primary"
                variant="soft-outline"
                size="md"
                className="bg-background/90 backdrop-blur"
              >
                매칭 {matchScore}
              </Badge>
            ) : null}
          </div>
        </Link>
        <BookmarkButton
          targetType="job"
          targetId={job.id}
          bookmarked={bookmarked}
          redirectTo={redirectTo}
          compact
          icon="heart"
          className={cn(
            "absolute right-3 top-3 z-10 rounded-full border-primary bg-primary-soft text-primary backdrop-blur hover:bg-primary/15",
            compact ? "size-8" : "size-11",
          )}
        />
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
        {matchReasons.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {matchReasons.map((reason) => (
              <Badge
                key={reason}
                color="primary"
                variant="soft-outline"
                size="sm"
              >
                {reason}
              </Badge>
            ))}
          </div>
        ) : null}
        <div
          className={cn(
            "mt-auto flex items-center justify-between text-muted-foreground",
            compact ? "text-xs" : "text-sm",
          )}
        >
          <p>{formatDeadline(job.deadline)}</p>
          <span
            className={cn(
              "font-black text-primary",
              compact ? "text-sm" : "text-base",
            )}
          >
            {primaryPlatform}
          </span>
        </div>
      </CardContent>
    </Card>
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
