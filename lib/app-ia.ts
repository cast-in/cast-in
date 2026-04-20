import type { UserRole } from "@/types/enums";

export const APP_TABS: Record<
  UserRole,
  readonly {
    href: "/discover" | "/talents" | "/jobs" | "/messages" | "/profile";
    label: string;
  }[]
> = {
  actor: [
    { href: "/discover", label: "둘러보기" },
    { href: "/talents", label: "오디션 탐색" },
    { href: "/jobs", label: "지원 관리" },
    { href: "/messages", label: "메시지" },
    { href: "/profile", label: "프로필" },
  ],
  casting: [
    { href: "/discover", label: "인재 찾기" },
    { href: "/talents", label: "배우 탐색" },
    { href: "/jobs", label: "공고 관리" },
    { href: "/messages", label: "메시지" },
    { href: "/profile", label: "프로필" },
  ],
};

export function getRoleModeLabel(role: UserRole) {
  return role === "actor" ? "배우 모드" : "캐스팅 모드";
}

export function getRoleEntityLabel(role: UserRole) {
  return role === "actor" ? "배우" : "캐스팅 담당자";
}
