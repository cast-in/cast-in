import * as React from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const surfaceCardClassName =
  "rounded-xl bg-card py-0 shadow-sm ring-1 ring-border/70";

export function SurfaceCard({
  className,
  ...props
}: React.ComponentProps<typeof Card>) {
  return <Card className={cn(surfaceCardClassName, className)} {...props} />;
}

export { surfaceCardClassName };
