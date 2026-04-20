"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getRoleEntityLabel, getRoleModeLabel } from "@/lib/app-ia";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Role = "actor" | "casting";

const OPTIONS: { value: Role; title: string; desc: string; label: string }[] = [
  {
    value: "actor",
    title: getRoleEntityLabel("actor"),
    desc: "나에게 맞는 오디션을 찾고 지원 현황을 한눈에 봐요.",
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
  const router = useRouter();
  const [selected, setSelected] = useState<Role | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleNext() {
    if (!selected) return;
    setSubmitting(true);
    router.push(`/onboarding/profile?role=${selected}`);
  }

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
                <Badge variant={isActive ? "default" : "secondary"}>
                  {opt.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{opt.desc}</p>
            </button>
          );
        })}
      </div>

      <Button
        type="button"
        onClick={handleNext}
        disabled={!selected || submitting}
        className="w-full"
      >
        {submitting ? "넘어가는 중..." : "다음으로"}
      </Button>
    </div>
  );
}
