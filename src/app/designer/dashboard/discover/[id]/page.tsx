import { DashboardHeader } from "@/components/sajivo/DashboardBlocks";
import { ProjectCard } from "@/components/sajivo/ProjectCard";
import { ProposalForm } from "@/features/marketplace/ProposalModal";
import { getProjectById } from "@/lib/server/repository";
import { notFound } from "next/navigation";

export default async function DesignerMarketplaceProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const project = await getProjectById((await params).id);
  if (!project) notFound();
  return (
    <>
      <DashboardHeader title="Marketplace Project" text="Read the customer brief and submit a professional design proposal." />
      <ProjectCard project={project} role="designer" />
      <div className="mt-5"><ProposalForm /></div>
    </>
  );
}
