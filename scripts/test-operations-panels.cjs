const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { test } = require("node:test");

// Minimal hook fixture: inspect actual JSX/handlers without a browser or live API.
// This tests state transitions, not DOM layout or React scheduling guarantees.
function fixture(exportName, props = {}, fetcher) {
  const state = [], effects = [], cleanups = [], calls = [];
  let cursor = 0, pending = [], tree;
  const same = (a, b) => a && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const react = {
    useRef(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = { current: initial };
      return state[index];
    },
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [state[index], value => { state[index] = typeof value === "function" ? value(state[index]) : value; }];
    },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!same(effects[index], deps)) {
        effects[index] = deps;
        pending.push(() => { cleanups[index]?.(); cleanups[index] = effect(); });
      }
    },
  };
  const filename = path.resolve(__dirname, "../src/components/v2/admin/OperationsPanels.tsx");
  const code = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module, exports: module.exports, console, AbortController, Error,
    FormData: class { constructor(form) { this.values = form.values; } get(key) { return this.values[key]; } },
    window: { confirm: () => true },
    fetch: (url, options = {}) => { calls.push({ url, options }); return fetcher(url, options); },
    require: name => name === "react" ? react : name === "lucide-react" ? new Proxy({}, { get: (_, key) => key }) : require(name),
  }, { filename });
  function render() {
    cursor = 0; tree = module.exports[exportName](props);
    const jobs = pending; pending = []; jobs.forEach(job => job());
    return tree;
  }
  function elements(node, result = []) {
    if (!node || typeof node !== "object") return result;
    if (Array.isArray(node)) { node.forEach(child => elements(child, result)); return result; }
    if (typeof node.type === "function") return elements(node.type(node.props), result);
    result.push(node); elements(node.props?.children, result); return result;
  }
  const find = (type, predicate = () => true) => elements(tree).find(node => node.type === type && predicate(node.props));
  async function flush() { await new Promise(resolve => setImmediate(resolve)); render(); }
  return { render, flush, find, elements, calls };
}
const json = (data, status = 200) => Promise.resolve(Response.json(data, { status }));
const row = { id: "customer", public_id: "SUP-1", status: "open", subject: "Help", account: null };
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };

test("accounts show protected controls and pagination boundaries", async () => {
  const f = fixture("AccountsPanel", {}, () => json({ accounts: [{ id: "admin", protected: true }, { id: "customer", protected: false }], total: 26 }));
  f.render(); await f.flush();
  assert.equal(f.find("button", p => p.children === "Protected admin").props.disabled, true);
  assert.equal(f.find("button", p => p["aria-label"] === "Previous page").props.disabled, true);
  f.find("button", p => p["aria-label"] === "Next page").props.onClick();
  f.render(); await f.flush();
  assert.match(f.calls.at(-1).url, /page=2/);
  assert.equal(f.find("button", p => p["aria-label"] === "Next page").props.disabled, true);
});
test("accounts HTTP errors display an alert and hide the editable table", async () => {
  const f = fixture("AccountsPanel", {}, () => json({ error: "Super-admin access required" }, 403));
  f.render(); await f.flush();
  assert.ok(f.find("p", p => p.role === "alert"));
  assert.equal(f.find("table"), undefined);
});
test("account form sends only allowed fields and preserves selection on PATCH failure", async () => {
  const f = fixture("AccountsPanel", {}, (_, options) => options.method === "PATCH"
    ? json({ error: "Account update failed" }, 400)
    : json({ accounts: [{ id: "customer", full_name: "Test", account_status: "active", updated_at: "2026-09-18T00:00:00Z" }], total: 1 }));
  f.render(); await f.flush();
  f.find("button", p => p.children === "Edit").props.onClick(); f.render();
  const form = f.find("form", p => p.className?.includes("border-y"));
  await form.props.onSubmit({ preventDefault() {}, currentTarget: { values: { full_name: "Changed", phone: "", city: "", account_status: "suspended", primary_role: "admin" } } });
  f.render();
  assert.ok(f.find("input", p => p.name === "full_name"));
  assert.ok(f.find("p", p => p.role === "alert"));
  assert.deepEqual(Object.keys(JSON.parse(f.calls.at(-1).options.body)).sort(), ["account_status", "city", "expectedUpdatedAt", "full_name", "id", "phone"]);
  assert.equal(JSON.parse(f.calls.at(-1).options.body).expectedUpdatedAt, "2026-09-18T00:00:00Z");
});
test("support status update disables inputs, sends kind/id/status, then reflects success", async () => {
  const write = deferred();
  const f = fixture("SupportWorkPanel", { kind: "tickets" }, (_, options) => options.method === "PATCH" ? write.promise : json({ rows: [row], total: 1 }));
  f.render(); await f.flush();
  f.find("select").props.onChange({ target: { value: "resolved" } }); f.render();
  assert.equal(f.find("select").props.disabled, true);
  assert.deepEqual(JSON.parse(f.calls.at(-1).options.body), { kind: "tickets", id: row.id, status: "resolved" });
  write.resolve(Response.json({ request: { id: row.id, status: "resolved" } }));
  await f.flush();
  assert.equal(f.find("select").props.value, "resolved");
  assert.equal(f.find("select").props.disabled, false);
});
test("support PATCH failure restores controls without displaying a false status", async () => {
  const f = fixture("SupportWorkPanel", { kind: "tickets" }, (_, options) => options.method === "PATCH"
    ? json({ error: "Status update failed" }, 500) : json({ rows: [row], total: 1 }));
  f.render(); await f.flush();
  f.find("select").props.onChange({ target: { value: "resolved" } }); await f.flush();
  assert.equal(f.find("select").props.value, "open");
  assert.equal(f.find("select").props.disabled, false);
  assert.ok(f.find("p", p => p.role === "alert"));
});
test("account conflict preserves form until explicit reload and reloads a fresh version", async () => {
  let reads = 0;
  const f = fixture("AccountsPanel", {}, (_, options) => options.method === "PATCH"
    ? json({ error: "Account changed; reload before saving" }, 409)
    : json({ accounts: [{ id: "customer", full_name: "Test", account_status: ++reads === 1 ? "active" : "suspended",
      updated_at: reads === 1 ? "2026-09-18T00:00:00Z" : "2026-09-18T01:00:00Z" }], total: 1 }));
  f.render(); await f.flush();
  f.find("button", p => p.children === "Edit").props.onClick(); f.render();
  await f.find("form", p => p.className?.includes("border-y")).props.onSubmit({
    preventDefault() {}, currentTarget: { values: { full_name: "Edit", phone: "", city: "", account_status: "active" } },
  });
  f.render();
  assert.ok(f.find("p", p => p.role === "alert"));
  assert.ok(f.find("input", p => p.name === "full_name"));
  f.find("button", p => Array.isArray(p.children) && p.children.includes("Reload accounts")).props.onClick();
  f.render(); await f.flush();
  assert.equal(f.find("input", p => p.name === "full_name"), undefined);
  f.find("button", p => p.children === "Edit").props.onClick(); f.render();
  assert.equal(f.find("select", p => p.name === "account_status").props.defaultValue, "suspended");
});
test("refresh response cannot overwrite a completed status update", async () => {
  const write = deferred(), refresh = deferred();
  let reads = 0;
  const f = fixture("SupportWorkPanel", { kind: "tickets" }, (_, options) => options.method === "PATCH"
    ? write.promise : ++reads === 1 ? json({ rows: [row], total: 1 }) : refresh.promise);
  f.render(); await f.flush();
  const change = f.find("select").props.onChange;
  f.find("button", p => p["aria-label"] === "Refresh requests").props.onClick();
  f.render();
  change({ target: { value: "resolved" } }); f.render();
  assert.equal(f.find("button", p => p["aria-label"] === "Refresh requests").props.disabled, true);
  write.resolve(Response.json({ request: { id: row.id, status: "resolved" } })); await f.flush();
  refresh.resolve(Response.json({ rows: [row], total: 1 })); await f.flush();
  assert.equal(f.find("select").props.value, "resolved");
});
