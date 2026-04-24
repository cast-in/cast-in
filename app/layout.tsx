import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Noto_Sans_KR, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import {
  getThemePreferenceScript,
  isThemePreference,
  THEME_PREFERENCE_KEY,
} from "@/lib/theme";
import { Toaster } from "@/components/toaster";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "캐스트인",
  description: "배우와 캐스팅 담당자를 한 곳에서 이어줘요",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const storedThemePreference = cookieStore.get(THEME_PREFERENCE_KEY)?.value;
  const themePreference = isThemePreference(storedThemePreference)
    ? storedThemePreference
    : "system";

  return (
    <html
      lang="ko"
      suppressHydrationWarning
      data-theme-preference={themePreference}
      className={`${notoSansKr.variable} ${geistMono.variable} h-full antialiased ${
        themePreference === "dark" ? "dark" : ""
      }`}
      style={
        themePreference === "system"
          ? undefined
          : { colorScheme: themePreference }
      }
    >
      <body className="min-h-full flex flex-col">
        <Script id="theme-preference-script" strategy="beforeInteractive">
          {getThemePreferenceScript()}
        </Script>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
