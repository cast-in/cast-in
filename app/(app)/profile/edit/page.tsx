import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProfileForm } from "@/app/onboarding/profile/profile-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageContainer } from "@/components/page-container";
import { getRoleEntityLabel, getRoleModeLabel } from "@/lib/app-ia";
import { getViewerProfile } from "@/lib/queries/viewer";
import { createClient } from "@/lib/supabase/server";
import { AvatarUploader } from "./avatar-uploader";

export default async function ProfileEditPage() {
  const { profile, activeRole } = await getViewerProfile();
  if (!profile || !activeRole) return null;

  const supabase = await createClient();

  if (activeRole === "casting") {
    const { data: castingProfile } = await supabase
      .from("casting_profiles")
      .select("company_name, contact, intro")
      .eq("user_id", profile.id)
      .maybeSingle();

    return (
      <PageContainer>
        <EditHeader activeRole={activeRole} />
        <Card className="rounded-[28px] border-none bg-card py-0 shadow-sm ring-1 ring-border/70">
          <CardHeader className="px-6 pt-6">
            <CardDescription>{getRoleModeLabel(activeRole)}</CardDescription>
            <CardTitle className="text-xl">프로필 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 px-6 pb-6">
            <AvatarUploader
              userId={profile.id}
              profileName={profile.name}
              initialAvatarUrl={profile.avatar_url ?? null}
            />
            <ProfileForm
              role="casting"
              extended
              redirectTo="/profile"
              submitLabel="저장하기"
              defaults={{
                name: profile.name,
                company_name: castingProfile?.company_name ?? profile.name,
                contact: castingProfile?.contact ?? "",
                intro: castingProfile?.intro ?? "",
              }}
            />
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const { data: actorProfile } = await supabase
    .from("actor_profiles")
    .select("region, age, genres, bio, skills, visibility")
    .eq("user_id", profile.id)
    .maybeSingle();
  const visibility =
    actorProfile?.visibility === "connections" || actorProfile?.visibility === "private"
      ? actorProfile.visibility
      : "public";

  return (
    <PageContainer>
      <EditHeader activeRole={activeRole} />
      <Card className="rounded-[28px] border-none bg-card py-0 shadow-sm ring-1 ring-border/70">
        <CardHeader className="px-6 pt-6">
          <CardDescription>{getRoleModeLabel(activeRole)}</CardDescription>
          <CardTitle className="text-xl">프로필 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 px-6 pb-6">
          <AvatarUploader
            userId={profile.id}
            profileName={profile.name}
            initialAvatarUrl={profile.avatar_url ?? null}
          />
          <ProfileForm
            role="actor"
            extended
            redirectTo="/profile"
            submitLabel="저장하기"
            defaults={{
              name: profile.name,
              age: actorProfile?.age ?? null,
              region: actorProfile?.region ?? "",
              genres: actorProfile?.genres ?? [],
              skills: actorProfile?.skills ?? [],
              bio: actorProfile?.bio ?? "",
              visibility,
            }}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}

function EditHeader({ activeRole }: { activeRole: "actor" | "casting" }) {
  return (
    <div className="space-y-3">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        프로필로
      </Link>
      <div className="space-y-2">
        <Badge variant="secondary">프로필 수정</Badge>
        <h1 className="text-3xl font-bold tracking-tight">
          {getRoleEntityLabel(activeRole)} 프로필 수정
        </h1>
      </div>
    </div>
  );
}
