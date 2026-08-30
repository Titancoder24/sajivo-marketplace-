import type { Metadata } from "next";
import { HomeLanding } from "@/components/v2/home/HomeLanding";

export const metadata: Metadata = {
  title: "Sajivo | Plan, hire and manage your interior project",
  description:
    "Explore interior services, compare verified professionals and manage your project from one clear brief to final handover.",
};

export default function V2HomePage() {
  return <HomeLanding />;
}
