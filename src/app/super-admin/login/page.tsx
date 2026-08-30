import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/v2/admin/AdminLoginForm";
import { SajivoLogo } from "@/components/brand/SajivoLogo";
import { getPlatformAdmin } from "@/lib/server/angel";

export const metadata: Metadata = {
  title: "Super Admin Sign In | Sajivo",
  description: "Restricted Sajivo platform administration access.",
  robots: { index: false, follow: false },
};

export default async function SuperAdminLoginPage() {
  const admin = await getPlatformAdmin();
  if (admin) redirect("/v2/admin");

  return (
    <main data-super-admin-login className="relative grid min-h-screen place-items-center overflow-hidden bg-[#0f1412] px-4 py-12 text-white">
      <style>{`body:has([data-super-admin-login]) > div > header, body:has([data-super-admin-login]) > aside[aria-label="Appearance and language preferences"], body:has([data-super-admin-login]) > button[aria-label="Mute interface sounds"], body:has([data-super-admin-login]) > button[aria-label="Enable interface sounds"] { display: none; } body:has([data-super-admin-login]) > div > main { padding-bottom: 0; }`}</style>
      <div className="absolute inset-x-0 top-0 h-px bg-[#df694f]" />
      <section className="w-full max-w-md rounded-md border border-[#303a35] bg-[#202824] p-7 shadow-2xl shadow-black/35 sm:p-9">
        <SajivoLogo href="/v2" />
        <div className="mt-8 border-t border-[#354039] pt-7">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#df7a62]">Restricted access</p>
          <h1 className="mt-3 text-2xl font-extrabold tracking-normal">Sajivo Super Admin</h1>
          <p className="mt-2 text-sm leading-6 text-[#9ba5a0]">Sign in to manage platform operations, integrations, analytics, SEO, and Angel support.</p>
        </div>
        <AdminLoginForm />
      </section>
    </main>
  );
}
