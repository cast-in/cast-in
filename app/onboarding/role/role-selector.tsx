"use client";

import Link from "next/link";
import { useState } from "react";
import { getRoleEntityLabel, getRoleModeLabel } from "@/lib/app-ia";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Role = "actor" | "casting";

const OPTIONS: { value: Role; title: string; desc: string; label: string }[] = [
  {
    value: "actor",
    title: getRoleEntityLabel("actor"),
    desc: "나에게 맞는 공고를 찾고 지원 흐름을 한눈에 봐요.",
    label: getRoleModeLabel("actor"),
  },
  {
    value: "casting",
    title: getRoleEntityLabel("casting"),
    desc: "원하는 인재를 찾고 지원자를 한 곳에서 관리해요.",
    label: getRoleModeLabel("casting"),
  },
];

export function RoleSelector() {
  const [selected, setSelected] = useState<Role | null>(null);
  const profileHref = selected ? `/onboarding/profile?role=${selected}` : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {OPTIONS.map((opt) => {
          const isActive = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelected(opt.value)}
              className={cn(
                "flex w-full flex-col gap-1 rounded-xl border bg-card p-5 text-left transition-colors",
                isActive
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:bg-accent",
              )}
            >
              <div className="flex items-center justify-between">
                <strong className="text-lg">{opt.title}</strong>
                <Badge color={isActive ? "primary" : "secondary"}>
                  {opt.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{opt.desc}</p>
            </button>
          );
        })}
      </div>

      {profileHref ? (
        <Link href={profileHref} className={cn(buttonVariants(), "w-full")}>
          프로필 입력하기
        </Link>
      ) : (
        <Button type="button" disabled className="w-full">
          프로필 입력하기
        </Button>
      )}
    </div>
  );
}
