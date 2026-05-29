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
import { getUserPublicStoragePath } from "@/lib/supabase/storage-url";

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
    media_urls: formData.getAll("media_urls").join(","),
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
    .select("id, casting_id, media_urls")
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
    media_urls,
    status,
  } = parsed.data;
  const existingMediaUrls = job.media_urls ?? [];
  const existingMediaUrlSet = new Set(existingMediaUrls);
  const validMediaUrls = media_urls.every((url) =>
    existingMediaUrlSet.has(url) ||
    getUserPublicStoragePath(url, "job-media", user.id),
  );

  if (!validMediaUrls) {
    return { ok: false, error: "업로드한 공고 이미지를 다시 확인해주세요." };
  }

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
      media_urls,
      status,
    })
    .eq("id", job_id)
    .eq("casting_id", user.id);

  if (error) return { ok: false, error: error.message };

  await removeUnusedJobMedia({
    nextUrls: media_urls,
    previousUrls: existingMediaUrls,
    supabase,
    userId: user.id,
  });

  revalidatePath(`/jobs/${job_id}`);
  revalidatePath("/jobs");
  revalidatePath("/discover");
  revalidatePath("/talents");
  revalidatePath("/bookmarks");
  revalidatePath(`/castings/${user.id}`);
  redirect(`/jobs/${job_id}`);
}

async function removeUnusedJobMedia({
  nextUrls,
  previousUrls,
  supabase,
  userId,
}: {
  nextUrls: readonly string[];
  previousUrls: readonly string[];
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
}) {
  const nextPaths = new Set(
    nextUrls
      .map((url) => getUserPublicStoragePath(url, "job-media", userId))
      .filter((path): path is string => Boolean(path)),
  );
  const removedPaths = [
    ...new Set(
      previousUrls
        .map((url) => getUserPublicStoragePath(url, "job-media", userId))
        .filter((path): path is string => Boolean(path))
        .filter((path) => !nextPaths.has(path)),
    ),
  ];

  if (removedPaths.length === 0) return;
  await supabase.storage.from("job-media").remove(removedPaths);
}
