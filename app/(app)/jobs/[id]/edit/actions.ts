"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  JOB_AGE_GROUP_VALUES,
  JOB_TARGET_GENDER_VALUES,
} from "@/lib/job-filter-options";
import { getViewerProfile } from "@/lib/queries/viewer";
import { UpdateJobSchema, formatZodError } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

export type UpdateJobResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateJobAction(
  formData: FormData,
): Promise<UpdateJobResult> {
  const parsed = UpdateJobSchema.safeParse({
    job_id: formData.get("job_id") ?? "",
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
    fee_text: formData.get("fee_text") ?? "",
    genre: formData.get("genre") ?? "",
    region: formData.get("region") ?? "",
    shooting_schedule: formData.get("shooting_schedule") ?? "",
    deadline: formData.get("deadline") ?? "",
    requirements: formData.get("requirements") ?? "",
    role_type: formData.get("role_type") ?? "",
    target_genders: formData.getAll("target_genders").join(","),
    target_age_groups: formData.getAll("target_age_groups").join(","),
    platforms: formData.getAll("platforms").join(","),
    status: formData.get("status") ?? "open",
  });
  if (!parsed.success) {
    return { ok: false, error: formatZodError(parsed.error) };
  }

  const { activeRole } = await getViewerProfile();
  if (activeRole !== "casting") {
    return { ok: false, error: "캐스팅에서만 공고를 수정할 수 있어요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "먼저 로그인해주세요." };

  const { data: job, error: fetchError } = await supabase
    .from("jobs")
    .select("id, casting_id")
    .eq("id", parsed.data.job_id)
    .maybeSingle();
  if (fetchError) return { ok: false, error: fetchError.message };
  if (!job) return { ok: false, error: "공고를 찾을 수 없어요." };
  if (job.casting_id !== user.id) {
    return { ok: false, error: "이 공고를 수정할 권한이 없어요." };
  }

  const {
    job_id,
    title,
    description,
    fee_text,
    genre,
    region,
    shooting_schedule,
    deadline,
    requirements,
    role_type,
    target_genders,
    target_age_groups,
    platforms,
    status,
  } = parsed.data;

  const { error } = await supabase
    .from("jobs")
    .update({
      title,
      description,
      fee_text,
      genre,
      region,
      shooting_schedule,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      requirements,
      role_type,
      target_genders:
        target_genders.length > 0 ? target_genders : JOB_TARGET_GENDER_VALUES,
      target_age_groups:
        target_age_groups.length > 0 ? target_age_groups : JOB_AGE_GROUP_VALUES,
      platforms,
      status,
    })
    .eq("id", job_id)
    .eq("casting_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/jobs/${job_id}`);
  revalidatePath("/jobs");
  revalidatePath("/discover");
  redirect(`/jobs/${job_id}`);
}
