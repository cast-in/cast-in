import type { ComponentType, ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn("min-h-40 justify-center", className)}>
      <CardContent className="grid justify-items-center gap-3 px-6 py-10 text-center">
        {Icon ? (
          <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Icon aria-hidden={true} className="size-5" />
          </span>
        ) : null}
        <div className="space-y-1">
          <p className="font-medium text-foreground">{title}</p>
          {description ? (
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="pt-1">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
