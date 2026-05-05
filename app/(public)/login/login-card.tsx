"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BrandLogo } from "@/components/brand-logo";
import { AuthForm, type AuthMode } from "./auth-form";

export function LoginCard() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const title = mode === "signin" ? "로그인" : "비밀번호 재설정";

  return (
    <Card className="w-[min(460px,calc(100vw-40px))]">
      <CardHeader className="items-center text-center">
        <BrandLogo
          href="/"
          className="mb-1"
          size={28}
          textClassName="text-base"
        />
        <CardTitle className="text-2xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <AuthForm mode={mode} onModeChange={setMode} />
      </CardContent>
    </Card>
  );
}
