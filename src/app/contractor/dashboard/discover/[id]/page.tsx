import { DashboardHeader } from "@/components/sajivo/DashboardBlocks";
import { ProjectCard } from "@/components/sajivo/ProjectCard";
import { ProposalForm } from "@/features/marketplace/ProposalModal";
import { getProjectById } from "@/lib/server/repository";
import { notFound } from "next/navigation";

export default async function ContractorMarketplaceProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const project = await getProjectById((await params).id);
  if (!project) notFound();
  return (
    <>
      <DashboardHeader title="Marketplace Project" text="Read the customer brief and submit an execution quotation." />
      <ProjectCard project={project} role="contractor" />
      <div className="mt-5"><ProposalForm label="Submit Quotation" /></div>
    </>
  );
}
