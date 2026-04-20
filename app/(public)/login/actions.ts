"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthResult = { ok: true } | { ok: false; error: string };

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

  // 이메일 확인 필요 케이스 — 안내 메시지
  // 개발 중 바로 로그인하려면 Supabase 대시보드 Auth → Providers → Email 에서 'Confirm email' 끄기
  return {
    ok: false,
    error: "인증 메일을 보냈어요. 메일함에서 링크를 눌러주세요.",
  };
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
