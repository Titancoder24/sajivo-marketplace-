import Image from "next/image";
import Link from "next/link";

export function SajivoLogo({ compact = false, className = "", href = "/v2" }: { compact?: boolean; className?: string; href?: string }) {
  return (
    <Link href={href} aria-label="Sajivo home" className={`block shrink-0 rounded bg-[#061a3b] px-2 py-1 shadow-sm ${className}`}>
      <Image
        src="/brand/sajivo-leaf-logo-white.png"
        alt="Sajivo"
        width={compact ? 112 : 156}
        height={compact ? 45 : 62}
        priority
        className={`h-auto object-contain object-left ${compact ? "w-[112px]" : "w-[156px]"}`}
      />
    </Link>
  );
}
