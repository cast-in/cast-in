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

  redirect(profile ? "/discover" : "/onboarding/role");
}

export async function signUpWithPassword(
  formData: FormData,
): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 6)
    return { ok: false, error: "비밀번호는 6자 이상으로 만들어주세요." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // 이메일 확인 설정이 켜져 있어도 리다이렉트 경로 통일
      emailRedirectTo: `${getOrigin()}/auth/callback`,
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
  if (password.length < 6) {
    return { ok: false, error: "비밀번호는 6자 이상으로 만들어주세요." };
  }
  if (password !== passwordConfirm) {
    return { ok: false, error: "비밀번호가 서로 달라요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: translateAuthError(error.message) };

  redirect("/discover");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function getOrigin() {
  // Server action에서 window 접근 불가 — env 기반
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
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
