const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { test } = require("node:test");

const root = path.resolve(__dirname, "..");
function load(relative, mocks = {}) {
  const filename = path.join(root, relative);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module, exports: module.exports, process, console, Request, Response,
    require: (name) => name in mocks ? mocks[name] : require(name),
  }, { filename });
  return module.exports;
}
const programmatic = load("src/lib/seo/programmatic.ts");
const id = "8badb67d-3a4b-4e53-b608-b4c1dd1a1a34";
const initial = {
  id, state_slug: "uttar-pradesh", state_name: "Uttar Pradesh", city_slug: "lucknow", city_name: "Lucknow",
  service_slug: "interior-designers", service_name: "Interior Designers",
  route_path: "/in/uttar-pradesh/lucknow/interior-designers", title: "Interior Designers in Lucknow",
  meta_description: "Compare designers", h1: "Interior Designers", introduction: "Plan a project",
  target_keywords: [], status: "draft", quality_status: "needs_review", indexing_allowed: false,
  published_at: null, updated_at: "2026-09-18T00:00:00.000Z",
};

function fixture(options = {}) {
  const rows = options.rows || [{ ...initial, ...options.page }];
  const invalidated = [];
  const supabase = { from(table) {
    const filters = [];
    let update, start = 0, end = Infinity, single = false;
    const query = {
      select() { return this; }, order() { return this; },
      eq(key, value) { filters.push((row) => row[key] === value); return this; },
      neq(key, value) { filters.push((row) => row[key] !== value); return this; },
      in(key, values) { filters.push((row) => values.includes(row[key])); return this; },
      range(a, b) { start = a; end = b + 1; return this; },
      limit(value) { end = value; return this; },
      update(value) { update = value; return this; },
      maybeSingle() { single = true; return this; },
      then(resolve, reject) {
        if (options.throwRead) return Promise.reject(new Error("network")).then(resolve, reject);
        if (options.readError || (update && options.writeError)) return Promise.resolve({ data: null, error: { message: "database unavailable" } }).then(resolve, reject);
        let selected = (table === "seo_pages" ? rows : []).filter((row) => filters.every((filter) => filter(row))).slice(start, end);
        if (update && options.race) selected = [];
        if (update) selected.forEach((row) => Object.assign(row, update));
        return Promise.resolve({ data: single ? selected[0] || null : selected, error: null, count: 0 }).then(resolve, reject);
      },
    };
    return query;
  } };
  const mocks = {
    "@/lib/seo/programmatic": programmatic,
    "@/lib/server/angel": { getPlatformAdmin: async () => options.forbidden ? null : { supabase, userId: id } },
    "@/lib/supabase/server": { createClient: async () => supabase },
    "next/cache": { revalidatePath: (route) => invalidated.push(route) },
    "next/navigation": { notFound() { throw new Error("NEXT_NOT_FOUND"); } },
  };
  const api = load("src/app/api/v2/admin/seo/route.ts", mocks);
  const publicPage = load("src/app/(public)/in/[state]/[city]/[service]/page.tsx", mocks);
  const sitemap = load("src/app/sitemap.ts", mocks).default;
  async function patch(status = "published", extra = {}) {
    return api.PATCH(new Request("http://localhost/api/v2/admin/seo", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, expectedUpdatedAt: rows[0]?.updated_at || initial.updated_at, ...extra }),
    }));
  }
  return { rows, api, publicPage, sitemap, patch, invalidated };
}
const params = Promise.resolve({ state: "uttar-pradesh", city: "lucknow", service: "interior-designers" });

test("SEO table paginates 25/50, searches all rows, and preserves refresh loading state", () => {
  const state = [];
  let cursor = 0;
  const panel = load("src/components/v2/admin/AdminGrowthPanels.tsx", {
    react: { ...require("react"), useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [state[index], (value) => { state[index] = typeof value === "function" ? value(state[index]) : value; }];
    } },
    "./MonoAnalyticsSuite": {},
    "@/lib/analytics/schema": {},
  });
  const pages = Array.from({ length: 1201 }, (_, n) => ({ ...initial, id: String(n), city_name: "City " + n, route_path: "/in/state/city-" + n + "/interior-designers" }));
  let tree;
  function render(rows = pages) {
    cursor = 0;
    tree = panel.SeoPagesTable({ pages: rows, onUpdated() {}, onRefresh() {}, loading: true });
  }
  function nodes(value = tree) {
    if (Array.isArray(value)) return value.flatMap(nodes);
    if (!value || typeof value !== "object") return [];
    return [value, ...nodes(value.props?.children ?? null)];
  }
  function control(label) { return nodes().find((node) => node.props?.["aria-label"] === label); }
  function rowCount() { return nodes().filter((node) => node.type === "tr").length - 1; }
  render();
  assert.equal(rowCount(), 25);
  assert.equal(control("Previous SEO page").props.disabled, true);
  assert.equal(control("Refresh SEO pages").props.disabled, true);
  control("Next SEO page").props.onClick(); render();
  assert.equal(control("Previous SEO page").props.disabled, false);
  control("SEO rows per page").props.onChange({ target: { value: "50" } }); render();
  assert.equal(rowCount(), 50);
  assert.equal(control("Previous SEO page").props.disabled, true);
  control("Search SEO pages").props.onChange({ target: { value: "CITY-1200/" } }); render();
  assert.equal(rowCount(), 1);
  assert.equal(control("Next SEO page").props.disabled, true);
  control("Search SEO pages").props.onChange({ target: { value: "" } }); render();
  control("Next SEO page").props.onClick(); render(pages.slice(0, 2));
  assert.equal(rowCount(), 2);
  assert.equal(control("Previous SEO page").props.disabled, true);
});

test("publish persists, becomes public and enters sitemap; unpublish reverses all three", async () => {
  const f = fixture();
  assert.equal((await f.publicPage.generateMetadata({ params })).robots.index, false);
  assert.equal((await f.sitemap()).some((entry) => entry.url.endsWith(initial.route_path)), false);
  await assert.rejects(f.publicPage.default({ params }), /NEXT_NOT_FOUND/);
  assert.equal((await f.patch()).status, 200);
  assert.equal(f.rows[0].status, "published");
  assert.equal(f.rows[0].indexing_allowed, true);
  assert.equal(f.rows[0].quality_status, "approved");
  assert.ok(f.rows[0].published_at);
  assert.equal((await f.api.GET()).status, 200);
  assert.equal((await f.publicPage.generateMetadata({ params })).robots.index, true);
  assert.equal((await f.sitemap()).some((entry) => entry.url.endsWith(initial.route_path)), true);
  assert.ok(f.invalidated.includes("/sitemap.xml"));
  assert.equal((await f.patch("draft")).status, 200);
  assert.equal(f.rows[0].indexing_allowed, false);
  assert.equal(f.rows[0].published_at, null);
  assert.equal((await f.publicPage.generateMetadata({ params })).robots.index, false);
  assert.equal((await f.sitemap()).some((entry) => entry.url.endsWith(initial.route_path)), false);
  await assert.rejects(f.publicPage.default({ params }), /NEXT_NOT_FOUND/);
});

test("authorization, malformed requests, missing pages and validation", async () => {
  assert.equal((await fixture({ forbidden: true }).patch()).status, 403);
  assert.equal((await fixture().patch("archived")).status, 400);
  assert.equal((await fixture().patch("published", { id: "invalid" })).status, 400);
  assert.equal((await fixture({ rows: [] }).patch()).status, 404);
  for (const page of [{ title: " " }, { service_slug: "unknown" }, { route_path: "//external.test" }, { city_slug: "" }]) {
    const f = fixture({ page });
    assert.equal((await f.patch()).status, 422);
    assert.equal(f.rows[0].status, "draft");
  }
  const f = fixture();
  assert.equal((await f.api.PATCH(new Request("http://localhost", { method: "PATCH", body: "{" }))).status, 400);
});

test("stale versions and concurrent updates cannot overwrite publication", async () => {
  assert.equal((await fixture().patch("published", { expectedUpdatedAt: "old" })).status, 409);
  const f = fixture({ race: true });
  assert.equal((await f.patch()).status, 409);
  assert.equal(f.rows[0].status, "draft");
});

test("database errors and network failures never claim success", async () => {
  for (const options of [{ readError: true }, { writeError: true }, { throwRead: true }]) {
    const f = fixture(options);
    assert.equal((await f.patch()).status, 500);
    assert.equal(f.rows[0].status, "draft");
  }
});

test("unpublish remains possible for malformed legacy content", async () => {
  const f = fixture({ page: { status: "published", indexing_allowed: true, title: "" } });
  assert.equal((await f.patch("draft")).status, 200);
  assert.equal(f.rows[0].indexing_allowed, false);
});

test("admin listing includes pages beyond the old 500-row cutoff", async () => {
  const f = fixture({ rows: Array.from({ length: 1201 }, (_, n) => ({ ...initial, id: String(n) })) });
  const response = await f.api.GET();
  assert.equal((await response.json()).pages.length, 1201);
});

test("no fallback resurrects missing or non-indexable published pages", async () => {
  for (const options of [{ rows: [] }, { page: { status: "published", indexing_allowed: false } }]) {
    const f = fixture(options);
    assert.equal((await f.publicPage.generateMetadata({ params })).robots.index, false);
    assert.equal((await f.sitemap()).some((entry) => entry.url.endsWith(initial.route_path)), false);
  }
  await assert.rejects(fixture({ readError: true }).sitemap(), /could not be loaded/);
});
