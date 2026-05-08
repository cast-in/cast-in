import { Badge } from "@/components/ui/badge";
import { getRoleEntityLabel } from "@/lib/app-ia";
import { getViewerProfile } from "@/lib/queries/viewer";
import { ProfileForm } from "./profile-form";

export default async function OnboardingProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; intent?: string }>;
}) {
  const { role, intent } = await searchParams;
  const resolvedRole: "actor" | "casting" =
    role === "casting" ? "casting" : "actor";
  const { profile } = await getViewerProfile();
  const isAddFlow = intent === "add";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge color="secondary">
          {isAddFlow ? "역할 추가" : "2/2 프로필 만들기"}
        </Badge>
        <h2 className="text-3xl font-bold tracking-tight">
          {getRoleEntityLabel(resolvedRole)} 프로필
        </h2>
        <p className="text-muted-foreground">
          {isAddFlow
            ? "새 역할을 추가하고 바로 전환해요."
            : "필요한 정보만 먼저 입력해요. 나머지는 나중에 채울 수 있어요."}
        </p>
      </div>

      <ProfileForm
        role={resolvedRole}
        defaultName={profile?.name ?? ""}
        submitLabel={isAddFlow ? "역할 추가하고 전환하기" : "캐스트인 시작하기"}
      />
    </div>
  );
}
