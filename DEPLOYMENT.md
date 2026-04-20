# Stylyf Deployment

Stylyf is deployed directly from the repository checkout. The server does not use a copied release directory, helper scripts, or a separate deployment user.

## Production shape

- Repo path: `/root/stylyf`
- App runtime: SolidStart production build at `.output/server/index.mjs`
- Local bind: `127.0.0.1:3001`
- Public entry: `Caddy` on `:80` and `:443`
- Domains: `stylyf.com`, `www.stylyf.com`

## Build and restart

From the repo root:

```bash
npm install
npm run build
systemctl restart stylyf
systemctl reload caddy
```

## systemd unit

File: `/etc/systemd/system/stylyf.service`

```ini
[Unit]
Description=Stylyf SolidStart App
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/stylyf
Environment=NODE_ENV=production
Environment=HOST=127.0.0.1
Environment=PORT=3001
ExecStart=/usr/bin/node /root/stylyf/.output/server/index.mjs
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

After creating or editing the unit:

```bash
systemctl daemon-reload
systemctl enable --now stylyf
```

## Caddy site block

File: `/etc/caddy/Caddyfile`

```caddy
searchupp.com, www.searchupp.com {
	encode zstd gzip
	reverse_proxy 127.0.0.1:3000
}

stylyf.com, www.stylyf.com {
	encode zstd gzip
	reverse_proxy 127.0.0.1:3001
}
```

Validate and reload:

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

## DNS

Required records:

```text
A      @      62.72.56.232
CNAME  www    stylyf.com
```

## Verification

```bash
systemctl status stylyf --no-pager
systemctl status caddy --no-pager
curl -I http://127.0.0.1:3001
curl -I https://stylyf.com
curl -I https://www.stylyf.com
```
