"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Funnel, FunnelChart,
  Legend, Line, LineChart, Pie, PieChart, PolarAngleAxis, PolarGrid, Radar, RadarChart,
  RadialBar, RadialBarChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, Treemap, XAxis, YAxis,
} from "recharts";

export type AnalyticsSummary = {
  dau: number; wau: number; mau: number; sessions24h: number; sessions30d: number; pageViews24h: number; pageViews30d: number;
  topRoutes: Array<{ path: string; views: number; sessions: number }>;
  topEvents: Array<{ name: string; value: number }>;
  hourly: Array<{ hour: number; events: number; sessions: number }>;
  devices: Array<{ name: string; value: number }>;
  referrers: Array<{ name: string; value: number }>;
  funnel: Array<{ name: string; value: number }>;
  daily: Array<{ day: string; views: number; sessions: number; active_users: number }>;
};

const demo: AnalyticsSummary = {
  dau: 184, wau: 892, mau: 3240, sessions24h: 326, sessions30d: 6910, pageViews24h: 874, pageViews30d: 18420,
  daily: Array.from({ length: 14 }, (_, i) => ({ day: `D${i + 1}`, views: 390 + ((i * 83) % 420), sessions: 170 + ((i * 47) % 230), active_users: 95 + ((i * 31) % 145) })),
  topRoutes: [{path:"/v2",views:2840,sessions:1100},{path:"/professionals",views:2210,sessions:940},{path:"/v2/projects",views:1760,sessions:710},{path:"/services",views:1390,sessions:610},{path:"/v2/support",views:980,sessions:420}],
  topEvents: [{name:"page_view",value:18420},{name:"ui_click",value:11280},{name:"angel_opened",value:1380},{name:"signup_started",value:920},{name:"project_created",value:308}],
  hourly: Array.from({length:12},(_,i)=>({hour:i*2,events:120+((i*97)%520),sessions:55+((i*43)%230)})),
  devices: [{name:"Mobile",value:62},{name:"Desktop",value:31},{name:"Tablet",value:7}],
  referrers: [{name:"Direct",value:42},{name:"Google",value:31},{name:"Instagram",value:14},{name:"LinkedIn",value:8},{name:"Other",value:5}],
  funnel: [{name:"Visitors",value:6910},{name:"Signup started",value:920},{name:"Signup complete",value:650},{name:"Requirements",value:410},{name:"Projects",value:308}],
};

const colors = ["#f07a5c", "#ffffff", "#aeb8b3", "#78968a", "#d9a648", "#7793ad"];
const axis = { fontSize: 9, fill: "#8f9994" };

export function MonoAnalyticsSuite({ live, heatmap }: { live: AnalyticsSummary; heatmap: Array<{ x_bucket: number; y_bucket: number; clicks: number }> }) {
  const [preview, setPreview] = useState(true);
  useEffect(() => { const timer = window.setTimeout(() => setPreview(false), 15000); return () => window.clearTimeout(timer); }, []);
  const normalizedLive: AnalyticsSummary = { ...demo, ...live, topRoutes: live.topRoutes || [], topEvents: live.topEvents || [], hourly: live.hourly || [], devices: live.devices || [], referrers: live.referrers || [], funnel: live.funnel || [], daily: live.daily || [] };
  const data = preview ? demo : normalizedLive;
  const routeData = data.topRoutes.slice(0, 7).map((item) => ({ ...item, route: item.path.replace(/^\/v2\/?/, "") || "home" }));
  const radarData = data.topEvents.slice(0, 6).map((item) => ({ subject: item.name.replaceAll("_", " "), value: item.value }));
  const conversion = data.funnel.map((item, index) => ({ ...item, rate: index ? Math.round((item.value / Math.max(1, data.funnel[0]?.value || 1)) * 100) : 100 }));
  const heatCells = useMemo(() => {
    const source = preview ? Array.from({length:49},(_,i)=>({x_bucket:i%7,y_bucket:Math.floor(i/7),clicks:(i*37)%100})) : heatmap;
    const maximum = Math.max(1, ...source.map((point) => point.clicks));
    return Array.from({length:100},(_,i)=>{const x=i%10,y=Math.floor(i/10);const clicks=source.filter((p)=>p.x_bucket===x&&p.y_bucket===y).reduce((s,p)=>s+p.clicks,0);return {x,y,clicks,opacity:clicks/maximum};});
  }, [heatmap, preview]);
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#39443f] bg-[#17211d] px-4 py-3 text-white"><div><p className="text-xs font-extrabold">Mono Charts analytics studio</p><p className="mt-1 text-[10px] text-white/55">15 operational views backed by privacy-safe Supabase events</p></div><span className={`rounded-full px-3 py-1 text-[10px] font-bold ${preview?"bg-[#f07a5c] text-white":"bg-emerald-300 text-[#14201b]"}`}>{preview?"Animated preview · live data in 15s":"Live Supabase data"}</span></div>
    <section className="grid gap-3 sm:grid-cols-3">{[["DAU",data.dau],["WAU",data.wau],["MAU",data.mau]].map(([label,value])=><article key={label} className="rounded-md bg-[#181818] p-5 text-white"><p className="text-[10px] font-bold uppercase text-white/45">Active users</p><div className="mt-2 flex items-end justify-between"><b className="text-3xl tabular-nums">{value}</b><span className="text-xs font-bold text-[#f07a5c]">{label}</span></div><MiniLine data={data.daily.map((d)=>d.active_users)}/></article>)}</section>
    <section className="grid gap-4 xl:grid-cols-2">
      <Frame title="Audience pulse" metric={`${data.pageViews30d.toLocaleString()} views`} caption="Area · 30-day activity"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.daily}><defs><linearGradient id="views" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f07a5c" stopOpacity={.8}/><stop offset="1" stopColor="#f07a5c" stopOpacity={.04}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#ffffff12"/><XAxis dataKey="day" tick={axis} axisLine={false} tickLine={false}/><YAxis tick={axis} axisLine={false} tickLine={false}/><Tooltip/><Area type="monotone" dataKey="views" stroke="#f07a5c" fill="url(#views)" strokeWidth={2}/></AreaChart></ResponsiveContainer></Frame>
      <Frame title="Session velocity" metric={`${data.sessions30d.toLocaleString()} sessions`} caption="Line · users and sessions"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.daily}><CartesianGrid vertical={false} stroke="#ffffff12"/><XAxis dataKey="day" tick={axis} axisLine={false}/><YAxis tick={axis} axisLine={false}/><Tooltip/><Legend/><Line type="monotone" dataKey="sessions" stroke="#fff" dot={false} strokeWidth={2}/><Line type="monotone" dataKey="active_users" name="active users" stroke="#f07a5c" dot={false} strokeWidth={2}/></LineChart></ResponsiveContainer></Frame>
      <Frame title="Top product routes" metric={`${routeData.length} modules`} caption="Rounded bars · route adoption"><ResponsiveContainer width="100%" height="100%"><BarChart data={routeData} layout="vertical" margin={{left:10}}><XAxis type="number" hide/><YAxis type="category" dataKey="route" width={90} tick={axis} axisLine={false} tickLine={false}/><Tooltip/><Bar dataKey="views" fill="#f07a5c" radius={[0,8,8,0]}/></BarChart></ResponsiveContainer></Frame>
      <Frame title="Event mix" metric={`${data.topEvents.reduce((s,e)=>s+e.value,0).toLocaleString()} events`} caption="Donut · interaction distribution"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.topEvents.slice(0,6)} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={3}>{data.topEvents.slice(0,6).map((_,i)=><Cell key={i} fill={colors[i%colors.length]}/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer></Frame>
      <Frame title="Marketplace funnel" metric={`${conversion.at(-1)?.rate || 0}% end rate`} caption="Funnel · visitor to project"><ResponsiveContainer width="100%" height="100%"><FunnelChart><Tooltip/><Funnel dataKey="value" data={conversion} isAnimationActive fill="#f07a5c"/></FunnelChart></ResponsiveContainer></Frame>
      <Frame title="Feature intensity" metric="Module usage" caption="Radar · tracked actions"><ResponsiveContainer width="100%" height="100%"><RadarChart data={radarData}><PolarGrid stroke="#ffffff22"/><PolarAngleAxis dataKey="subject" tick={axis}/><Radar dataKey="value" stroke="#f07a5c" fill="#f07a5c" fillOpacity={.48}/><Tooltip/></RadarChart></ResponsiveContainer></Frame>
      <Frame title="Device reach" metric={`${data.devices[0]?.name || "No data"} first`} caption="Radial · viewport classes"><ResponsiveContainer width="100%" height="100%"><RadialBarChart data={data.devices} innerRadius="24%" outerRadius="95%" startAngle={180} endAngle={0}><RadialBar dataKey="value" fill="#f07a5c" background={{fill:"#ffffff10"}} cornerRadius={8}/><Tooltip/><Legend/></RadialBarChart></ResponsiveContainer></Frame>
      <Frame title="Route efficiency" metric="Views vs sessions" caption="Scatter · content engagement"><ResponsiveContainer width="100%" height="100%"><ScatterChart><CartesianGrid stroke="#ffffff12"/><XAxis dataKey="sessions" name="sessions" tick={axis}/><YAxis dataKey="views" name="views" tick={axis}/><Tooltip cursor={{strokeDasharray:"3 3"}}/><Scatter data={routeData} fill="#f07a5c"/></ScatterChart></ResponsiveContainer></Frame>
      <Frame title="Traffic sources" metric={`${data.referrers.length} sources`} caption="Treemap · acquisition share"><ResponsiveContainer width="100%" height="100%"><Treemap data={data.referrers} dataKey="value" nameKey="name" stroke="#181818" fill="#78968a" aspectRatio={4/3}/></ResponsiveContainer></Frame>
      <Frame title="Hourly demand" metric="24-hour cycle" caption="Composed · events and sessions"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={data.hourly}><CartesianGrid vertical={false} stroke="#ffffff12"/><XAxis dataKey="hour" tick={axis}/><YAxis tick={axis}/><Tooltip/><Bar dataKey="events" fill="#ffffff33" radius={[6,6,0,0]}/><Line dataKey="sessions" stroke="#f07a5c" dot={false} strokeWidth={2}/></ComposedChart></ResponsiveContainer></Frame>
      <Frame title="Conversion curve" metric={`${conversion.at(-1)?.value || 0} projects`} caption="Step line · lifecycle conversion"><ResponsiveContainer width="100%" height="100%"><LineChart data={conversion}><CartesianGrid vertical={false} stroke="#ffffff12"/><XAxis dataKey="name" tick={axis}/><YAxis domain={[0,100]} tick={axis}/><Tooltip/><Line type="stepAfter" dataKey="rate" stroke="#f07a5c" strokeWidth={3} dot={{fill:"#fff"}}/></LineChart></ResponsiveContainer></Frame>
      <Frame title="Interaction heatmap" metric={`${heatmap.reduce((s,p)=>s+p.clicks,0)} live clicks`} caption="Matrix · normalized click positions"><div className="grid h-full grid-cols-10 gap-1 rounded-md bg-[#111] p-2">{heatCells.map((cell)=><div key={`${cell.x}-${cell.y}`} title={`${cell.clicks} clicks`} className="rounded-sm" style={{backgroundColor:`rgba(240,122,92,${.06+cell.opacity*.94})`}}/>)}</div></Frame>
    </section>
  </div>;
}

function Frame({title,metric,caption,children}:{title:string;metric:string;caption:string;children:React.ReactNode}) { return <article className="flex h-[300px] flex-col rounded-md bg-[#181818] p-5 text-white"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase text-white/45">{title}</p><p className="mt-1 text-xl font-extrabold">{metric}</p></div><span className="rounded-full border border-white/15 px-2 py-1 text-[9px] text-white/55">Mono</span></div><div className="mt-4 min-h-0 flex-1">{children}</div><p className="mt-3 border-t border-white/10 pt-2 text-[10px] text-white/45">{caption}</p></article> }

function MiniLine({data}:{data:number[]}) { const points=data.length?data:[0,0]; return <div className="mt-4 h-10"><ResponsiveContainer width="100%" height="100%"><LineChart data={points.map((value,index)=>({index,value}))}><Line dataKey="value" stroke="#f07a5c" dot={false} strokeWidth={2} isAnimationActive/></LineChart></ResponsiveContainer></div>; }
