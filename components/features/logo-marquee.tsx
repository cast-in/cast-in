import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoItem = {
  name: string;
  src?: string;
  darkSrc?: string;
  width?: number;
  height?: number;
};

// public/logos/dark/<같은 파일명>이 있으면 다크모드 전용 에셋으로 사용.
function resolveDarkSrc(src: string): string | undefined {
  const darkUrl = src.replace(/^\/logos\//, "/logos/dark/");
  const fsPath = path.join(process.cwd(), "public", darkUrl);
  return fs.existsSync(fsPath) ? darkUrl : undefined;
}

// src 없으면 이름 텍스트가 플레이스홀더로 표시됨.
const LOGOS: LogoItem[] = [
  { name: "피네이션", src: "/logos/p-nation.png" },
  { name: "브랜뉴뮤직", src: "/logos/brand-new-music.png" },
  { name: "DSP미디어", src: "/logos/dsp-media.svg" },
  { name: "스타쉽엔터테인먼트", src: "/logos/starship-entertainment.png" },
  { name: "팬엔터테인먼트", src: "/logos/pan-entertainment.webp" },
  { name: "에이스토리", src: "/logos/astory.webp" },
  { name: "키이스트", src: "/logos/keyeast.svg" },
  { name: "콘텐츠웨이브", src: "/logos/contents-wave.png" },
];

export function LogoMarquee() {
  const resolved = LOGOS.map((logo) => ({
    ...logo,
    darkSrc: logo.src ? resolveDarkSrc(logo.src) : undefined,
  }));
  const loop = [...resolved, ...resolved];

  return (
    <section
      aria-label="함께하는 업체"
      className="border-b border-border py-12"
    >
      <div
        className={cn(
          "group relative overflow-hidden",
          "[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]",
        )}
      >
        <div className="flex w-max animate-marquee items-center gap-16 pr-16 group-hover:[animation-play-state:paused]">
          {loop.map((logo, i) => (
            <LogoCell key={`${logo.name}-${i}`} logo={logo} />
          ))}
        </div>
      </div>
    </section>
  );
}

function LogoCell({ logo }: { logo: LogoItem }) {
  if (logo.src) {
    const imgClass =
      "h-16 w-auto object-contain opacity-80 transition hover:opacity-100";
    const width = logo.width ?? 200;
    const height = logo.height ?? 80;
    return (
      <div className="flex h-16 shrink-0 items-center">
        <Image
          src={logo.src}
          alt={logo.name}
          width={width}
          height={height}
          className={cn(imgClass, logo.darkSrc && "dark:hidden")}
        />
        {logo.darkSrc && (
          <Image
            src={logo.darkSrc}
            alt={logo.name}
            width={width}
            height={height}
            className={cn(imgClass, "hidden dark:block")}
            aria-hidden
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-16 shrink-0 items-center">
      <span className="text-xl font-bold tracking-tight text-muted-foreground/70">
        {logo.name}
      </span>
    </div>
  );
}
