# Stylyf Deployment

Stylyf is deployed directly from the repository checkout. The live website is the landing app at `apps/landing`.

## Production shape

- Repo path: `/root/stylyf`
- App path: `/root/stylyf/apps/landing`
- App runtime: `apps/landing/.output/server/index.mjs`
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
Description=Stylyf Landing App
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/stylyf/apps/landing
Environment=NODE_ENV=production
Environment=HOST=127.0.0.1
Environment=PORT=3001
ExecStart=/usr/bin/node /root/stylyf/apps/landing/.output/server/index.mjs
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
stylyf.com, www.stylyf.com {
	encode zstd gzip
	reverse_proxy 127.0.0.1:3001 {
		header_up -Accept-Encoding
		transport http {
			compression off
		}
	}
}
```

Validate and reload:

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

## Update flow

```bash
git pull
npm install
npm run build
systemctl restart stylyf
systemctl reload caddy
```

## Verification

```bash
systemctl status stylyf --no-pager
systemctl status caddy --no-pager
curl -I http://127.0.0.1:3001
curl -I https://stylyf.com
curl -I https://www.stylyf.com
```
