import { Badge } from "@/components/ui/badge";
import { RoleSelector } from "./role-selector";

export default function OnboardingRolePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge variant="secondary">1/2 역할 선택</Badge>
        <h2 className="text-3xl font-bold tracking-tight">
          어떻게 활동해요?
        </h2>
        <p className="text-muted-foreground">
          역할에 따라 추천과 화면이 달라져요. 나중에 언제든 바꿀 수 있어요.
        </p>
      </div>

      <RoleSelector />
    </div>
  );
}
