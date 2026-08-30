"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  Circle,
  Clock3,
  Filter,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";

type Status =
  | "todo"
  | "in_progress"
  | "review"
  | "done"
  | "blocked"
  | "cancelled";
type Column = "todo" | "in_progress" | "blocked" | "done";
type Priority = "low" | "medium" | "high" | "urgent";
type Task = {
  id: string;
  public_id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  due_at: string | null;
};

const columns: Array<{ status: Column; label: string; badge: string }> = [
  { status: "todo", label: "To do", badge: "bg-[#f1f1ef] text-[#666a72]" },
  {
    status: "in_progress",
    label: "In progress",
    badge: "bg-[#fff0e9] text-[#c74419]",
  },
  { status: "blocked", label: "Blocked", badge: "bg-[#fff0ef] text-[#bd3b38]" },
  { status: "done", label: "Completed", badge: "bg-[#e9f8f0] text-[#18704d]" },
];

const columnFor = (status: Status): Column =>
  status === "review"
    ? "in_progress"
    : status === "cancelled"
      ? "blocked"
      : status;
const nextStatus = (status: Status): Status =>
  status === "todo"
    ? "in_progress"
    : status === "in_progress" || status === "review"
      ? "done"
      : "todo";
const dueLabel = (value: string | null) =>
  !value
    ? "No due date"
    : new Date(value).toDateString() === new Date().toDateString()
      ? "Today"
      : new Intl.DateTimeFormat("en-IN", {
          day: "numeric",
          month: "short",
        }).format(new Date(value));

async function parse(response: Response) {
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(data.error || "The request could not be completed.");
  return data;
}

function StatusDot({ status }: { status: Status }) {
  const column = columnFor(status);
  if (column === "done")
    return (
      <span className="grid h-5 w-5 place-items-center rounded-full bg-[#2fa874] text-white">
        <Check size={12} />
      </span>
    );
  const tone =
    column === "in_progress"
      ? "border-[#ec4f1c] text-[#ec4f1c]"
      : column === "blocked"
        ? "border-[#cf4845] bg-[#fff2f1] text-[#cf4845]"
        : "border-[#bfc1c5] text-[#a2a5aa]";
  return (
    <span
      className={`grid h-5 w-5 place-items-center rounded-full border bg-white ${tone}`}
    >
      <Circle size={7} fill="currentColor" />
    </span>
  );
}

export function ProjectTasks({ projectId }: { projectId?: string }) {
  const [items, setItems] = useState<Task[]>([]);
  const [loading, setLoading] = useState(Boolean(projectId));
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [filter, setFilter] = useState<"all" | Priority>("all");
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium" as Priority,
    dueDate: "",
  });

  const load = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await parse(
        await fetch(`/api/v2/projects/${projectId}/tasks`, {
          cache: "no-store",
        }),
      );
      setItems(data.tasks);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Tasks could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);
  useEffect(() => {
    void load();
  }, [load]);
  const visible = useMemo(
    () =>
      filter === "all"
        ? items
        : items.filter((item) => item.priority === filter),
    [items, filter],
  );

  async function create(event: FormEvent) {
    event.preventDefault();
    if (!projectId) {
      setOpen(false);
      setError("Sign in and open one of your projects before adding a task.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const data = await parse(
        await fetch(`/api/v2/projects/${projectId}/tasks`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: form.title,
            description: form.description,
            priority: form.priority,
            dueAt: form.dueDate
              ? new Date(`${form.dueDate}T12:00:00`).toISOString()
              : null,
          }),
        }),
      );
      setItems((current) => [data.task, ...current]);
      setForm({ title: "", description: "", priority: "medium", dueDate: "" });
      setOpen(false);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Task could not be created.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function move(task: Task) {
    if (!projectId) return;
    const status = nextStatus(task.status),
      previous = items;
    setItems((current) =>
      current.map((item) => (item.id === task.id ? { ...item, status } : item)),
    );
    try {
      const data = await parse(
        await fetch(`/api/v2/projects/${projectId}/tasks/${task.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status }),
        }),
      );
      setItems((current) =>
        current.map((item) => (item.id === task.id ? data.task : item)),
      );
    } catch (caught) {
      setItems(previous);
      setError(
        caught instanceof Error ? caught.message : "Task could not be updated.",
      );
    }
  }

  async function remove(task: Task) {
    if (!projectId) return;
    const previous = items;
    setItems((current) => current.filter((item) => item.id !== task.id));
    setDeleting(null);
    try {
      await parse(
        await fetch(`/api/v2/projects/${projectId}/tasks/${task.id}`, {
          method: "DELETE",
        }),
      );
    } catch (caught) {
      setItems(previous);
      setError(
        caught instanceof Error ? caught.message : "Task could not be deleted.",
      );
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold">Tasks & decisions</h2>
          <p className="mt-1 text-sm text-[#747881]">
            Track responsibilities, approvals and site actions.
          </p>
        </div>
        <div className="flex gap-2">
          <label className="flex h-10 items-center gap-2 rounded-md border border-[#dededb] bg-white px-3 text-xs font-bold">
            <Filter size={15} />
            <select
              aria-label="Filter tasks by priority"
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value as typeof filter)
              }
              className="bg-transparent outline-none"
            >
              <option value="all">All priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-10 items-center gap-2 rounded-md bg-[#ec4f1c] px-4 text-xs font-extrabold text-white shadow-[0_3px_0_#b93610] active:translate-y-[2px] active:shadow-[0_1px_0_#b93610]"
          >
            <Plus size={15} />
            Add task
          </button>
        </div>
      </div>
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-[#efc8c2] bg-[#fff4f1] p-3 text-xs font-semibold text-[#a43a28]"
        >
          <AlertCircle size={16} />
          <span className="flex-1">{error}</span>
          {error.toLowerCase().includes("sign in") && (
            <Link href="/login" className="underline">
              Sign in
            </Link>
          )}
          <button aria-label="Dismiss error" onClick={() => setError("")}>
            <X size={14} />
          </button>
        </div>
      )}
      {loading ? (
        <div className="grid min-h-56 place-items-center rounded-lg border bg-white">
          <span className="flex items-center gap-2 text-sm font-bold text-[#747881]">
            <Loader2 className="animate-spin" size={18} />
            Loading project tasks
          </span>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
          {columns.map((column) => (
            <section
              key={column.status}
              className="min-w-0 rounded-lg bg-[#f1f1ef] p-3"
            >
              <header className="flex items-center gap-2 px-1 pb-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${column.badge}`}
                >
                  {column.label}
                </span>
                <span className="text-xs font-bold text-[#777b83]">
                  {
                    visible.filter(
                      (item) => columnFor(item.status) === column.status,
                    ).length
                  }
                </span>
              </header>
              <div className="grid gap-3">
                {visible
                  .filter((item) => columnFor(item.status) === column.status)
                  .map((item) => (
                    <article
                      key={item.id}
                      className="rounded-md border border-[#e1e1de] bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => void move(item)}
                          aria-label={`Move ${item.title} to next status`}
                          title="Move to next status"
                        >
                          <StatusDot status={item.status} />
                        </button>
                        <h3 className="min-w-0 flex-1 text-sm font-extrabold leading-5">
                          {item.title}
                        </h3>
                        <button
                          onClick={() => setDeleting(item)}
                          aria-label={`Delete ${item.title}`}
                          className="text-[#92969d] hover:text-[#bd3b38]"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {item.description && (
                        <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-[#747881]">
                          {item.description}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[9px] font-extrabold uppercase text-[#777b83]">
                          {item.public_id} · {item.priority}
                        </span>
                        <span className="text-[10px] font-bold text-[#777b83]">
                          <Clock3 size={11} className="mr-1 inline" />
                          {dueLabel(item.due_at)}
                        </span>
                      </div>
                    </article>
                  ))}
                {visible.every(
                  (item) => columnFor(item.status) !== column.status,
                ) && (
                  <p className="rounded-md border border-dashed border-[#d3d3cf] px-3 py-6 text-center text-[11px] text-[#8a8d94]">
                    No tasks
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
      {!projectId && !loading && (
        <div className="rounded-lg border border-[#eadfca] bg-[#fffaf0] p-4 text-sm text-[#76551e]">
          This workspace is in read-only preview.{" "}
          <Link href="/login" className="font-extrabold underline">
            Sign in
          </Link>{" "}
          to manage a Supabase project.
        </div>
      )}
      {open && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/45 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) setOpen(false);
          }}
        >
          <form
            onSubmit={create}
            className="w-full max-w-lg rounded-lg bg-white p-5 shadow-2xl"
          >
            <div className="flex justify-between">
              <div>
                <h2 className="text-lg font-extrabold">Add project task</h2>
                <p className="mt-1 text-xs text-[#747881]">
                  Saved to this project’s Supabase workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close task form"
              >
                <X size={17} />
              </button>
            </div>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-1.5 text-xs font-bold">
                Task title
                <input
                  autoFocus
                  required
                  minLength={3}
                  maxLength={180}
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  className="h-11 rounded-md border px-3 text-sm font-normal"
                />
              </label>
              <label className="grid gap-1.5 text-xs font-bold">
                Description
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="resize-none rounded-md border p-3 text-sm font-normal"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-bold">
                  Priority
                  <select
                    value={form.priority}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        priority: event.target.value as Priority,
                      }))
                    }
                    className="h-11 rounded-md border bg-white px-3 text-sm font-normal"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </label>
                <label className="grid gap-1.5 text-xs font-bold">
                  Due date
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        dueDate: event.target.value,
                      }))
                    }
                    className="h-11 rounded-md border px-3 text-sm font-normal"
                  />
                </label>
              </div>
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
                disabled={saving || form.title.trim().length < 3}
                className="flex h-10 items-center gap-2 rounded-md bg-[#ec4f1c] px-5 text-xs font-extrabold text-white disabled:opacity-50"
              >
                {saving && <Loader2 className="animate-spin" size={14} />}Create
                task
              </button>
            </div>
          </form>
        </div>
      )}
      {deleting && (
        <div className="fixed inset-0 z-[110] grid place-items-center bg-black/45 p-4">
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-task-title" className="w-full max-w-sm rounded-lg bg-white p-5 shadow-2xl">
            <h2 id="delete-task-title" className="text-lg font-extrabold">Delete task?</h2>
            <p className="mt-2 text-sm leading-6 text-[#747881]">“{deleting.title}” will be permanently removed from this project.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setDeleting(null)} className="h-10 rounded-md border px-4 text-xs font-bold">Cancel</button>
              <button type="button" onClick={() => void remove(deleting)} className="h-10 rounded-md bg-[#bd3b38] px-4 text-xs font-extrabold text-white">Delete task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
