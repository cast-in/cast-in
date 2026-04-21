"use server";

import { revalidatePath } from "next/cache";
import { getViewerProfile } from "@/lib/queries/viewer";
import { isJobAccepting } from "@/lib/job-status";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationStatus } from "@/types/enums";

export type ApplyToJobResult =
  | { ok: true; applicationId: string }
  | { ok: false; error: string };

export type UpdateApplicationResult =
  | { ok: true }
  | { ok: false; error: string };

const APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  "pending",
  "reviewing",
  "pass",
  "hold",
  "reject",
];

export async function updateApplicationAction(
  formData: FormData,
): Promise<UpdateApplicationResult> {
  const applicationId = String(formData.get("application_id") ?? "");
  if (!applicationId) return { ok: false, error: "지원 정보를 찾을 수 없어요." };

  const { activeRole } = await getViewerProfile();
  if (activeRole !== "casting") {
    return { ok: false, error: "캐스팅만 지원자를 관리할 수 있어요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "먼저 로그인해주세요." };

  const { data: app, error: fetchErr } = await supabase
    .from("applications")
    .select("id, job_id, jobs!inner(casting_id)")
    .eq("id", applicationId)
    .maybeSingle();
  if (fetchErr) return { ok: false, error: fetchErr.message };
  if (!app) return { ok: false, error: "지원을 찾을 수 없어요." };

  const job = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;
  if (!job || job.casting_id !== user.id) {
    return { ok: false, error: "이 지원을 관리할 권한이 없어요." };
  }

  const update: { status?: ApplicationStatus; casting_memo?: string | null } = {};

  if (formData.has("status")) {
    const raw = String(formData.get("status") ?? "") as ApplicationStatus;
    if (!APPLICATION_STATUSES.includes(raw)) {
      return { ok: false, error: "잘못된 상태 값이에요." };
    }
    update.status = raw;
  }

  if (formData.has("casting_memo")) {
    update.casting_memo = String(formData.get("casting_memo") ?? "").trim() || null;
  }

  if (Object.keys(update).length === 0) {
    return { ok: false, error: "변경할 내용이 없어요." };
  }

  const { error } = await supabase
    .from("applications")
    .update(update)
    .eq("id", applicationId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/jobs/${app.job_id}`);
  return { ok: true };
}

export async function applyToJobAction(
  formData: FormData,
): Promise<ApplyToJobResult> {
  const jobId = String(formData.get("job_id") ?? "");
  if (!jobId) return { ok: false, error: "공고 정보를 찾을 수 없어요." };

  const { activeRole } = await getViewerProfile();
  if (activeRole !== "actor") {
    return { ok: false, error: "배우 모드에서만 지원할 수 있어요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "먼저 로그인해주세요." };

  const { data: job, error: jobErr } = await supabase
    .from("jobs")
    .select("id, casting_id, status, deadline")
    .eq("id", jobId)
    .maybeSingle();
  if (jobErr) return { ok: false, error: jobErr.message };
  if (!job) return { ok: false, error: "공고를 찾을 수 없어요." };
  if (!isJobAccepting(job)) {
    return { ok: false, error: "마감된 공고에는 지원할 수 없어요." };
  }

  const memo = String(formData.get("memo") ?? "").trim() || null;

  const { data: application, error: appErr } = await supabase
    .from("applications")
    .insert({ job_id: jobId, actor_id: user.id, memo })
    .select("id")
    .maybeSingle();
  if (appErr) {
    if (appErr.code === "23505") {
      return { ok: false, error: "이미 이 공고에 지원했어요." };
    }
    return { ok: false, error: appErr.message };
  }
  if (!application) return { ok: false, error: "지원 처리에 실패했어요." };

  const { data: room, error: roomErr } = await supabase
    .from("chat_rooms")
    .upsert(
      {
        job_id: jobId,
        actor_id: user.id,
        casting_id: job.casting_id,
      },
      { onConflict: "job_id,actor_id,casting_id" },
    )
    .select("id")
    .maybeSingle();
  if (roomErr) return { ok: false, error: roomErr.message };

  if (memo && room) {
    const { error: msgErr } = await supabase.from("messages").insert({
      room_id: room.id,
      sender_id: user.id,
      body: memo,
    });
    if (msgErr) return { ok: false, error: msgErr.message };
  }

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  return { ok: true, applicationId: application.id };
}
