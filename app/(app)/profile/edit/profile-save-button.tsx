"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function ProfileSaveButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="sm" className="px-5" loading={pending}>
      {pending ? "저장 중" : "전체 저장"}
    </Button>
  );
}
