import { notFound } from "next/navigation";
import { Send } from "lucide-react";
import { ActorProfileView } from "@/app/(app)/profile/actor-profile-view";
import { buttonVariants } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";
import { BackButton } from "@/components/features/back-button";
import { BookmarkButton } from "@/components/features/bookmark-button";
import { PageContainer } from "@/components/page-container";
import { cn } from "@/lib/utils";
import { listBookmarkedTargetIds } from "@/lib/queries/bookmarks";
import {
  getActorProfileMetrics,
  listActorAwards,
  listActorCredits,
  recordActorProfileView,
} from "@/lib/queries/actor-profile-showcase";
import { getActorDetail, type ActorDetail } from "@/lib/queries/jobs";
import { listPortfolioFor } from "@/lib/queries/portfolio";
import { getViewerProfile } from "@/lib/queries/viewer";
import { startActorConversationAction } from "./actions";

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

  const [bookmarkedActorIds, portfolioItems, credits, awards, metrics] =
    await Promise.all([
      listBookmarkedTargetIds("actor", [actor.id]),
      listPortfolioFor(actor.id),
      listActorCredits(actor.id).catch(() => []),
      listActorAwards(actor.id).catch(() => []),
      getActorProfileMetrics(actor.id),
    ]);

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
            bookmarked={bookmarkedActorIds.has(actor.id)}
          />
        ) : null
      }
    />
  );
}

function ActorProfileActions({
  actorId,
  bookmarked,
}: {
  actorId: string;
  bookmarked: boolean;
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

      <form action={startActorConversationAction}>
        <input type="hidden" name="actor_id" value={actorId} />
        <button
          type="submit"
          aria-label="메시지 보내기"
          className={cn(
            buttonVariants({ color: "neutral", variant: "ghost", size: "icon-lg" }),
            "rounded-full border-white/35 bg-white/20 text-white shadow-sm backdrop-blur hover:bg-white/30 hover:text-white",
          )}
        >
          <Send aria-hidden="true" className="size-4" />
        </button>
      </form>
    </div>
  );
}
