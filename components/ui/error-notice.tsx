import * as React from "react";

import { cn } from "@/lib/utils";

type ErrorNoticeProps = Omit<React.ComponentProps<"div">, "children"> & {
  message: string;
  size?: "sm" | "md";
};

export function ErrorNotice({
  className,
  message,
  size = "md",
  role = "alert",
  ...props
}: ErrorNoticeProps) {
  return (
    <div
      role={role}
      className={cn(
        "rounded-md border border-destructive/40 bg-destructive/10 text-sm text-destructive",
        size === "sm" ? "p-3" : "p-4",
        className,
      )}
      {...props}
    >
      {message}
    </div>
  );
}
