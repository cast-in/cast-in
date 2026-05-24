import type { UserRole } from "@/types/enums";

export const APP_HOME_HREF = "/dashboard";

export const APP_TABS: Record<
  UserRole,
  readonly {
    href:
      | "/talents"
      | "/jobs"
      | "/profile"
      | "/messages"
      | "/cds";
    label: string;
  }[]
> = {
  actor: [
    { href: "/talents", label: "공고 탐색" },
    { href: "/jobs", label: "지원 관리" },
    { href: "/messages", label: "메시지" },
    { href: "/profile", label: "프로필" },
    { href: "/cds", label: "CDS" },
  ],
  casting: [
    { href: "/talents", label: "배우 탐색" },
    { href: "/jobs", label: "공고 관리" },
    { href: "/messages", label: "메시지" },
    { href: "/profile", label: "프로필" },
    { href: "/cds", label: "CDS" },
  ],
};

export function getRoleModeLabel(role: UserRole) {
  return role === "actor" ? "배우 모드" : "캐스팅 모드";
}

export function getRoleEntityLabel(role: UserRole) {
  return role === "actor" ? "배우" : "캐스팅 디렉터";
}
