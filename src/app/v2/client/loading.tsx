import { Loader2 } from "lucide-react";

export default function ClientLoading() {
  return (
    <div className="grid min-h-[55vh] place-items-center" role="status" aria-label="Loading your workspace">
      <div className="text-center">
        <Loader2 className="mx-auto animate-spin text-[#d65f45]" size={26} />
        <p className="mt-3 text-xs font-semibold text-[#68736d]">Loading your account data…</p>
      </div>
    </div>
  );
}
