"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getViewerProfile } from "@/lib/queries/viewer";
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

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, error: "공고 제목을 입력해주세요." };

  const requirementsRaw = String(formData.get("requirements") ?? "");
  const requirements = requirementsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const deadline = String(formData.get("deadline") ?? "");
  const status = (formData.get("status") === "draft" ? "draft" : "open") as
    | "open"
    | "draft";

  const { error } = await supabase.from("jobs").insert({
    casting_id: user.id,
    title,
    description: String(formData.get("description") ?? "") || null,
    genre: String(formData.get("genre") ?? "") || null,
    region: String(formData.get("region") ?? "") || null,
    deadline: deadline ? new Date(deadline).toISOString() : null,
    requirements,
    status,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/jobs");
  redirect("/jobs");
}
