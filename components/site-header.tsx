import Link from "next/link";
import { AppNav } from "@/app/(app)/app-nav";
import type { UserRole } from "@/types/enums";
import { BrandLogo } from "@/components/brand-logo";
import { HeaderUserMenu } from "@/components/header-user-menu";
import { MobileSiteMenu } from "@/components/mobile-site-menu";
import { NotificationBell } from "@/components/notification-bell";
import { buttonVariants } from "@/components/ui/button";
import { APP_HOME_HREF } from "@/lib/app-ia";
import type { NotificationItem } from "@/lib/queries/notifications";

type HeaderViewer = {
  user: { email?: string | null } | null;
  profile: { name: string; avatar_url?: string | null } | null;
  activeRole: UserRole | null;
  availableRoles: UserRole[];
  unreadMessages?: number;
  unreadNotifications?: number;
  recentNotifications?: NotificationItem[];
};

export function SiteHeader({ viewer }: { viewer: HeaderViewer }) {
  const showAuthenticatedHeader = Boolean(
    viewer.user && viewer.profile && viewer.activeRole,
  );
  const needsOnboarding = Boolean(viewer.user && !showAuthenticatedHeader);
  const logoHref = showAuthenticatedHeader ? APP_HOME_HREF : "/";

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/95 backdrop-blur after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:z-0 after:h-px after:bg-border after:content-['']">
      <div className="relative z-10 mx-auto flex h-full max-w-5xl items-center justify-between gap-6 px-5">
        <div className="flex min-w-0 items-center gap-2">
          <Link href={logoHref} className="shrink-0">
            <BrandLogo size={32} />
          </Link>
        </div>

        {showAuthenticatedHeader && viewer.activeRole ? (
          <>
            <div className="hidden md:block">
              <AppNav
                role={viewer.activeRole}
                counts={{
                  messages: viewer.unreadMessages,
                }}
              />
            </div>

            <div className="flex items-center gap-2">
              <HeaderUserMenu
                activeRole={viewer.activeRole}
                availableRoles={viewer.availableRoles}
                profileName={viewer.profile?.name ?? "사용자"}
                avatarUrl={viewer.profile?.avatar_url ?? null}
                userEmail={viewer.user?.email}
              />

              <NotificationBell
                unreadCount={viewer.unreadNotifications ?? 0}
                notifications={viewer.recentNotifications ?? []}
                panelClassName="right-[-2.75rem] md:right-0"
              />

              <MobileSiteMenu
                activeRole={viewer.activeRole}
                profileName={viewer.profile?.name ?? "사용자"}
                avatarUrl={viewer.profile?.avatar_url ?? null}
                userEmail={viewer.user?.email}
                counts={{
                  messages: viewer.unreadMessages,
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            {needsOnboarding ? (
              <Link href="/onboarding/role" className={buttonVariants()}>
                온보딩 이어가기
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className={buttonVariants({ color: "neutral", variant: "ghost" })}
                >
                  로그인
                </Link>
                <Link href="/login" className={buttonVariants()}>
                  시작하기
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
