import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { AlertCircle, Check, ChevronDown, Upload } from "lucide-react";

export function Field({ label, error, hint, icon, className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string; icon?: ReactNode }) {
  return (
    <label className={`block min-w-0 text-[13px] font-semibold text-[#242424] ${className}`}>
      <span className="mb-1.5 block">{label}</span>
      <span className="relative block">
        {icon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#858585]">{icon}</span>}
        <input
          aria-invalid={Boolean(error)}
          className={`h-10 w-full min-w-0 rounded-[5px] border bg-white px-3 text-[13px] font-normal text-[#202020] outline-none transition placeholder:text-[#a1a1a1] focus:border-[#e74925] focus:ring-2 focus:ring-[#e74925]/10 ${icon ? "pl-9" : ""} ${error ? "border-[#d14343] bg-[#fffafa]" : "border-[#d8d8d8]"}`}
          {...props}
        />
      </span>
      {error ? <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[#c43d3d]"><AlertCircle size={12} />{error}</span> : hint ? <span className="mt-1 block text-[11px] font-normal text-[#777]">{hint}</span> : null}
    </label>
  );
}

export function SelectField({ label, error, children, className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; children: ReactNode }) {
  return (
    <label className={`block min-w-0 text-[13px] font-semibold text-[#242424] ${className}`}>
      <span className="mb-1.5 block">{label}</span>
      <span className="relative block">
        <select aria-invalid={Boolean(error)} className={`h-10 w-full appearance-none rounded-[5px] border bg-white px-3 pr-9 text-[13px] font-normal outline-none focus:border-[#e74925] focus:ring-2 focus:ring-[#e74925]/10 ${error ? "border-[#d14343]" : "border-[#d8d8d8]"}`} {...props}>{children}</select>
        <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6f6f6f]" />
      </span>
      {error && <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[#c43d3d]"><AlertCircle size={12} />{error}</span>}
    </label>
  );
}

export function TextAreaField({ label, error, counter, className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string; counter?: string }) {
  return (
    <label className={`block min-w-0 text-[13px] font-semibold text-[#242424] ${className}`}>
      <span className="mb-1.5 block">{label}</span>
      <span className="relative block">
        <textarea aria-invalid={Boolean(error)} className={`min-h-24 w-full resize-y rounded-[5px] border bg-white px-3 py-2.5 text-[13px] font-normal leading-5 outline-none focus:border-[#e74925] focus:ring-2 focus:ring-[#e74925]/10 ${error ? "border-[#d14343]" : "border-[#d8d8d8]"}`} {...props} />
        {counter && <span className="absolute bottom-2 right-2 text-[10px] font-normal text-[#999]">{counter}</span>}
      </span>
      {error && <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[#c43d3d]"><AlertCircle size={12} />{error}</span>}
    </label>
  );
}

export function ChoiceCard({ active, title, description, icon, onClick, compact = false }: { active: boolean; title: string; description: string; icon: ReactNode; onClick: () => void; compact?: boolean }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={`relative flex min-w-0 items-start gap-3 rounded-[6px] border text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e74925] ${compact ? "min-h-20 p-3" : "min-h-28 p-4"} ${active ? "border-[#e86445] bg-[#fff8f5] shadow-[0_0_0_1px_rgba(231,73,37,.08)]" : "border-[#dcdcdc] bg-white hover:border-[#b9b9b9] hover:bg-[#fcfcfc]"}`}>
      <span className={`mt-0.5 shrink-0 ${active ? "text-[#e74925]" : "text-[#666]"}`}>{icon}</span>
      <span className="min-w-0 pr-5"><span className="block text-[14px] font-bold leading-5 text-[#202020]">{title}</span><span className="mt-1 block text-[12px] leading-[18px] text-[#666]">{description}</span></span>
      <span className={`absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full border ${active ? "border-[#e74925] bg-[#e74925] text-white" : "border-[#bcbcbc] bg-white"}`}>{active && <Check size={12} strokeWidth={3} />}</span>
    </button>
  );
}

export function UploadBox({ label, description = "PNG, JPG or PDF (Max. 5MB)" }: { label: string; description?: string }) {
  return (
    <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-[6px] border border-dashed border-[#cfcfcf] bg-white px-4 text-center transition hover:border-[#e74925] hover:bg-[#fffaf8]">
      <Upload size={21} className="text-[#686868]" /><span className="mt-2 text-[12px] font-bold text-[#333]">{label}</span><span className="mt-1 text-[10px] text-[#898989]">{description}</span><input type="file" className="sr-only" />
    </label>
  );
}

export function Section({ number, title, description, children }: { number: number; title: string; description?: string; children: ReactNode }) {
  return <section className="border-t border-[#e7e7e7] py-6 first:border-t-0 first:pt-0"><h3 className="text-[15px] font-extrabold text-[#252525]">{number}. {title}</h3>{description && <p className="mt-1 text-[12px] leading-5 text-[#666]">{description}</p>}<div className="mt-4">{children}</div></section>;
}

export function Notice({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "green" | "peach" }) {
  const colors = tone === "green" ? "border-[#dceee2] bg-[#f1faf4] text-[#356c49]" : tone === "peach" ? "border-[#f3dfd8] bg-[#fff7f3] text-[#744d42]" : "border-[#dbe8f8] bg-[#f1f6fd] text-[#385d88]";
  return <div className={`flex items-start gap-2 rounded-[5px] border px-3 py-2.5 text-[11px] leading-5 ${colors}`}><Check size={15} className="mt-0.5 shrink-0" />{children}</div>;
}
