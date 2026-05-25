"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";
import {
  sendPasswordResetFromSettingsAction,
  type SettingsActionResult,
} from "./actions";

export function PasswordResetForm() {
  const [state, action, pending] = useActionState<
    SettingsActionResult | null,
    FormData
  >(sendPasswordResetFromSettingsAction, null);

  return (
    <form action={action} className="grid gap-3">
      {state && !state.ok ? (
        <ErrorNotice message={state.error} size="sm" />
      ) : null}
      {state?.ok ? (
        <p
          className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm font-medium text-primary"
          role="status"
        >
          {state.message}
        </p>
      ) : null}
      <div>
        <Button
          type="submit"
          color="neutral"
          variant="outline"
          disabled={pending}
          isLoading={pending}
        >
          재설정 메일 받기
        </Button>
      </div>
    </form>
  );
}
