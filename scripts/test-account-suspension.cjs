const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { test } = require("node:test");
const { NextRequest } = require("next/server");
const root = path.resolve(__dirname, "..");
function load(relative, mocks = {}) {
  const filename = path.join(root, relative);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module, exports: module.exports, console, Request, Response, URL,
    process: { env: { NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test" } },
    require: (name) => name in mocks ? mocks[name] : require(name),
  }, { filename });
  return module.exports;
}
const access = load("src/lib/supabase/account-access.ts");
function client(status = "active", options = {}) {
  const calls = [];
  return {
    calls,
    auth: {
      async getUser() {
        calls.push("getUser");
        if (options.throwAuth) throw new Error("network");
        return { data: { user: options.anonymous ? null : { id: "verified-id", user_metadata: { account_status: "active" } } }, error: options.authError || null };
      },
      async getClaims() { calls.push("getClaims"); return { data: null }; },
      async signInWithPassword() { return { data: { user: { id: "verified-id" } }, error: null }; },
      async signOut() { calls.push("signOut"); return { error: null }; },
      async exchangeCodeForSession() { return { error: null }; },
    },
    from(table) {
      calls.push(table);
      return {
        select() { return this; },
        eq(key, value) { if (table === "profiles" && key === "id") assert.equal(value, "verified-id"); return this; },
        async maybeSingle() {
          if (options.throwProfile) throw new Error("network");
          return { data: options.missing ? null : { account_status: status }, error: options.queryError ? { message: "denied" } : null };
        },
      };
    },
  };
}
function mocks(supabase) {
  return {
    "@/lib/supabase/account-access": access,
    "./account-access": access,
    "@/lib/supabase/server": { createClient: async () => supabase },
    "@supabase/ssr": { createServerClient: (_url, _key, settings) => {
      settings.cookies.setAll([{ name: "refreshed-session", value: "new", options: { httpOnly: true } }], {});
      return supabase;
    } },
    "server-only": {},
    "@/lib/server/integrations": {},
  };
}

test("only a verified user with a fresh active profile is authorized", async () => {
  assert.equal((await access.getActiveUser(client())).data.user.id, "verified-id");
  for (const status of ["suspended", "inactive", null, undefined, ""]) {
    const supabase = client(status === undefined ? null : status);
    const result = await access.getActiveUser(supabase);
    assert.equal(result.data.user, null);
    assert.equal(result.error.code, "account_suspended");
    assert.equal(result.error.status, 403);
  }
});
test("missing profiles, database errors, and network failures fail closed", async () => {
  for (const options of [{ missing: true }, { queryError: true }, { throwProfile: true }, { throwAuth: true }]) {
    const result = await access.getActiveUser(client("active", options));
    assert.equal(result.data.user, null);
    assert.equal(result.error.code, "account_unavailable");
  }
});
test("invalid auth cannot be authorized by metadata or a returned user", async () => {
  const supabase = client("active", { authError: { message: "invalid JWT" } });
  assert.equal((await access.getActiveUser(supabase)).data.user, null);
  assert.equal(supabase.calls.includes("profiles"), false);
});
test("anonymous requests do not query profiles", async () => {
  const supabase = client("active", { anonymous: true });
  assert.equal((await access.getActiveUser(supabase)).data.user, null);
  assert.equal(supabase.calls.includes("profiles"), false);
});
test("proxy blocks suspended API calls, preserves refreshed cookies and denies caching", async () => {
  for (const route of ["/api/v2/admin/accounts", "/api/projects", "/api/v2/projects/x/tasks", "/api/projects/fake.png"]) {
    const proxy = load("src/lib/supabase/proxy.ts", mocks(client("suspended")));
    const response = await proxy.updateSession(new NextRequest("http://localhost" + route));
    assert.equal(response.status, 403);
    assert.equal((await response.json()).code, "account_suspended");
    assert.equal(response.cookies.get("refreshed-session").value, "new");
    assert.equal(response.headers.get("cache-control"), "private, no-store");
  }
});
test("proxy redirects suspended dashboards and returns 503 on account lookup failure", async () => {
  for (const route of ["/v2/admin", "/customer/dashboard", "/profile"]) {
    const proxy = load("src/lib/supabase/proxy.ts", mocks(client("suspended")));
    const response = await proxy.updateSession(new NextRequest("http://localhost" + route));
    assert.equal(response.status, 307);
    assert.match(response.headers.get("location"), /account_suspended/);
  }
  const proxy = load("src/lib/supabase/proxy.ts", mocks(client("active", { queryError: true })));
  assert.equal((await proxy.updateSession(new NextRequest("http://localhost/api/projects"))).status, 503);
});
test("public browsing and logout remain available without an account check", async () => {
  for (const route of ["/", "/v2", "/v2/", "/v2/register", "/login", "/api/auth/logout"]) {
    const supabase = client("suspended");
    const proxy = load("src/lib/supabase/proxy.ts", mocks(supabase));
    assert.equal((await proxy.updateSession(new NextRequest("http://localhost" + route))).status, 200);
    assert.equal(supabase.calls.includes("profiles"), false);
  }
});
test("anonymous v2 homepage remains public and its layout renders without authorization", async () => {
  for (const options of [{ anonymous: true }, {}, { queryError: true }]) {
    const supabase = client("suspended", options);
    const proxy = load("src/lib/supabase/proxy.ts", mocks(supabase));
    assert.equal((await proxy.updateSession(new NextRequest("http://localhost/v2"))).status, 200);
    const layout = load("src/app/v2/layout.tsx", {
      ...mocks(supabase),
      "@/components/v2/V2Shell": { V2Shell: () => null },
    });
    const element = await layout.default({ children: "Public homepage" });
    assert.equal(element.props.children, "Public homepage");
    assert.equal(element.props.initialProfile, null);
    assert.equal(element.props.isPlatformAdmin, false);
    assert.equal(supabase.calls.includes("platform_admins"), false);
  }
});
test("direct admin authorization is denied even without running proxy", async () => {
  const supabase = client("suspended");
  const angel = load("src/lib/server/angel.ts", mocks(supabase));
  assert.equal(await angel.getPlatformAdmin("super_admin"), null);
  assert.equal(supabase.calls.includes("platform_admins"), false);
});
test("password and admin login do not return success for suspended accounts", async () => {
  for (const route of ["login", "admin-login"]) {
    const supabase = client("suspended");
    const api = load("src/app/api/auth/" + route + "/route.ts", mocks(supabase));
    const response = await api.POST(new Request("http://localhost", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "test@example.com", password: "password-test" }) }));
    assert.equal(response.status, 403);
    assert.ok(supabase.calls.includes("signOut"));
  }
});
test("OAuth callback clears rejected sessions and does not redirect into the app", async () => {
  const supabase = client("suspended");
  const api = load("src/app/auth/callback/route.ts", mocks(supabase));
  const response = await api.GET(new Request("http://localhost/auth/callback?code=test&next=/v2"));
  assert.match(response.headers.get("location"), /account_unavailable/);
  assert.ok(supabase.calls.includes("signOut"));
});
