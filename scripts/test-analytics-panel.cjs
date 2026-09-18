// Run: node scripts/test-analytics-panel.cjs. Deferred fetches exercise response races.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const states = [], refs = [], effects = [], requests = [];
let stateCursor = 0, refCursor = 0, mounted = false, checks = 0;
const check = (value, message) => { assert.ok(value, message); checks++; };
const react = {
  ...require('react'),
  useState(initial) {
    const index = stateCursor++;
    if (!(index in states)) states[index] = initial;
    return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
  },
  useRef(initial) { const index = refCursor++; return refs[index] ??= { current: initial }; },
  useEffect(effect) { if (!mounted) effects.push(effect); },
};
function load(file, mocks = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(source, {
    exports, require: name => mocks[name] ?? require(name), AbortController, Error,
    fetch(url, options) { return new Promise((resolve, reject) => requests.push({ url, options, resolve, reject })); },
  });
  return exports;
}
const suite = () => null;
const { AnalyticsPanel } = load('src/components/v2/admin/AdminGrowthPanels.tsx', {
  react,
  './MonoAnalyticsSuite': { MonoAnalyticsSuite: suite },
  '@/lib/analytics/schema': load('src/lib/analytics/schema.ts'),
});
function render() { stateCursor = 0; refCursor = 0; const tree = AnalyticsPanel(); mounted = true; return tree; }
function nodes(node) {
  if (!node || typeof node !== 'object') return [];
  return [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
}
const find = (tree, predicate) => nodes(tree).find(predicate);
const button = tree => find(tree, node => node.type === 'button');
const chart = tree => find(tree, node => node.type === suite);
const alert = tree => find(tree, node => node.props?.role === 'alert');
const flush = () => new Promise(resolve => setImmediate(resolve));
const summary = { dau:1, wau:2, mau:3, sessions24h:1, sessions30d:2, pageViews24h:3, pageViews30d:4, topRoutes:[], topEvents:[], hourly:[], devices:[], referrers:[], funnel:[], daily:[] };
const success = (index, dau = 1) => requests[index].resolve({ ok:true, json:async () => ({ summary: { ...summary, dau }, heatmap:[] }) });
(async () => {
  let tree = render();
  const cleanup = effects[0]();
  check(tree.props['aria-busy'], 'Initial loading state');
  requests[0].reject(new Error('Offline'));
  await flush(); tree = render();
  check(Boolean(alert(tree)), 'Network failure is visible');
  check(!chart(tree), 'No chart after failure');
  check(!tree.props['aria-busy'], 'Loading ends on failure');
  button(tree).props.onClick(); success(1);
  await flush(); tree = render();
  check(chart(tree)?.props.live.dau === 1, 'Retry restores real data');
  check(!alert(tree), 'Retry clears error');
  const apply = button(tree).props.onClick;
  apply(); tree = render();
  check(!chart(tree), 'Refresh immediately hides old metrics');
  requests[2].resolve({ ok:false, json:async () => ({error:'Forbidden'}) });
  await flush(); tree = render();
  check(Boolean(alert(tree)) && !chart(tree), 'HTTP error clears data');
  button(tree).props.onClick();
  requests[3].resolve({ ok:true, json:async () => { throw new SyntaxError('Bad JSON'); } });
  await flush(); tree = render();
  check(Boolean(alert(tree)) && !tree.props['aria-busy'], 'Invalid JSON is recoverable');
  button(tree).props.onClick();
  requests[4].resolve({ ok:true, json:async () => ({ summary:null, heatmap:[] }) });
  await flush(); tree = render();
  check(Boolean(alert(tree)) && !chart(tree), 'Incomplete success is an error');
  button(tree).props.onClick(); success(5);
  await flush(); tree = render();
  const refresh = button(tree).props.onClick;
  refresh(); refresh();
  check(requests[6].options.signal.aborted, 'Superseded request aborted');
  success(7, 7); await flush(); success(6, 6); await flush(); tree = render();
  check(chart(tree)?.props.live.dau === 7, 'Late success cannot overwrite newer data');
  refresh(); refresh(); success(9, 9); await flush();
  requests[8].reject(new Error('Late failure')); await flush(); tree = render();
  check(chart(tree)?.props.live.dau === 9 && !alert(tree), 'Late error cannot erase newer data');
  refresh(); refresh(); success(10, 10); await flush(); tree = render();
  check(tree.props['aria-busy'] && !chart(tree), 'Older finally cannot end latest loading');
  success(11, 11); await flush(); tree = render();
  check(chart(tree)?.props.live.dau === 11, 'Latest result wins');
  find(tree, node => node.type === 'select').props.onChange({target:{value:'/services'}});
  tree = render(); button(tree).props.onClick();
  check(requests[12].url.endsWith('?path=%2Fservices'), 'Selected filter encoded');
  requests[12].reject(new Error('Retry filter')); await flush(); tree = render();
  button(tree).props.onClick();
  check(requests[13].url.endsWith('?path=%2Fservices'), 'Retry preserves filter');
  const before = JSON.stringify(states);
  cleanup(); success(13); await flush();
  check(requests[13].options.signal.aborted, 'Unmount aborts pending request');
  check(JSON.stringify(states) === before, 'Unmount invalidates late updates');
  console.log(`PASS: ${checks} analytics panel checks (mocked hooks/deferred network).`);
})().catch(error => { console.error(error); process.exitCode = 1; });
