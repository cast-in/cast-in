import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThemePreferenceControl } from "@/components/theme-preference-control";
import { signOutAction } from "@/app/(public)/login/actions";
import { getRoleModeLabel } from "@/lib/app-ia";
import { getViewerProfile } from "@/lib/queries/viewer";
import { cookies } from "next/headers";
import { isThemePreference, THEME_PREFERENCE_KEY } from "@/lib/theme";
import { switchActiveRoleAction } from "./actions";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const storedThemePreference = cookieStore.get(THEME_PREFERENCE_KEY)?.value;
  const themePreference = isThemePreference(storedThemePreference)
    ? storedThemePreference
    : "system";
  const { user, activeRole, availableRoles } = await getViewerProfile();

  return (
    <section className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight">설정</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>활동 모드</CardTitle>
          <CardDescription>
            한 계정으로 배우와 캐스팅 담당자 역할을 모두 쓸 수 있어요. 필요한
            모드로 바로 전환하면 돼요.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="grid gap-4 pt-4">
          {(["actor", "casting"] as const).map((role) => {
            const enabled = availableRoles.includes(role);
            const active = activeRole === role;

            return (
              <div
                key={role}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{getRoleModeLabel(role)}</span>
                    {active ? <Badge>현재 모드</Badge> : null}
                    {!enabled ? <Badge variant="secondary">미추가</Badge> : null}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {role === "actor"
                      ? "오디션을 찾고 지원 상태를 관리해요."
                      : "인재를 찾고 공고와 지원자를 관리해요."}
                  </p>
                </div>

                {enabled ? (
                  active ? (
                    <Button type="button" variant="secondary" disabled>
                      사용 중
                    </Button>
                  ) : (
                    <form action={switchActiveRoleAction}>
                      <input type="hidden" name="role" value={role} />
                      <Button type="submit">{getRoleModeLabel(role)}로 전환</Button>
                    </form>
                  )
                ) : (
                  <Link
                    href={`/onboarding/profile?role=${role}&intent=add`}
                    className={buttonVariants({ variant: "secondary" })}
                  >
                    {getRoleModeLabel(role)} 추가
                  </Link>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>화면 모드</CardTitle>
          <CardDescription>
            라이트, 다크, 시스템 모드 중에서 원하는 화면을 선택할 수 있어요.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <ThemePreferenceControl initialPreference={themePreference} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>계정</CardTitle>
          <CardDescription>
            {user?.email ?? "로그인 정보를 찾을 수 없어요."}
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <form action={signOutAction}>
            <Button type="submit" variant="secondary">
              로그아웃
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
