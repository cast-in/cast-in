import { notFound } from "next/navigation";
import { ActorProfileView } from "@/app/(app)/profile/actor-profile-view";
import { ErrorNotice } from "@/components/ui/error-notice";
import { BackButton } from "@/components/features/back-button";
import { BookmarkButton } from "@/components/features/bookmark-button";
import { PageContainer } from "@/components/page-container";
import { isJobAccepting } from "@/lib/job-status";
import { listBookmarkedTargetIds } from "@/lib/queries/bookmarks";
import {
  getActorProfileMetrics,
  listActorAwards,
  listActorCredits,
  recordActorProfileView,
} from "@/lib/queries/actor-profile-showcase";
import { getActorDetail, listMyJobs, type ActorDetail } from "@/lib/queries/jobs";
import { listPortfolioFor } from "@/lib/queries/portfolio";
import { getViewerProfile } from "@/lib/queries/viewer";
import { ActorMessageDialog, type ActorMessageJob } from "./actor-message-dialog";

export default async function ActorDetailPage({
  params,
}: {
  params: Promise<{ actorId: string }>;
}) {
  const { actorId } = await params;
  const { activeRole } = await getViewerProfile();
  if (!activeRole) return null;

  let actor: ActorDetail | null = null;
  let errorMessage: string | null = null;

  try {
    actor = await getActorDetail(actorId);
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "배우 정보를 불러오지 못했어요.";
  }

  if (!actor && !errorMessage) notFound();

  if (!actor) {
    return (
      <PageContainer size="wide">
        <BackButton fallbackHref="/talents" />
        {errorMessage ? <ErrorNotice message={errorMessage} /> : null}
      </PageContainer>
    );
  }

  await recordActorProfileView(actor.id).catch(() => null);

  const [bookmarkedActorIds, portfolioItems, credits, awards, metrics, myJobs] =
    await Promise.all([
      listBookmarkedTargetIds("actor", [actor.id]),
      listPortfolioFor(actor.id),
      listActorCredits(actor.id).catch(() => []),
      listActorAwards(actor.id).catch(() => []),
      getActorProfileMetrics(actor.id),
      activeRole === "casting" ? listMyJobs().catch(() => []) : Promise.resolve([]),
    ]);
  const messageJobs: ActorMessageJob[] = myJobs
    .filter((job) => isJobAccepting(job))
    .map((job) => ({
      id: job.id,
      title: job.title,
    }));

  return (
    <ActorProfileView
      profile={{
        id: actor.id,
        name: actor.name,
        avatar_url: actor.avatar_url,
      }}
      actorProfile={{
        affiliation: actor.affiliation,
        bio: actor.bio,
        birth_date: actor.birth_date,
        gender: actor.gender,
        genres: actor.genres,
        height_cm: actor.height_cm,
        image_tags: actor.image_tags,
        region: actor.region,
        skills: actor.skills,
        updated_at: actor.updated_at,
        weight_kg: actor.weight_kg,
      }}
      email={actor.email ?? "이메일 미등록"}
      socialLinks={actor.social_links}
      portfolioItems={portfolioItems}
      credits={credits}
      awards={awards}
      metrics={metrics}
      editable={false}
      heroActions={
        activeRole === "casting" ? (
          <ActorProfileActions
            actorId={actor.id}
            actorName={actor.name}
            bookmarked={bookmarkedActorIds.has(actor.id)}
            jobs={messageJobs}
          />
        ) : null
      }
    />
  );
}

function ActorProfileActions({
  actorId,
  actorName,
  bookmarked,
  jobs,
}: {
  actorId: string;
  actorName: string;
  bookmarked: boolean;
  jobs: ActorMessageJob[];
}) {
  const iconButtonClassName =
    "!border-white/35 !bg-white/20 !text-white shadow-sm backdrop-blur hover:!bg-white/30 hover:!text-white";

  return (
    <div className="flex items-center gap-3">
      <BookmarkButton
        targetType="actor"
        targetId={actorId}
        bookmarked={bookmarked}
        redirectTo={`/talents/${actorId}`}
        compact
        icon="heart"
        className={iconButtonClassName}
      />

      <ActorMessageDialog
        actorId={actorId}
        actorName={actorName}
        jobs={jobs}
        className={iconButtonClassName}
      />
    </div>
  );
}
