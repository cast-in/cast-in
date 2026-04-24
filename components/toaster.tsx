"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      theme="system"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "rounded-xl border border-border bg-card text-foreground shadow-sm",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}
