"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function BackButton() {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/jobs");
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="translate-y-px"
      aria-label="이전 페이지로 돌아가기"
      onClick={handleBack}
    >
      <ArrowLeft aria-hidden="true" className="size-5" />
    </Button>
  );
}
