"use client";

import type { ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type OAuthButtonsProps = {
  intent?: "login" | "signup";
};

type OAuthProvider = {
  id: "kakao";
  name: string;
  className: string;
  Icon: () => ReactNode;
};

const providers: OAuthProvider[] = [
  {
    id: "kakao",
    name: "카카오",
    className:
      "!bg-[#FEE500] !text-[rgba(0,0,0,0.85)] hover:!bg-[#FEE500] hover:!text-[rgba(0,0,0,0.85)] focus-visible:border-[#FEE500] focus-visible:ring-[#FEE500]/40 dark:!bg-[#FEE500] dark:!text-[rgba(0,0,0,0.85)] dark:hover:!bg-[#FEE500] dark:hover:!text-[rgba(0,0,0,0.85)]",
    Icon: KakaoBubbleIcon,
  },
];

const socialButtonClass =
  "h-10 w-full gap-2.5 rounded-lg border-0 px-5 font-sans text-sm font-semibold tracking-normal";

export function OAuthButtons({ intent = "login" }: OAuthButtonsProps = {}) {
  function getLabel(provider: OAuthProvider) {
    return intent === "signup"
      ? `${provider.name}로 가입하기`
      : `${provider.name} 로그인`;
  }

  function getUnavailableMessage(provider: OAuthProvider) {
    return intent === "signup"
      ? `${provider.name} 가입은 준비 중이에요`
      : `${provider.name} 로그인은 준비 중이에요`;
  }

  return (
    <div className="grid gap-2">
      {providers.map((provider) => {
        const label = getLabel(provider);
        const Icon = provider.Icon;

        return (
          <Button
            key={provider.id}
            type="button"
            size="lg"
            variant="outline"
            aria-label={label}
            className={`${socialButtonClass} ${provider.className}`}
            onClick={() => toast(getUnavailableMessage(provider))}
          >
            <Icon />
            {label}
          </Button>
        );
      })}
    </div>
  );
}

function KakaoBubbleIcon() {
  return (
    <svg
      className="size-4 shrink-0 !text-black"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M12 4C7.03 4 3 7.11 3 10.95c0 2.42 1.6 4.56 4.03 5.8l-.5 1.88a.45.45 0 0 0 .67.5l2.2-1.39c.82.17 1.7.26 2.6.26 4.97 0 9-3.11 9-6.95S16.97 4 12 4Z"
      />
    </svg>
  );
}
