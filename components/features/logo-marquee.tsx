import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoItem = {
  name: string;
  src?: string;
  width?: number;
  height?: number;
};

// src 없으면 이름 텍스트가 플레이스홀더로 표시됨.
const LOGOS: LogoItem[] = [
  { name: "어비스컴퍼니", src: "/logos/abyss-company.jpg" },
  { name: "피네이션", src: "/logos/p-nation.jpg" },
  { name: "브랜뉴뮤직", src: "/logos/brand-new-music.png" },
  { name: "DSP미디어", src: "/logos/dsp-media.svg" },
  { name: "스타쉽엔터테인먼트", src: "/logos/starship-entertainment.jpg" },
  { name: "팬엔터테인먼트", src: "/logos/pan-entertainment.webp" },
  { name: "래몽래인", src: "/logos/raemongraein.jpg" },
  { name: "에이스토리", src: "/logos/astory.webp" },
  { name: "키이스트", src: "/logos/keyeast.svg" },
  { name: "콘텐츠웨이브", src: "/logos/contents-wave.png" },
];

export function LogoMarquee() {
  const loop = [...LOGOS, ...LOGOS];

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
    return (
      <div className="flex h-16 shrink-0 items-center">
        <Image
          src={logo.src}
          alt={logo.name}
          width={logo.width ?? 200}
          height={logo.height ?? 80}
          className="h-16 w-auto object-contain opacity-80 transition hover:opacity-100"
        />
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
