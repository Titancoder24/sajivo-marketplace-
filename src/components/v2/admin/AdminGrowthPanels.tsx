"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, ChevronLeft, ChevronRight, Eye, EyeOff, Globe2, KeyRound, Loader2, Plus, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { MonoAnalyticsSuite, type AnalyticsSummary } from "./MonoAnalyticsSuite";
import { analyticsHeatmapSchema, analyticsSummarySchema } from "@/lib/analytics/schema";

type Analytics = { summary: AnalyticsSummary; heatmap: Array<{ path: string; x_bucket: number; y_bucket: number; clicks: number }> };

export function AnalyticsPanel() {
  const [data, setData] = useState<Analytics | null>(null); const [loading, setLoading] = useState(true); const [path, setPath] = useState("");
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const pending = useRef<AbortController | null>(null);
  async function load(target: string) {
    const id = ++requestId.current;
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const response = await fetch(`/api/v2/admin/analytics${target ? `?path=${encodeURIComponent(target)}` : ""}`, { cache: "no-store", signal: controller.signal });
      const payload = await response.json();
      if (!response.ok) throw new Error(typeof payload?.error === "string" ? payload.error : "Analytics could not be loaded.");
      const summary = analyticsSummarySchema.safeParse(payload?.summary);
      const heatmap = analyticsHeatmapSchema.safeParse(payload?.heatmap);
      if (!summary.success || !heatmap.success) throw new Error("Analytics returned incomplete data. Please retry.");
      if (id !== requestId.current) return;
      setData({ summary: summary.data, heatmap: heatmap.data.map((point) => ({ ...point, path: point.path ?? target })) });
    } catch (cause) {
      if (id !== requestId.current || controller.signal.aborted) return;
      setData(null);
      setError(cause instanceof Error ? cause.message : "Analytics could not be loaded. Please retry.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }
  useEffect(() => {
    void load("");
    return () => { requestId.current += 1; pending.current?.abort(); };
  }, []);
  return <div className="space-y-4" aria-busy={loading}>
    {error && <div role="alert" className="border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p>{error}</p><button type="button" onClick={() => void load(path)} className="mt-3 inline-flex items-center gap-2 rounded border border-red-300 px-3 py-2 font-bold"><RefreshCw size={14}/>Retry analytics</button></div>}
    {loading ? <Loading /> : data ? <><div className="flex flex-wrap items-center gap-2"><select aria-label="Heatmap route" value={path} onChange={(event) => setPath(event.target.value)} className="h-9 min-w-0 max-w-full rounded border border-[#d6dcd8] bg-white px-2 text-xs"><option value="">All routes</option>{path && !data.summary.topRoutes.some((route) => route.path === path) && <option value={path}>{path}</option>}{data.summary.topRoutes.map((route) => <option key={route.path} value={route.path}>{route.path}</option>)}</select><button type="button" onClick={() => void load(path)} className="h-9 rounded bg-[#1d2a27] px-3 text-xs font-bold text-white">Apply heatmap filter</button></div><MonoAnalyticsSuite live={data.summary} heatmap={data.heatmap}/></> : null}
  </div>;
}

export type SeoPage = { id: string; state_name: string; city_name: string; service_name: string; route_path: string; title: string; status: string; indexing_allowed: boolean; target_keywords: string[]; published_at: string | null; updated_at: string };

export function SeoPagesTable({ pages, onUpdated, onRefresh, loading = false }: {
  pages: SeoPage[]; onUpdated: (page: SeoPage) => void; onRefresh: () => void; loading?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [pageNumber, setPageNumber] = useState(1);
  const query = search.trim().toLowerCase();
  const filtered = pages.filter((page) => [page.title, page.city_name, page.state_name, page.service_name, page.route_path, page.status].some((value) => value.toLowerCase().includes(query)));
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(pageNumber, totalPages);
  const start = (currentPage - 1) * pageSize;
  const visiblePages = filtered.slice(start, start + pageSize);
  return <section className="border border-[#dce1dd] bg-white">
    <header className="flex items-center justify-between gap-3 border-b border-[#e5e9e6] p-5">
      <div><h2 className="text-sm font-extrabold">SEO pages</h2><p className="mt-1 text-xs text-[#75807a]">{pages.length} pages</p></div>
      <button type="button" onClick={onRefresh} disabled={loading} title="Refresh SEO pages" aria-label="Refresh SEO pages" className="grid size-9 place-items-center border border-[#dce1dd] disabled:opacity-50"><RefreshCw size={16} className={loading ? "animate-spin" : ""}/></button>
    </header>
    <div className="flex flex-wrap items-center gap-3 border-b border-[#e5e9e6] px-5 py-3">
      <label className="relative min-w-0 flex-1">
        <Search size={15} aria-hidden="true" className="absolute left-3 top-3 text-[#75807a]"/>
        <input type="search" aria-label="Search SEO pages" placeholder="Search pages" value={search} onChange={(event) => { setSearch(event.target.value); setPageNumber(1); }} className="h-9 w-full min-w-40 rounded border border-[#d5dcd7] py-2 pl-9 pr-3 text-xs"/>
      </label>
      <label className="flex items-center gap-2 text-xs">Rows per page
        <select aria-label="SEO rows per page" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPageNumber(1); }} className="h-9 rounded border border-[#d5dcd7] bg-white px-2"><option value={25}>25</option><option value={50}>50</option></select>
      </label>
      <span aria-live="polite" className="text-xs text-[#75807a]">{filtered.length ? start + 1 : 0}-{Math.min(start + pageSize, filtered.length)} of {filtered.length}</span>
      <nav aria-label="SEO pagination" className="flex items-center gap-2">
        <button type="button" aria-label="Previous SEO page" title="Previous page" disabled={currentPage === 1} onClick={() => setPageNumber(currentPage - 1)} className="grid size-9 place-items-center rounded border border-[#d5dcd7] disabled:opacity-40"><ChevronLeft size={16}/></button>
        <span className="min-w-16 text-center text-xs">{currentPage} / {totalPages}</span>
        <button type="button" aria-label="Next SEO page" title="Next page" disabled={currentPage === totalPages} onClick={() => setPageNumber(currentPage + 1)} className="grid size-9 place-items-center rounded border border-[#d5dcd7] disabled:opacity-40"><ChevronRight size={16}/></button>
      </nav>
    </div>
    <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs">
      <thead className="bg-[#f7f9f7] text-[#7a8580]"><tr><th className="px-5 py-3">Location / service</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Publication</th></tr></thead>
      <tbody className="divide-y divide-[#edf0ee]">{visiblePages.map((page) => <tr key={page.id}>
        <td className="max-w-96 px-5 py-4"><b>{page.city_name}, {page.state_name}</b><p className="mt-1">{page.service_name}</p><p className="mt-1 break-all text-[10px] text-[#75807a]">{page.route_path}</p></td>
        <td className="px-5 py-4"><span className="font-bold capitalize">{page.status}</span><p className="mt-1 text-[10px]">{page.status === "published" && page.indexing_allowed ? "Indexable" : "Not indexable"}</p></td>
        <td className="px-5 py-4"><SeoPublicationControl page={page} onUpdated={onUpdated}/></td>
      </tr>)}{!filtered.length && <tr><td colSpan={3} className="p-6 text-center text-[#75807a]">{query ? "No matching SEO pages." : "No SEO pages found."}</td></tr>}</tbody>
    </table></div>
  </section>;
}

function SeoPublicationControl({ page, onUpdated }: { page: SeoPage; onUpdated: (page: SeoPage) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const published = page.status === "published";
  async function changeStatus() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/v2/admin/seo", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: page.id, status: published ? "draft" : "published", expectedUpdatedAt: page.updated_at }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.page) throw new Error(payload.error || "Publication could not be saved.");
      onUpdated(payload.page);
      toast.success(published ? "Page unpublished" : "Page published");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Publication failed. Please retry.";
      setError(message); toast.error(message);
    } finally { setBusy(false); }
  }
  return <div className="max-w-80">
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={() => void changeStatus()} disabled={busy} aria-label={`${published ? "Unpublish" : "Publish"} ${page.title}`} className="inline-flex h-9 min-w-28 items-center justify-center gap-2 rounded border border-[#d5dcd7] px-3 font-bold disabled:opacity-50">
        {busy ? <Loader2 size={14} className="animate-spin"/> : published ? <EyeOff size={14}/> : <Globe2 size={14}/>}
        {busy ? "Saving..." : published ? "Unpublish" : "Publish"}
      </button>
      {published && page.indexing_allowed && <Link href={page.route_path} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-[#276b9b]">View<Eye size={13}/></Link>}
    </div>
    {error && <p role="alert" className="mt-2 text-xs text-[#b84e37]">{error}</p>}
  </div>;
}

type HighIntentRoute = {
  keyword?: string;
  phrase?: string;
  routeSlug?: string;
  route_slug?: string;
  slug?: string;
  intent?: string;
  searchIntent?: string;
  search_intent?: string;
  crawlStatus?: string;
  crawl_status?: string;
  status?: string;
  indexable?: boolean;
};
type ApprovedCity = string | {
  name?: string;
  cityName?: string;
  city_name?: string;
  slug?: string;
  citySlug?: string;
  city_slug?: string;
  stateName?: string;
  state_name?: string;
  stateSlug?: string;
  state_slug?: string;
};
type SeoCity = { name: string; slug: string; stateName: string; stateSlug: string };

function slugifySeoValue(value: string) {
  return value.toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function normalizeSeoCity(city: ApprovedCity): SeoCity {
  if (typeof city === "string") return { name: city, slug: slugifySeoValue(city), stateName: "Uttar Pradesh", stateSlug: "uttar-pradesh" };
  const name = city.name || city.cityName || city.city_name || "Lucknow";
  const stateName = city.stateName || city.state_name || "Uttar Pradesh";
  return {
    name,
    slug: city.slug || city.citySlug || city.city_slug || slugifySeoValue(name),
    stateName,
    stateSlug: city.stateSlug || city.state_slug || slugifySeoValue(stateName),
  };
}

function keywordPhrase(route: HighIntentRoute) { return route.keyword || route.phrase || "Untitled keyword"; }
function keywordRouteSlug(route: HighIntentRoute) { return route.routeSlug || route.route_slug || route.slug || slugifySeoValue(keywordPhrase(route)); }
function keywordIntent(route: HighIntentRoute) { return route.intent || route.searchIntent || route.search_intent || "Commercial investigation"; }
export function SeoPanel() {
  const [pages,setPages]=useState<SeoPage[]>([]); const [keywords,setKeywords]=useState(0); const [loading,setLoading]=useState(true); const [creating,setCreating]=useState(false);
  const [highIntentRoutes,setHighIntentRoutes]=useState<HighIntentRoute[]>([]); const [approvedCities,setApprovedCities]=useState<SeoCity[]>([]); const [selectedCitySlug,setSelectedCitySlug]=useState("");
  const [loadError, setLoadError] = useState("");
  async function load() {
    setLoading(true); setLoadError("");
    try {
      const response = await fetch("/api/v2/admin/seo", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "SEO pages could not be loaded");
      const cities = (Array.isArray(payload.approvedCities) ? payload.approvedCities : []).map(normalizeSeoCity);
      setPages(Array.isArray(payload.pages) ? payload.pages : []);
      setKeywords(Number(payload.keywordCount) || 0);
      setHighIntentRoutes(Array.isArray(payload.highIntentRoutes) ? payload.highIntentRoutes : []);
      setApprovedCities(cities);
      setSelectedCitySlug((current) => current || cities[0]?.slug || "");
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : "SEO pages could not be loaded");
    } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setCreating(true);
    try {
      const response = await fetch("/api/v2/admin/seo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stateName: form.get("state"), cityName: form.get("city"), serviceName: form.get("service"), status: form.get("status") }) });
      const payload = await response.json();
      if (!response.ok) {
        if (payload.page) await load();
        throw new Error(payload.error || "Page could not be created");
      }
      toast.success("SEO route created");
      formElement.reset();
      await load();
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Page could not be created"); }
    finally { setCreating(false); }
  }
  if(loading&&!pages.length)return <Loading/>;
  const selectedCity=approvedCities.find((city)=>city.slug===selectedCitySlug)||approvedCities[0];
  const crawlableCount=highIntentRoutes.filter((route)=>pages.some((page)=>page.route_path===`/in/${selectedCity?.stateSlug}/${selectedCity?.slug}/${keywordRouteSlug(route)}`&&page.status==="published"&&page.indexing_allowed)).length;
  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]"><div className="space-y-5">{loadError && <p role="alert" className="text-sm text-[#b84e37]">{loadError}</p>}<p className="text-xs text-[#75807a]">{keywords} managed keyword targets</p><SeoPagesTable pages={pages} loading={loading} onRefresh={() => void load()} onUpdated={(updated) => setPages((current) => current.map((page) => page.id === updated.id ? updated : page))}/><section className="rounded-md border border-[#dce1dd] bg-white"><header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e5e9e6] p-5"><div><h2 className="text-sm font-extrabold">High-intent keyword inventory</h2><p className="mt-1 text-[10px] text-[#75807a]">{highIntentRoutes.length} target routes · {crawlableCount} crawlable · {highIntentRoutes.length-crawlableCount} require attention</p></div><label className="block min-w-52 text-[10px] font-bold">Preview market<select value={selectedCitySlug} onChange={(event)=>setSelectedCitySlug(event.target.value)} disabled={!approvedCities.length} className="mt-1 h-9 w-full rounded border border-[#d5dcd7] bg-white px-3 text-xs disabled:opacity-60">{approvedCities.length?<>{approvedCities.map((city)=><option key={`${city.stateSlug}-${city.slug}`} value={city.slug}>{city.name}, {city.stateName}</option>)}</>:<option>No approved cities</option>}</select></label></header><div className="overflow-x-auto"><table className="w-full min-w-[880px] text-left text-xs"><thead className="bg-[#f7f9f7] text-[10px] uppercase text-[#7a8580]"><tr><th className="px-5 py-3">Keyword phrase</th><th className="px-5 py-3">Route slug</th><th className="px-5 py-3">Intent</th><th className="px-5 py-3">Crawl status</th><th className="px-5 py-3">Selected city</th></tr></thead><tbody className="divide-y divide-[#edf0ee]">{highIntentRoutes.map((route,index)=>{const routePath=selectedCity?`/in/${selectedCity.stateSlug}/${selectedCity.slug}/${keywordRouteSlug(route)}`:"";const crawlable=pages.some((page)=>page.route_path===routePath&&page.status==="published"&&page.indexing_allowed);const crawlStatus=crawlable?"Crawlable":"Not published";const href=crawlable?routePath:"";return <tr key={`${keywordRouteSlug(route)}-${index}`}><td className="px-5 py-4 font-semibold">{keywordPhrase(route)}</td><td className="px-5 py-4 font-mono text-[10px] text-[#64716a]">/{keywordRouteSlug(route)}</td><td className="px-5 py-4">{keywordIntent(route)}</td><td className="px-5 py-4"><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${crawlable?"bg-[#eaf6f0] text-[#2e765b]":"bg-[#fff0eb] text-[#b84e37]"}`}>{crawlStatus}</span></td><td className="px-5 py-4">{href?<Link href={href} target="_blank" className="inline-flex items-center gap-1 font-bold text-[#276b9b]">Open {selectedCity?.name}<Eye size={13}/></Link>:<span className="text-[10px] text-[#8b948f]">Not published</span>}</td></tr>})}{!highIntentRoutes.length&&<tr><td colSpan={5} className="px-5 py-8 text-center text-[#75807a]">No high-intent routes were returned by the SEO API.</td></tr>}</tbody></table></div></section></div><form onSubmit={create} className="h-fit rounded-md border border-[#dce1dd] bg-white p-5"><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded bg-[#edf3ef] text-[#355548]"><Globe2 size={18}/></span><div><h2 className="text-sm font-extrabold">Create local route</h2><p className="mt-0.5 text-[10px] text-[#75807a]">Adds metadata, FAQ schema, sitemap and keywords</p></div></div><div className="mt-5 space-y-3">{[["state","State","Uttar Pradesh"],["city","City","Lucknow"],["service","Service","Interior Designers"]].map(([name,label,placeholder])=><label key={name} className="block text-[10px] font-bold">{label}<input name={name} placeholder={placeholder} required className="mt-1 h-10 w-full rounded border border-[#d5dcd7] px-3 text-xs outline-none"/></label>)}<label className="block text-[10px] font-bold">Publishing<select name="status" className="mt-1 h-10 w-full rounded border border-[#d5dcd7] bg-white px-3 text-xs"><option value="draft">Save as draft</option><option value="published">Publish now</option></select></label></div><button disabled={creating} className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#d65f45] text-xs font-bold text-white shadow-[0_3px_0_#9f3d2b] disabled:opacity-50">{creating?<Loader2 size={15} className="animate-spin"/>:<Plus size={15}/>}Create route</button><p className="mt-4 text-[10px] leading-4 text-[#7b8580]">Publishing creates indexable pages; it does not guarantee search rankings. Quality, authority, crawlability and market competition still matter.</p></form></div>;
}

type Integration={id:string;provider:string;value_hint:string|null;status:string;config:Record<string,unknown>;last_verified_at:string|null;updated_at:string};
const providerLabel:Record<string,string>={openrouter:"OpenRouter · Angel AI",google_analytics:"Google Analytics 4",microsoft_clarity:"Microsoft Clarity",google_search_console:"Google Search Console",razorpay:"Razorpay",resend:"Resend",twilio:"Twilio"};
export function IntegrationsPanel(){const [items,setItems]=useState<Integration[]>([]);const [provider,setProvider]=useState("openrouter");const [secret,setSecret]=useState("");const [saving,setSaving]=useState(false);async function load(){const response=await fetch("/api/v2/admin/integrations",{cache:"no-store"});const payload=await response.json();if(!response.ok)toast.error(payload.error||"Integrations could not be loaded");else setItems(payload.integrations)}useEffect(()=>{void load()},[]);async function save(event:FormEvent){event.preventDefault();setSaving(true);const response=await fetch("/api/v2/admin/integrations",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({provider,secret})});const payload=await response.json();setSaving(false);if(!response.ok)toast.error(payload.error||"Key could not be saved");else{setSecret("");toast.success("Encrypted integration key saved");await load()}}return <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]"><section className="rounded-md border border-[#dce1dd] bg-white"><header className="border-b border-[#e5e9e6] p-5"><h2 className="text-sm font-extrabold">Platform integrations</h2><p className="mt-1 text-[10px] text-[#75807a]">Encrypted provider credentials and operational status</p></header><div className="divide-y divide-[#edf0ee]">{items.map((item)=><div key={item.id} className="flex items-center gap-4 px-5 py-4"><span className="grid h-10 w-10 place-items-center rounded bg-[#edf3ef] text-[#355548]"><KeyRound size={18}/></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold">{providerLabel[item.provider]||item.provider}</p><p className="mt-1 text-[10px] text-[#78827d]">{item.value_hint||"No key configured"} · Updated {new Date(item.updated_at).toLocaleDateString()}</p></div><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${item.status==="configured"?"bg-[#eaf6f0] text-[#2e765b]":"bg-[#eef1ef] text-[#6b7670]"}`}>{item.status.replaceAll("_"," ")}</span></div>)}</div></section><form onSubmit={save} className="h-fit rounded-md border border-[#dce1dd] bg-white p-5"><div className="flex items-start gap-3"><ShieldCheck className="text-emerald-600" size={21}/><div><h2 className="text-sm font-extrabold">Set or rotate a key</h2><p className="mt-1 text-[10px] leading-4 text-[#74807a]">AES-256-GCM encrypted before database storage. Existing secrets are never displayed.</p></div></div><label className="mt-5 block text-[10px] font-bold">Provider<select value={provider} onChange={(event)=>setProvider(event.target.value)} className="mt-1 h-10 w-full rounded border border-[#d5dcd7] bg-white px-3 text-xs">{Object.entries(providerLabel).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label className="mt-3 block text-[10px] font-bold">API key or integration secret<input type="password" autoComplete="new-password" value={secret} onChange={(event)=>setSecret(event.target.value)} required minLength={8} className="mt-1 h-10 w-full rounded border border-[#d5dcd7] px-3 text-xs outline-none"/></label><button disabled={saving||!secret} className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#1d2a27] text-xs font-bold text-white shadow-[0_3px_0_#0c1311] disabled:opacity-50">{saving?<Loader2 className="animate-spin" size={15}/>:<CheckCircle2 size={15}/>}Encrypt and save</button></form></div>}

function Loading(){return <div className="grid min-h-80 place-items-center"><Loader2 className="animate-spin text-[#516159]" size={25}/></div>}
