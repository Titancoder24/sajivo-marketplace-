import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FolderKanban, Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "My projects | Sajivo",
  description: "Open an active Sajivo project workspace.",
};

export default async function V2ProjectsPage() {
  const supabase = await createClient();
  let projectId: string | undefined;
  if (supabase) {
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      const { data } = await supabase
        .from("projects")
        .select("id")
        .or(
          `customer_id.eq.${auth.user.id},selected_professional_id.eq.${auth.user.id}`,
        )
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      projectId = data?.id;
    }
  }
  if (projectId) redirect(`/v2/projects/${projectId}`);
  return <section className="mx-auto grid min-h-[calc(100vh-140px)] max-w-3xl place-items-center px-5 py-16 text-center"><div><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#eaf1ed] text-[#496056]"><FolderKanban size={24}/></span><h1 className="mt-5 text-2xl font-extrabold">No projects yet</h1><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#6e7973]">Create your first project brief. Its workspace will contain only the tasks, files, people and records added to that project.</p><Link href="/v2/projects/new" className="mt-6 inline-flex h-11 items-center gap-2 rounded-md bg-[#d65f45] px-5 text-sm font-bold text-white shadow-[0_3px_0_#9f3d2b]"><Plus size={16}/>Start a project</Link></div></section>;
}
