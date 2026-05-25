"use server";

import { revalidatePath } from "next/cache";
import { ATTACHMENT_BUCKET, parseAttachmentList } from "@/lib/attachments";
import { WithdrawApplicationSchema, formatZodError } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationStatus } from "@/types/enums";

export type WithdrawApplicationResult =
  | { ok: true }
  | { ok: false; error: string };

const WITHDRAWABLE_STATUSES: ApplicationStatus[] = [
  "pending",
  "reviewing",
  "hold",
];

export async function withdrawApplicationAction(
  formData: FormData,
): Promise<WithdrawApplicationResult> {
  const parsed = WithdrawApplicationSchema.safeParse({
    application_id: formData.get("application_id") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: formatZodError(parsed.error) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "먼저 로그인해주세요." };

  const { data: application, error: fetchError } = await supabase
    .from("applications")
    .select("id, actor_id, job_id, status, attachments")
    .eq("id", parsed.data.application_id)
    .maybeSingle();
  if (fetchError) return { ok: false, error: fetchError.message };
  if (!application || application.actor_id !== user.id) {
    return { ok: false, error: "지원 정보를 찾을 수 없어요." };
  }

  if (!WITHDRAWABLE_STATUSES.includes(application.status)) {
    return {
      ok: false,
      error: "결과가 확정된 지원은 철회할 수 없어요.",
    };
  }

  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", parsed.data.application_id)
    .eq("actor_id", user.id)
    .in("status", WITHDRAWABLE_STATUSES);
  if (error) return { ok: false, error: error.message };

  const attachmentPaths = parseAttachmentList(application.attachments).map(
    (attachment) => attachment.path,
  );
  if (attachmentPaths.length > 0) {
    await supabase.storage.from(ATTACHMENT_BUCKET).remove(attachmentPaths);
  }

  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  revalidatePath(`/jobs/${application.job_id}`);
  return { ok: true };
}
