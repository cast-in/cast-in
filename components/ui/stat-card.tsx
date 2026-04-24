import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: number | string;
  description?: string;
  className?: string;
};

export function StatCard({
  label,
  value,
  description,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("min-h-28 justify-between", className)}>
      <CardHeader className="gap-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl font-bold tracking-tight tabular-nums">
          {value}
        </CardTitle>
        {description ? (
          <p className="text-xs leading-5 text-muted-foreground">{description}</p>
        ) : null}
      </CardHeader>
    </Card>
  );
}
