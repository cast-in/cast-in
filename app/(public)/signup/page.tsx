import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BrandLogo } from "@/components/brand-logo";
import { SignUpForm } from "./sign-up-form";

export default function SignUpPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-muted/40 p-5">
      <Card className="w-[min(460px,calc(100vw-40px))]">
        <CardHeader className="items-center text-center">
          <BrandLogo className="mb-1" size={28} textClassName="text-base" />
          <CardTitle className="text-2xl">새로 시작하기</CardTitle>
          <CardDescription>
            이메일로 계정을 만들어 바로 시작할 수 있어요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
        </CardContent>
      </Card>
    </main>
  );
}
