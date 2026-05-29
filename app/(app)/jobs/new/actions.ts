"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  JOB_AGE_GROUP_VALUES,
  JOB_TARGET_GENDER_VALUES,
} from "@/lib/job-filter-options";
import { getViewerProfile } from "@/lib/queries/viewer";
import { CreateJobSchema, formatZodError } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { getUserPublicStoragePath } from "@/lib/supabase/storage-url";

export type CreateJobResult =
  | { ok: true }
  | { ok: false; error: string };

export async function createJobAction(
  formData: FormData,
): Promise<CreateJobResult> {
  const { activeRole } = await getViewerProfile();
  if (activeRole !== "casting") {
    return { ok: false, error: "캐스팅에서만 공고를 등록할 수 있어요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "먼저 로그인해주세요." };

  const parsed = CreateJobSchema.safeParse({
    title: formData.get("title") ?? "",
    production_name: formData.get("production_name") ?? "",
    description: formData.get("description") ?? "",
    role_name: formData.get("role_name") ?? "",
    fee_text: formData.get("fee_text") ?? "",
    fee_type: formData.get("fee_type") ?? "negotiable",
    fee_amount: formData.get("fee_amount") ?? "",
    genre: formData.get("genre") ?? "",
    region: formData.get("region") ?? "",
    shooting_schedule: formData.get("shooting_schedule") ?? "",
    deadline: formData.get("deadline") ?? "",
    requirements: formData.get("requirements") ?? "",
    role_type: formData.get("role_type") ?? "",
    target_age_min: formData.get("target_age_min") ?? "",
    target_age_max: formData.get("target_age_max") ?? "",
    target_genders: formData.getAll("target_genders").join(","),
    target_age_groups: formData.getAll("target_age_groups").join(","),
    platforms: formData.getAll("platforms").join(","),
    media_urls: formData.getAll("media_urls").join(","),
    application_questions: formData.get("application_questions") ?? "",
    status: formData.get("status") ?? "open",
  });
  if (!parsed.success) {
    return { ok: false, error: formatZodError(parsed.error) };
  }

  const {
    title,
    production_name,
    description,
    role_name,
    fee_text,
    fee_type,
    fee_amount,
    genre,
    region,
    shooting_schedule,
    deadline,
    requirements,
    role_type,
    target_age_min,
    target_age_max,
    target_genders,
    target_age_groups,
    platforms,
    media_urls,
    application_questions,
    status,
  } = parsed.data;

  const resolvedFeeText = formatFeeText({ feeText: fee_text, feeType: fee_type, feeAmount: fee_amount });
  const resolvedAgeGroups =
    target_age_groups.length > 0
      ? target_age_groups
      : getAgeGroupsFromRange(target_age_min, target_age_max);
  const validMediaUrls = media_urls.every((url) =>
    getUserPublicStoragePath(url, "job-media", user.id),
  );

  if (!validMediaUrls) {
    return { ok: false, error: "업로드한 공고 이미지를 다시 확인해주세요." };
  }

  const { data: job, error } = await supabase
    .from("jobs")
    .insert({
      casting_id: user.id,
      title,
      production_name,
      description,
      role_name,
      fee_text: resolvedFeeText,
      fee_type,
      fee_amount,
      genre,
      region,
      shooting_schedule,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      requirements,
      role_type,
      target_age_min,
      target_age_max,
      target_genders:
        target_genders.length > 0 ? target_genders : JOB_TARGET_GENDER_VALUES,
      target_age_groups: resolvedAgeGroups,
      platforms,
      media_urls,
      status,
    })
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!job) return { ok: false, error: "공고 등록에 실패했어요." };

  if (application_questions.length > 0) {
    const { error: questionsError } = await supabase
      .from("job_application_questions")
      .insert(
        application_questions.map((question, index) => ({
          job_id: job.id,
          label: question.label,
          required: question.required,
          sort_order: index,
        })),
      );

    if (questionsError) {
      await supabase.from("jobs").delete().eq("id", job.id).eq("casting_id", user.id);
      return { ok: false, error: questionsError.message };
    }
  }

  revalidatePath("/jobs");
  revalidatePath("/discover");
  revalidatePath("/talents");
  redirect("/jobs");
}

function formatFeeText({
  feeAmount,
  feeText,
  feeType,
}: {
  feeAmount: number | null;
  feeText: string | null;
  feeType: string;
}) {
  if (feeText) return feeText;
  if (feeType === "negotiable") return "협의";
  if (feeAmount === null) return null;

  const amount = `${feeAmount.toLocaleString("ko-KR")}원`;
  if (feeType === "per_episode") return `회차 ${amount}`;
  if (feeType === "daily") return `일급 ${amount}`;
  if (feeType === "flat") return `총액 ${amount}`;
  return amount;
}

function getAgeGroupsFromRange(minAge: number | null, maxAge: number | null) {
  if (minAge === null && maxAge === null) return JOB_AGE_GROUP_VALUES;

  return JOB_AGE_GROUP_VALUES.filter((group) => {
    const [start, end] = getAgeGroupRange(group);
    return (maxAge ?? 120) >= start && (minAge ?? 0) <= end;
  });
}

function getAgeGroupRange(group: (typeof JOB_AGE_GROUP_VALUES)[number]) {
  if (group === "10s") return [10, 19] as const;
  if (group === "20s") return [20, 29] as const;
  if (group === "30s") return [30, 39] as const;
  if (group === "40s") return [40, 49] as const;
  return [50, 120] as const;
}
