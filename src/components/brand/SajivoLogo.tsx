import Image from "next/image";
import Link from "next/link";

export function SajivoLogo({ compact = false, className = "", href = "/v2" }: { compact?: boolean; className?: string; href?: string }) {
  return (
    <Link href={href} aria-label="Sajivo home" className={`block shrink-0 ${className}`}>
      <Image
        src="/brand/sajivo-logo.png"
        alt="Sajivo"
        width={compact ? 108 : 150}
        height={compact ? 36 : 50}
        priority
        className={`h-auto object-contain object-left ${compact ? "w-[108px]" : "w-[150px]"}`}
      />
    </Link>
  );
}
