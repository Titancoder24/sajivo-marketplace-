# Account Suspension Enforcement

The admin accounts API persists `profiles.account_status`. Application authorization
requires a verified Supabase user and a fresh profile with status exactly `active`.
Missing profiles and database/network errors deny authorization. No session metadata,
client-supplied role, or service-role credential is used as an authorization shortcut.

The proxy blocks suspended authenticated API requests (403) and redirects protected
pages. Account lookup outages return 503. Logout and public browsing remain available.
The server APIs, server-rendered account screens, and admin helpers independently use
`getActiveUser`, so authorization does not rely solely on proxy execution.
Password/admin login and OAuth callbacks also check status after authentication.

## Sessions and Database Limits

- This change does not ban a Supabase Auth user or globally revoke their sessions.
  Existing JWTs and refresh tokens may remain valid. The next protected application
  request is denied based on the current profile, independent of JWT expiry.
- Rejected login/callback sessions are signed out locally. This is not global
  session revocation and does not invalidate already issued access tokens.
- Requests already authorized when suspension occurs may finish. Strict enforcement
  at each database operation requires coordinated RLS changes.
- Direct Supabase REST, Storage, Realtime, RPC, and other services bypass Next.js.
  Their access remains governed by existing RLS/policies and token validity.
  Universal database-level suspension is NOT claimed by this implementation.
- The existing profile authorization trigger must remain deployed to prevent users
  from changing their own account status. The accounts API protects administrator
  profiles from suspension through that endpoint.
- No migrations were modified here. Coordinate an independent audit of all exposed
  policies, authorization functions, storage access, and session revocation/ban
  operations before promising platform-wide immediate revocation.

Run `node --test scripts/test-account-suspension.cjs` for mocked regression coverage.
These tests do not mutate live Supabase accounts or verify deployed RLS.
