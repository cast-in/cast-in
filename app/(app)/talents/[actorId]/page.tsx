import type { ComponentType } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Ruler, Sparkles, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { ErrorNotice } from "@/components/ui/error-notice";
import { SurfaceCard } from "@/components/ui/surface-card";
import { BookmarkButton } from "@/components/features/bookmark-button";
import { SocialLinksList } from "@/components/features/social-links-list";
import { PageContainer } from "@/components/page-container";
import { formatDate } from "@/lib/format";
import { listBookmarkedTargetIds } from "@/lib/queries/bookmarks";
import { getActorDetail, type ActorDetail } from "@/lib/queries/jobs";
import { listPortfolioFor, type PortfolioItem } from "@/lib/queries/portfolio";
import { getViewerProfile } from "@/lib/queries/viewer";

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

  let bookmarkedActorIds = new Set<string>();
  let portfolioItems: PortfolioItem[] = [];

  if (actor) {
    [bookmarkedActorIds, portfolioItems] = await Promise.all([
      listBookmarkedTargetIds("actor", [actor.id]),
      listPortfolioFor(actor.id),
    ]);
  }

  return (
    <PageContainer size="wide">
      <Link
        href="/talents"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        ← 배우 탐색
      </Link>

      {errorMessage ? <ErrorNotice message={errorMessage} /> : null}

      {actor ? (
        <>
          <ActorHero
            actor={actor}
            bookmarked={bookmarkedActorIds.has(actor.id)}
          />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-4">
              <IntroSection actor={actor} />
              <PortfolioSection actorName={actor.name} items={portfolioItems} />
            </div>
            <aside className="space-y-4">
              <ProfileFacts actor={actor} />
              {actor.social_links.length > 0 ? (
                <SocialLinksCard links={actor.social_links} />
              ) : null}
              <KeywordSection actor={actor} />
            </aside>
          </div>
        </>
      ) : null}
    </PageContainer>
  );
}

function ActorHero({
  actor,
  bookmarked,
}: {
  actor: ActorDetail;
  bookmarked: boolean;
}) {
  const summary = actor.bio?.trim() || "자기소개를 아직 입력하지 않았어요.";
  const subtitle = [
    actor.region ?? "지역 미등록",
    actor.age !== null ? `${actor.age}세` : null,
    actor.height_cm ? `${actor.height_cm}cm` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <SurfaceCard>
      <div
        aria-hidden="true"
        className="h-28 bg-gradient-to-r from-actor/90 via-brand-blue/75 to-background md:h-36"
      />
      <div className="px-6 pb-6">
        <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
          <AvatarBlock name={actor.name} avatarUrl={actor.avatar_url} />
          <div className="flex items-center gap-2">
            <BookmarkButton
              targetType="actor"
              targetId={actor.id}
              bookmarked={bookmarked}
              redirectTo={`/talents/${actor.id}`}
            />
            <Badge variant="secondary" className="bg-actor-soft text-actor">
              배우
            </Badge>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {actor.genres.slice(0, 3).map((genre) => (
            <Badge key={genre}>{genre}</Badge>
          ))}
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
          {actor.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          {subtitle}
        </p>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-foreground/80 md:text-base">
          {summary}
        </p>
      </div>
    </SurfaceCard>
  );
}

function IntroSection({ actor }: { actor: ActorDetail }) {
  return (
    <SurfaceCard>
      <CardHeader className="px-6 pt-6">
        <CardDescription>소개</CardDescription>
        <h2 className="text-xl font-semibold tracking-tight">자기소개</h2>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground md:text-[0.95rem]">
          {actor.bio?.trim() || "자기소개를 아직 입력하지 않았어요."}
        </p>
      </CardContent>
    </SurfaceCard>
  );
}

function ProfileFacts({ actor }: { actor: ActorDetail }) {
  return (
    <SurfaceCard>
      <CardHeader className="px-6 pt-6">
        <CardDescription>기본 정보</CardDescription>
        <h2 className="text-xl font-semibold tracking-tight">프로필</h2>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <dl className="grid gap-3">
          <FactItem
            icon={MapPin}
            label="활동 지역"
            value={actor.region ?? "지역 미등록"}
          />
          <FactItem
            icon={CalendarDays}
            label="나이"
            value={actor.age !== null ? `${actor.age}세` : "나이 미등록"}
          />
          <FactItem
            icon={Ruler}
            label="신장"
            value={actor.height_cm ? `${actor.height_cm}cm` : "신장 미등록"}
          />
          <FactItem
            icon={UserRound}
            label="성별"
            value={getGenderLabel(actor.gender)}
          />
        </dl>
      </CardContent>
    </SurfaceCard>
  );
}

function KeywordSection({ actor }: { actor: ActorDetail }) {
  return (
    <SurfaceCard>
      <CardHeader className="px-6 pt-6">
        <CardDescription>프로필 키워드</CardDescription>
        <h2 className="text-xl font-semibold tracking-tight">장르와 특기</h2>
      </CardHeader>
      <CardContent className="space-y-6 px-6 pb-6">
        <ChipGroup
          label="대표 장르"
          items={actor.genres.filter(Boolean)}
          emptyLabel="등록한 장르가 없어요."
        />
        <ChipGroup
          label="특기"
          items={actor.skills.filter(Boolean)}
          emptyLabel="등록한 특기가 없어요."
        />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles aria-hidden="true" className="size-3.5" />
          <span>최근 업데이트 {formatDate(actor.updated_at)}</span>
        </div>
      </CardContent>
    </SurfaceCard>
  );
}

function SocialLinksCard({ links }: { links: ActorDetail["social_links"] }) {
  return (
    <SurfaceCard>
      <CardHeader className="px-6 pt-6">
        <CardDescription>링크</CardDescription>
        <h2 className="text-xl font-semibold tracking-tight">SNS와 웹사이트</h2>
      </CardHeader>
      <CardContent className="px-3 pb-4">
        <SocialLinksList links={links} />
      </CardContent>
    </SurfaceCard>
  );
}

function PortfolioSection({
  actorName,
  items,
}: {
  actorName: string;
  items: PortfolioItem[];
}) {
  return (
    <SurfaceCard>
      <CardHeader className="px-6 pt-6">
        <CardDescription>포트폴리오</CardDescription>
        <h2 className="text-xl font-semibold tracking-tight">사진과 영상</h2>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {items.length === 0 ? (
          <div className="grid min-h-48 place-items-center rounded-xl bg-muted/30 px-6 py-10 text-center">
            <div className="space-y-1">
              <p className="font-medium text-foreground">
                아직 공개된 포트폴리오가 없어요
              </p>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                배우가 사진이나 영상을 올리면 이곳에서 볼 수 있어요.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item, index) => (
              <figure
                key={item.id}
                className="overflow-hidden rounded-xl bg-muted ring-1 ring-border/70"
              >
                <div className="relative aspect-[4/3]">
                  {item.type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt={item.caption ?? `${actorName} 포트폴리오 ${index + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <video
                      src={item.url}
                      aria-label={item.caption ?? `${actorName} 포트폴리오 영상 ${index + 1}`}
                      className="h-full w-full object-cover"
                      controls
                      preload="metadata"
                    />
                  )}
                  <Badge
                    variant="secondary"
                    className="absolute left-2 top-2 bg-background/85 backdrop-blur"
                  >
                    {item.type === "image" ? "사진" : "영상"}
                  </Badge>
                </div>
                {item.caption ? (
                  <figcaption className="px-3 py-2 text-sm text-muted-foreground">
                    {item.caption}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        )}
      </CardContent>
    </SurfaceCard>
  );
}

function FactItem({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
      <Icon aria-hidden={true} className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
        <dd className="mt-1 break-words text-sm font-medium">{value}</dd>
      </div>
    </div>
  );
}

function ChipGroup({
  label,
  items,
  emptyLabel,
}: {
  label: string;
  items: string[];
  emptyLabel: string;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">{label}</h3>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Badge key={item} variant="secondary" className="h-7 px-3">
              {item}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      )}
    </section>
  );
}

function AvatarBlock({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  return (
    <div className="flex size-20 items-center justify-center overflow-hidden rounded-[24px] bg-background text-2xl font-semibold shadow-sm ring-4 ring-background md:size-24 md:text-3xl">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={`${name} 프로필 사진`}
          className="h-full w-full object-cover"
        />
      ) : (
        getAvatarFallback(name)
      )}
    </div>
  );
}

function getGenderLabel(value: string | null) {
  if (value === "male") return "남성";
  if (value === "female") return "여성";
  return value?.trim() || "성별 미등록";
}

function getAvatarFallback(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "U";
}
