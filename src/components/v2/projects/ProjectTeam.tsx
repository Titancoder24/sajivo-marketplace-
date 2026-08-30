"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Loader2,
  Mail,
  MessageSquare,
  UserPlus,
  X,
} from "lucide-react";
type Member = {
  id: string;
  profile_id: string;
  role: string;
  status: string;
  profile: { full_name: string; email: string; primary_role: string } | null;
};
export function ProjectTeam({ projectId }: { projectId?: string }) {
  const [members, setMembers] = useState<Member[]>([]),
    [loading, setLoading] = useState(Boolean(projectId)),
    [error, setError] = useState(""),
    [open, setOpen] = useState(false),
    [saving, setSaving] = useState(false),
    [form, setForm] = useState({ email: "", role: "Project collaborator" });
  const load = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/v2/projects/${projectId}/team`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMembers(data.members);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Team could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);
  useEffect(() => {
    void load();
  }, [load]);
  async function invite(event: FormEvent) {
    event.preventDefault();
    if (!projectId) {
      setOpen(false);
      setError(
        "Sign in and open one of your projects before inviting members.",
      );
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/v2/projects/${projectId}/team`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMembers((current) => [
        ...current.filter((item) => item.profile_id !== data.member.profile_id),
        data.member,
      ]);
      setForm({ email: "", role: "Project collaborator" });
      setOpen(false);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Invitation could not be created.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold">Project team</h2>
          <p className="mt-1 text-sm text-[#747881]">
            People, roles and communication for this project.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#ec4f1c] px-4 text-xs font-extrabold text-white"
        >
          <UserPlus size={15} />
          Invite member
        </button>
      </div>
      {error && (
        <div
          role="alert"
          className="flex gap-2 rounded-md border border-[#efc8c2] bg-[#fff4f1] p-3 text-xs font-semibold text-[#a43a28]"
        >
          <AlertCircle size={16} />
          <span className="flex-1">{error}</span>
          {error.toLowerCase().includes("sign in") && (
            <Link href="/login" className="underline">
              Sign in
            </Link>
          )}
          <button onClick={() => setError("")}>
            <X size={14} />
          </button>
        </div>
      )}
      {loading ? (
        <div className="grid min-h-52 place-items-center rounded-lg border bg-white">
          <Loader2 className="animate-spin text-[#ec4f1c]" />
        </div>
      ) : members.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {members.map((member) => {
            const name = member.profile?.full_name || "Sajivo member",
              initials = name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2);
            return (
              <article
                key={member.id}
                className="rounded-lg border bg-white p-5"
              >
                <div className="flex items-start justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-[#f4dcd4] text-sm font-extrabold">
                    {initials}
                  </span>
                  <span className="rounded-full bg-[#e9f8f0] px-2 py-1 text-[9px] font-extrabold uppercase text-[#18704d]">
                    {member.status}
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-extrabold">{name}</h3>
                <p className="mt-1 text-xs text-[#747881]">{member.role}</p>
                <p className="mt-3 truncate text-[10px] text-[#8a8d94]">
                  {member.profile?.email}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button className="flex h-9 items-center justify-center gap-2 rounded-md bg-[#242a28] text-xs font-bold text-white">
                    <MessageSquare size={13} />
                    Chat
                  </button>
                  <a
                    href={`mailto:${member.profile?.email || ""}`}
                    className="flex h-9 items-center justify-center gap-2 rounded-md border text-xs font-bold"
                  >
                    <Mail size={13} />
                    Email
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-white p-10 text-center">
          <UserPlus className="mx-auto text-[#ec4f1c]" />
          <h3 className="mt-3 text-sm font-extrabold">
            Build your project team
          </h3>
          <p className="mt-1 text-xs text-[#747881]">
            Invite an existing verified Sajivo account to collaborate.
          </p>
        </div>
      )}
      {open && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/45 p-4">
          <form
            onSubmit={invite}
            className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl"
          >
            <div className="flex justify-between">
              <div>
                <h2 className="text-lg font-extrabold">
                  Invite project member
                </h2>
                <p className="mt-1 text-xs text-[#747881]">
                  The person must already have a Sajivo account.
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)}>
                <X size={17} />
              </button>
            </div>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-1.5 text-xs font-bold">
                Account email
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  className="h-11 rounded-md border px-3 text-sm font-normal"
                />
              </label>
              <label className="grid gap-1.5 text-xs font-bold">
                Project role
                <input
                  required
                  minLength={2}
                  value={form.role}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      role: event.target.value,
                    }))
                  }
                  className="h-11 rounded-md border px-3 text-sm font-normal"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-10 rounded-md border px-4 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                className="flex h-10 items-center gap-2 rounded-md bg-[#ec4f1c] px-4 text-xs font-extrabold text-white"
              >
                {saving && <Loader2 className="animate-spin" size={14} />}Create
                invitation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
