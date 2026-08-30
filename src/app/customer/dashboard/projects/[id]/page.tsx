import { DashboardHeader, SectionHeader } from "@/components/sajivo/DashboardBlocks";
import { ProposalCard } from "@/components/sajivo/ProposalCard";
import { ProjectCard } from "@/components/sajivo/ProjectCard";
import { ButtonLink } from "@/components/ui/button";
import { getProjectById, getProposals } from "@/lib/server/repository";
import { MessageSquareText } from "lucide-react";
import { notFound } from "next/navigation";

export default async function CustomerProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();
  const projectProposals = (await getProposals("customer")).filter((proposal) => proposal.projectId === project.id);
  return (
    <>
      <DashboardHeader eyebrow="Project" title="Project detail" text="Review the brief, files, project state, and proposal actions." action={<ButtonLink href={`/customer/dashboard/workspace/${project.id}`} variant="secondary" size="sm">Open workspace</ButtonLink>} />
      <ProjectCard project={project} role="customer" />
      <div id="proposals" className="mt-7 scroll-mt-24"><SectionHeader title={`Proposals received (${projectProposals.length})`} text="Every professional response appears here. Compare scope, timeline, deliverables, and pricing before choosing." /><div className="grid gap-3">{projectProposals.length ? projectProposals.map((proposal) => <ProposalCard key={proposal.id} proposal={proposal} viewerRole="customer" />) : <div className="rounded-lg border border-dashed border-[var(--rv-border)] bg-white p-8 text-center"><MessageSquareText className="mx-auto text-[var(--rv-terracotta)]" size={28} /><h2 className="font-display mt-4 text-xl">Your proposals will appear here</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--rv-ink-2)]">Your project is published and matching has started. We will notify you when an interior designer or contractor submits a proposal.</p></div>}</div></div>
    </>
  );
}
