const assert = require("node:assert/strict");
const { readFileSync, existsSync, readdirSync, lstatSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { test } = require("node:test");

const root = path.resolve(__dirname, "..");
const actorId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const targetId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
function load(relative, mocks = {}, globals = {}) {
  const filename = path.join(root, relative);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module, exports: module.exports, process, console, Request, Response, URL,
    ...globals, require: name => name in mocks ? mocks[name] : require(name),
  }, { filename });
  return module.exports;
}
const initialVersion = "2026-09-18T00:00:00.000Z";
const accountValues = { id: targetId, full_name: "Test Customer", phone: "123", city: "Lucknow", account_status: "active", expectedUpdatedAt: initialVersion };
function fixture(options = {}) {
  const role = options.role === undefined ? "super_admin" : options.role;
  const rows = {
    profiles: options.profiles || [{ ...accountValues, primary_role: "customer", created_at: "2026-09-18", updated_at: initialVersion }],
    platform_admins: [
      ...(role ? [{ profile_id: actorId, role, status: options.adminStatus || "active" }] : []),
      ...(options.protected ? [{ profile_id: targetId, role: "support_admin", status: "inactive" }] : []),
    ],
    support_tickets: [{ id: targetId, status: "open", resolved_at: null }],
    support_callback_requests: [{ id: targetId, status: "requested" }],
  };
  if (options.missing) for (const table of ["profiles", "support_tickets", "support_callback_requests"]) rows[table] = [];
  const calls = [];
  const supabase = { from(table) {
    const call = { table, filters: [], start: 0, end: Infinity, update: null };
    calls.push(call);
    const q = {
      select(fields, config) { call.fields = fields; call.config = config; return this; },
      eq(key, value) { call.filters.push([key, value]); return this; },
      order(key, config) { (call.order ||= []).push([key, config]); return this; },
      or(value) { call.or = value; return this; },
      range(start, end) { call.start = start; call.end = end; return this; },
      update(value) { call.update = value; return this; },
      maybeSingle() { call.single = true; return this; },
      then(resolve, reject) {
        const mode = call.update ? "write" : "read";
        if (options.protectedError && table === "platform_admins" && !call.filters.some(([key, value]) => key === "profile_id" && value === actorId)) {
          return Promise.resolve({ data: null, error: { message: "secret registry detail" } }).then(resolve, reject);
        }
        if (options.throwOn === table + ":" + mode) return Promise.reject(new Error("secret transport detail")).then(resolve, reject);
        if (options.errorOn === table + ":" + mode) return Promise.resolve({ data: null, error: { message: "secret database detail" } }).then(resolve, reject);
        if (!Number.isInteger(call.start)) return Promise.resolve({ data: null, error: { message: "invalid offset" } }).then(resolve, reject);
        let selected = rows[table].filter(row => call.filters.every(([key, value]) => row[key] === value));
        if (call.or) {
          const term = call.or.match(/ilike\.%(.*?)%/)?.[1].toLowerCase();
          selected = selected.filter(row => ["full_name", "email", "account_public_id"].some(key => String(row[key] || "").toLowerCase().includes(term)));
        }
        const count = selected.length;
        selected = selected.slice(call.start, call.end + 1);
        if (call.update) selected.forEach(row => Object.assign(row, call.update));
        return Promise.resolve({ data: call.single ? selected[0] || null : selected.map(row => ({ ...row })), count, error: null }).then(resolve, reject);
      },
    };
    return q;
  } };
  // Exercise the real role gate, rather than stubbing every caller as an admin.
  const auth = load("src/lib/server/angel.ts", {
    "server-only": {},
    "@/lib/supabase/server": { createClient: async () => supabase },
    "@/lib/supabase/account-access": { getActiveUser: async () => ({
      data: { user: options.anonymous || options.suspended ? null : { id: actorId } },
      error: options.suspended ? new Error("inactive account") : null,
    }) },
    "@/lib/server/integrations": {},
  });
  const apis = Object.fromEntries(["accounts", "support-work"].map(name => [
    name, load("src/app/api/v2/admin/" + name + "/route.ts", { "@/lib/server/angel": auth }),
  ]));
  const get = (name, query = "") => apis[name].GET(new Request("http://localhost/api/v2/admin/" + name + query));
  const patch = (name, body, raw = false) => apis[name].PATCH(new Request("http://localhost/api/v2/admin/" + name, {
    method: "PATCH", body: raw ? body : JSON.stringify(body), headers: { "Content-Type": "application/json" },
  }));
  return { rows, calls, get, patch };
}

for (const options of [{ anonymous: true }, { role: null }, { role: "analyst" }, { role: "knowledge_manager" }, { adminStatus: "inactive" }, { suspended: true }]) {
  test("GET/PATCH deny unauthorized callers: " + JSON.stringify(options), async () => {
    const f = fixture(options);
    for (const name of ["accounts", "support-work"]) {
      assert.equal((await f.get(name)).status, 403);
      assert.equal((await f.patch(name, "{", true)).status, 403);
    }
    assert.equal(f.calls.some(call => call.update), false);
    assert.equal(f.calls.some(call => call.table !== "platform_admins"), false);
  });
}
test("support admins access support work but never account editing/listing", async () => {
  const f = fixture({ role: "support_admin" });
  assert.equal((await f.get("accounts")).status, 403);
  assert.equal((await f.patch("accounts", accountValues)).status, 403);
  assert.equal((await f.get("support-work")).status, 200);
  assert.equal((await f.patch("support-work", { kind: "callbacks", id: targetId, status: "confirmed" })).status, 200);
});
test("admin registry lookup errors fail closed", async () => {
  const f = fixture({ errorOn: "platform_admins:read" });
  for (const name of ["accounts", "support-work"]) assert.equal((await f.get(name)).status, 403);
});
test("accounts reject malformed JSON, invalid/oversized fields, roles and mass assignment", async () => {
  const f = fixture();
  for (const body of [
    {}, { ...accountValues, id: "bad" }, { ...accountValues, full_name: " " },
    { ...accountValues, full_name: "a".repeat(121) }, { ...accountValues, phone: "a".repeat(31) },
    { ...accountValues, city: "a".repeat(101) }, { ...accountValues, account_status: "deleted" },
    { ...accountValues, primary_role: "admin" }, { ...accountValues, email: "other@example.test" },
    { ...accountValues, expectedUpdatedAt: undefined }, { ...accountValues, expectedUpdatedAt: null },
    { ...accountValues, expectedUpdatedAt: 123 }, { ...accountValues, expectedUpdatedAt: "old" },
    { ...accountValues, expectedUpdatedAt: "2026-02-30T00:00:00Z" },
    { ...accountValues, expectedUpdatedAt: "2026-09-18" },
  ]) assert.equal((await f.patch("accounts", body)).status, 400);
  assert.equal((await f.patch("accounts", "{", true)).status, 400);
  assert.equal(f.calls.some(call => call.update), false);
});
test("self and registered admins (including inactive admins) cannot be modified", async () => {
  for (const [options, id] of [[{}, actorId], [{ protected: true }, targetId]]) {
    const f = fixture(options);
    assert.equal((await f.patch("accounts", { ...accountValues, id })).status, 403);
    assert.equal(f.calls.some(call => call.update), false);
  }
  const f = fixture({ protected: true });
  assert.equal((await (await f.get("accounts")).json()).accounts[0].protected, true);
});
test("protected-account lookup errors deny edits and return JSON 500", async () => {
  const f = fixture({ protectedError: true });
  for (const response of [await f.get("accounts"), await f.patch("accounts", accountValues)]) {
    assert.equal(response.status, 500);
    assert.equal((await response.text()).includes("secret"), false);
  }
  assert.equal(f.calls.some(call => call.update), false);
});
test("accounts GET includes optimistic versions", async () => {
  const f = fixture();
  assert.equal((await (await f.get("accounts")).json()).accounts[0].updated_at, initialVersion);
  assert.ok(f.calls.find(call => call.table === "profiles").fields.includes("updated_at"));
});
test("account updates trim values, target only requested account, and persist suspension/reactivation", async () => {
  const f = fixture();
  for (const status of ["suspended", "active"]) {
    const expectedUpdatedAt = f.rows.profiles[0].updated_at;
    const response = await f.patch("accounts", { ...accountValues, expectedUpdatedAt, full_name: "  Renamed Customer  ", account_status: status });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).account.updated_at, f.rows.profiles[0].updated_at);
    assert.equal(f.rows.profiles[0].full_name, "Renamed Customer");
    assert.equal(f.rows.profiles[0].account_status, status);
    const update = f.calls.findLast(call => call.update);
    assert.equal(JSON.stringify(update.filters), JSON.stringify([["id", targetId], ["updated_at", expectedUpdatedAt]]));
    assert.ok(update.update.updated_at);
    assert.equal("primary_role" in update.update, false);
    assert.equal("expectedUpdatedAt" in update.update, false);
  }
});
test("missing accounts/support requests return 404, never claim success", async () => {
  const f = fixture({ missing: true });
  assert.equal((await f.patch("accounts", accountValues)).status, 404);
  for (const kind of ["tickets", "callbacks"]) assert.equal((await f.patch("support-work", { kind, id: targetId, status: kind === "tickets" ? "open" : "requested" })).status, 404);
});
test("pagination is bounded, inclusive, and includes the final partial page", async () => {
  const profiles = Array.from({ length: 61 }, (_, i) => ({ ...accountValues, id: String(i) }));
  const f = fixture({ profiles });
  for (const [page, expected] of [[1, 25], [2, 25], [3, 11], [4, 0]]) {
    const response = await (await f.get("accounts", "?page=" + page)).json();
    assert.equal(response.accounts.length, expected);
    assert.equal(response.total, 61);
    assert.equal(response.page, page);
    if (expected) assert.equal(response.accounts[0].id, String((page - 1) * 25));
  }
  for (const name of ["accounts", "support-work"]) {
    for (const [input, expected] of [["0", 1], ["-5", 1], ["nope", 1], ["10001", 10000]]) {
      assert.equal((await (await f.get(name, "?page=" + input)).json()).page, expected);
    }
  }
});
test("account search removes PostgREST filter syntax and limits input length", async () => {
  const f = fixture();
  await f.get("accounts", "?search=" + encodeURIComponent("x),id.neq.(a" + "q".repeat(200)));
  const filter = f.calls.find(call => call.or).or;
  assert.equal(filter.includes("(") || filter.includes(")"), false);
  assert.equal(filter.split(",").length, 3);
  assert.equal(filter.match(/ilike\.%(.*?)%/)[1].length, 100);
});
test("support validation rejects cross-kind statuses and malformed IDs/JSON", async () => {
  const f = fixture();
  for (const body of [
    {}, { kind: "other", id: targetId, status: "open" },
    { kind: "tickets", id: "bad", status: "open" },
    { kind: "tickets", id: targetId, status: "completed" },
    { kind: "callbacks", id: targetId, status: "resolved" },
  ]) assert.equal((await f.patch("support-work", body)).status, 400);
  assert.equal((await f.patch("support-work", "{", true)).status, 400);
  assert.equal(f.calls.some(call => call.update), false);
});
test("support kinds paginate the right table; all allowed statuses persist", async () => {
  const f = fixture();
  for (const [kind, table, statuses] of [
    ["callbacks", "support_callback_requests", ["requested", "confirmed", "completed", "cancelled"]],
    ["tickets", "support_tickets", ["open", "pending", "resolved", "closed"]],
  ]) {
    await f.get("support-work", "?kind=" + kind + "&page=2");
    const query = f.calls.at(-1);
    assert.equal(query.table, table);
    assert.equal(query.start, 25);
    assert.equal(query.end, 49);
    for (const status of statuses) {
      const response = await f.patch("support-work", { kind, id: targetId, status, account_id: actorId });
      assert.equal(response.status, 200);
      assert.equal((await response.json()).request.status, status);
      const row = f.rows[table][0];
      assert.equal(row.status, status);
      const update = f.calls.at(-1).update;
      assert.equal("account_id" in update, false);
      if (kind === "tickets") assert.equal(Boolean(row.resolved_at), ["resolved", "closed"].includes(status));
      else assert.equal("resolved_at" in update, false);
    }
  }
  await f.patch("support-work", { kind: "tickets", id: targetId, status: "open" });
  assert.equal(f.rows.support_tickets[0].resolved_at, null);
});
test("database errors return generic failures without leaking details or mutating records", async () => {
  for (const [name, table, body] of [
    ["accounts", "profiles", accountValues],
    ["support-work", "support_tickets", { kind: "tickets", id: targetId, status: "resolved" }],
    ["support-work", "support_callback_requests", { kind: "callbacks", id: targetId, status: "completed" }],
  ]) {
    const f = fixture({ errorOn: table + ":read" });
    const response = await f.get(name, "?kind=" + (table === "support_tickets" ? "tickets" : "callbacks"));
    assert.equal(response.status, 500);
    assert.equal((await response.text()).includes("secret"), false);
    const w = fixture({ errorOn: table + ":write" });
    const before = JSON.stringify(w.rows);
    const writeResponse = await w.patch(name, body);
    assert.equal(writeResponse.ok, false);
    assert.equal((await writeResponse.text()).includes("secret"), false);
    assert.equal(JSON.stringify(w.rows), before);
  }
});

test("stale account contact edit cannot undo a newer suspension", async () => {
  const f = fixture();
  const stale = { ...accountValues, full_name: "Edited contact name" };
  await f.patch("accounts", { ...accountValues, account_status: "suspended" });
  const response = await f.patch("accounts", stale);
  assert.equal(response.status, 409);
  assert.equal(f.rows.profiles[0].account_status, "suspended");
  assert.equal(f.rows.profiles[0].full_name, accountValues.full_name);
});
test("two writers with the same account version cannot both succeed", async () => {
  const f = fixture();
  const responses = await Promise.all([
    f.patch("accounts", { ...accountValues, full_name: "First writer" }),
    f.patch("accounts", { ...accountValues, full_name: "Second writer" }),
  ]);
  assert.deepEqual(responses.map(response => response.status).sort(), [200, 409]);
  assert.equal(f.rows.profiles[0].full_name, "First writer");
});
test("failed conflict lookup returns 500, not a misleading 409 or 404", async () => {
  const f = fixture({ errorOn: "profiles:read" });
  const response = await f.patch("accounts", { ...accountValues, expectedUpdatedAt: "2026-09-17T00:00:00Z" });
  assert.equal(response.status, 500);
  assert.equal(f.rows.profiles[0].updated_at, initialVersion);
});
for (const name of ["accounts", "support-work"]) {
  test(name + " normalizes fractional pagination before querying", async () => {
    const f = fixture();
    const response = await f.get(name, "?page=1.5");
    assert.equal(response.status, 200);
    assert.equal((await response.json()).page, 1);
    assert.ok(f.calls.every(call => Number.isInteger(call.start)));
  });
  test(name + " returns JSON 500 for unexpected GET/PATCH/auth query rejection", async () => {
    const table = name === "accounts" ? "profiles" : "support_callback_requests";
    const f = fixture({ throwOn: table + ":read" });
    const response = await f.get(name);
    assert.equal(response.status, 500);
    assert.equal((await response.text()).includes("secret"), false);
    const body = name === "accounts" ? accountValues : { kind: "callbacks", id: targetId, status: "completed" };
    const write = fixture({ throwOn: table + ":write" });
    assert.equal((await write.patch(name, body)).status, 500);
    const gate = fixture({ throwOn: "platform_admins:read" });
    assert.equal((await gate.get(name)).status, 500);
    assert.equal((await gate.patch(name, body)).status, 500);
  });
}
test("write failures use server-error status, not invalid-client-request status", async () => {
  for (const [name, table, body] of [
    ["accounts", "profiles", accountValues],
    ["support-work", "support_callback_requests", { kind: "callbacks", id: targetId, status: "completed" }],
  ]) assert.equal((await fixture({ errorOn: table + ":write" }).patch(name, body)).status, 500);
});
test("gallery archive is absent from app repo, with no public symlink or retired paths", () => {
  const archived = path.join(root, "archive/gallery-exclusions");
  const publicRoot = path.join(root, "public");
  assert.equal(existsSync(archived), false);
  function visit(dir) {
    for (const item of readdirSync(dir)) {
      const file = path.join(dir, item);
      assert.equal(lstatSync(file).isSymbolicLink(), false, file);
      if (lstatSync(file).isDirectory()) visit(file);
    }
  }
  visit(publicRoot);
  for (const file of ["quiet-luxury-room/05.webp", "pvc-wall-panels/05.webp", "crafted-dining-space/03.webp",
    ...Array.from({ length: 6 }, (_, i) => "quiet-luxury-room-set-two/0" + (i + 1) + ".webp")]) {
    assert.equal(existsSync(path.join(publicRoot, "media/sajivo-gallery", file)), false);
  }
});
