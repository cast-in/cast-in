import { Badge } from "@/components/ui/badge";
import { RoleSelector } from "./role-selector";

export default function OnboardingRolePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge variant="secondary">1/2 역할 선택</Badge>
        <h2 className="text-3xl font-bold tracking-tight">
          어떤 화면으로 시작할까요?
        </h2>
        <p className="text-muted-foreground">
          역할에 맞춰 필요한 메뉴를 먼저 보여드려요. 나중에 바꿀 수 있어요.
        </p>
      </div>

      <RoleSelector />
    </div>
  );
}
