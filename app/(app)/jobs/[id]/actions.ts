"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  attachmentsToJson,
  isAttachmentPathForOwner,
  parseAttachmentFormValue,
} from "@/lib/attachments";
import { getViewerProfile } from "@/lib/queries/viewer";
import { isJobAccepting } from "@/lib/job-status";
import {
  ApplyToJobSchema,
  ManageJobSchema,
  StartJobConversationSchema,
  UpdateApplicationSchema,
  formatZodError,
} from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

export type ApplyToJobResult =
  | { ok: true; applicationId: string }
  | { ok: false; error: string };

export type StartJobConversationResult =
  | { ok: true; roomId: string }
  | { ok: false; error: string };

export type UpdateApplicationResult =
  | { ok: true }
  | { ok: false; error: string };

export async function closeJobAction(formData: FormData): Promise<void> {
  const parsed = ManageJobSchema.safeParse({
    job_id: formData.get("job_id") ?? "",
  });
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const { activeRole } = await getViewerProfile();
  if (activeRole !== "casting") {
    throw new Error("캐스팅만 공고를 마감할 수 있어요.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("먼저 로그인해주세요.");

  const { data: job, error: fetchErr } = await supabase
    .from("jobs")
    .select("id, casting_id")
    .eq("id", parsed.data.job_id)
    .maybeSingle();
  if (fetchErr) throw new Error(fetchErr.message);
  if (!job) throw new Error("공고를 찾을 수 없어요.");
  if (job.casting_id !== user.id) {
    throw new Error("이 공고를 마감할 권한이 없어요.");
  }

  const { error } = await supabase
    .from("jobs")
    .update({ status: "closed" })
    .eq("id", parsed.data.job_id)
    .eq("casting_id", user.id);
  if (error) throw new Error(error.message);

  const { error: applicationsError } = await supabase
    .from("applications")
    .update({ status: "reject" })
    .eq("job_id", parsed.data.job_id)
    .in("status", ["pending", "reviewing", "hold"]);
  if (applicationsError) throw new Error(applicationsError.message);

  revalidatePath(`/jobs/${parsed.data.job_id}`);
  revalidatePath("/jobs");
  revalidatePath("/discover");
  revalidatePath("/dashboard");
  redirect(`/jobs/${parsed.data.job_id}`);
}

export async function updateApplicationAction(
  formData: FormData,
): Promise<UpdateApplicationResult> {
  const raw = {
    application_id: formData.get("application_id") ?? "",
    status: formData.has("status")
      ? formData.get("status") ?? undefined
      : undefined,
    casting_memo: formData.has("casting_memo")
      ? String(formData.get("casting_memo") ?? "")
      : undefined,
  };
  const parsed = UpdateApplicationSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: formatZodError(parsed.error) };
  }

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
    .eq("id", parsed.data.application_id)
    .maybeSingle();
  if (fetchErr) return { ok: false, error: fetchErr.message };
  if (!app) return { ok: false, error: "지원을 찾을 수 없어요." };

  const job = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;
  if (!job || job.casting_id !== user.id) {
    return { ok: false, error: "이 지원을 관리할 권한이 없어요." };
  }

  const update: {
    status?: (typeof parsed.data)["status"];
    casting_memo?: string | null;
  } = {};
  if (parsed.data.status !== undefined) update.status = parsed.data.status;
  if (parsed.data.casting_memo !== undefined)
    update.casting_memo = parsed.data.casting_memo;

  const { error } = await supabase
    .from("applications")
    .update(update)
    .eq("id", parsed.data.application_id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/jobs/${app.job_id}`);
  return { ok: true };
}

export async function applyToJobAction(
  formData: FormData,
): Promise<ApplyToJobResult> {
  const parsed = ApplyToJobSchema.safeParse({
    job_id: formData.get("job_id") ?? "",
    memo: formData.get("memo") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: formatZodError(parsed.error) };
  }

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
    .select("id, status, deadline")
    .eq("id", parsed.data.job_id)
    .maybeSingle();
  if (jobErr) return { ok: false, error: jobErr.message };
  if (!job) return { ok: false, error: "공고를 찾을 수 없어요." };
  if (!isJobAccepting(job)) {
    return { ok: false, error: "마감된 공고에는 지원할 수 없어요." };
  }

  const memo = parsed.data.memo;
  const parsedAttachments = parseAttachmentFormValue(formData.get("attachments"));
  if (!parsedAttachments.ok) {
    return { ok: false, error: parsedAttachments.error };
  }
  const attachments = parsedAttachments.attachments;
  if (
    attachments.some(
      (attachment) =>
        !isAttachmentPathForOwner({
          path: attachment.path,
          scope: "applications",
          targetId: parsed.data.job_id,
          userId: user.id,
        }),
    )
  ) {
    return { ok: false, error: "첨부 파일 경로를 확인할 수 없어요." };
  }

  const { data: questions, error: questionsErr } = await supabase
    .from("job_application_questions")
    .select("id, label, required")
    .eq("job_id", parsed.data.job_id)
    .order("sort_order", { ascending: true });
  if (questionsErr) return { ok: false, error: questionsErr.message };

  const answers: Record<string, string> = {};
  for (const question of questions ?? []) {
    const answer = String(formData.get(`question_${question.id}`) ?? "").trim();
    if (question.required && !answer) {
      return { ok: false, error: `${question.label} 답변을 입력해주세요.` };
    }
    if (answer) answers[question.id] = answer;
  }

  const { data: application, error: appErr } = await supabase
    .from("applications")
    .insert({
      job_id: parsed.data.job_id,
      actor_id: user.id,
      memo,
      answers,
      attachments: attachmentsToJson(attachments),
    })
    .select("id")
    .maybeSingle();
  if (appErr) {
    if (appErr.code === "23505") {
      return { ok: false, error: "이미 이 공고에 지원했어요." };
    }
    return { ok: false, error: appErr.message };
  }
  if (!application) return { ok: false, error: "지원 처리에 실패했어요." };

  revalidatePath(`/jobs/${parsed.data.job_id}`);
  revalidatePath("/jobs");
  return { ok: true, applicationId: application.id };
}

export async function startJobConversationAction(
  formData: FormData,
): Promise<StartJobConversationResult> {
  const parsed = StartJobConversationSchema.safeParse({
    job_id: formData.get("job_id") ?? "",
    actor_id: formData.has("actor_id")
      ? formData.get("actor_id") ?? undefined
      : undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: formatZodError(parsed.error) };
  }

  const { activeRole } = await getViewerProfile();
  if (activeRole !== "actor" && activeRole !== "casting") {
    return { ok: false, error: "대화를 시작할 수 있는 권한이 없어요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "먼저 로그인해주세요." };

  const { data: job, error: jobErr } = await supabase
    .from("jobs")
    .select("id, casting_id")
    .eq("id", parsed.data.job_id)
    .maybeSingle();
  if (jobErr) return { ok: false, error: jobErr.message };
  if (!job) return { ok: false, error: "공고를 찾을 수 없어요." };

  const actorId =
    activeRole === "actor" ? user.id : (parsed.data.actor_id ?? null);
  if (!actorId) {
    return { ok: false, error: "메시지를 보낼 배우를 찾을 수 없어요." };
  }

  if (activeRole === "actor") {
    const { data: application, error: applicationErr } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", parsed.data.job_id)
      .eq("actor_id", actorId)
      .maybeSingle();
    if (applicationErr) return { ok: false, error: applicationErr.message };
    if (!application) {
      return { ok: false, error: "지원한 공고에서만 대화를 시작할 수 있어요." };
    }
  }

  if (activeRole === "casting") {
    if (job.casting_id !== user.id) {
      return { ok: false, error: "이 공고의 지원자에게만 메시지를 보낼 수 있어요." };
    }

    const { data: application, error: applicationErr } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", parsed.data.job_id)
      .eq("actor_id", actorId)
      .maybeSingle();
    if (applicationErr) return { ok: false, error: applicationErr.message };
    if (!application) {
      return { ok: false, error: "지원자를 찾을 수 없어요." };
    }
  }

  const { data: existingRoom, error: existingRoomErr } = await supabase
    .from("chat_rooms")
    .select("id")
    .eq("job_id", parsed.data.job_id)
    .eq("actor_id", actorId)
    .eq("casting_id", job.casting_id)
    .maybeSingle();
  if (existingRoomErr) return { ok: false, error: existingRoomErr.message };
  if (existingRoom) {
    revalidatePath("/messages");
    return { ok: true, roomId: existingRoom.id };
  }

  const { data: room, error: roomErr } = await supabase
    .from("chat_rooms")
    .insert({
      job_id: parsed.data.job_id,
      actor_id: actorId,
      casting_id: job.casting_id,
    })
    .select("id")
    .maybeSingle();
  if (roomErr) {
    if (roomErr.code === "23505") {
      const { data: roomAfterConflict, error: refetchErr } = await supabase
        .from("chat_rooms")
        .select("id")
        .eq("job_id", parsed.data.job_id)
        .eq("actor_id", actorId)
        .eq("casting_id", job.casting_id)
        .maybeSingle();
      if (refetchErr) return { ok: false, error: refetchErr.message };
      if (roomAfterConflict) {
        revalidatePath("/messages");
        return { ok: true, roomId: roomAfterConflict.id };
      }
    }
    return { ok: false, error: roomErr.message };
  }

  if (!room) return { ok: false, error: "대화방을 열 수 없어요." };

  revalidatePath("/messages");
  return { ok: true, roomId: room.id };
}
