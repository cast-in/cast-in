"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { parseSocialLinksFromForm, socialLinksToJson } from "@/lib/social-links";
import type { Database } from "@/types/database";

type ActorProfileUpsert =
  Database["public"]["Tables"]["actor_profiles"]["Insert"];
type CastingProfileUpsert =
  Database["public"]["Tables"]["casting_profiles"]["Insert"];
type ProfileUpsert = Database["public"]["Tables"]["profiles"]["Insert"];
type SupabaseWriteClient = ReturnType<typeof createAdminClient>;

export type SaveProfileResult = { ok: true } | { ok: false; error: string };

function parseCsv(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parsePositiveInt(value: FormDataEntryValue | null) {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
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

  const admin = getAdminClient();
  if ("error" in admin) return admin;

  const role = formData.get("role") === "casting" ? "casting" : "actor";
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "이름을 입력해주세요." };

  const rawRedirect = String(formData.get("redirect_to") ?? "");
  const redirectTo = rawRedirect.startsWith("/") ? rawRedirect : "/talents";

  // 1. profiles upsert
  const profilePayload: ProfileUpsert = {
    id: user.id,
    role,
    name,
    email: user.email ?? null,
  };
  const consentMetadata = getConsentMetadata(user.user_metadata);
  if (consentMetadata.privacyConsentAt) {
    profilePayload.privacy_consent_at = consentMetadata.privacyConsentAt;
  }
  if (consentMetadata.marketingConsentAt !== undefined) {
    profilePayload.marketing_consent_at = consentMetadata.marketingConsentAt;
  }

  const { error: pErr } = await upsertProfileWithConsentFallback(
    admin,
    profilePayload,
  );
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
    if (formData.has("gender")) {
      const gender = String(formData.get("gender") ?? "").trim();
      payload.gender = gender || null;
    }
    if (formData.has("height_cm")) {
      payload.height_cm = parsePositiveInt(formData.get("height_cm"));
    }
    if (formData.has("weight_kg")) {
      payload.weight_kg = parsePositiveInt(formData.get("weight_kg"));
    }
    if (formData.has("affiliation")) {
      payload.affiliation =
        String(formData.get("affiliation") ?? "").trim() || "프리랜서";
    }
    if (formData.has("image_tags")) {
      payload.image_tags = parseCsv(String(formData.get("image_tags") ?? ""));
    }
    if (formData.has("social_url") || formData.has("social_title")) {
      const socialLinks = parseSocialLinksFromForm(formData);
      if (!socialLinks.ok) return { ok: false, error: socialLinks.error };
      payload.social_links = socialLinksToJson(socialLinks.links);
    }
    if (formData.has("visibility")) {
      payload.visibility = parseVisibility(String(formData.get("visibility") ?? ""));
    }
    const { error } = await admin.from("actor_profiles").upsert(payload);
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
    const { error } = await admin.from("casting_profiles").upsert(payload);
    if (error) return { ok: false, error: error.message };
  }

  redirect(redirectTo);
}

function getAdminClient(): SupabaseWriteClient | { ok: false; error: string } {
  try {
    return createAdminClient();
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Supabase 관리자 키가 설정되지 않았어요.",
    };
  }
}

function getConsentMetadata(metadata: {
  [key: string]: unknown;
} | null): {
  privacyConsentAt: string | null;
  marketingConsentAt?: string | null;
} {
  const hasMarketingConsentAt = Boolean(
    metadata &&
      Object.prototype.hasOwnProperty.call(metadata, "marketing_consent_at"),
  );

  return {
    privacyConsentAt: getMetadataString(metadata?.privacy_consent_at),
    marketingConsentAt: hasMarketingConsentAt
      ? getMetadataString(metadata?.marketing_consent_at)
      : undefined,
  };
}

function getMetadataString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

async function upsertProfileWithConsentFallback(
  supabase: SupabaseWriteClient,
  profilePayload: ProfileUpsert,
) {
  const result = await supabase.from("profiles").upsert(profilePayload);
  if (!isMissingConsentSchemaError(result.error)) return result;

  const fallbackPayload: ProfileUpsert = { ...profilePayload };
  delete fallbackPayload.privacy_consent_at;
  delete fallbackPayload.marketing_consent_at;

  return supabase.from("profiles").upsert(fallbackPayload);
}

function isMissingConsentSchemaError(
  error: { message?: string; code?: string } | null,
) {
  if (!error?.message) return false;

  const message = error.message.toLowerCase();
  return (
    (error.code === "PGRST204" || message.includes("schema cache")) &&
    message.includes("profiles") &&
    (message.includes("privacy_consent_at") ||
      message.includes("marketing_consent_at"))
  );
}
