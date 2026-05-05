import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  href?: string;
  imageClassName?: string;
  textClassName?: string;
  showText?: boolean;
  size?: number;
};

export function BrandLogo({
  className,
  href,
  imageClassName,
  textClassName,
  showText = true,
  size = 36,
}: BrandLogoProps) {
  const content = (
    <>
      <Image
        src="/logo2.png"
        alt={showText ? "" : "캐스트인"}
        width={size}
        height={size}
        className={cn("shrink-0 object-contain", imageClassName)}
      />
      {showText ? (
        <span className={cn("font-bold tracking-tight", textClassName)}>
          캐스트인
        </span>
      ) : null}
    </>
  );
  const rootClassName = cn(
    "flex items-center gap-2.5",
    href &&
      "rounded-md transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={rootClassName}>
        {content}
      </Link>
    );
  }

  return <div className={rootClassName}>{content}</div>;
}
