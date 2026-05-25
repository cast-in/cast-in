import type { HTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  CalendarDays,
  MapPin,
  Ruler,
  UserRound,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SurfaceCard } from "@/components/ui/surface-card";
import { Textarea } from "@/components/ui/textarea";
import { PageContainer } from "@/components/page-container";
import { calculateAge } from "@/lib/format";
import type {
  ActorAward,
  ActorCredit,
} from "@/lib/queries/actor-profile-showcase";
import type { PortfolioItem } from "@/lib/queries/portfolio";
import type { ActorSocialLink } from "@/lib/social-links";
import { cn } from "@/lib/utils";
import { saveActorProfileEditAction } from "./actions";
import { EditablePortfolioSection } from "./editable-portfolio-section";
import { HeroAvatarUploader } from "./hero-avatar-uploader";
import { KeywordSelector } from "./keyword-selector";
import { AwardRows, CreditRows } from "./repeatable-profile-lists";

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
  weight_kg?: number | null;
};

type ActorProfileEditViewProps = {
  profile: {
    id: string;
    name: string;
    email?: string | null;
    avatar_url?: string | null;
  };
  actorProfile: ActorProfileRecord | null;
  socialLinks: ActorSocialLink[];
  portfolioItems: PortfolioItem[];
  credits: ActorCredit[];
  awards: ActorAward[];
};

const sectionClassName = "rounded-[22px] px-5 py-6 md:px-7 md:py-7";
const keywordOptions = {
  genres: ["드라마", "영화", "광고", "연극", "뮤지컬"],
  skills: ["연기", "노래", "댄스", "운전", "액션", "영어"],
  imageTags: ["시크함", "소년미", "소녀미", "도시적", "청순함", "강렬함"],
};

export function ActorProfileEditView({
  profile,
  actorProfile,
  socialLinks,
  portfolioItems,
  credits,
  awards,
}: ActorProfileEditViewProps) {
  const age = calculateAge(actorProfile?.birth_date ?? null);
  const imageItems = portfolioItems.filter((item) => item.type === "image");
  const videoItems = portfolioItems.filter((item) => item.type === "video");
  const primarySocial = socialLinks[0] ?? null;

  return (
    <PageContainer size="wide" className="space-y-5">
      <form action={saveActorProfileEditAction} className="space-y-5">
        <div className="sticky top-20 z-20 flex flex-col gap-3 rounded-lg bg-[linear-gradient(90deg,#052f35,#04543f)] px-5 py-3 text-white shadow-sm md:flex-row md:items-center md:justify-between">
          <p className="flex items-center gap-3 text-sm font-bold">
            <span className="size-2.5 rounded-full bg-primary" />
            프로필 수정 중 · 변경사항은 저장해야 반영됩니다
          </p>
          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className={cn(
                buttonVariants({ color: "neutral", variant: "outline", size: "sm" }),
                "border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white",
              )}
            >
              취소
            </Link>
            <Button type="submit" size="sm" className="px-5">
              전체 저장
            </Button>
          </div>
        </div>

        <section className="overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_74%_24%,rgba(34,197,94,0.58),rgba(187,247,208,0.9)_42%,rgba(240,253,244,0.95)_100%)] p-5 shadow-sm ring-1 ring-border/70 md:p-10">
          <div className="grid gap-7 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-center">
            <HeroAvatarUploader
              userId={profile.id}
              profileName={profile.name}
              initialAvatarUrl={profile.avatar_url ?? imageItems[0]?.url ?? null}
            />

            <div className="grid gap-5">
              <div className="w-full md:w-1/3">
                <TextField
                  id="profile-name"
                  name="name"
                  label="이름"
                  defaultValue={profile.name}
                  placeholder="이름 입력"
                  required
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <TextField
                  id="profile-email"
                  name="email"
                  type="email"
                  label="이메일"
                  defaultValue={profile.email ?? ""}
                  placeholder="이메일 주소 입력"
                />
                <TextField
                  id="profile-social"
                  name="social_url"
                  label="SNS 계정"
                  defaultValue={primarySocial?.title ?? primarySocial?.url ?? ""}
                  placeholder="SNS 계정 또는 URL 입력"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="profile-bio">소개</Label>
                <Textarea
                  id="profile-bio"
                  name="bio"
                  rows={5}
                  defaultValue={actorProfile?.bio ?? ""}
                  className="min-h-32 bg-background/70"
                  placeholder="프로필 소개 입력"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-5">
            <EditablePortfolioSection
              userId={profile.id}
              title="대표 이미지"
              kind="image"
              items={imageItems}
              limit={3}
              avatarUrl={profile.avatar_url}
            />

            <EditablePortfolioSection
              userId={profile.id}
              title="대표 영상"
              kind="video"
              items={videoItems}
              limit={2}
            />

            <div className="grid gap-5 md:grid-cols-2">
              <EditableHistoryCard title="필모그래피">
                <CreditRows initialItems={credits} />
              </EditableHistoryCard>

              <EditableHistoryCard title="수상">
                <AwardRows initialItems={awards} />
              </EditableHistoryCard>
            </div>
          </div>

          <aside className="space-y-5">
            <ProfileFactsEditor actorProfile={actorProfile} age={age} />
            <KeywordEditor actorProfile={actorProfile} />
          </aside>
        </div>
      </form>
    </PageContainer>
  );
}

function ProfileFactsEditor({
  actorProfile,
  age,
}: {
  actorProfile: ActorProfileRecord | null;
  age: number | null;
}) {
  return (
    <SurfaceCard className={sectionClassName}>
      <SectionTitle eyebrow="기본 정보" title="프로필" />

      <div className="mt-5 grid gap-3">
        <IconField icon={<MapPin aria-hidden="true" className="size-4" />}>
          <TextField
            id="profile-region"
            name="region"
            label="활동 지역"
            defaultValue={actorProfile?.region ?? ""}
            placeholder="활동 지역 입력"
          />
        </IconField>
        <IconField icon={<CalendarDays aria-hidden="true" className="size-4" />}>
          <TextField
            id="profile-age"
            name="age"
            label="나이"
            inputMode="numeric"
            defaultValue={age?.toString() ?? ""}
            placeholder="나이 입력"
          />
        </IconField>
        <IconField icon={<UserRound aria-hidden="true" className="size-4" />}>
          <div className="grid gap-2">
            <Label htmlFor="profile-gender">성별</Label>
            <Select
              id="profile-gender"
              name="gender"
              defaultValue={actorProfile?.gender ?? ""}
              className="bg-background"
            >
              <option value="">선택 안 함</option>
              <option value="male">남성</option>
              <option value="female">여성</option>
              <option value="other">기타</option>
            </Select>
          </div>
        </IconField>
        <IconField icon={<Ruler aria-hidden="true" className="size-4" />}>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              id="profile-height"
              name="height_cm"
              label="신장"
              inputMode="numeric"
              defaultValue={actorProfile?.height_cm?.toString() ?? ""}
              placeholder="신장 입력"
            />
            <TextField
              id="profile-weight"
              name="weight_kg"
              label="체중"
              inputMode="numeric"
              defaultValue={actorProfile?.weight_kg?.toString() ?? ""}
              placeholder="체중 입력"
            />
          </div>
        </IconField>
        <IconField icon={<BriefcaseBusiness aria-hidden="true" className="size-4" />}>
          <TextField
            id="profile-affiliation"
            name="affiliation"
            label="소속 여부"
            defaultValue={actorProfile?.affiliation ?? "프리랜서"}
            placeholder="소속 여부 입력"
          />
        </IconField>
      </div>
    </SurfaceCard>
  );
}

function KeywordEditor({
  actorProfile,
}: {
  actorProfile: ActorProfileRecord | null;
}) {
  return (
    <SurfaceCard className={sectionClassName}>
      <SectionTitle eyebrow="장르, 특기, 이미지" title="대표 키워드" />

      <div className="mt-6 space-y-5">
        <KeywordSelector
          name="genres"
          label="대표 장르"
          options={keywordOptions.genres}
          initialValues={actorProfile?.genres ?? []}
          addPlaceholder="대표 장르 입력"
        />
        <KeywordSelector
          name="skills"
          label="특기"
          options={keywordOptions.skills}
          initialValues={actorProfile?.skills ?? []}
          addPlaceholder="특기 입력"
        />
        <KeywordSelector
          name="image_tags"
          label="이미지 키워드"
          options={keywordOptions.imageTags}
          initialValues={actorProfile?.image_tags ?? []}
          addPlaceholder="이미지 키워드 입력"
        />
      </div>
    </SurfaceCard>
  );
}

function EditableHistoryCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <SurfaceCard className={sectionClassName}>
      <div className="mb-5 flex items-center gap-2 text-2xl font-bold tracking-normal">
        <h2>{title}</h2>
      </div>
      {children}
    </SurfaceCard>
  );
}

function SectionTitle({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-bold tracking-normal">{title}</h2>
    </div>
  );
}

function IconField({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-xl bg-muted/35 p-4">
      <div className="mt-7 shrink-0 text-muted-foreground">{icon}</div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function TextField({
  id,
  name,
  label,
  defaultValue,
  placeholder,
  type = "text",
  inputMode,
  required,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  placeholder?: string;
  type?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        inputMode={inputMode}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="bg-background/70"
      />
    </div>
  );
}
