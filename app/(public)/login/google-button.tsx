"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { buttonVariants } from "@/components/ui/button";

export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setLoading(false);
      toast.error(`로그인 실패: ${error.message}`);
    }
    // 성공 시 Google 로그인 페이지로 리다이렉트됨
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={buttonVariants({ size: "lg", color: "neutral", variant: "outline" })}
    >
      {loading ? "이동하는 중이에요" : "Google 계정으로 계속하기"}
    </button>
  );
}
