import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase 이메일 인증/비밀번호 재설정 콜백.
 * code를 세션으로 교환한 뒤 온보딩 또는 요청된 경로로 이동한다.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.redirect(`${origin}/login?error=auth`);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .maybeSingle();

      const destination = profile ? next : "/onboarding/role";
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}

function getSafeNextPath(value: string | null) {
  if (!value) return "/talents";
  if (!value.startsWith("/") || value.startsWith("//")) return "/talents";

  try {
    const parsed = new URL(value, "http://localhost");
    if (parsed.origin !== "http://localhost") return "/talents";
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/talents";
  }
}
