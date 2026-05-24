import type { ComponentType } from "react";
import Link from "next/link";
import { Mail, Pencil, Phone, UserRound } from "lucide-react";
import { ActorProfileView } from "@/app/(app)/profile/actor-profile-view";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SurfaceCard } from "@/components/ui/surface-card";
import { PageContainer } from "@/components/page-container";
import { getRoleEntityLabel } from "@/lib/app-ia";
import {
  getActorProfileMetrics,
  listActorAwards,
  listActorCredits,
} from "@/lib/queries/actor-profile-showcase";
import { listMyPortfolio } from "@/lib/queries/portfolio";
import { getViewerProfile } from "@/lib/queries/viewer";
import { parseSocialLinks } from "@/lib/social-links";
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

  const [
    { data: actorProfile },
    portfolioItems,
    credits,
    awards,
    metrics,
  ] = await Promise.all([
    supabase
      .from("actor_profiles")
      .select("affiliation, region, birth_date, gender, height_cm, weight_kg, genres, bio, skills, image_tags, social_links, updated_at")
      .eq("user_id", profile.id)
      .maybeSingle(),
    listMyPortfolio(),
    listActorCredits(profile.id).catch(() => []),
    listActorAwards(profile.id).catch(() => []),
    getActorProfileMetrics(profile.id),
  ]);

  const socialLinks = parseSocialLinks(actorProfile?.social_links);

  return (
    <ActorProfileView
      profile={profile}
      actorProfile={actorProfile}
      email={email}
      socialLinks={socialLinks}
      portfolioItems={portfolioItems}
      credits={credits}
      awards={awards}
      metrics={metrics}
    />
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
      ? "bg-[#edf3ff] text-[#4f7cff] dark:bg-[#4f7cff]/16 dark:text-[#76a2ff]"
      : "bg-[#e7fbfa] text-[#0ea5a3] dark:bg-[#0ea5a3]/16 dark:text-[#2dd4cf]";

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
          <Badge color="secondary" className={badgeToneClassName}>
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
