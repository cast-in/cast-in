import type { BadgeColor, BadgeVariant } from "@/components/ui/badge";
import type { ApplicationStatus } from "@/types/enums";

export type ApplicationStatusMeta = {
  value: ApplicationStatus;
  label: string;
  color: BadgeColor;
  variant: BadgeVariant;
};

export const APPLICATION_STATUS_OPTIONS: ApplicationStatusMeta[] = [
  { value: "pending", label: "대기", color: "secondary", variant: "fill" },
  { value: "reviewing", label: "검토 중", color: "primary", variant: "fill" },
  { value: "pass", label: "합격", color: "primary", variant: "fill" },
  { value: "hold", label: "보류", color: "neutral", variant: "outline" },
  { value: "reject", label: "반려", color: "destructive", variant: "soft" },
];

export const APPLICATION_STATUS_META = Object.fromEntries(
  APPLICATION_STATUS_OPTIONS.map((opt) => [opt.value, opt]),
) as Record<ApplicationStatus, ApplicationStatusMeta>;
