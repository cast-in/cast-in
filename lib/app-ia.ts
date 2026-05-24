import type { UserRole } from "@/types/enums";

export const APP_HOME_HREF = "/dashboard";

export type AppTabHref =
  | "/talents"
  | "/discover"
  | "/jobs"
  | "/profile"
  | "/messages"
  | "/cds";

export const APP_TABS: Record<
  UserRole,
  readonly {
    href: AppTabHref;
    label: string;
  }[]
> = {
  actor: [
    { href: "/talents", label: "공고 탐색" },
    { href: "/jobs", label: "지원 관리" },
    { href: "/messages", label: "메시지" },
    { href: "/profile", label: "프로필" },
  ],
  casting: [
    { href: "/talents", label: "배우 탐색" },
    { href: "/discover", label: "공고 탐색" },
    { href: "/jobs", label: "공고 관리" },
    { href: "/messages", label: "메시지" },
    { href: "/profile", label: "프로필" },
  ],
};

export function getRoleModeLabel(role: UserRole) {
  return role === "actor" ? "배우 모드" : "캐스팅 모드";
}

export function getRoleEntityLabel(role: UserRole) {
  return role === "actor" ? "배우" : "캐스팅 디렉터";
}

export function isAppTabActive({
  href,
  pathname,
  role,
  source,
}: {
  href: AppTabHref;
  pathname: string;
  role: UserRole;
  source?: string | null;
}) {
  if (role === "actor" && pathname.startsWith("/jobs/")) {
    return href === "/talents";
  }
  if (
    role === "casting" &&
    pathname.startsWith("/jobs/") &&
    source === "discover"
  ) {
    return href === "/discover";
  }

  return pathname === href || pathname.startsWith(href + "/");
}
