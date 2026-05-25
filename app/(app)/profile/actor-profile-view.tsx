/* eslint-disable @next/next/no-img-element */

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import {
  AtSign,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ExternalLink,
  FileImage,
  Mail,
  MapPin,
  Play,
  Ruler,
  Sparkles,
  SquarePen,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SurfaceCard } from "@/components/ui/surface-card";
import { PageContainer } from "@/components/page-container";
import { calculateAge, formatDate } from "@/lib/format";
import type {
  ActorAward,
  ActorCredit,
  ActorProfileMetrics,
} from "@/lib/queries/actor-profile-showcase";
import type { PortfolioItem } from "@/lib/queries/portfolio";
import type { ActorSocialLink } from "@/lib/social-links";
import { cn } from "@/lib/utils";

type ActorProfileRecord = {
  affiliation?: string | null;
  bio: string | null;
  birth_date: string | null;
  gender: string | null;
  genres: string[] | null;
  height_cm: number | null;
  image_tags?: string[] | null;
  region: string | null;
  skills: string[] | null;
  updated_at: string | null;
  weight_kg?: number | null;
};

type ActorProfileViewProps = {
  profile: {
    id: string;
    name: string;
    avatar_url?: string | null;
  };
  actorProfile: ActorProfileRecord | null;
  email?: string | null;
  socialLinks: ActorSocialLink[];
  portfolioItems: PortfolioItem[];
  credits: ActorCredit[];
  awards: ActorAward[];
  metrics: ActorProfileMetrics;
  editable?: boolean;
  heroActions?: ReactNode;
};

const sectionCardClassName = "rounded-[22px] px-5 py-6 md:px-7 md:py-7";

export function ActorProfileView({
  profile,
  actorProfile,
  email,
  socialLinks,
  portfolioItems,
  credits,
  awards,
  metrics,
  editable = true,
  heroActions,
}: ActorProfileViewProps) {
  const genres = actorProfile?.genres?.filter(Boolean) ?? [];
  const skills = actorProfile?.skills?.filter(Boolean) ?? [];
  const imageTags = actorProfile?.image_tags?.filter(Boolean) ?? [];
  const age = calculateAge(actorProfile?.birth_date ?? null);
  const gender = getGenderLabel(actorProfile?.gender ?? null);
  const heroGender = actorProfile?.gender ? gender : null;
  const location = actorProfile?.region?.trim() || "활동 지역 미등록";
  const bio =
    actorProfile?.bio?.trim() ||
    "자기소개를 아직 입력하지 않았어요. 강점과 분위기를 먼저 짧게 남겨보세요.";
  const imageItems = portfolioItems.filter((item) => item.type === "image");
  const videoItems = portfolioItems.filter((item) => item.type === "video");

  return (
    <PageContainer size="wide" className="space-y-5">
      <ActorHero
        name={profile.name}
        avatarUrl={profile.avatar_url ?? imageItems[0]?.url ?? null}
        roleLabel="배우"
        summary={bio}
        subtitle={[location, age !== null ? `${age}세` : null, heroGender]
          .filter(Boolean)
          .join(" · ")}
        email={email}
        socialLinks={socialLinks}
        metrics={metrics}
        editHref={editable ? "/profile/edit" : undefined}
        actions={heroActions}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <MediaSection
            title="대표 이미지"
            items={imageItems}
            kind="image"
            emptyLabel="대표 이미지가 없어요."
            limit={3}
            editHref={editable ? "/profile/portfolio" : undefined}
            moreHref={editable ? "/profile/portfolio" : undefined}
          />

          <MediaSection
            title="대표 영상"
            items={videoItems}
            kind="video"
            emptyLabel="대표 영상이 없어요."
            limit={2}
            editHref={editable ? "/profile/portfolio" : undefined}
            moreHref={editable ? "/profile/portfolio" : undefined}
          />

          <div className="grid gap-5 md:grid-cols-2">
            <HistoryCard
              title="필모그래피"
              items={credits}
              emptyLabel="등록된 필모그래피가 없어요."
              editHref={editable ? "/profile/showcase" : undefined}
              moreHref={editable ? "/profile/showcase" : undefined}
            />
            <AwardsCard
              title="수상"
              items={awards}
              emptyLabel="등록된 수상 이력이 없어요."
              editHref={editable ? "/profile/showcase" : undefined}
              moreHref={editable ? "/profile/showcase" : undefined}
            />
          </div>
        </div>

        <aside className="space-y-5">
          <ProfileFactsCard
            location={location}
            age={age}
            gender={gender}
            heightCm={actorProfile?.height_cm ?? null}
            weightKg={actorProfile?.weight_kg ?? null}
            affiliation={actorProfile?.affiliation ?? "프리랜서"}
            editHref={editable ? "/profile/edit" : undefined}
          />

          <KeywordCard
            genres={genres}
            skills={skills}
            imageTags={imageTags}
            updatedAt={actorProfile?.updated_at ?? null}
            editHref={editable ? "/profile/edit" : undefined}
          />
        </aside>
      </div>
    </PageContainer>
  );
}

function ActorHero({
  name,
  avatarUrl,
  roleLabel,
  subtitle,
  summary,
  email,
  socialLinks,
  metrics,
  editHref,
  actions,
}: {
  name: string;
  avatarUrl: string | null;
  roleLabel: string;
  subtitle: string;
  summary: string;
  email?: string | null;
  socialLinks: ActorSocialLink[];
  metrics: ActorProfileMetrics;
  editHref?: string;
  actions?: ReactNode;
}) {
  const primarySocial = socialLinks[0] ?? null;
  const hasTopAction = Boolean(actions ?? editHref);

  return (
    <section className="relative overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_74%_24%,rgba(34,197,94,0.58),rgba(187,247,208,0.9)_42%,rgba(240,253,244,0.95)_100%)] p-5 shadow-sm ring-1 ring-border/70 md:p-10">
      {actions ? (
        <div className="absolute right-5 top-5 z-10 md:right-8 md:top-8">
          {actions}
        </div>
      ) : editHref ? (
        <Link
          href={editHref}
          className={cn(
            buttonVariants({ size: "sm" }),
            "absolute right-5 top-5 z-10 rounded-xl px-5 md:right-8 md:top-8",
          )}
        >
          <SquarePen aria-hidden="true" className="size-4" />
          프로필 수정
        </Link>
      ) : null}

      <div
        className={cn(
          "grid gap-7 lg:grid-cols-[300px_minmax(0,1fr)_330px] lg:items-end lg:pt-0",
          hasTopAction && "pt-14 md:pt-10",
        )}
      >
        <Portrait name={name} avatarUrl={avatarUrl} />

        <div className="min-w-0 lg:pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-4xl font-bold tracking-normal text-foreground md:text-5xl">
              {name}
            </h1>
            <Badge
              color="primary"
              className="h-8 rounded-full px-5 text-sm text-primary-foreground"
            >
              {roleLabel}
            </Badge>
          </div>

          <p className="mt-6 text-sm font-medium text-foreground/75 md:text-base">
            {subtitle}
          </p>

          <div className="mt-4 space-y-2 text-sm text-foreground/65">
            {email ? <ContactLine icon={Mail} label={email} /> : null}
            {primarySocial ? (
              <ContactLine icon={AtSign} label={primarySocial.title} />
            ) : null}
          </div>

          <p className="mt-8 max-w-[46rem] text-sm font-medium leading-8 text-foreground/70 md:text-base">
            {summary}
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-3 lg:self-end">
          <StatItem label="조회 건수" value={metrics.viewCount} />
          <StatItem label="저장 건수" value={metrics.saveCount} />
          <StatItem label="제안 건수" value={metrics.offerCount} />
        </dl>
      </div>
    </section>
  );
}

function Portrait({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  return (
    <div className="aspect-[3/4] w-full max-w-[300px] overflow-hidden rounded-lg bg-gray-50 shadow-sm ring-1 ring-gray-100">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={`${name} 프로필 사진`}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="grid h-full place-items-center bg-gray-50 text-gray-300">
          <FileImage aria-hidden="true" className="size-16 stroke-[1.35]" />
          <span className="sr-only">{name} 프로필 사진 없음</span>
        </div>
      )}
    </div>
  );
}

function ContactLine({
  icon: Icon,
  label,
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
}) {
  return (
    <p className="flex min-w-0 items-center gap-2">
      <Icon aria-hidden={true} className="size-4 shrink-0 text-foreground/45" />
      <span className="truncate">{label}</span>
    </p>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/28 px-4 py-4 backdrop-blur-sm ring-1 ring-white/35">
      <dt className="text-xs font-semibold text-foreground/65">{label}</dt>
      <dd className="mt-2 text-2xl font-bold tracking-normal text-foreground/75">
        {value.toLocaleString("ko-KR")}
      </dd>
    </div>
  );
}

function MediaSection({
  title,
  items,
  kind,
  emptyLabel,
  limit,
  editHref,
  moreHref,
}: {
  title: string;
  items: PortfolioItem[];
  kind: "image" | "video";
  emptyLabel: string;
  limit: number;
  editHref?: string;
  moreHref?: string;
}) {
  const visibleItems = items.slice(0, limit);

  return (
    <SurfaceCard className={sectionCardClassName}>
      <SectionHeader title={title} editHref={editHref} />

      {visibleItems.length === 0 ? (
        <EmptyState label={emptyLabel} />
      ) : (
        <>
          <div
            className={cn(
              "mt-5 grid gap-3",
              kind === "image"
                ? "sm:grid-cols-2 xl:grid-cols-3"
                : "md:grid-cols-2",
            )}
          >
            {visibleItems.map((item, index) =>
              kind === "image" ? (
                <ImageTile key={item.id} item={item} index={index} />
              ) : (
                <VideoTile key={item.id} item={item} index={index} />
              ),
            )}
          </div>

          {items.length > limit && moreHref ? (
            <MoreLink href={moreHref} />
          ) : null}
        </>
      )}
    </SurfaceCard>
  );
}

function ImageTile({ item, index }: { item: PortfolioItem; index: number }) {
  return (
    <figure className="relative aspect-square overflow-hidden rounded-xl bg-muted">
      <img
        src={item.url}
        alt={item.caption ?? `대표 이미지 ${index + 1}`}
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
  );
}

function VideoTile({ item, index }: { item: PortfolioItem; index: number }) {
  const label = item.caption ?? `대표 영상 ${index + 1}`;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      aria-label={`${label} 열기`}
      className="group relative aspect-video overflow-hidden rounded-xl bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <video
        src={item.url}
        className="h-full w-full object-cover"
        muted
        playsInline
        preload="metadata"
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
    </a>
  );
}

function ProfileFactsCard({
  location,
  age,
  gender,
  heightCm,
  weightKg,
  affiliation,
  editHref,
}: {
  location: string;
  age: number | null;
  gender: string;
  heightCm: number | null;
  weightKg: number | null;
  affiliation: string;
  editHref?: string;
}) {
  const stature = [
    heightCm ? `${heightCm}cm` : null,
    weightKg ? `${weightKg}kg` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <SurfaceCard className={sectionCardClassName}>
      <SectionHeader
        title="프로필"
        eyebrow="기본 정보"
        editHref={editHref}
      />

      <dl className="mt-5 grid gap-3">
        <FactItem icon={MapPin} label="활동 지역" value={location} />
        <FactItem
          icon={CalendarDays}
          label="나이"
          value={age !== null ? `${age}세` : "나이 미등록"}
        />
        <FactItem icon={UserRound} label="성별" value={gender} />
        <FactItem icon={Ruler} label="신장" value={stature || "신장 미등록"} />
        <FactItem
          icon={BriefcaseBusiness}
          label="소속 여부"
          value={affiliation.trim() || "프리랜서"}
        />
      </dl>
    </SurfaceCard>
  );
}

function KeywordCard({
  genres,
  skills,
  imageTags,
  updatedAt,
  editHref,
}: {
  genres: string[];
  skills: string[];
  imageTags: string[];
  updatedAt: string | null;
  editHref?: string;
}) {
  return (
    <SurfaceCard className={sectionCardClassName}>
      <SectionHeader
        title="대표 키워드"
        eyebrow="장르, 특기, 이미지"
        editHref={editHref}
      />

      <div className="mt-6 space-y-6">
        <ChipGroup label="대표 장르" items={genres} emptyLabel="등록한 장르가 없어요." />
        <ChipGroup label="특기" items={skills} emptyLabel="등록한 특기가 없어요." />
        <ChipGroup
          label="이미지 키워드"
          items={imageTags}
          emptyLabel="등록한 이미지 키워드가 없어요."
        />
      </div>

      <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles aria-hidden="true" className="size-3.5" />
        최근 업데이트 {formatDate(updatedAt)}
      </p>
    </SurfaceCard>
  );
}

function HistoryCard({
  title,
  items,
  emptyLabel,
  editHref,
  moreHref,
}: {
  title: string;
  items: ActorCredit[];
  emptyLabel: string;
  editHref?: string;
  moreHref?: string;
}) {
  return (
    <SurfaceCard className={sectionCardClassName}>
      <SectionHeader title={title} editHref={editHref} />

      {items.length === 0 ? (
        <EmptyState label={emptyLabel} />
      ) : (
        <>
          <ul className="mt-5 divide-y divide-border">
            {items.slice(0, 4).map((item) => (
              <li
                key={item.id}
                className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-3 py-4"
              >
                <time className="text-sm font-bold text-foreground">
                  {item.year ?? "-"}
                </time>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{item.title}</p>
                  {item.role ? (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {item.role}
                    </p>
                  ) : null}
                </div>
                {item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      buttonVariants({ color: "primary", variant: "soft", size: "xs" }),
                      "rounded-full px-4",
                    )}
                  >
                    보러가기
                    <ExternalLink aria-hidden="true" className="size-3" />
                  </a>
                ) : null}
              </li>
            ))}
          </ul>

          {items.length > 4 && moreHref ? <MoreLink href={moreHref} /> : null}
        </>
      )}
    </SurfaceCard>
  );
}

function AwardsCard({
  title,
  items,
  emptyLabel,
  editHref,
  moreHref,
}: {
  title: string;
  items: ActorAward[];
  emptyLabel: string;
  editHref?: string;
  moreHref?: string;
}) {
  return (
    <SurfaceCard className={sectionCardClassName}>
      <SectionHeader title={title} editHref={editHref} />

      {items.length === 0 ? (
        <EmptyState label={emptyLabel} />
      ) : (
        <>
          <ul className="mt-5 divide-y divide-border">
            {items.slice(0, 4).map((item) => (
              <li
                key={item.id}
                className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 py-4"
              >
                <time className="text-sm font-bold text-foreground">
                  {item.year ?? "-"}
                </time>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{item.title}</p>
                  {item.organization ? (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {item.organization}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>

          {items.length > 4 && moreHref ? <MoreLink href={moreHref} /> : null}
        </>
      )}
    </SurfaceCard>
  );
}

function SectionHeader({
  title,
  eyebrow,
  icon: Icon,
  editHref,
}: {
  title: string;
  eyebrow?: string;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  editHref?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-sm font-medium text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="flex min-w-0 items-center gap-2 text-2xl font-bold tracking-normal">
          {Icon ? (
            <Icon aria-hidden={true} className="size-5 shrink-0 text-foreground/60" />
          ) : null}
          <span className="truncate">{title}</span>
        </h2>
      </div>

      {editHref ? (
        <Link
          href={editHref}
          className={cn(
            buttonVariants({ color: "neutral", variant: "ghost", size: "sm" }),
            "shrink-0",
          )}
        >
          수정하기
          <SquarePen aria-hidden="true" className="size-3.5" />
        </Link>
      ) : null}
    </div>
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
    <div className="flex items-center gap-4 rounded-xl bg-muted/35 px-4 py-4">
      <Icon aria-hidden={true} className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
        <dd className="mt-1 truncate text-sm font-semibold text-foreground">
          {value}
        </dd>
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
      <h3 className="text-sm font-bold">{label}</h3>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Badge
              key={item}
              color="primary"
              variant="outline"
              className="h-8 rounded-full bg-primary-soft px-3"
            >
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

function getGenderLabel(value: string | null) {
  if (value === "male") return "남성";
  if (value === "female") return "여성";
  if (value === "other") return "기타";
  return value?.trim() || "성별 미등록";
}
