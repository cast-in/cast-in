import { z } from "zod";
import {
  JOB_AGE_GROUP_OPTIONS,
  JOB_PLATFORM_OPTIONS,
  JOB_ROLE_TYPE_OPTIONS,
  JOB_TARGET_GENDER_OPTIONS,
} from "@/lib/job-filter-options";

const optionalString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => (typeof value === "string" ? value.trim() : ""))
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

const optionalPositiveInt = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    if (value === null || value === undefined || value === "") return null;

    const normalized =
      typeof value === "number"
        ? String(value)
        : value.replaceAll(",", "").trim();
    if (!normalized) return null;

    const parsed = Number(normalized);
    if (!Number.isInteger(parsed) || parsed < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "숫자를 다시 입력해주세요.",
      });
      return z.NEVER;
    }

    return parsed;
  });

const roleTypeSchema = optionalString.refine(
  (value) =>
    value === null ||
    JOB_ROLE_TYPE_OPTIONS.includes(
      value as (typeof JOB_ROLE_TYPE_OPTIONS)[number],
    ),
  "역할을 다시 선택해주세요.",
);

const feeTypeSchema = z
  .enum(["negotiable", "per_episode", "daily", "flat", "other"])
  .catch("negotiable");

const JobApplicationQuestionSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "추가 질문 내용을 입력해주세요.")
    .max(80, "추가 질문은 80자 이내로 입력해주세요."),
  required: z.boolean().catch(false),
});

const applicationQuestionsJson = z
  .string()
  .optional()
  .transform((value, ctx) => {
    if (!value?.trim()) return [];

    try {
      const parsed = JSON.parse(value) as unknown;
      const result = z.array(JobApplicationQuestionSchema).safeParse(parsed);
      if (!result.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: formatZodError(result.error),
        });
        return z.NEVER;
      }
      return result.data;
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "추가 질문 정보를 다시 확인해주세요.",
      });
      return z.NEVER;
    }
  });

export const ApplicationStatusSchema = z.enum([
  "pending",
  "reviewing",
  "pass",
  "hold",
  "reject",
]);

const JobFieldsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "공고 제목을 입력해주세요.")
    .max(120, "공고 제목은 120자 이내로 입력해주세요."),
  production_name: optionalString,
  description: optionalString,
  role_name: optionalString,
  fee_text: optionalString,
  fee_type: feeTypeSchema,
  fee_amount: optionalPositiveInt,
  genre: optionalString,
  region: optionalString,
  shooting_schedule: optionalString,
  deadline: optionalString,
  requirements: csvStringArray,
  role_type: roleTypeSchema,
  target_age_min: optionalPositiveInt,
  target_age_max: optionalPositiveInt,
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
  media_urls: csvStringArray,
  application_questions: applicationQuestionsJson,
});

export const CreateJobSchema = JobFieldsSchema.extend({
  status: z.enum(["open", "draft"]).catch("open"),
}).superRefine((data, ctx) => {
  if (data.status !== "open") return;

  const requiredFields = [
    ["production_name", data.production_name, "제작사/브랜드명을 입력해주세요."],
    ["region", data.region, "촬영 지역을 선택해주세요."],
    ["genre", data.genre, "장르를 선택해주세요."],
    ["deadline", data.deadline, "마감 일시를 선택해주세요."],
    ["role_type", data.role_type, "역할 유형을 선택해주세요."],
    ["description", data.description, "상세 설명을 입력해주세요."],
  ] as const;

  for (const [path, value, message] of requiredFields) {
    if (!value) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [path],
        message,
      });
    }
  }

  if (data.target_genders.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["target_genders"],
      message: "성별을 선택해주세요.",
    });
  }

  if (
    data.target_age_min !== null &&
    data.target_age_max !== null &&
    data.target_age_min > data.target_age_max
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["target_age_min"],
      message: "최소 나이는 최대 나이보다 작아야 해요.",
    });
  }
});

export const UpdateJobSchema = JobFieldsSchema.extend({
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

export const StartActorConversationSchema = z.object({
  actor_id: z.string().uuid("배우 정보를 찾을 수 없어요."),
  job_id: z.string().uuid("공고 정보를 찾을 수 없어요.").optional(),
  message: z
    .string()
    .trim()
    .min(1, "메시지를 입력해주세요.")
    .max(1000, "메시지는 1,000자 이내로 입력해주세요."),
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

export const WithdrawApplicationSchema = z.object({
  application_id: z.string().uuid("지원 정보를 찾을 수 없어요."),
});

export function formatZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "입력값을 확인해주세요.";
}
