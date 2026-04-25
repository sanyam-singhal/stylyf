#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/stylyf-usage-smoke-XXXXXX")"
PORT="${STYLYF_SMOKE_PORT:-4891}"
BASE_URL="http://127.0.0.1:${PORT}"
SCREENSHOT_DIR="${APP_DIR}/stylyf-smoke-screenshots"
LOG_DIR="${APP_DIR}/stylyf-smoke-logs"
mkdir -p "${LOG_DIR}"

run_with_heartbeat() {
  local label="$1"
  shift
  local log_file="${LOG_DIR}/${label}.log"
  "$@" >"${log_file}" 2>&1 &
  local pid="$!"
  local status=0
  while kill -0 "${pid}" 2>/dev/null; do
    sleep 15
    if kill -0 "${pid}" 2>/dev/null; then
      echo "Still running: ${label}"
    fi
  done
  wait "${pid}" || status="$?"
  if [[ "${status}" != "0" ]]; then
    echo "Command failed: ${label}"
    tail -120 "${log_file}" || true
  else
    echo "Completed: ${label} (log: ${log_file})"
  fi
  return "${status}"
}

echo "Building Stylyf CLI..."
npm --prefix "${ROOT_DIR}" run cli:build

echo "Generating portable rich internal-tool app at ${APP_DIR}..."
node "${ROOT_DIR}/packages/stylyf-cli/dist/bin.js" generate \
  --spec "${ROOT_DIR}/packages/stylyf-cli/examples/v1.0/internal-tool.rich.json" \
  --target "${APP_DIR}" \
  --no-install

echo "Installing generated app dependencies and post-generate artifacts..."
run_with_heartbeat npm-install npm --prefix "${APP_DIR}" install
run_with_heartbeat auth-generate npm --prefix "${APP_DIR}" run auth:generate
run_with_heartbeat db-generate npm --prefix "${APP_DIR}" run db:generate

echo "Checking and building generated app..."
run_with_heartbeat check npm --prefix "${APP_DIR}" run check
run_with_heartbeat build npm --prefix "${APP_DIR}" run build

mkdir -p "${SCREENSHOT_DIR}"

echo "Starting generated app on ${BASE_URL}..."
setsid bash -c '
  cd "$1"
  env \
    APP_BASE_URL="$2" \
    BETTER_AUTH_URL="$2" \
    BETTER_AUTH_SECRET="verify-secret-minimum-32-characters" \
    DATABASE_URL="file:./local.db" \
    S3_BUCKET="verify-bucket" \
    AWS_REGION="auto" \
    npm run start -- --port "$3"
' _ "${APP_DIR}" "${BASE_URL}" "${PORT}" &
SERVER_PID="$!"

cleanup() {
  kill -TERM "-${SERVER_PID}" 2>/dev/null || true
}
trap cleanup EXIT

echo "Capturing Playwright screenshots..."
BASE_URL="${BASE_URL}" SCREENSHOT_DIR="${SCREENSHOT_DIR}" node --input-type=module <<'NODE'
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const baseUrl = process.env.BASE_URL;
const screenshotDir = process.env.SCREENSHOT_DIR;
if (!baseUrl || !screenshotDir) {
  throw new Error("BASE_URL and SCREENSHOT_DIR are required");
}

async function waitForHttp(url) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < 30_000) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolvePromise => setTimeout(resolvePromise, 500));
  }
  throw new Error(`Timed out waiting for ${url}: ${lastError?.message ?? "unknown error"}`);
}

await mkdir(screenshotDir, { recursive: true });
await waitForHttp(baseUrl);

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await page.screenshot({ path: resolve(screenshotDir, "login-redirect.png"), fullPage: true });
  let bodyText = await page.locator("body").innerText();
  if (!bodyText.includes("Sign in")) {
    throw new Error("Expected protected home route to redirect to the generated login page");
  }

  await page.goto(`${baseUrl}/tickets/new`, { waitUntil: "networkidle" });
  await page.screenshot({ path: resolve(screenshotDir, "protected-create-redirect.png"), fullPage: true });
  bodyText = await page.locator("body").innerText();
  if (!bodyText.includes("Sign in")) {
    throw new Error("Expected protected create route to redirect to the generated login page");
  }

  await page.getByLabel("Email").fill("agent@example.com");
  await page.getByLabel("Password").fill("local-password");
  await page.getByRole("button", { name: "Need an account? Create one" }).click();
  await page.waitForFunction(() => document.body.innerText.includes("Create your account"));
  await page.screenshot({ path: resolve(screenshotDir, "auth-toggle.png"), fullPage: true });
} finally {
  await browser.close();
}
NODE

echo "Generated app smoke passed."
echo "App root: ${APP_DIR}"
echo "Screenshots: ${SCREENSHOT_DIR}"
