"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Switch } from "@/components/ui/switch";
import type { NotificationSettings } from "@/lib/queries/settings";
import {
  updateNotificationSettingsAction,
  type SettingsActionResult,
} from "./actions";

export function NotificationSettingsForm({
  initialSettings,
}: {
  initialSettings: NotificationSettings;
}) {
  const [applicationEnabled, setApplicationEnabled] = useState(
    initialSettings.application_notifications_enabled,
  );
  const [messageEnabled, setMessageEnabled] = useState(
    initialSettings.message_notifications_enabled,
  );
  const [state, action, pending] = useActionState<
    SettingsActionResult | null,
    FormData
  >(updateNotificationSettingsAction, null);

  return (
    <form action={action} className="grid gap-4">
      <input
        type="hidden"
        name="application_notifications_enabled"
        value={applicationEnabled ? "on" : "off"}
      />
      <input
        type="hidden"
        name="message_notifications_enabled"
        value={messageEnabled ? "on" : "off"}
      />

      <SettingToggle
        checked={applicationEnabled}
        description="지원 접수, 지원 상태 변경, 지원 철회 알림을 받아요."
        disabled={pending}
        label="지원 알림"
        onChange={setApplicationEnabled}
      />
      <SettingToggle
        checked={messageEnabled}
        description="새 메시지가 도착하면 알림을 받아요."
        disabled={pending}
        label="메시지 알림"
        onChange={setMessageEnabled}
      />

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
        <Button type="submit" disabled={pending} isLoading={pending}>
          저장하기
        </Button>
      </div>
    </form>
  );
}

function SettingToggle({
  checked,
  description,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  disabled: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
      <span className="min-w-0">
        <span className="block font-bold">{label}</span>
        <span className="mt-1 block text-sm text-muted-foreground">
          {description}
        </span>
      </span>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
        aria-label={label}
      />
    </div>
  );
}
