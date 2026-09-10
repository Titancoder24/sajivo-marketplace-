import { ArrowUpRight, AtSign, Building2, Camera, Share2 } from "lucide-react";

const socialLinks = [
  { label: "Pinterest", handle: "@sajivomarketplace", href: "https://www.pinterest.com/sajivomarketplace/", Icon: Camera },
  { label: "LinkedIn", handle: "Sajivo Technologies", href: "https://www.linkedin.com/company/sajivo-technologies-pvt-ltd/", Icon: Building2 },
  { label: "Instagram", handle: "@saji_vopvtltd", href: "https://www.instagram.com/saji_vopvtltd/", Icon: Camera },
  { label: "X", handle: "@SajivoTechfvf", href: "https://x.com/SajivoTechfvf", Icon: AtSign },
  { label: "Threads", handle: "@sajivo_tech", href: "https://www.threads.net/@sajivo_tech", Icon: Share2 },
] as const;

export function SocialLinks({ showHandles = false }: { showHandles?: boolean }) {
  return <div className="flex flex-wrap gap-x-5 gap-y-3">
    {socialLinks.map(({ label, handle, href, Icon }) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={`${label} ${handle}`} className="inline-flex items-center gap-2 text-sm text-[var(--rv-ink-2)] transition hover:text-[var(--rv-terracotta)]"><Icon size={15} aria-hidden="true" /><span>{showHandles ? handle : label}</span><ArrowUpRight size={12} aria-hidden="true" /></a>)}
  </div>;
}
