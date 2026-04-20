import Link from "next/link";
import type { ComponentType } from "react";
import {
  Mail,
  MapPin,
  Phone,
  Settings2,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getRoleEntityLabel, getRoleModeLabel } from "@/lib/app-ia";
import { getViewerProfile } from "@/lib/queries/viewer";
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
    const hasContact = Boolean(castingProfile?.contact);
    const hasIntro = Boolean(castingProfile?.intro);

    return (
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_320px]">
        <div className="space-y-4">
          <ProfileHeroCard
            modeLabel={getRoleModeLabel(activeRole)}
            entityLabel={getRoleEntityLabel(activeRole)}
            title={companyName}
            subtitle={`${profile.name} 담당 · 캐스팅 담당자 프로필`}
            summary={intro}
            tone="casting"
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

          <InfoSectionCard
            eyebrow="소개"
            title="회사 소개"
            body={intro}
          />

          <Card className="rounded-[28px] border-none bg-card py-0 shadow-sm ring-1 ring-border/70">
            <CardHeader className="px-6 pt-6">
              <CardDescription>기본 정보</CardDescription>
              <CardTitle className="text-xl">프로필 정보</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 px-6 pb-6 md:grid-cols-2">
              <DetailItem label="회사명" value={companyName} />
              <DetailItem label="담당자" value={profile.name} />
              <DetailItem label="연락처" value={castingProfile?.contact ?? "미등록"} />
              <DetailItem label="이메일" value={email} />
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <InsightCard
            title="프로필 상태"
            items={[
              { label: "현재 모드", value: getRoleModeLabel(activeRole) },
              { label: "소개 입력", value: hasIntro ? "완료" : "미완료" },
              { label: "연락처 등록", value: hasContact ? "완료" : "미완료" },
            ]}
          />

          <Card className="rounded-[28px] border-none bg-card py-0 shadow-sm ring-1 ring-border/70">
            <CardHeader className="px-6 pt-6">
              <CardDescription>관리</CardDescription>
              <CardTitle className="text-xl">프로필 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6">
              <p className="text-sm leading-6 text-muted-foreground">
                연락처와 회사 소개를 다듬으면 후보자와 더 자연스럽게 연결할 수
                있어요.
              </p>
              <Link
                href="/settings"
                className={buttonVariants({ variant: "secondary" })}
              >
                <Settings2 aria-hidden="true" />
                설정 열기
              </Link>
            </CardContent>
          </Card>
        </aside>
      </section>
    );
  }

  const { data: actorProfile } = await supabase
    .from("actor_profiles")
    .select("region, age, genres, bio, skills")
    .eq("user_id", profile.id)
    .maybeSingle();

  const genres = actorProfile?.genres?.filter(Boolean) ?? [];
  const skills = actorProfile?.skills?.filter(Boolean) ?? [];
  const bio =
    actorProfile?.bio ??
    "자기소개를 아직 입력하지 않았어요. 강점과 분위기를 먼저 짧게 남겨보세요.";
  const location =
    actorProfile?.region ??
    "활동 지역을 아직 등록하지 않았어요.";
  const ageText = actorProfile?.age ? `${actorProfile.age}세` : "나이 미등록";

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_320px]">
      <div className="space-y-4">
        <ProfileHeroCard
          modeLabel={getRoleModeLabel(activeRole)}
          entityLabel={getRoleEntityLabel(activeRole)}
          title={profile.name}
          subtitle={[location, actorProfile?.age ? `${actorProfile.age}세` : null]
            .filter(Boolean)
            .join(" · ")}
          summary={bio}
          tone="actor"
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

        <InfoSectionCard
          eyebrow="소개"
          title="자기소개"
          body={bio}
        />

        <ChipSectionCard
          eyebrow="프로필 키워드"
          title="대표 장르와 특기"
          sections={[
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
      </div>

      <aside className="space-y-4">
        <InsightCard
          title="프로필 요약"
          items={[
            { label: "현재 모드", value: getRoleModeLabel(activeRole) },
            { label: "활동 지역", value: location },
            { label: "나이", value: ageText },
            { label: "장르 수", value: `${genres.length}개` },
            { label: "특기 수", value: `${skills.length}개` },
          ]}
        />

        <Card className="rounded-[28px] border-none bg-card py-0 shadow-sm ring-1 ring-border/70">
          <CardHeader className="px-6 pt-6">
            <CardDescription>관리</CardDescription>
            <CardTitle className="text-xl">프로필 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            <p className="text-sm leading-6 text-muted-foreground">
              장르와 특기를 더 채우면 더 잘 맞는 오디션을 찾기 쉬워져요.
            </p>
            <Link
              href="/settings"
              className={buttonVariants({ variant: "secondary" })}
            >
              <Settings2 aria-hidden="true" />
              설정 열기
            </Link>
          </CardContent>
        </Card>
      </aside>
    </section>
  );
}

function ProfileHeroCard({
  modeLabel,
  entityLabel,
  title,
  subtitle,
  summary,
  tone,
  meta,
}: {
  modeLabel: string;
  entityLabel: string;
  title: string;
  subtitle: string;
  summary: string;
  tone: "actor" | "casting";
  meta: { icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>; label: string }[];
}) {
  const bannerClassName =
    tone === "actor"
      ? "bg-gradient-to-r from-actor/90 via-brand-blue/75 to-background"
      : "bg-gradient-to-r from-casting/90 via-primary/70 to-background";

  const badgeToneClassName =
    tone === "actor"
      ? "bg-actor-soft text-actor"
      : "bg-casting-soft text-casting";

  return (
    <Card className="overflow-hidden rounded-[28px] border-none bg-card py-0 shadow-sm ring-1 ring-border/70">
      <div aria-hidden="true" className={`h-28 md:h-32 ${bannerClassName}`} />
      <div className="px-6 pb-6">
        <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
          <div className="flex size-20 items-center justify-center rounded-[24px] bg-background text-2xl font-semibold shadow-sm ring-4 ring-background md:size-24 md:text-3xl">
            {getAvatarFallback(title)}
          </div>
          <Badge variant="secondary" className={badgeToneClassName}>
            {entityLabel}
          </Badge>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge>{modeLabel}</Badge>
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
          {title}
        </h1>
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
    </Card>
  );
}

function InfoSectionCard({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <Card className="rounded-[28px] border-none bg-card py-0 shadow-sm ring-1 ring-border/70">
      <CardHeader className="px-6 pt-6">
        <CardDescription>{eyebrow}</CardDescription>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <p className="text-sm leading-7 text-muted-foreground md:text-[0.95rem]">
          {body}
        </p>
      </CardContent>
    </Card>
  );
}

function ChipSectionCard({
  eyebrow,
  title,
  sections,
}: {
  eyebrow: string;
  title: string;
  sections: { label: string; items: string[]; emptyLabel: string }[];
}) {
  return (
    <Card className="rounded-[28px] border-none bg-card py-0 shadow-sm ring-1 ring-border/70">
      <CardHeader className="px-6 pt-6">
        <CardDescription>{eyebrow}</CardDescription>
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
    </Card>
  );
}

function InsightCard({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: string }[];
}) {
  return (
    <Card className="rounded-[28px] border-none bg-card py-0 shadow-sm ring-1 ring-border/70">
      <CardHeader className="px-6 pt-6">
        <CardDescription>요약</CardDescription>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-4 border-b border-border/70 pb-4 last:border-b-0 last:pb-0"
          >
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <span className="text-right text-sm font-medium text-foreground">
              {item.value}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
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
