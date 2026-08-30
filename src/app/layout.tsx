import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { PwaRegister } from "@/components/sajivo/PwaRegister";
import { SoundExperience } from "@/components/sajivo/SoundExperience";
import { AppPreferences } from "@/components/sajivo/AppPreferences";
import { ProductAnalytics } from "@/components/analytics/ProductAnalytics";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sajivo | Interior projects, designers, contractors",
  description: "A production-grade marketplace for interior projects, professionals, proposals, and project collaboration.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Sajivo",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#c65d47",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${manrope.variable} antialiased`}>
        {children}
        <ProductAnalytics />
        <AppPreferences />
        <SoundExperience />
        <PwaRegister />
        <Toaster />
      </body>
    </html>
  );
}
