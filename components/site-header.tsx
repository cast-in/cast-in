import Link from "next/link";
import { AppNav } from "@/app/(app)/app-nav";
import type { UserRole } from "@/types/enums";
import { BrandLogo } from "@/components/brand-logo";
import { HeaderUserMenu } from "@/components/header-user-menu";
import { MobileSiteMenu } from "@/components/mobile-site-menu";
import { buttonVariants } from "@/components/ui/button";

type HeaderViewer = {
  user: { email?: string | null } | null;
  profile: { name: string; avatar_url?: string | null } | null;
  activeRole: UserRole | null;
  availableRoles: UserRole[];
  unreadMessages?: number;
  unreadNotifications?: number;
};

export function SiteHeader({ viewer }: { viewer: HeaderViewer }) {
  const showAuthenticatedHeader = Boolean(
    viewer.user && viewer.profile && viewer.activeRole,
  );
  const needsOnboarding = Boolean(viewer.user && !showAuthenticatedHeader);

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-5 py-3">
        <Link href="/">
          <BrandLogo size={32} textClassName="text-lg" />
        </Link>

        {showAuthenticatedHeader && viewer.activeRole ? (
          <>
            <div className="hidden md:block">
              <AppNav
                role={viewer.activeRole}
                counts={{
                  messages: viewer.unreadMessages,
                  notifications: viewer.unreadNotifications,
                }}
              />
            </div>

            <HeaderUserMenu
              activeRole={viewer.activeRole}
              availableRoles={viewer.availableRoles}
              profileName={viewer.profile?.name ?? "사용자"}
              avatarUrl={viewer.profile?.avatar_url ?? null}
              userEmail={viewer.user?.email}
            />

            <MobileSiteMenu
              activeRole={viewer.activeRole}
              profileName={viewer.profile?.name ?? "사용자"}
              avatarUrl={viewer.profile?.avatar_url ?? null}
              userEmail={viewer.user?.email}
              counts={{
                messages: viewer.unreadMessages,
                notifications: viewer.unreadNotifications,
              }}
            />
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
