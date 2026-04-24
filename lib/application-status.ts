import type { ApplicationStatus } from "@/types/enums";

type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

export type ApplicationStatusMeta = {
  value: ApplicationStatus;
  label: string;
  variant: BadgeVariant;
};

export const APPLICATION_STATUS_OPTIONS: ApplicationStatusMeta[] = [
  { value: "pending", label: "대기", variant: "secondary" },
  { value: "reviewing", label: "검토 중", variant: "default" },
  { value: "pass", label: "합격", variant: "default" },
  { value: "hold", label: "보류", variant: "outline" },
  { value: "reject", label: "반려", variant: "destructive" },
];

export const APPLICATION_STATUS_META = Object.fromEntries(
  APPLICATION_STATUS_OPTIONS.map((opt) => [opt.value, opt]),
) as Record<ApplicationStatus, ApplicationStatusMeta>;
