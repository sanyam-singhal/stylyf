import type { AppIR } from "../compiler/generated-app.js";

function serviceName(app: AppIR) {
  return app.deployment?.serviceName ?? app.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function renderGeneratedDeploymentMarkdown(app: AppIR) {
  const profile = app.deployment?.profile ?? "none";
  return [
    "# Deployment",
    "",
    `Profile: ${profile}`,
    "",
    profile === "none"
      ? "No deployment files were requested. Build locally with `npm run build` and deploy the generated source using your platform of choice."
      : "Deployment scaffolding is source-only and opt-in. Review all paths, users, domains, and environment values before applying it.",
    "",
    "## Common Commands",
    "",
    "```bash",
    "npm install",
    "npm run preflight",
    "npm run build",
    "npm run start",
    "```",
    "",
    app.deployment?.domain ? `Domain: ${app.deployment.domain}` : "",
    profile === "systemd-caddy" ? "Systemd and Caddy examples are emitted under `deploy/` and contain no stateful scripts." : "",
    "",
  ].filter(Boolean).join("\n");
}

export function renderGeneratedDockerfile(app: AppIR) {
  return [
    "FROM node:22-alpine AS deps",
    "WORKDIR /app",
    "COPY package*.json ./",
    "RUN npm ci",
    "",
    "FROM node:22-alpine AS build",
    "WORKDIR /app",
    "COPY --from=deps /app/node_modules ./node_modules",
    "COPY . .",
    "RUN npm run build",
    "",
    "FROM node:22-alpine AS runner",
    "WORKDIR /app",
    "ENV NODE_ENV=production",
    "COPY --from=build /app .",
    "EXPOSE 3000",
    `LABEL org.opencontainers.image.title=${JSON.stringify(app.name)}`,
    'CMD ["npm", "run", "start"]',
    "",
  ].join("\n");
}

export function renderGeneratedSystemdUnit(app: AppIR) {
  const service = serviceName(app);
  return [
    `[Unit]`,
    `Description=${app.name} SolidStart app`,
    "After=network.target",
    "",
    "[Service]",
    "Type=simple",
    `WorkingDirectory=/opt/${service}`,
    `EnvironmentFile=/opt/${service}/.env.production`,
    "ExecStart=/usr/bin/npm run start",
    "Restart=on-failure",
    "RestartSec=5",
    "NoNewPrivileges=true",
    "PrivateTmp=true",
    "ProtectSystem=full",
    "",
    "[Install]",
    "WantedBy=multi-user.target",
    "",
  ].join("\n");
}

export function renderGeneratedCaddyfile(app: AppIR) {
  const domain = app.deployment?.domain ?? "example.com";
  return [
    `${domain} {`,
    "  encode zstd gzip",
    "  reverse_proxy 127.0.0.1:3000",
    "  header {",
    "    X-Content-Type-Options nosniff",
    "    Referrer-Policy strict-origin-when-cross-origin",
    "  }",
    "}",
    "",
  ].join("\n");
}
