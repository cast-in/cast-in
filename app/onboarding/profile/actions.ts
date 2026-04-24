"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type ActorProfileUpsert =
  Database["public"]["Tables"]["actor_profiles"]["Insert"];
type CastingProfileUpsert =
  Database["public"]["Tables"]["casting_profiles"]["Insert"];

export type SaveProfileResult = { ok: true } | { ok: false; error: string };

function parseCsv(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseVisibility(value: string) {
  if (value === "connections" || value === "private") return value;
  return "public";
}

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

  const rawRedirect = String(formData.get("redirect_to") ?? "");
  const redirectTo = rawRedirect.startsWith("/") ? rawRedirect : "/discover";

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
    const birthDateStr = String(formData.get("birth_date") ?? "").trim();
    const genresStr = String(formData.get("genres") ?? "");
    const payload: ActorProfileUpsert = {
      user_id: user.id,
      birth_date: birthDateStr || null,
      region: String(formData.get("region") ?? "") || null,
      genres: genresStr ? parseCsv(genresStr) : [],
    };
    if (formData.has("bio")) {
      payload.bio = String(formData.get("bio") ?? "").trim() || null;
    }
    if (formData.has("skills")) {
      payload.skills = parseCsv(String(formData.get("skills") ?? ""));
    }
    if (formData.has("visibility")) {
      payload.visibility = parseVisibility(String(formData.get("visibility") ?? ""));
    }
    const { error } = await supabase.from("actor_profiles").upsert(payload);
    if (error) return { ok: false, error: error.message };
  } else {
    const companyName = String(formData.get("company_name") ?? "").trim();
    if (!companyName) return { ok: false, error: "회사명을 입력해주세요." };
    const payload: CastingProfileUpsert = {
      user_id: user.id,
      company_name: companyName,
      contact: String(formData.get("contact") ?? "") || null,
    };
    if (formData.has("intro")) {
      payload.intro = String(formData.get("intro") ?? "").trim() || null;
    }
    const { error } = await supabase.from("casting_profiles").upsert(payload);
    if (error) return { ok: false, error: error.message };
  }

  redirect(redirectTo);
}
