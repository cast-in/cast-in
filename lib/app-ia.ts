import type { UserRole } from "@/types/enums";

export const APP_TABS: Record<
  UserRole,
  readonly {
    href:
      | "/discover"
      | "/talents"
      | "/jobs"
      | "/messages"
      | "/notifications";
    label: string;
  }[]
> = {
  actor: [
    { href: "/discover", label: "둘러보기" },
    { href: "/talents", label: "공고 찾기" },
    { href: "/jobs", label: "내 지원" },
    { href: "/messages", label: "메시지" },
    { href: "/notifications", label: "알림" },
  ],
  casting: [
    { href: "/discover", label: "인재 찾기" },
    { href: "/talents", label: "배우 탐색" },
    { href: "/jobs", label: "공고 관리" },
    { href: "/messages", label: "메시지" },
    { href: "/notifications", label: "알림" },
  ],
};

export function getRoleModeLabel(role: UserRole) {
  return role === "actor" ? "배우 모드" : "캐스팅 모드";
}

export function getRoleEntityLabel(role: UserRole) {
  return role === "actor" ? "배우" : "캐스팅 담당자";
}
