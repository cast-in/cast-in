import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BrandLogo } from "@/components/brand-logo";
import { AuthForm } from "./auth-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-muted/40 p-5">
      <Card className="w-[min(460px,calc(100vw-40px))]">
        <CardHeader className="items-center text-center">
          <BrandLogo className="mb-1" size={28} textClassName="text-base" />
          <CardTitle className="text-2xl">다시 만나서 반가워요</CardTitle>
          <CardDescription>
            이메일로 로그인하거나 계정을 새로 만들어보세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm />
        </CardContent>
      </Card>
    </main>
  );
}
