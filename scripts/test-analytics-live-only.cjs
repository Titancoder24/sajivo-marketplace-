// Run: node scripts/test-analytics-live-only.cjs. Mocked Supabase/browser; no live writes.
process.chdir(require('node:path').resolve(__dirname, '..'));
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { exports, require: (name) => mocks[name] ?? (name.startsWith('@/') ? load('src/' + name.slice(2) + '.ts') : require(name)), Request, Response, URL, Blob, console, ...globals }, { filename: file });
  return exports;
}
const schema = load('src/lib/analytics/schema.ts');
const empty = { dau:0, wau:0, mau:0, sessions24h:0, sessions30d:0, pageViews24h:0, pageViews30d:0, topRoutes:[], topEvents:[], hourly:[], devices:[], referrers:[], funnel:[], daily:[] };
let checks = 0;
function check(ok) { assert.ok(ok); checks++; }
(async () => {
  check(schema.analyticsSummarySchema.safeParse(empty).success);
  for (const bad of [null, {}, {...empty,wau:undefined}, {...empty,dau:-1}, {...empty,devices:null}]) check(!schema.analyticsSummarySchema.safeParse(bad).success);
  check(!schema.analyticsHeatmapSchema.safeParse([{ x_bucket:10,y_bucket:0,clicks:1 }]).success);
  const React = require('react');
  const {renderToStaticMarkup} = require('react-dom/server');
  const {MonoAnalyticsSuite} = load('src/components/v2/admin/MonoAnalyticsSuite.tsx', { '@/lib/analytics/schema': schema });
  const render = (live, heatmap=[]) => renderToStaticMarkup(React.createElement(MonoAnalyticsSuite,{live,heatmap}));
  const zeroHtml = render({...empty, funnel:[{name:'Visitors',value:0},{name:'Projects',value:0}]});
  check(zeroHtml.includes('No analytics events recorded'));
  check((zeroHtml.match(/No recorded data in this period/g)||[]).length === 12);
  check(zeroHtml.includes('Rate unavailable'));
  check(!/Animated preview|18420|18,420|100%/.test(zeroHtml));
  check(render(null).includes('role="alert"'));
  check(render({...empty,wau:undefined}).includes('role="alert"'));
  const html = render({...empty,dau:3,wau:5,mau:8,sessions30d:2,pageViews30d:17});
  check(html.includes('17 views') && !html.includes('No analytics events recorded'));
  const heatHtml=render(empty,[{x_bucket:1,y_bucket:1,clicks:4},{x_bucket:1,y_bucket:1,clicks:6},{x_bucket:2,y_bucket:2,clicks:5}]);
  check(heatHtml.includes('15 recorded clicks') && heatHtml.includes('title="10 clicks"'));
  let responseSummary=empty, responseHeat=[], rpcError=null, denied=false, thrown=false, calls=[];
  const route = load('src/app/api/v2/admin/analytics/route.ts',{
    '@/lib/analytics/schema':schema,
    '@/lib/server/angel':{getPlatformAdmin:async(role)=>{check(role==='analyst');if(thrown)throw Error('offline');return denied?null:{supabase:{rpc:async(name,args)=>{calls.push([name,args]);return {data:name==='admin_analytics_summary'?responseSummary:responseHeat,error:rpcError};}}};}}
  });
  let res=await route.GET(new Request('http://localhost/api?path=%2Fservices'));
  check(res.status===200 && res.headers.get('cache-control')==='private, no-store');
  check(calls[1][1].target_path==='/services');
  check((await res.json()).summary.dau===0);
  responseSummary={...empty,wau:undefined}; check((await route.GET(new Request('http://localhost'))).status===502);
  responseSummary=empty; responseHeat=null; check((await route.GET(new Request('http://localhost'))).status===502);
  responseHeat=[]; rpcError={message:'db down'}; check((await route.GET(new Request('http://localhost'))).status===503);
  rpcError=null; denied=true; check((await route.GET(new Request('http://localhost'))).status===403);
  denied=false; thrown=true; check((await route.GET(new Request('http://localhost'))).status===503);
  let inserted=[], insertError=null, authError=null, configured=true;
  const events=load('src/app/api/v2/analytics/events/route.ts',{'@/lib/supabase/server':{createClient:async()=>configured?{auth:{getUser:async()=>({data:{user:null},error:authError})},from:()=>({insert:async(event)=>{inserted.push(event);return {error:insertError};}})}:null}});
  const base={sessionId:'a74eb160-ecf6-4c1e-bba7-08c7e903602a',eventName:'ui_click',path:'/services',viewportHeight:200};
  const post=(event)=>events.POST(new Request('http://localhost',{method:'POST',body:JSON.stringify(event)}));
  check((await post(base)).status===201 && inserted.length===1);
  for(const metadata of [{x_pct:'bad',y_pct:.5},{x_pct:2,y_pct:0},{x_pct:.5},{x_pct:null,y_pct:null}]) check((await post({...base,metadata})).status===400);
  check(inserted.length===1);
  check((await post({...base,metadata:{x_pct:.3,y_pct:.7}})).status===201);
  authError={name:'AuthSessionMissingError'};check((await post(base)).status===201);
  authError={name:'AuthRetryableFetchError'};check((await post(base)).status===503);
  authError=null;insertError={message:'offline'};check((await post(base)).status===503);
  configured=false;check((await post(base)).status===503);
  const effects=[], payloads=[], ref={current:null};let click;
  class Element {closest(){return this} tagName='BUTTON';getAttribute(){return null}}
  const tracker=load('src/components/analytics/ProductAnalytics.tsx',{
    react:{useEffect:fn=>effects.push(fn),useRef:()=>ref},'next/navigation':{usePathname:()=>'/services'}
  },{
    window:{sessionStorage:{getItem(){throw Error('blocked')}},innerWidth:1000,innerHeight:800,location:{pathname:'/services'}},
    document:{referrer:'',addEventListener:(name,fn)=>{click=fn},removeEventListener:()=>{}},
    navigator:{sendBeacon:()=>false},crypto:require('node:crypto').webcrypto,Element,
    fetch:async(url,options)=>{payloads.push(JSON.parse(options.body));return new Response()}
  });
  tracker.ProductAnalytics();effects[0]();effects[0]();effects[1]();
  check(payloads.length===1);
  click({target:new Element(),isTrusted:false,detail:1}); check(payloads.length===1);
  click({target:new Element(),isTrusted:true,detail:0});check(!('x_pct' in payloads[1].metadata));
  click({target:new Element(),isTrusted:true,detail:1,clientX:500,clientY:400});check(payloads[2].metadata.x_pct===.5 && payloads[2].metadata.y_pct===.5);
  check(payloads.every(p=>p.sessionId===payloads[0].sessionId));
  console.log(`PASS: ${checks} analytics checks (mocked Supabase/browser).`);
})().catch(error=>{console.error(error);process.exitCode=1});
