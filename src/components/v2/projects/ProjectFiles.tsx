"use client";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Download,
  FileText,
  Loader2,
  Search,
  Upload,
  X,
} from "lucide-react";

type StoredFile = {
  id: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
  download_url: string | null;
};
const formatSize = (size: number | null) =>
  !size
    ? "Unknown size"
    : size < 1024 * 1024
      ? `${Math.ceil(size / 1024)} KB`
      : `${(size / 1024 / 1024).toFixed(1)} MB`;

export function ProjectFiles({ projectId }: { projectId?: string }) {
  const [files, setFiles] = useState<StoredFile[]>([]),
    [query, setQuery] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(Boolean(projectId)),
    [uploading, setUploading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const load = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/projects/${projectId}/files`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setFiles(data.files);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Files could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);
  useEffect(() => {
    void load();
  }, [load]);
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!selected.length) return;
    if (!projectId) {
      setError("Sign in and open one of your projects before uploading files.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      selected.forEach((file) => body.append("files", file));
      const response = await fetch(`/api/projects/${projectId}/files`, {
        method: "POST",
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }
  const shown = files.filter((file) =>
    file.file_name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="grid gap-4">
      <input
        ref={input}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.dwg"
        onChange={upload}
        className="sr-only"
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold">Project files</h2>
          <p className="mt-1 text-sm text-[#747881]">
            Drawings, references, contracts and site records.
          </p>
        </div>
        <button
          type="button"
          disabled={uploading}
          onClick={() => input.current?.click()}
          className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#ec4f1c] px-4 text-xs font-extrabold text-white disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="animate-spin" size={15} />
          ) : (
            <Upload size={15} />
          )}
          Upload files
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
          <button onClick={() => setError("")} aria-label="Dismiss error">
            <X size={14} />
          </button>
        </div>
      )}
      <section className="overflow-hidden rounded-lg border border-[#e3e3e0] bg-white">
        <header className="flex items-center justify-between gap-3 border-b p-4">
          <div>
            <h2 className="text-[15px] font-extrabold">All project files</h2>
            <p className="mt-1 text-xs text-[#777b83]">{shown.length} files</p>
          </div>
          <label className="relative">
            <Search
              size={14}
              className="absolute left-3 top-2.5 text-[#8a8d94]"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search files"
              className="h-9 w-48 rounded-md border pl-9 pr-3 text-xs"
            />
          </label>
        </header>
        {loading ? (
          <div className="grid min-h-48 place-items-center">
            <Loader2 className="animate-spin text-[#ec4f1c]" />
          </div>
        ) : shown.length ? (
          <div className="divide-y">
            {shown.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 px-4 py-4 sm:px-5"
              >
                <span className="grid h-9 w-9 place-items-center rounded-md bg-[#fff0e9] text-[#e84a18]">
                  <FileText size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-extrabold">
                    {file.file_name}
                  </p>
                  <p className="mt-1 text-[10px] text-[#848890]">
                    {file.mime_type || "File"} · {formatSize(file.file_size)} ·{" "}
                    {new Intl.DateTimeFormat("en-IN", {
                      dateStyle: "medium",
                    }).format(new Date(file.created_at))}
                  </p>
                </div>
                {file.download_url && (
                  <a
                    href={file.download_url}
                    className="grid h-9 w-9 place-items-center rounded-md border"
                    aria-label={`Download ${file.file_name}`}
                  >
                    <Download size={15} />
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="m-4 flex w-[calc(100%-32px)] items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-sm font-bold text-[#666a72]"
          >
            <Upload size={19} className="text-[#e84a18]" />
            Choose PDF, image, or DWG files
          </button>
        )}
      </section>
    </div>
  );
}
