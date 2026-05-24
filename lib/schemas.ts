import { z } from "zod";
import {
  JOB_AGE_GROUP_OPTIONS,
  JOB_PLATFORM_OPTIONS,
  JOB_ROLE_TYPE_OPTIONS,
  JOB_TARGET_GENDER_OPTIONS,
} from "@/lib/job-filter-options";

const optionalString = z
  .string()
  .transform((value) => value.trim())
  .transform((value) => (value.length > 0 ? value : null))
  .nullable();

const csvStringArray = z
  .string()
  .optional()
  .transform((value) =>
    (value ?? "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean),
  );

function csvOptionArray(
  allowedValues: readonly string[],
  message: string,
) {
  return csvStringArray.superRefine((values, ctx) => {
    const invalidValue = values.find((value) => !allowedValues.includes(value));
    if (!invalidValue) return;

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message,
    });
  });
}

const roleTypeSchema = optionalString.refine(
  (value) =>
    value === null ||
    JOB_ROLE_TYPE_OPTIONS.includes(
      value as (typeof JOB_ROLE_TYPE_OPTIONS)[number],
    ),
  "역할을 다시 선택해주세요.",
);

export const ApplicationStatusSchema = z.enum([
  "pending",
  "reviewing",
  "pass",
  "hold",
  "reject",
]);

export const CreateJobSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "공고 제목을 입력해주세요.")
    .max(120, "공고 제목은 120자 이내로 입력해주세요."),
  description: optionalString,
  fee_text: optionalString,
  genre: optionalString,
  region: optionalString,
  shooting_schedule: optionalString,
  deadline: optionalString,
  requirements: csvStringArray,
  role_type: roleTypeSchema,
  target_genders: csvOptionArray(
    JOB_TARGET_GENDER_OPTIONS.map((option) => option.value),
    "대상 성별을 다시 선택해주세요.",
  ),
  target_age_groups: csvOptionArray(
    JOB_AGE_GROUP_OPTIONS.map((option) => option.value),
    "대상 연령대를 다시 선택해주세요.",
  ),
  platforms: csvOptionArray(
    JOB_PLATFORM_OPTIONS,
    "플랫폼/채널을 다시 선택해주세요.",
  ),
  status: z.enum(["open", "draft"]).catch("open"),
});

export const UpdateJobSchema = CreateJobSchema.extend({
  job_id: z.string().uuid("공고 정보를 찾을 수 없어요."),
  status: z.enum(["open", "closed", "draft"]).catch("open"),
});

export const ManageJobSchema = z.object({
  job_id: z.string().uuid("공고 정보를 찾을 수 없어요."),
});

export const ApplyToJobSchema = z.object({
  job_id: z.string().uuid("공고 정보를 찾을 수 없어요."),
  memo: optionalString,
});

export const StartJobConversationSchema = z.object({
  job_id: z.string().uuid("공고 정보를 찾을 수 없어요."),
  actor_id: z.string().uuid("배우 정보를 찾을 수 없어요.").optional(),
});

export const UpdateApplicationSchema = z
  .object({
    application_id: z.string().uuid("지원 정보를 찾을 수 없어요."),
    status: ApplicationStatusSchema.optional(),
    casting_memo: z
      .string()
      .optional()
      .transform((value) =>
        value === undefined
          ? undefined
          : value.trim().length > 0
            ? value.trim()
            : null,
      ),
  })
  .refine(
    (data) => data.status !== undefined || data.casting_memo !== undefined,
    { message: "변경할 내용이 없어요." },
  );

export function formatZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "입력값을 확인해주세요.";
}
