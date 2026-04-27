# Security Notes

## Defaults

- secrets are read server-side through `src/lib/env.server.ts` and re-exported from `src/lib/env.ts`
- browser code only receives public/publishable values
- object storage uses presigned URLs; raw bucket credentials stay server-side
- generated route protection is explicit in middleware when auth-protected routes exist
- Postgres stores object pointers, ownership, status, and compact text summaries; variable-sized media and screenshots belong in Tigris/S3-compatible storage
- reference media lifecycle is server-authorized and browser-direct: intent, direct PUT, confirm pointer, presigned GET, and delete object/pointer
- browser presigned uploads require a tight bucket CORS allowlist for the exact builder origin and generated app origins
- bucket CORS permits browser requests to already-presigned object URLs; it does not expose object-storage credentials to the browser

## Backend Mode

- hosted mode uses Supabase Auth and Supabase SDK data access; apply `supabase/schema.sql` and `supabase/policies.sql` before production use

## Review Before Production

- tighten ownership and role policies for your domain
- review generated Supabase RLS policies when using hosted mode
- configure real email delivery before relying on auth email flows
- use least-privilege object-storage keys
- rotate any smoke-test credentials used during builder dogfooding
