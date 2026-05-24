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

  const {
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

  const { error } = await supabase.from("jobs").insert({
    casting_id: user.id,
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
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/jobs");
  redirect("/jobs");
}
