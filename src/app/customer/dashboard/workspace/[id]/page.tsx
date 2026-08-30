import { redirect } from "next/navigation";

export default async function CustomerWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  redirect(`/v2/projects/${(await params).id}`);
}
