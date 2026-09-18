"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  FileImage,
  FileText,
  Home,
  Layers3,
  LoaderCircle,
  MapPin,
  MessageSquareText,
  Plus,
  Save,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { budgetOptions, scopeOptions } from "@/lib/constants";
import { services } from "@/lib/demo-data";

const steps = [
  { label: "Scope", description: "Size of project" },
  { label: "Services", description: "What you need" },
  { label: "Details", description: "Project brief" },
  { label: "Budget", description: "Investment range" },
  { label: "Files", description: "Plans & references" },
  { label: "Review", description: "Confirm & publish" },
] as const;

const scopeIcons = [Sparkles, Home, Layers3, Building2, Plus];

const scopeServiceNames: Record<string, string[]> = {
  single_item: ["Modular Kitchen Design", "False Ceiling", "Wall Paneling", "Flooring Installation"],
  single_room: ["Modular Kitchen Design", "False Ceiling", "Wall Paneling", "Flooring Installation", "End-to-End Execution"],
  multi_room: ["Full Home Interior Design", "Modular Kitchen Design", "False Ceiling", "Wall Paneling", "Flooring Installation", "End-to-End Execution"],
  complete_property: ["Full Home Interior Design", "Modular Kitchen Design", "False Ceiling", "Wall Paneling", "Flooring Installation", "End-to-End Execution"],
  custom: services.map((service) => service.name),
};

export function ProjectWizard() {
  const [step, setStep] = useState(0);
  const [selectedScope, setSelectedScope] = useState("");
  const [selectedSubtype, setSelectedSubtype] = useState("");
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [customRequirement, setCustomRequirement] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");
  const [timeline, setTimeline] = useState("");
  const [budget, setBudget] = useState("");
  const [fulfillmentPreference, setFulfillmentPreference] = useState<"independent_professional" | "managed_execution" | "help_me_decide">("help_me_decide");
  const [files, setFiles] = useState<File[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [publishedProjectId, setPublishedProjectId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const progress = Math.round(((step + 1) / steps.length) * 100);
  const selectedScopeTitle = scopeOptions.find((item) => item.id === selectedScope)?.title;
  const selectedScopeOption = scopeOptions.find((item) => item.id === selectedScope) ?? scopeOptions[0];

  function selectScope(scopeId: string) {
    const option = scopeOptions.find((item) => item.id === scopeId) ?? scopeOptions[0];
    setSelectedScope(scopeId);
    setSelectedSubtype(option.subtypes[0]);
    setSelectedRooms(scopeId === "multi_room" ? option.subtypes.slice(0, 2) : []);
    setSelectedServices(scopeServiceNames[scopeId].slice(0, scopeId === "complete_property" ? 3 : 1));
  }

  function validateCurrentStep() {
    if (step === 0 && !selectedScope) {
      toast.error("Choose a project scope to continue");
      return false;
    }
    if (step === 1 && selectedServices.length === 0) {
      toast.error("Select at least one service");
      return false;
    }
    if (step === 1 && selectedScope === "multi_room" && selectedRooms.length < 2) {
      toast.error("Select at least two rooms for a multiple-room project");
      return false;
    }
    if (step === 1 && selectedScope === "custom" && customRequirement.trim().length < 12) {
      toast.error("Describe your custom requirement before continuing");
      return false;
    }
    if (step === 2 && (!title.trim() || description.trim().length < 12 || !city.trim() || timeline.trim().length < 2)) {
      toast.error("Add a title, detailed description, city, and timeline to continue");
      return false;
    }
    if (step === 3 && !budget) {
      toast.error("Choose the closest budget range to continue");
      return false;
    }
    return true;
  }

  async function next() {
    if (!validateCurrentStep()) return;
    if (step === steps.length - 1) {
      setPublishing(true);
      try {
        const response = await fetch("/api/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, description, scopeType: selectedScope, scopeLabel: selectedScopeTitle, scopeSubtype: selectedScope === "multi_room" ? selectedRooms.join(", ") : selectedScope === "custom" ? customRequirement : selectedSubtype, services: selectedServices, city, locality, budgetRange: budget, expectedTimeline: timeline, fulfillmentPreference, fileNames: files.map((file) => file.name), publish: true }) });
        const payload = await response.json();
        if (!response.ok) { toast.error(payload.error ?? "Unable to publish this project"); return; }
        if (files.length) {
          const formData = new FormData();
          files.forEach((file) => formData.append("files", file));
          const uploadResponse = await fetch(`/api/projects/${payload.project.id}/files`, { method: "POST", body: formData });
          const uploadPayload = await uploadResponse.json();
          if (!uploadResponse.ok) {
            toast.warning(uploadPayload.error ?? "Project published, but the attachments could not be uploaded.");
          }
        }
        setPublishedProjectId(payload.project.id);
        toast.success("Project published. Professionals can now send proposals.");
      } catch {
        toast.error("We could not publish the project. Please try again.");
      } finally {
        setPublishing(false);
      }
      return;
    }
    setStep((value) => value + 1);
  }

  if (publishedProjectId) {
    return <section className="grid min-h-[620px] place-items-center rounded-lg border border-[var(--rv-border)] bg-white px-5 py-12"><div className="max-w-2xl text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={32} /></span><p className="mt-6 text-xs font-bold uppercase text-emerald-700">Project successfully published</p><h2 className="font-display mt-2 text-3xl sm:text-4xl">Thank you. Your brief is now live.</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--rv-ink-2)]">Verified interior designers and contractors can review your requirement and send itemised proposals. Every response will appear in your project’s Proposals area, where you can compare pricing, timelines, and deliverables.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><ButtonLink href={`/customer/dashboard/projects/${publishedProjectId}?tab=proposals`}><MessageSquareText size={16} />View proposals</ButtonLink><ButtonLink href="/customer/dashboard/projects" variant="outline">Go to my projects</ButtonLink></div><div className="mt-8 rounded-lg border border-[var(--rv-border)] bg-[var(--rv-bg)] p-4 text-left"><p className="text-sm font-bold">What happens now</p><ol className="mt-3 grid gap-2 text-xs leading-5 text-[var(--rv-ink-2)] sm:grid-cols-3"><li><strong className="text-[var(--rv-ink)]">1. Matching</strong><br />Relevant professionals receive the brief.</li><li><strong className="text-[var(--rv-ink)]">2. Proposals</strong><br />Quotes arrive in this project workspace.</li><li><strong className="text-[var(--rv-ink)]">3. Selection</strong><br />Compare and choose your preferred partner.</li></ol></div></div></section>;
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const incoming = Array.from(fileList);
    const oversized = incoming.find((file) => file.size > 25 * 1024 * 1024);
    if (oversized) {
      toast.error(`${oversized.name} is larger than 25 MB`);
      return;
    }
    if (files.length + incoming.length > 20) {
      toast.error("A project can include up to 20 attachments");
      return;
    }
    setFiles((current) => [...current, ...incoming]);
    toast.success(`${incoming.length} file${incoming.length > 1 ? "s" : ""} added`);
  }

  return (
    <section className="min-w-0 rounded-lg border border-[var(--rv-border)] bg-white [overflow-wrap:anywhere]">
      <div className="grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="min-w-0 border-b border-[var(--rv-border)] bg-[var(--rv-bg)] p-4 lg:border-b-0 lg:border-r lg:p-5">
          <div className="flex items-end justify-between gap-3 lg:block">
            <div><p className="text-xs font-bold uppercase text-[var(--rv-ink-2)]">New project brief</p><p className="mt-1 text-sm font-semibold">Step {step + 1} of {steps.length}</p></div>
            <span className="text-xs font-bold text-[var(--rv-terracotta)]">{progress}%</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white"><motion.div className="h-full rounded-full bg-[var(--rv-terracotta)]" animate={{ width: `${progress}%` }} /></div>
          <ol className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-1 lg:gap-1" aria-label="Project creation progress">
            {steps.map((item, index) => (
              <li key={item.label} className="min-w-0">
                <button
                  type="button"
                  onClick={() => index <= step && setStep(index)}
                  disabled={index > step}
                  aria-current={index === step ? "step" : undefined}
                  className={`rv-focus flex min-h-16 w-full min-w-0 flex-col items-center gap-1 rounded-md px-1 py-2.5 text-center lg:min-h-0 lg:flex-row lg:gap-3 lg:px-3 lg:text-left ${index === step ? "bg-white shadow-sm" : "hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-55"}`}
                >
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${index < step ? "bg-emerald-500 text-white" : index === step ? "bg-[var(--rv-terracotta)] text-white" : "border border-[var(--rv-border)] bg-white text-[var(--rv-ink-2)]"}`}>{index < step ? <Check size={14} /> : index + 1}</span>
                  <span><span className="block text-sm font-semibold">{item.label}</span><span className="hidden text-xs text-[var(--rv-ink-2)] lg:block">{item.description}</span></span>
                </button>
              </li>
            ))}
          </ol>
          <div className="mt-8 hidden rounded-md border border-[var(--rv-border)] bg-white p-3 text-xs leading-5 text-[var(--rv-ink-2)] lg:block"><Save className="mb-2 text-[var(--rv-terracotta)]" size={17} />Nothing is published until you review the brief and confirm the final step.</div>
        </aside>

        <div className="min-w-0">
          <div className="border-b border-[var(--rv-border)] px-4 py-5 sm:px-8">
            <p className="text-xs font-bold uppercase text-[var(--rv-terracotta)]">{steps[step].description}</p>
            <h2 className="font-display mt-1 text-2xl sm:text-3xl">{step === 0 ? "How much are you planning?" : step === 1 ? "Which services do you need?" : step === 2 ? "Tell professionals about the project" : step === 3 ? "What budget are you working with?" : step === 4 ? "Add anything useful for quoting" : "Review your project brief"}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--rv-ink-2)]">{step === 0 ? "Choose the closest option. You can refine rooms and deliverables later." : step === 1 ? "Select every service that should be included in proposals." : step === 2 ? "Clear details help professionals send accurate timelines and estimates." : step === 3 ? "Your range helps match you with the right professionals." : step === 4 ? "Plans and reference photos reduce back-and-forth before a proposal." : "Make sure the essentials are right before publishing to the marketplace."}</p>
          </div>

          <div className="min-h-[460px] p-4 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.16 }}>
                {step === 0 && (
                  <div className="grid gap-3 md:grid-cols-2">
                    {scopeOptions.map((scope, index) => {
                      const Icon = scopeIcons[index];
                      const active = selectedScope === scope.id;
                      return <button type="button" key={scope.id} onClick={() => selectScope(scope.id)} aria-pressed={active} className={`rv-focus group relative min-w-0 overflow-hidden rounded-lg border p-4 text-left transition sm:p-5 ${active ? "border-[var(--rv-terracotta)] bg-[rgba(198,93,71,0.06)] shadow-sm" : "border-[var(--rv-border)] bg-[var(--rv-surface)] hover:border-[var(--rv-ink-2)]"}`}><div className="flex min-w-0 items-start gap-3 sm:gap-4"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-md sm:h-11 sm:w-11 ${active ? "bg-[var(--rv-terracotta)] text-white" : "bg-[var(--rv-bg)] text-[var(--rv-ink)]"}`}><Icon size={20} /></span><div className="min-w-0"><h3 className="font-display break-words text-lg leading-tight sm:text-xl">{scope.title}</h3><p className="mt-1 break-words text-sm leading-6 text-[var(--rv-ink-2)]">{scope.description}</p></div></div>{active && <CheckCircle2 className="absolute right-3 top-3 text-[var(--rv-terracotta)]" size={18} />}</button>;
                    })}
                  </div>
                )}

                {step === 1 && (
                  <div className="grid gap-6">
                    <section className="rounded-lg border border-[var(--rv-border)] bg-[var(--rv-bg)] p-4 sm:p-5"><p className="text-xs font-bold uppercase text-[var(--rv-terracotta)]">Specific choices for {selectedScopeTitle}</p><h3 className="font-display mt-1 text-xl">{selectedScope === "multi_room" ? "Which rooms are included?" : selectedScope === "custom" ? "What makes this project different?" : "Choose the closest requirement"}</h3>{selectedScope === "custom" ? <Textarea value={customRequirement} onChange={(event) => setCustomRequirement(event.target.value)} placeholder="Describe the spaces, products, or work that do not fit a standard scope..." className="mt-4 min-h-28 bg-white" /> : <div className="mt-4 flex flex-wrap gap-2">{selectedScopeOption.subtypes.map((subtype) => { const active = selectedScope === "multi_room" ? selectedRooms.includes(subtype) : selectedSubtype === subtype; return <button type="button" key={subtype} onClick={() => selectedScope === "multi_room" ? setSelectedRooms((current) => active ? current.filter((item) => item !== subtype) : [...current, subtype]) : setSelectedSubtype(subtype)} aria-pressed={active} className={`rv-focus rounded-md border px-3 py-2 text-sm font-semibold ${active ? "border-[var(--rv-terracotta)] bg-white text-[var(--rv-terracotta-dark)] shadow-sm" : "border-[var(--rv-border)] bg-white hover:border-[var(--rv-ink-2)]"}`}>{active && <Check size={13} className="mr-1.5 inline" />}{subtype}</button>; })}</div>}<p className="mt-3 text-xs text-[var(--rv-ink-2)]">The service list below is tailored to this scope. Changing the scope updates both these choices and the recommended services.</p></section>
                    {["Design", "Ceiling", "Wall", "Flooring", "Execution"].map((category) => {
                      const categoryServices = services.filter((service) => service.category === category && scopeServiceNames[selectedScope].includes(service.name));
                      if (!categoryServices.length) return null;
                      return <section key={category}><h3 className="mb-3 text-sm font-bold">{category}</h3><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{categoryServices.map((service) => { const active = selectedServices.includes(service.name); return <button type="button" key={service.id} onClick={() => setSelectedServices((items) => active ? items.filter((item) => item !== service.name) : [...items, service.name])} aria-pressed={active} className={`rv-focus flex min-h-14 items-center gap-3 rounded-md border p-3 text-left text-sm font-semibold ${active ? "border-[var(--rv-terracotta)] bg-[rgba(198,93,71,0.06)]" : "border-[var(--rv-border)] hover:bg-[var(--rv-bg)]"}`}><span className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${active ? "border-[var(--rv-terracotta)] bg-[var(--rv-terracotta)] text-white" : "border-[var(--rv-border)] bg-white"}`}>{active && <Check size={13} />}</span>{service.name}</button>; })}</div></section>;
                    })}
                  </div>
                )}

                {step === 2 && (
                  <div className="grid max-w-3xl gap-5">
                    <div><Label htmlFor="project-title">Project title</Label><Input id="project-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Two-bedroom apartment renovation" /><p className="mt-1.5 text-xs text-[var(--rv-ink-2)]">Keep it specific and easy to scan.</p></div>
                    <div><Label htmlFor="project-description">Project description</Label><Textarea id="project-description" value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-36" /><div className="mt-1.5 flex justify-between text-xs text-[var(--rv-ink-2)]"><span>Include priorities, constraints, and the result you want.</span><span>{description.length}/1000</span></div></div>
                    <div className="grid gap-4 md:grid-cols-2"><div><Label htmlFor="city">City</Label><div className="relative"><MapPin className="pointer-events-none absolute left-3 top-3.5 text-[var(--rv-ink-2)]" size={16} /><Input id="city" className="pl-9" value={city} onChange={(event) => setCity(event.target.value)} /></div></div><div><Label htmlFor="locality">Locality</Label><Input id="locality" value={locality} onChange={(event) => setLocality(event.target.value)} /></div></div>
                    <div><Label htmlFor="timeline">Project completion timeline</Label><Input id="timeline" value={timeline} onChange={(event) => setTimeline(event.target.value)} placeholder="e.g. Complete within 10 weeks after work begins" /><p className="mt-1.5 text-xs text-[var(--rv-ink-2)]">This is the time available to complete the project after execution starts.</p></div>
                    <fieldset><legend className="text-sm font-semibold">How would you like the project delivered?</legend><div className="mt-2 grid gap-2 md:grid-cols-3">{([
                      ["independent_professional", "Marketplace professionals", "Receive proposals from independent verified professionals."],
                      ["managed_execution", "Sajivo Managed Execution", "Request eligibility review by Sajivo's disclosed execution unit."],
                      ["help_me_decide", "Help me decide", "Publish the brief and decide after reviewing the available routes."],
                    ] as const).map(([value, label, detail]) => <button type="button" key={value} onClick={() => setFulfillmentPreference(value)} aria-pressed={fulfillmentPreference === value} className={`rounded-md border p-3 text-left ${fulfillmentPreference === value ? "border-[var(--rv-terracotta)] bg-[rgba(198,93,71,0.06)]" : "border-[var(--rv-border)]"}`}><span className="block text-sm font-bold">{label}</span><span className="mt-1 block text-xs leading-5 text-[var(--rv-ink-2)]">{detail}</span></button>)}</div></fieldset>
                  </div>
                )}

                {step === 3 && (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {budgetOptions.map((option) => { const active = budget === option; return <button type="button" key={option} onClick={() => setBudget(option)} aria-pressed={active} className={`rv-focus relative min-h-24 rounded-lg border p-4 text-left ${active ? "border-[var(--rv-terracotta)] bg-[rgba(198,93,71,0.06)] shadow-sm" : "border-[var(--rv-border)] hover:border-[var(--rv-ink-2)]"}`}><CircleDollarSign className={active ? "text-[var(--rv-terracotta)]" : "text-[var(--rv-ink-2)]"} size={19} /><span className="mt-3 block text-sm font-bold">{option}</span>{active && <CheckCircle2 className="absolute right-3 top-3 text-[var(--rv-terracotta)]" size={18} />}</button>; })}
                  </div>
                )}

                {step === 4 && (
                  <div className="grid grid-cols-1 gap-4">
                    <input ref={fileInput} type="file" multiple className="sr-only" accept=".pdf,.jpg,.jpeg,.png,.dwg" onChange={(event) => addFiles(event.target.files)} />
                    <button type="button" onClick={() => fileInput.current?.click()} className="rv-focus rounded-lg border border-dashed border-[var(--rv-border)] bg-[var(--rv-bg)] p-10 text-center hover:border-[var(--rv-terracotta)]"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-[var(--rv-terracotta)] shadow-sm"><UploadCloud size={23} /></span><h3 className="font-display mt-4 text-xl">Upload plans, photos, or inspiration</h3><p className="mt-2 text-sm text-[var(--rv-ink-2)]">PDF, JPG, PNG or DWG · up to 25 MB each</p><span className="mt-4 inline-flex h-10 items-center rounded-md border border-[var(--rv-border)] bg-white px-4 text-sm font-semibold">Choose files</span></button>
                    {files.length > 0 && <div className="divide-y divide-[var(--rv-border)] rounded-lg border border-[var(--rv-border)]">{files.map((file) => { const key = `${file.name}-${file.lastModified}`; return <div key={key} className="flex items-center gap-3 p-3"><span className="grid h-9 w-9 place-items-center rounded-md bg-[var(--rv-bg)] text-[var(--rv-terracotta)]">{/\.(jpg|jpeg|png)$/i.test(file.name) ? <FileImage size={17} /> : <FileText size={17} />}</span><span className="min-w-0 flex-1 truncate text-sm font-semibold">{file.name}</span><span className="text-xs text-[var(--rv-ink-2)]">{(file.size / 1024 / 1024).toFixed(1)} MB</span><Button variant="ghost" size="icon" aria-label={`Remove ${file.name}`} onClick={() => setFiles((current) => current.filter((item) => `${item.name}-${item.lastModified}` !== key))}><X size={16} /></Button></div>; })}</div>}
                  </div>
                )}

                {step === 5 && (
                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="rounded-lg border border-[var(--rv-border)]"><div className="border-b border-[var(--rv-border)] p-5"><div className="flex items-center gap-2 text-xs font-semibold text-emerald-700"><CheckCircle2 size={15} /> Ready to publish</div><h3 className="font-display mt-2 text-2xl">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--rv-ink-2)]">{description}</p></div><dl className="grid sm:grid-cols-2"><ReviewItem label="Scope" value={selectedScopeTitle ?? "Not selected"} /><ReviewItem label="Specific requirement" value={selectedScope === "multi_room" ? selectedRooms.join(", ") : selectedScope === "custom" ? customRequirement : selectedSubtype} /><ReviewItem label="Location" value={`${locality}, ${city}`} /><ReviewItem label="Budget" value={budget} /><ReviewItem label="Timeline" value={timeline} /><ReviewItem label="Delivery route" value={fulfillmentPreference === "managed_execution" ? "Sajivo Managed Execution" : fulfillmentPreference === "independent_professional" ? "Marketplace professionals" : "Help me decide"} /><ReviewItem label="Files" value={files.length ? `${files.length} attached` : "No files attached"} /><div className="border-t border-[var(--rv-border)] p-5 sm:col-span-2"><dt className="text-xs font-bold uppercase text-[var(--rv-ink-2)]">Services</dt><dd className="mt-2 flex flex-wrap gap-2">{selectedServices.map((service) => <span key={service} className="rounded-full bg-[var(--rv-bg)] px-3 py-1 text-xs font-semibold">{service}</span>)}</dd></div></dl></div>
                    <aside className="rounded-lg bg-[var(--rv-slate)] p-5 text-white"><ClipboardCheck size={22} /><h3 className="font-display mt-4 text-xl">What happens next?</h3><ol className="mt-4 grid gap-4 text-sm text-white/75"><li className="flex gap-3"><span className="font-bold text-white">1</span>Verified professionals review your brief.</li><li className="flex gap-3"><span className="font-bold text-white">2</span>You receive itemised proposals.</li><li className="flex gap-3"><span className="font-bold text-white">3</span>Compare, discuss, and select the best fit.</li></ol></aside>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <footer className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-[var(--rv-border)] bg-white/95 px-4 py-4 backdrop-blur sm:px-8">
            <Button variant="outline" aria-label="Back" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}><ArrowLeft size={16} /><span className="hidden sm:inline">Back</span></Button>
            <Button onClick={next} disabled={publishing}>{publishing ? <LoaderCircle className="animate-spin" size={16} /> : step === steps.length - 1 ? <><span>Publish project</span><CheckCircle2 size={16} /></> : <><span>Continue</span><ArrowRight size={16} /></>}</Button>
          </footer>
        </div>
      </div>
    </section>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return <div className="border-t border-[var(--rv-border)] p-5 even:sm:border-l"><dt className="text-xs font-bold uppercase text-[var(--rv-ink-2)]">{label}</dt><dd className="mt-1.5 text-sm font-semibold">{value}</dd></div>;
}
