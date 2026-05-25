import type { BadgeColor, BadgeVariant } from "@/components/ui/badge";
import type { ApplicationStatus } from "@/types/enums";

export type ApplicationStatusMeta = {
  value: ApplicationStatus;
  label: string;
  color: BadgeColor;
  variant: BadgeVariant;
};

export type SelectableApplicationStatus = Exclude<ApplicationStatus, "pending">;

export const APPLICATION_STATUS_META: Record<
  ApplicationStatus,
  ApplicationStatusMeta
> = {
  pending: {
    value: "pending",
    label: "검토 중",
    color: "primary",
    variant: "soft-outline",
  },
  reviewing: {
    value: "reviewing",
    label: "검토 중",
    color: "primary",
    variant: "soft-outline",
  },
  pass: { value: "pass", label: "합격", color: "primary", variant: "fill" },
  hold: { value: "hold", label: "보류", color: "neutral", variant: "outline" },
  reject: {
    value: "reject",
    label: "반려",
    color: "destructive",
    variant: "soft",
  },
};

export const APPLICATION_STATUS_OPTIONS: ApplicationStatusMeta[] = [
  APPLICATION_STATUS_META.reviewing,
  { value: "pass", label: "합격", color: "primary", variant: "fill" },
  { value: "hold", label: "보류", color: "neutral", variant: "outline" },
  { value: "reject", label: "반려", color: "destructive", variant: "soft" },
];

export function toSelectableApplicationStatus(
  status: ApplicationStatus,
): SelectableApplicationStatus {
  return status === "pending" ? "reviewing" : status;
}
