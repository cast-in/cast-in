import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageContainer } from "@/components/page-container";
import { signOutAction } from "@/app/(public)/login/actions";
import { getMyNotificationSettings } from "@/lib/queries/settings";
import { getViewerProfile } from "@/lib/queries/viewer";
import { DeleteAccountDialog } from "./delete-account-dialog";
import { ModeSwitcher } from "./mode-switcher";
import { NotificationSettingsForm } from "./notification-settings-form";
import { PasswordResetForm } from "./password-reset-form";

export default async function SettingsPage() {
  const { user, activeRole, availableRoles } = await getViewerProfile();
  const notificationSettings = await getMyNotificationSettings();

  return (
    <PageContainer pageTitle="설정" size="narrow" className="pb-16">
      {activeRole ? (
        <Card>
          <CardHeader>
            <CardTitle>활동 모드</CardTitle>
            <CardDescription>
              배우와 캐스팅 프로필을 모두 만들면 활동 모드를 바꿀 수 있어요.
            </CardDescription>
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
          <CardTitle>알림</CardTitle>
          <CardDescription>
            받지 않도록 끄면 새 알림을 만들지 않아요.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <NotificationSettingsForm initialSettings={notificationSettings} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>계정</CardTitle>
          <CardDescription>
            {user?.email ?? "로그인 정보를 찾을 수 없어요."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 pt-4">
          <section className="grid gap-2">
            <h2 className="text-sm font-bold">비밀번호</h2>
            <p className="text-sm text-muted-foreground">
              로그인한 이메일로 비밀번호 재설정 링크를 보내요.
            </p>
            <PasswordResetForm />
          </section>

          <section className="grid gap-2 border-t border-border pt-5">
            <h2 className="text-sm font-bold">로그아웃</h2>
            <p className="text-sm text-muted-foreground">
              이 기기에서 현재 계정 세션을 종료해요.
            </p>
            <div>
              <form action={signOutAction}>
                <Button type="submit" color="secondary">
                  로그아웃
                </Button>
              </form>
            </div>
          </section>
        </CardContent>
      </Card>

      <Card className="border border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">위험한 작업</CardTitle>
          <CardDescription>
            계정을 삭제하면 프로필, 공고, 지원 내역, 메시지를 되돌릴 수 없어요.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <DeleteAccountDialog />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
