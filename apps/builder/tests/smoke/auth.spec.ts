import { expect, test } from "@playwright/test";
import { installClientErrorGuards } from "./helpers";

test("login route renders the internal auth form", async ({ page }) => {
  const assertNoClientErrors = installClientErrorGuards(page);
  const response = await page.goto("/login");
  expect(response?.status() ?? 0).toBeLessThan(500);
  await expect(page.getByRole("heading", { name: "Sign in to build." })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  assertNoClientErrors();
});
