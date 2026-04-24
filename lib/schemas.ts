import { z } from "zod";

const optionalString = z
  .string()
  .transform((value) => value.trim())
  .transform((value) => (value.length > 0 ? value : null))
  .nullable();

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
  genre: optionalString,
  region: optionalString,
  deadline: optionalString,
  requirements: z
    .string()
    .optional()
    .transform((value) =>
      (value ?? "")
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  status: z.enum(["open", "draft"]).catch("open"),
});

export const ApplyToJobSchema = z.object({
  job_id: z.string().uuid("공고 정보를 찾을 수 없어요."),
  memo: optionalString,
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
