import { notFound } from "next/navigation";
import { LiveProfessionalScreen, type ProfessionalMode } from "@/components/v2/professional/LiveProfessionalScreen";

const views:ProfessionalMode[]=["opportunities","proposals","projects","team","documents","finance","analytics","settings"];
export function generateStaticParams(){return views.map(view=>({view}))}

export default async function ProfessionalViewPage({ params }: { params: Promise<{ view: string }> }) {
  const { view } = await params;
  if (!views.includes(view as ProfessionalMode)) notFound();
  return <LiveProfessionalScreen mode={view as ProfessionalMode}/>;
}
