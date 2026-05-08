"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BackButtonProps = {
  fallbackHref: string;
  ariaLabel?: string;
  className?: string;
};

export function BackButton({
  fallbackHref,
  ariaLabel = "이전 페이지로 돌아가기",
  className,
}: BackButtonProps) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <Button
      type="button"
      color="neutral" variant="ghost"
      size="icon"
      className={cn("translate-y-px", className)}
      aria-label={ariaLabel}
      onClick={handleBack}
    >
      <ArrowLeft aria-hidden="true" className="size-5" />
    </Button>
  );
}
