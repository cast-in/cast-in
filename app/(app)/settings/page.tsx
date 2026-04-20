import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageContainer } from "@/components/page-container";
import { ThemePreferenceControl } from "@/components/theme-preference-control";
import { signOutAction } from "@/app/(public)/login/actions";
import { getViewerProfile } from "@/lib/queries/viewer";
import { cookies } from "next/headers";
import { isThemePreference, THEME_PREFERENCE_KEY } from "@/lib/theme";
import { ModeSwitcher } from "./mode-switcher";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const storedThemePreference = cookieStore.get(THEME_PREFERENCE_KEY)?.value;
  const themePreference = isThemePreference(storedThemePreference)
    ? storedThemePreference
    : "system";
  const { user, activeRole, availableRoles } = await getViewerProfile();

  return (
    <PageContainer pageTitle="설정">
      {activeRole ? (
        <Card>
          <CardHeader>
            <CardTitle>활동 모드</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ModeSwitcher
              activeRole={activeRole}
              availableRoles={availableRoles}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>화면 모드</CardTitle>
        </CardHeader>
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
        <CardContent className="pt-4">
          <form action={signOutAction}>
            <Button type="submit" variant="secondary">
              로그아웃
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
