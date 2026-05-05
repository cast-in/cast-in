import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BrandLogo } from "@/components/brand-logo";
import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-muted/40 p-5">
      <Card className="w-[min(460px,calc(100vw-40px))]">
        <CardHeader className="items-center text-center">
          <BrandLogo
            href="/"
            className="mb-1"
            size={28}
            textClassName="text-base"
          />
          <CardTitle className="text-2xl">새 비밀번호 설정</CardTitle>
          <CardDescription>
            메일 링크로 들어온 뒤 사용할 새 비밀번호를 입력해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
        </CardContent>
      </Card>
    </main>
  );
}
