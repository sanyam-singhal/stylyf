import { expect, test, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getAuthCredentials, installClientErrorGuards, signInThroughApi } from "../smoke/helpers";

const runDogfood = process.env.STYLYF_BUILDER_RUN_DOGFOOD === "1";

test.skip(!runDogfood, "Set STYLYF_BUILDER_RUN_DOGFOOD=1 to run the full internal builder dogfood smoke.");
test.skip(!getAuthCredentials(), "Dogfood smoke requires configured Supabase builder test credentials.");

test.setTimeout(12 * 60 * 1000);

async function clickAndExpect(page: Page, buttonName: string | RegExp, expectedText: string | RegExp, timeout = 90_000) {
  await test.step(`run ${String(buttonName)}`, async () => {
    await page.getByRole("button", { name: buttonName }).click();
    await expect(page.getByText(expectedText).first()).toBeVisible({ timeout });
  });
}

async function saveCurrentSpecPane(page: Page, expectedText: string | RegExp) {
  await page.getByRole("button", { name: "Save pane" }).click();
  await expect(page.getByText(expectedText).first()).toBeVisible({ timeout: 30_000 });
}

test("creates and drives a generated app through the internal builder loop", async ({ page }) => {
  const assertNoClientErrors = installClientErrorGuards(page);
  await signInThroughApi(page);

  await test.step("create project with only a name", async () => {
    await page.goto("/projects/new");
    await page.getByLabel("App name").fill(`Dogfood Draft ${Date.now()}`);
    await page.getByRole("button", { name: /Create and open studio/i }).click();
    await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+$/i, { timeout: 90_000 });
    await expect(page.getByLabel("Next instruction")).toBeVisible();
  });

  await page.getByLabel("Toggle advanced controls").click();
  await expect(page.locator(".control-details")).toHaveAttribute("open", "");

  await test.step("save explicit Stylyf IR panes", async () => {
    await page.locator('textarea[name="specText"]').fill(JSON.stringify({
      app: {
        description: "A compact dogfood app that proves the builder can scaffold a useful SolidStart draft.",
      },
    }, null, 2));
    await saveCurrentSpecPane(page, "Saved brief spec pane.");

    await page.getByRole("tab", { name: "Screens" }).click();
    await page.locator('textarea[name="specText"]').fill(JSON.stringify({
      surfaces: [
        {
          name: "Home",
          kind: "landing",
          path: "/",
          audience: "user",
          sections: [
            { kind: "hero", title: "Dogfood builder draft", body: "A generated app produced by Stylyf Builder." },
            { kind: "feature-grid", title: "What this proves" },
          ],
        },
      ],
      navigation: {
        primary: [{ label: "Home", href: "/" }],
      },
    }, null, 2));
    await saveCurrentSpecPane(page, "Saved routes spec pane.");
  });

  await clickAndExpect(page, "Prepare outline", "Composed Stylyf spec.");
  await clickAndExpect(page, "Check outline", "Validated Stylyf spec.");
  await clickAndExpect(page, "Preview plan", "Planned Stylyf generation.");
  await clickAndExpect(page, "Build draft", "Built the app draft source.", 120_000);
  await clickAndExpect(page, "Install app", /Installed generated app dependencies|dependencies are already installed/i, 180_000);
  await clickAndExpect(page, "Quality check", "Generated app typecheck passed.", 180_000);
  await clickAndExpect(page, "Production build", "Generated app production build passed.", 180_000);

  await test.step("start preview and run screenshot review", async () => {
    await page.getByRole("button", { name: "Open" }).click();
    await expect(page.locator("iframe.preview-frame")).toBeVisible({ timeout: 60_000 });
    await clickAndExpect(page, /Screenshot review/i, "Screenshot review completed.", 120_000);
  });

  await test.step("exercise browser-direct reference asset lifecycle", async () => {
    const referenceDir = join(tmpdir(), "stylyf-builder-dogfood");
    mkdirSync(referenceDir, { recursive: true });
    const referencePath = join(referenceDir, "reference.txt");
    writeFileSync(referencePath, "Stylyf Builder dogfood reference.\n", "utf8");

    await page.setInputFiles('input[aria-label="Attach design reference"]', referencePath);
    await expect(page.getByText(/Attached reference\.txt/i)).toBeVisible({ timeout: 60_000 });
    await expect(page.getByLabel("Attached references")).toContainText("reference.txt");
    await page.getByLabel("Open reference.txt").click();
    await expect(page.getByText(/Opened reference\.txt/i)).toBeVisible({ timeout: 30_000 });
    await page.getByLabel("Delete reference.txt").click();
    await expect(page.getByText("Reference deleted.")).toBeVisible({ timeout: 30_000 });
  });

  assertNoClientErrors();
});
