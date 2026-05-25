import Link from "next/link";
import { FileImage } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { BookmarkButton } from "@/components/features/bookmark-button";
import type { CastingActorPreview } from "@/lib/queries/jobs";

export function ActorCard({
  actor,
  bookmarked,
  redirectTo,
}: {
  actor: CastingActorPreview;
  bookmarked: boolean;
  redirectTo: string;
}) {
  const actorHref = `/talents/${actor.id}`;
  const tags = getActorTags(actor);
  const matchScore = actor.match_score ?? 0;
  const matchReasons = actor.match_reasons?.slice(0, 2) ?? [];

  return (
    <Card className="h-full gap-0 overflow-hidden rounded-xl py-0">
      <div className="relative isolate">
        <Link
          href={actorHref}
          className="group block aspect-[4/5] bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ActorPortraitPreview name={actor.name} avatarUrl={actor.avatar_url} />
        </Link>
        {matchScore > 0 ? (
          <Badge
            color="primary"
            variant="soft-outline"
            size="md"
            className="absolute left-3 top-3 z-10 bg-background/90 backdrop-blur"
          >
            매칭 {matchScore}
          </Badge>
        ) : null}
        <BookmarkButton
          targetType="actor"
          targetId={actor.id}
          bookmarked={bookmarked}
          redirectTo={redirectTo}
          compact
          icon="heart"
          className="absolute right-3 top-3 z-10 bg-background/85 backdrop-blur hover:bg-background"
        />
      </div>
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <Link
          href={actorHref}
          className="min-w-0 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <CardTitle className="truncate text-lg font-bold">
            {actor.name}
          </CardTitle>
        </Link>
        <p className="line-clamp-1 text-xs font-medium text-muted-foreground">
          {getActorMeta(actor)}
        </p>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge
                key={tag}
                color="neutral"
                variant="outline"
                size="sm"
                className="bg-muted/70"
              >
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
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
      </CardContent>
    </Card>
  );
}

function ActorPortraitPreview({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden bg-muted text-muted-foreground transition-transform duration-200 group-hover:scale-[1.02]">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={`${name} 프로필 사진`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <>
          <FileImage aria-hidden="true" className="size-12 stroke-[1.35]" />
          <span className="sr-only">{name} 프로필 사진 없음</span>
        </>
      )}
    </div>
  );
}

function getActorMeta(actor: CastingActorPreview) {
  return [
    actor.age !== null ? `${actor.age}세` : null,
    getGenderLabel(actor.gender),
    normalizeRegionLabel(actor.region),
    actor.height_cm !== null ? `${actor.height_cm}cm` : null,
    actor.weight_kg !== null ? `${actor.weight_kg}kg` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function getGenderLabel(value: string | null) {
  if (value === "male") return "남성";
  if (value === "female") return "여성";
  return value?.trim() || null;
}

function normalizeRegionLabel(region: string | null) {
  if (!region) return null;
  return region.split("·")[0]?.trim() || region;
}

function getActorTags(actor: CastingActorPreview) {
  return [...actor.image_tags, ...actor.genres, ...actor.skills]
    .filter(Boolean)
    .slice(0, 3);
}
