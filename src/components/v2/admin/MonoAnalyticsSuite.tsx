"use client";

import { analyticsHeatmapSchema, analyticsSummarySchema, type AnalyticsSummary } from "@/lib/analytics/schema";
export type { AnalyticsSummary } from "@/lib/analytics/schema";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Funnel, FunnelChart,
  Legend, Line, LineChart, Pie, PieChart, PolarAngleAxis, PolarGrid, Radar, RadarChart,
  RadialBar, RadialBarChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, Treemap, XAxis, YAxis,
} from "recharts";

const colors = ["#f07a5c", "#ffffff", "#aeb8b3", "#78968a", "#d9a648", "#7793ad"];
const axis = { fontSize: 9, fill: "#8f9994" };

export function MonoAnalyticsSuite({ live, heatmap }: { live: AnalyticsSummary; heatmap: Array<{ x_bucket: number; y_bucket: number; clicks: number }> }) {
  const summaryResult = analyticsSummarySchema.safeParse(live);
  const heatmapResult = analyticsHeatmapSchema.safeParse(heatmap);
  if (!summaryResult.success || !heatmapResult.success) {
    return <p role="alert" className="p-4 text-sm">Analytics is unavailable: the Supabase response is incomplete. Reload to retry.</p>;
  }
  const data = summaryResult.data;
  const routeData = data.topRoutes.slice(0, 7).map((item) => ({ ...item, route: item.path.replace(/^\/v2\/?/, "") || "home" }));
  const radarData = data.topEvents.slice(0, 6).map((item) => ({ subject: item.name.replaceAll("_", " "), value: item.value }));
  const visitors = data.funnel[0]?.value ?? 0;
  const conversion = data.funnel.map((item) => ({ ...item, rate: visitors > 0 ? Math.round((item.value / visitors) * 100) : null }));
  const buckets = Array.from({length:100},(_,i)=> {
    const x=i%10,y=Math.floor(i/10);
    return {x,y,clicks:heatmap.filter((p)=>p.x_bucket===x&&p.y_bucket===y).reduce((s,p)=>s+p.clicks,0)};
  });
  const maximum = Math.max(1, ...buckets.map((point) => point.clicks));
  const heatCells = buckets.map((point) => ({ ...point, opacity: point.clicks / maximum }));
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#39443f] px-4 py-3"><p className="text-xs font-extrabold">Product analytics</p><span className="text-[10px] font-bold">Supabase snapshot · Last 30 days</span></div>
    {data.sessions30d === 0 && <p role="status" className="px-4 text-sm">No analytics events recorded in the last 30 days.</p>}
    <section className="grid gap-3 sm:grid-cols-3">{[["DAU",data.dau],["WAU",data.wau],["MAU",data.mau]].map(([label,value])=><article key={label} className="rounded-md bg-[#181818] p-5 text-white"><p className="text-[10px] font-bold uppercase text-white/45">Signed-in active users</p><div className="mt-2 flex items-end justify-between"><b className="text-3xl tabular-nums">{value}</b><span className="text-xs font-bold text-[#f07a5c]">{label}</span></div><MiniLine data={data.daily.map((d)=>d.active_users)}/></article>)}</section>
    <section className="grid gap-4 xl:grid-cols-2">
      <Frame empty={!data.daily.some((d) => d.views > 0)} title="Audience pulse" metric={`${data.pageViews30d.toLocaleString()} views`} caption="Area · 30-day activity"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.daily}><defs><linearGradient id="views" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f07a5c" stopOpacity={.8}/><stop offset="1" stopColor="#f07a5c" stopOpacity={.04}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#ffffff12"/><XAxis dataKey="day" tick={axis} axisLine={false} tickLine={false}/><YAxis tick={axis} axisLine={false} tickLine={false}/><Tooltip/><Area type="monotone" dataKey="views" stroke="#f07a5c" fill="url(#views)" strokeWidth={2}/></AreaChart></ResponsiveContainer></Frame>
      <Frame empty={!data.daily.some((d) => d.sessions > 0)} title="Session velocity" metric={`${data.sessions30d.toLocaleString()} sessions`} caption="Line · users and sessions"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.daily}><CartesianGrid vertical={false} stroke="#ffffff12"/><XAxis dataKey="day" tick={axis} axisLine={false}/><YAxis tick={axis} axisLine={false}/><Tooltip/><Legend/><Line type="monotone" dataKey="sessions" stroke="#fff" dot={false} strokeWidth={2}/><Line type="monotone" dataKey="active_users" name="active users" stroke="#f07a5c" dot={false} strokeWidth={2}/></LineChart></ResponsiveContainer></Frame>
      <Frame empty={!routeData.some((d) => d.views > 0)} title="Top product routes" metric={`${routeData.length} modules`} caption="Rounded bars · route adoption"><ResponsiveContainer width="100%" height="100%"><BarChart data={routeData} layout="vertical" margin={{left:10}}><XAxis type="number" hide/><YAxis type="category" dataKey="route" width={90} tick={axis} axisLine={false} tickLine={false}/><Tooltip/><Bar dataKey="views" fill="#f07a5c" radius={[0,8,8,0]}/></BarChart></ResponsiveContainer></Frame>
      <Frame empty={!data.topEvents.some((d) => d.value > 0)} title="Event mix" metric={`${data.topEvents.reduce((s,e)=>s+e.value,0).toLocaleString()} events`} caption="Donut · interaction distribution"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.topEvents.slice(0,6)} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={3}>{data.topEvents.slice(0,6).map((_,i)=><Cell key={i} fill={colors[i%colors.length]}/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer></Frame>
      <Frame empty={!conversion.some((d) => d.value > 0)} title="Marketplace funnel" metric={conversion.at(-1)?.rate != null ? `${conversion.at(-1)!.rate}% recorded end rate` : "Rate unavailable"} caption="Recorded event sessions · not a cohort conversion"><ResponsiveContainer width="100%" height="100%"><FunnelChart><Tooltip/><Funnel dataKey="value" data={conversion} isAnimationActive fill="#f07a5c"/></FunnelChart></ResponsiveContainer></Frame>
      <Frame empty={!radarData.some((d) => d.value > 0)} title="Feature intensity" metric="Module usage" caption="Radar · tracked actions"><ResponsiveContainer width="100%" height="100%"><RadarChart data={radarData}><PolarGrid stroke="#ffffff22"/><PolarAngleAxis dataKey="subject" tick={axis}/><Radar dataKey="value" stroke="#f07a5c" fill="#f07a5c" fillOpacity={.48}/><Tooltip/></RadarChart></ResponsiveContainer></Frame>
      <Frame empty={!data.devices.some((d) => d.value > 0)} title="Device reach" metric={data.devices[0]?.name ?? "No device data"} caption="Radial · viewport classes"><ResponsiveContainer width="100%" height="100%"><RadialBarChart data={data.devices} innerRadius="24%" outerRadius="95%" startAngle={180} endAngle={0}><RadialBar dataKey="value" fill="#f07a5c" background={{fill:"#ffffff10"}} cornerRadius={8}/><Tooltip/><Legend/></RadialBarChart></ResponsiveContainer></Frame>
      <Frame empty={!routeData.some((d) => d.views > 0)} title="Route efficiency" metric="Views vs sessions" caption="Scatter · content engagement"><ResponsiveContainer width="100%" height="100%"><ScatterChart><CartesianGrid stroke="#ffffff12"/><XAxis dataKey="sessions" name="sessions" tick={axis}/><YAxis dataKey="views" name="views" tick={axis}/><Tooltip cursor={{strokeDasharray:"3 3"}}/><Scatter data={routeData} fill="#f07a5c"/></ScatterChart></ResponsiveContainer></Frame>
      <Frame empty={!data.referrers.some((d) => d.value > 0)} title="Traffic sources" metric={`${data.referrers.length} sources`} caption="Treemap · acquisition share"><ResponsiveContainer width="100%" height="100%"><Treemap data={data.referrers} dataKey="value" nameKey="name" stroke="#181818" fill="#78968a" aspectRatio={4/3}/></ResponsiveContainer></Frame>
      <Frame empty={!data.hourly.some((d) => d.events > 0)} title="Hourly demand" metric="24-hour cycle" caption="Composed · events and sessions"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={data.hourly}><CartesianGrid vertical={false} stroke="#ffffff12"/><XAxis dataKey="hour" tick={axis}/><YAxis tick={axis}/><Tooltip/><Bar dataKey="events" fill="#ffffff33" radius={[6,6,0,0]}/><Line dataKey="sessions" stroke="#f07a5c" dot={false} strokeWidth={2}/></ComposedChart></ResponsiveContainer></Frame>
      <Frame empty={visitors === 0} title="Conversion curve" metric={conversion.length ? `${conversion.at(-1)!.value} recorded project sessions` : "No funnel data"} caption="Recorded event sessions as % of visitor sessions"><ResponsiveContainer width="100%" height="100%"><LineChart data={conversion}><CartesianGrid vertical={false} stroke="#ffffff12"/><XAxis dataKey="name" tick={axis}/><YAxis domain={[0,100]} tick={axis}/><Tooltip/><Line type="stepAfter" dataKey="rate" stroke="#f07a5c" strokeWidth={3} dot={{fill:"#fff"}}/></LineChart></ResponsiveContainer></Frame>
      <Frame empty={!heatmap.some((d) => d.clicks > 0)} title="Interaction heatmap" metric={`${heatmap.reduce((s,p)=>s+p.clicks,0)} recorded clicks`} caption="Matrix · normalized click positions"><div className="grid h-full grid-cols-10 gap-1 rounded-md bg-[#111] p-2">{heatCells.map((cell)=><div key={`${cell.x}-${cell.y}`} title={`${cell.clicks} clicks`} className="rounded-sm" style={{backgroundColor:`rgba(240,122,92,${.06+cell.opacity*.94})`}}/>)}</div></Frame>
    </section>
  </div>;
}

function Frame({title,metric,caption,children,empty}:{title:string;metric:string;caption:string;children:React.ReactNode;empty:boolean}) { return <article className="flex h-[300px] flex-col rounded-md bg-[#181818] p-5 text-white"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase text-white/45">{title}</p><p className="mt-1 break-words text-lg font-extrabold">{metric}</p></div><span className="rounded-full border border-white/15 px-2 py-1 text-[9px] text-white/55">Mono</span></div><div className="mt-4 min-h-0 flex-1">{empty ? <p role="status" className="grid h-full place-items-center text-xs text-white/55">No recorded data in this period.</p> : children}</div><p className="mt-3 border-t border-white/10 pt-2 text-[10px] text-white/45">{caption}</p></article> }

function MiniLine({data}:{data:number[]}) { if (!data.length) return <p className="mt-4 text-xs text-white/55">No daily activity recorded.</p>; const points=data; return <div className="mt-4 h-10"><ResponsiveContainer width="100%" height="100%"><LineChart data={points.map((value,index)=>({index,value}))}><Line dataKey="value" stroke="#f07a5c" dot={false} strokeWidth={2} isAnimationActive/></LineChart></ResponsiveContainer></div>; }
