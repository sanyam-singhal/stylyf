import { expect, test } from "@playwright/test";
import { getAuthCredentials, installClientErrorGuards, signInThroughApi } from "./helpers";

const protectedRoutes = ["/", "/projects/new", "/projects/demo"] as const;

for (const path of protectedRoutes) {
  test(`unauthenticated ${path} redirects to login`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status() ?? 0).toBeLessThan(500);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Sign in to build." })).toBeVisible();
  });
}

test.describe("authenticated builder routes", () => {
  test.skip(!getAuthCredentials(), "Authenticated smoke requires configured Supabase test credentials.");

  test.beforeEach(async ({ page }) => {
    await signInThroughApi(page);
  });

  test("dashboard renders project creation entry points", async ({ page }) => {
    const assertNoClientErrors = installClientErrorGuards(page);
    const response = await page.goto("/");
    expect(response?.status() ?? 0).toBeLessThan(500);
    await expect(page.getByRole("heading", { name: "Build a small app from an idea." })).toBeVisible();
    await expect(page.getByRole("link", { name: /Start new app/i }).first()).toBeVisible();
    await expect(page.getByText("What you can build")).toBeVisible();
    assertNoClientErrors();
  });

  test("new project route only asks for an app name", async ({ page }) => {
    const assertNoClientErrors = installClientErrorGuards(page);
    const response = await page.goto("/projects/new");
    expect(response?.status() ?? 0).toBeLessThan(500);
    await expect(page.getByRole("heading", { name: "Give the idea a name." })).toBeVisible();
    await expect(page.getByLabel("App name")).toBeVisible();
    await expect(page.getByRole("button", { name: /Create and open studio/i })).toBeVisible();
    assertNoClientErrors();
  });

  test("demo studio renders chat, preview, spec controls, and review actions", async ({ page }) => {
    const assertNoClientErrors = installClientErrorGuards(page);
    const response = await page.goto("/projects/demo");
    expect(response?.status() ?? 0).toBeLessThan(500);
    await expect(page.locator("h1", { hasText: "ContentRank" })).toBeVisible();
    await expect(page.getByLabel("Next instruction")).toBeVisible();
    await expect(page.getByText("Preview").first()).toBeVisible();
    await expect(page.getByText("Spec panes")).toBeVisible();
    await expect(page.getByRole("button", { name: "Build draft" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Screenshot review/i })).toBeVisible();
    assertNoClientErrors();
  });
});
