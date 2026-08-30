"use client";

import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Unable to sign in to the admin console.");
        return;
      }
      router.replace("/v2/admin");
      router.refresh();
    } catch {
      setError("The admin service is temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 grid gap-5">
      <div>
        <label htmlFor="admin-email" className="text-xs font-bold text-[#c9d0cc]">Admin email</label>
        <div className="relative mt-2">
          <Mail className="pointer-events-none absolute left-3 top-3.5 text-[#7f8b85]" size={17} />
          <input id="admin-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 w-full rounded-md border border-[#3a4540] bg-[#171d1a] px-10 text-sm text-white outline-none transition focus:border-[#e07359] focus:ring-2 focus:ring-[#e07359]/20" />
        </div>
      </div>
      <div>
        <label htmlFor="admin-password" className="text-xs font-bold text-[#c9d0cc]">Password</label>
        <div className="relative mt-2">
          <LockKeyhole className="pointer-events-none absolute left-3 top-3.5 text-[#7f8b85]" size={17} />
          <input id="admin-password" type={visible ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 w-full rounded-md border border-[#3a4540] bg-[#171d1a] px-10 text-sm text-white outline-none transition focus:border-[#e07359] focus:ring-2 focus:ring-[#e07359]/20" />
          <button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? "Hide password" : "Show password"} className="absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-md text-[#9ba5a0] hover:bg-white/5 hover:text-white">
            {visible ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </div>
      {error ? <p role="alert" className="rounded-md border border-[#7d382d] bg-[#351b17] px-3 py-2.5 text-xs leading-5 text-[#ffb8a8]">{error}</p> : null}
      <button type="submit" disabled={loading} className="flex h-11 items-center justify-center gap-2 rounded-md bg-[#df694f] px-4 text-sm font-extrabold text-white shadow-[0_3px_0_#913b2a] transition hover:bg-[#e8775e] disabled:cursor-wait disabled:opacity-60">
        {loading ? <><LoaderCircle className="animate-spin" size={17} />Verifying access...</> : <><ShieldCheck size={17} />Enter super admin</>}
      </button>
      <p className="text-center text-[11px] leading-5 text-[#77817c]">Access is checked against Sajivo's server-side administrator registry.</p>
    </form>
  );
}
