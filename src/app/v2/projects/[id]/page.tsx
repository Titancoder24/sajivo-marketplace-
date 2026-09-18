import { getActiveUser } from "@/lib/supabase/account-access";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { LiveProjectWorkspace, type LiveProject } from "@/components/v2/projects/LiveProjectWorkspace";
import { createClient } from "@/lib/supabase/server";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const metadata: Metadata = { title: "Project workspace | Sajivo", description: "Manage a Sajivo project, tasks, files and team records." };

export default async function V2ProjectWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuid.test(id)) notFound();
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured for this deployment.");
  const { data: auth } = await getActiveUser(supabase);
  if (!auth.user) redirect(`/login?next=${encodeURIComponent(`/v2/projects/${id}`)}`);
  const { data: project, error } = await supabase.from("projects").select("id,title,description,status,scope,services,city,state,locality,budget_range,custom_budget,preferred_start_date,expected_timeline,created_at,updated_at").eq("id", id).maybeSingle();
  if (error || !project) notFound();
  const [tasks, files, team, milestones] = await Promise.all([
    supabase.from("project_tasks").select("id", { count: "exact", head: true }).eq("project_id", id),
    supabase.from("project_files").select("id", { count: "exact", head: true }).eq("project_id", id),
    supabase.from("project_team_members").select("id", { count: "exact", head: true }).eq("project_id", id).neq("status", "removed"),
    supabase.from("project_milestones").select("id", { count: "exact", head: true }).eq("project_id", id),
  ]);
  return <LiveProjectWorkspace project={project as LiveProject} counts={{ tasks: tasks.count ?? 0, files: files.count ?? 0, team: team.count ?? 0, milestones: milestones.count ?? 0 }} />;
}
