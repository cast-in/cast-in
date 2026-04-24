"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
    genre: formData.get("genre") ?? "",
    region: formData.get("region") ?? "",
    deadline: formData.get("deadline") ?? "",
    requirements: formData.get("requirements") ?? "",
    status: formData.get("status") ?? "open",
  });
  if (!parsed.success) {
    return { ok: false, error: formatZodError(parsed.error) };
  }

  const { title, description, genre, region, deadline, requirements, status } =
    parsed.data;

  const { error } = await supabase.from("jobs").insert({
    casting_id: user.id,
    title,
    description,
    genre,
    region,
    deadline: deadline ? new Date(deadline).toISOString() : null,
    requirements,
    status,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/jobs");
  redirect("/jobs");
}
