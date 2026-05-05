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
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-5 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link href={logoHref} className="shrink-0">
            <BrandLogo size={32} textClassName="text-lg" />
          </Link>
          {showAuthenticatedHeader && viewer.activeRole ? (
            <RoleModeBadge role={viewer.activeRole} />
          ) : null}
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
                  className={buttonVariants({ variant: "ghost" })}
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

function RoleModeBadge({ role }: { role: UserRole }) {
  const isActor = role === "actor";

  return (
    <span
      className={
        isActor
          ? "inline-flex h-6 shrink-0 items-center rounded-full border border-actor/20 bg-actor-soft px-2 text-[11px] font-semibold leading-none text-actor"
          : "inline-flex h-6 shrink-0 items-center rounded-full border border-casting/20 bg-casting-soft px-2 text-[11px] font-semibold leading-none text-casting"
      }
    >
      {isActor ? "배우 모드" : "캐스팅 모드"}
    </span>
  );
}
