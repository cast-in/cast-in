"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageCircleMore } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  type ButtonColor,
  type ButtonVariant,
} from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { startJobConversationAction } from "./actions";

type JobConversationButtonProps = {
  jobId: string;
  actorId?: string;
  label?: string;
  pendingLabel?: string;
  iconOnly?: boolean;
  ariaLabel?: string;
  color?: ButtonColor;
  variant?: ButtonVariant;
  size?: "md" | "sm" | "lg" | "icon-lg";
  className?: string;
};

export function JobConversationButton({
  jobId,
  actorId,
  label = "문의하기",
  pendingLabel = "여는 중이에요",
  iconOnly = false,
  ariaLabel,
  color = "neutral",
  variant = "outline",
  size = "md",
  className,
}: JobConversationButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const data = new FormData();
    data.set("job_id", jobId);
    if (actorId) data.set("actor_id", actorId);

    startTransition(async () => {
      const result = await startJobConversationAction(data);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      router.push(`/messages?room=${result.roomId}`);
    });
  }

  return (
    <Button
      type="button"
      color={color}
      variant={variant}
      size={iconOnly ? "icon-lg" : size}
      className={cn(className)}
      disabled={pending}
      aria-label={iconOnly ? (ariaLabel ?? label) : undefined}
      onClick={handleClick}
    >
      <MessageCircleMore aria-hidden="true" className="size-4" />
      {iconOnly ? null : pending ? pendingLabel : label}
    </Button>
  );
}
