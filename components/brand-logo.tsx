import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  showText?: boolean;
  size?: number;
};

export function BrandLogo({
  className,
  imageClassName,
  textClassName,
  showText = true,
  size = 36,
}: BrandLogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
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
    </div>
  );
}
