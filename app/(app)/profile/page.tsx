import type { ComponentType } from "react";
import Link from "next/link";
import { Mail, MapPin, Pencil, Phone, Sparkles, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SurfaceCard } from "@/components/ui/surface-card";
import { SocialLinksList } from "@/components/features/social-links-list";
import { PageContainer } from "@/components/page-container";
import { getRoleEntityLabel } from "@/lib/app-ia";
import { calculateAge } from "@/lib/format";
import { listMyPortfolio, type PortfolioItem } from "@/lib/queries/portfolio";
import { getViewerProfile } from "@/lib/queries/viewer";
import { parseSocialLinks, type ActorSocialLink } from "@/lib/social-links";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const { user, profile, activeRole } = await getViewerProfile();
  if (!profile || !activeRole) return null;

  const supabase = await createClient();
  const email = profile.email ?? user?.email ?? "이메일 미등록";

  if (activeRole === "casting") {
    const { data: castingProfile } = await supabase
      .from("casting_profiles")
      .select("company_name, contact, intro")
      .eq("user_id", profile.id)
      .maybeSingle();

    const companyName = castingProfile?.company_name ?? profile.name;
    const intro =
      castingProfile?.intro ??
      "회사 소개를 아직 입력하지 않았어요. 어떤 프로젝트를 주로 진행하는지부터 남겨보세요.";

    return (
      <PageContainer>
        <ProfileHeroCard
          entityLabel={getRoleEntityLabel(activeRole)}
          title={companyName}
          subtitle={`${profile.name} 담당 · 캐스팅 디렉터 프로필`}
          summary={intro}
          tone="casting"
          avatarUrl={profile.avatar_url ?? null}
          meta={[
            {
              icon: UserRound,
              label: `담당자 ${profile.name}`,
            },
            {
              icon: Phone,
              label: castingProfile?.contact ?? "연락처 미등록",
            },
            {
              icon: Mail,
              label: email,
            },
          ]}
        />

        <InfoSectionCard title="회사 소개" body={intro} />

        <SurfaceCard>
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-xl">프로필 정보</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 px-6 pb-6 md:grid-cols-2">
            <DetailItem label="회사명" value={companyName} />
            <DetailItem label="담당자" value={profile.name} />
            <DetailItem label="연락처" value={castingProfile?.contact ?? "미등록"} />
            <DetailItem label="이메일" value={email} />
          </CardContent>
        </SurfaceCard>
      </PageContainer>
    );
  }

  const [{ data: actorProfile }, portfolioItems] = await Promise.all([
    supabase
      .from("actor_profiles")
      .select("region, birth_date, gender, height_cm, genres, bio, skills, social_links, visibility")
      .eq("user_id", profile.id)
      .maybeSingle(),
    listMyPortfolio(),
  ]);

  const genres = actorProfile?.genres?.filter(Boolean) ?? [];
  const skills = actorProfile?.skills?.filter(Boolean) ?? [];
  const socialLinks = parseSocialLinks(actorProfile?.social_links);
  const bio =
    actorProfile?.bio ??
    "자기소개를 아직 입력하지 않았어요. 강점과 분위기를 먼저 짧게 남겨보세요.";
  const location =
    actorProfile?.region ??
    "활동 지역을 아직 등록하지 않았어요.";
  const age = calculateAge(actorProfile?.birth_date ?? null);
  const gender = getGenderLabel(actorProfile?.gender ?? null);
  const height = actorProfile?.height_cm
    ? `${actorProfile.height_cm}cm`
    : "신장 미등록";

  return (
    <PageContainer>
      <ProfileHeroCard
        entityLabel={getRoleEntityLabel(activeRole)}
        title={profile.name}
        subtitle={[location, age !== null ? `${age}세` : null]
          .filter(Boolean)
          .join(" · ")}
        summary={bio}
        tone="actor"
        avatarUrl={profile.avatar_url ?? null}
        meta={[
          {
            icon: MapPin,
            label: location,
          },
          {
            icon: Sparkles,
            label: genres.length > 0 ? genres.join(" · ") : "장르 미등록",
          },
          {
            icon: Mail,
            label: email,
          },
        ]}
      />

      <InfoSectionCard title="자기소개" body={bio} />

      {socialLinks.length > 0 ? <SocialLinksSectionCard links={socialLinks} /> : null}

      <SurfaceCard>
        <CardHeader className="px-6 pt-6">
          <CardTitle className="text-xl">프로필 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 px-6 pb-6 md:grid-cols-2">
          <DetailItem label="활동 지역" value={location} />
          <DetailItem label="나이" value={age !== null ? `${age}세` : "나이 미등록"} />
          <DetailItem label="성별" value={gender} />
          <DetailItem label="신장" value={height} />
        </CardContent>
      </SurfaceCard>

      <ChipSectionCard
        title="대표 장르와 특기"
        sections={[
          {
            label: "공개 범위",
            items: [getVisibilityLabel(actorProfile?.visibility ?? "public")],
            emptyLabel: "전체 공개",
          },
          {
            label: "장르",
            items: genres,
            emptyLabel: "등록한 장르가 없어요.",
          },
          {
            label: "특기",
            items: skills,
            emptyLabel: "등록한 특기가 없어요.",
          },
        ]}
      />

      <PortfolioSectionCard items={portfolioItems} />
    </PageContainer>
  );
}

function PortfolioSectionCard({ items }: { items: PortfolioItem[] }) {
  return (
    <SurfaceCard>
      <CardHeader className="flex flex-row items-start justify-between gap-3 px-6 pt-6">
        <div>
          <CardTitle className="text-xl">사진과 영상</CardTitle>
        </div>
        <Link
          href="/profile/portfolio"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          관리
        </Link>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {items.length === 0 ? (
          <p className="rounded-2xl bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            아직 올린 포트폴리오가 없어요. 첫 번째 사진이나 영상을 추가해보세요.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {items.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted ring-1 ring-border/60"
              >
                {item.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={item.caption ?? "포트폴리오"}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <video
                    src={item.url}
                    className="h-full w-full object-cover"
                    preload="metadata"
                    muted
                  />
                )}
                <Badge
                  variant="secondary"
                  className="absolute left-2 top-2 bg-background/80 backdrop-blur"
                >
                  {item.type === "image" ? "사진" : "영상"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </SurfaceCard>
  );
}

function SocialLinksSectionCard({ links }: { links: ActorSocialLink[] }) {
  return (
    <SurfaceCard>
      <CardHeader className="px-6 pt-6">
        <CardTitle className="text-xl">SNS와 웹사이트</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-4">
        <SocialLinksList links={links} />
      </CardContent>
    </SurfaceCard>
  );
}

function ProfileHeroCard({
  entityLabel,
  title,
  subtitle,
  summary,
  tone,
  avatarUrl,
  meta,
}: {
  entityLabel: string;
  title: string;
  subtitle: string;
  summary: string;
  tone: "actor" | "casting";
  avatarUrl: string | null;
  meta: { icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>; label: string }[];
}) {
  const bannerClassName =
    "bg-gradient-to-r from-primary/80 via-primary/45 to-background";

  const badgeToneClassName =
    tone === "actor"
      ? "bg-actor-soft text-actor"
      : "bg-casting-soft text-casting";

  return (
    <SurfaceCard>
      <div aria-hidden="true" className={`h-28 md:h-32 ${bannerClassName}`} />
      <div className="px-6 pb-6">
        <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
          <div className="flex size-20 items-center justify-center overflow-hidden rounded-[24px] bg-muted text-2xl font-semibold text-muted-foreground shadow-sm ring-4 ring-background md:size-24 md:text-3xl">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={`${title} 프로필 사진`}
                className="h-full w-full object-cover"
              />
            ) : (
              getAvatarFallback(title)
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/profile/edit"
              className={buttonVariants({
                size: "sm",
                className: "border-0 shadow-none",
              })}
            >
              <Pencil aria-hidden="true" className="size-4" />
              프로필 수정
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {title}
          </h1>
          <Badge variant="secondary" className={badgeToneClassName}>
            {entityLabel}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          {subtitle}
        </p>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-foreground/80 md:text-base">
          {summary}
        </p>

        <div className="mt-6 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
          {meta.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-start gap-3">
                <Icon aria-hidden={true} className="mt-0.5 size-4 shrink-0" />
                <span className="leading-6">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </SurfaceCard>
  );
}

function InfoSectionCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <SurfaceCard>
      <CardHeader className="px-6 pt-6">
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <p className="text-sm leading-7 text-muted-foreground md:text-[0.95rem]">
          {body}
        </p>
      </CardContent>
    </SurfaceCard>
  );
}

function ChipSectionCard({
  title,
  sections,
}: {
  title: string;
  sections: { label: string; items: string[]; emptyLabel: string }[];
}) {
  return (
    <SurfaceCard>
      <CardHeader className="px-6 pt-6">
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-6 pb-6">
        {sections.map((section) => (
          <div key={section.label} className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              {section.label}
            </h2>
            {section.items.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {section.items.map((item) => (
                  <Badge key={item} variant="secondary" className="h-7 px-3">
                    {item}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{section.emptyLabel}</p>
            )}
          </div>
        ))}
      </CardContent>
    </SurfaceCard>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/40 p-4">
      <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}

function getAvatarFallback(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "U";
}

function getVisibilityLabel(value: string) {
  if (value === "connections") return "연결된 캐스팅만";
  if (value === "private") return "비공개";
  return "전체 공개";
}

function getGenderLabel(value: string | null) {
  if (value === "male") return "남성";
  if (value === "female") return "여성";
  return value?.trim() || "성별 미등록";
}
