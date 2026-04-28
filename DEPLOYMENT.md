# Deployment

Stylyf is deployed directly from the repository checkout. The live `stylyf.com` app is now the auth-gated internal builder at `apps/builder`.

This deploys only the builder control plane. Generated apps are not deployed from the builder. They are committed/pushed for manual dev-team review and deployment strategy selection.

## Current VPS Shape

- Repo path: `/root/stylyf`
- App path: `/root/stylyf/apps/builder`
- Runtime: `apps/builder/.output/server/index.mjs`
- Service: `stylyf.service`
- Public app port: `127.0.0.1:3001`
- Domains: `stylyf.com`, `www.stylyf.com`
- Workspace root: `STYLYF_BUILDER_ROOT`, production recommendation `/var/lib/stylyf-builder`

## Build And Refresh

```bash
cd /root/stylyf
npm install
set -a
. /root/stylyf/.env
export VITE_SUPABASE_URL="$SUPABASE_URL"
export VITE_SUPABASE_PUBLISHABLE_KEY="$SUPABASE_PUBLISHABLE_KEY"
set +a
npm --prefix apps/builder run schema:check
npm run builder:build
systemctl restart stylyf
systemctl reload caddy
```

## systemd Unit

File: `/etc/systemd/system/stylyf.service`

```ini
[Unit]
Description=Stylyf Internal Builder
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/stylyf/apps/builder
Environment=NODE_ENV=production
Environment=HOST=127.0.0.1
Environment=PORT=3001
Environment=STYLYF_BUILDER_ROOT=/var/lib/stylyf-builder
Environment=APP_BASE_URL=https://stylyf.com
EnvironmentFile=/root/stylyf/.env
ExecStart=/usr/bin/node /root/stylyf/apps/builder/.output/server/index.mjs
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

## Caddy

File: `/etc/caddy/Caddyfile`

```caddy
stylyf.com, www.stylyf.com {
  encode zstd gzip
  header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains"
    X-Content-Type-Options "nosniff"
    Referrer-Policy "strict-origin-when-cross-origin"
    X-Frame-Options "SAMEORIGIN"
    -Server
  }
  reverse_proxy 127.0.0.1:3001 {
    header_up -Accept-Encoding
    transport http {
      compression off
    }
  }
}
```

Preview ports are managed app dev servers. For local development the builder can iframe direct preview ports. For production, prefer an authenticated reverse-proxy path before exposing preview ports broadly.

## Required Environment

Keep secret values out of docs and git. The builder expects these keys at runtime:

- `APP_BASE_URL=https://stylyf.com`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `AWS_REGION`
- `AWS_S3_BUCKET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_ENDPOINT_URL_S3`
- optional `STYLYF_BUILDER_ROOT=/var/lib/stylyf-builder`
- optional `GITHUB_ORG=Depths-AI`
- optional `GITHUB_TOKEN` scoped narrowly for private generated-app repos
- optional `STYLYF_PREVIEW_PUBLIC_BASE` for preview URL construction

## Validation

```bash
npm run builder:check
npm --prefix apps/builder run schema:check
npm run builder:build
systemctl status stylyf --no-pager
systemctl status caddy --no-pager
curl -I https://stylyf.com
```

If `schema:check` reports missing tables or columns, apply `/root/stylyf/apps/builder/supabase/schema.sql` and `/root/stylyf/apps/builder/supabase/policies.sql` in Supabase before restarting the live service.
