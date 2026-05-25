"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

export async function signInWithPassword(
  formData: FormData,
): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { ok: false, error: "이메일과 비밀번호를 입력해주세요." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: translateAuthError(error.message) };

  // 프로필 존재 여부로 온보딩 분기
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  redirect(profile ? "/dashboard" : "/onboarding/role");
}

export async function signUpWithPassword(
  formData: FormData,
): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const privacyConsentAccepted =
    formData.get("privacy_consent") === "accepted";
  const marketingConsentAccepted =
    formData.get("marketing_consent") === "accepted";
  const passwordError = validatePassword(password);
  if (!email || passwordError) {
    return {
      ok: false,
      error: passwordError ?? "이메일과 비밀번호를 입력해주세요.",
    };
  }
  if (!privacyConsentAccepted) {
    return {
      ok: false,
      error: "개인정보 수집 및 이용에 동의해주세요.",
    };
  }

  const consentedAt = new Date().toISOString();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // 이메일 확인 설정이 켜져 있어도 리다이렉트 경로 통일
      emailRedirectTo: `${getOrigin()}/auth/callback`,
      data: {
        privacy_consent_at: consentedAt,
        marketing_consent_at: marketingConsentAccepted ? consentedAt : null,
      },
    },
  });
  if (error) return { ok: false, error: translateAuthError(error.message) };

  // session이 바로 들어오면 (이메일 확인 꺼진 경우) 곧장 온보딩으로
  if (data.session) redirect("/onboarding/role");

  return {
    ok: true,
    message: "인증 메일을 보냈어요. 메일함에서 링크를 눌러주세요.",
  };
}

export async function requestPasswordResetAction(
  formData: FormData,
): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { ok: false, error: "이메일을 입력해주세요." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getOrigin()}/auth/callback?next=/login/reset`,
  });
  if (error) return { ok: false, error: translateAuthError(error.message) };

  return {
    ok: true,
    message: "비밀번호 재설정 링크를 보냈어요. 메일함을 확인해주세요.",
  };
}

export async function updatePasswordAction(
  formData: FormData,
): Promise<AuthResult> {
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("password_confirm") ?? "");
  const passwordError = validatePassword(password);
  if (passwordError) {
    return { ok: false, error: passwordError };
  }
  if (password !== passwordConfirm) {
    return { ok: false, error: "비밀번호가 서로 달라요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: translateAuthError(error.message) };

  redirect("/dashboard");
}

// useActionState 시그니처용 래퍼 — 서버 액션이어야 React가 form action 바인딩을 정상 처리해요.
export async function signInFormAction(
  _prev: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  return signInWithPassword(formData);
}

export async function signUpFormAction(
  _prev: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  return signUpWithPassword(formData);
}

export async function requestPasswordResetFormAction(
  _prev: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  return requestPasswordResetAction(formData);
}

export async function updatePasswordFormAction(
  _prev: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  return updatePasswordAction(formData);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function getOrigin() {
  // Server action에서 window 접근 불가 — env 기반
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3333";
}

function validatePassword(password: string) {
  if (password.length < 8) {
    return "비밀번호는 8자 이상으로 만들어주세요.";
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "비밀번호에 영문과 숫자를 모두 포함해주세요.";
  }
  return null;
}

function translateAuthError(msg: string) {
  if (msg.includes("Invalid login credentials"))
    return "이메일이나 비밀번호를 다시 확인해주세요.";
  if (msg.includes("User already registered"))
    return "이미 가입된 이메일이에요. 로그인으로 들어가주세요.";
  if (msg.includes("Email not confirmed"))
    return "메일함에서 인증 링크를 먼저 눌러주세요.";
  return msg;
}
