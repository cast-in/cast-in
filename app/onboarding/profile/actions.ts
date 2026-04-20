"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SaveProfileResult = { ok: true } | { ok: false; error: string };

export async function saveOnboardingProfile(
  formData: FormData,
): Promise<SaveProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "먼저 로그인해주세요." };

  const role = formData.get("role") === "casting" ? "casting" : "actor";
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "이름을 입력해주세요." };

  // 1. profiles upsert
  const { error: pErr } = await supabase.from("profiles").upsert({
    id: user.id,
    role,
    name,
    email: user.email ?? null,
  });
  if (pErr) return { ok: false, error: pErr.message };

  // 2. 역할별 상세 프로필
  if (role === "actor") {
    const ageStr = String(formData.get("age") ?? "");
    const genresStr = String(formData.get("genres") ?? "");
    const { error } = await supabase.from("actor_profiles").upsert({
      user_id: user.id,
      age: ageStr ? Number(ageStr) : null,
      region: String(formData.get("region") ?? "") || null,
      genres: genresStr
        ? genresStr
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    });
    if (error) return { ok: false, error: error.message };
  } else {
    const companyName = String(formData.get("company_name") ?? "").trim();
    if (!companyName) return { ok: false, error: "회사명을 입력해주세요." };
    const { error } = await supabase.from("casting_profiles").upsert({
      user_id: user.id,
      company_name: companyName,
      contact: String(formData.get("contact") ?? "") || null,
    });
    if (error) return { ok: false, error: error.message };
  }

  redirect("/discover");
}
