import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  href?: string;
  imageClassName?: string;
  size?: number;
};

const BRAND_LOGO_ASPECT_RATIO = 1655 / 450;

export function BrandLogo({
  className,
  href,
  imageClassName,
  size = 36,
}: BrandLogoProps) {
  const content = (
    <Image
      src="/brand-logo.png"
      alt="캐스트인"
      width={Math.round(size * BRAND_LOGO_ASPECT_RATIO)}
      height={size}
      className={cn("h-auto shrink-0 object-contain", imageClassName)}
    />
  );
  const rootClassName = cn(
    "inline-flex items-center",
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
