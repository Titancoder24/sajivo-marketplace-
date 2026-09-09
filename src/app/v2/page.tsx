import type { Metadata } from "next";
import { HomeLanding } from "@/components/v2/home/HomeLanding";
import { getPublicWorkPhotos } from "@/lib/server/repository";

export const metadata: Metadata = {
  title: "Sajivo | Plan, hire and manage your interior project",
  description:
    "Explore interior services, compare verified professionals and manage your project from one clear brief to final handover.",
};

export default async function V2HomePage() {
  const workPhotos = await getPublicWorkPhotos();
  return <HomeLanding workPhotos={workPhotos} />;
}
