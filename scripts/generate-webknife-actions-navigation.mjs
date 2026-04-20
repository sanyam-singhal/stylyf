import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const outDir = resolve("webknife", "actions-navigation");

const wait = ms => ({ action: "wait", ms });
const click = selector => ({ action: "click", selector });
const type = (selector, text, delayMs = 20) => ({ action: "type", selector, text, delayMs });
const press = key => ({ action: "press", key });
const waitForSelector = (selector, timeoutMs = 20000) => ({ action: "waitForSelector", selector, timeoutMs });

function baseSteps(slug) {
  return [
    waitForSelector("input[type='search']"),
    waitForSelector("[data-theme-preset-option='stylyf']"),
    click("[data-theme-preset-option='stylyf']"),
    click("[data-theme-segment='light']"),
    wait(450),
    click("[data-sidebar-cluster='tier-1-actions-navigation']"),
    wait(450),
    click(`[data-sidebar-component='${slug}']`),
    wait(900),
    waitForSelector(`[data-registry-card='${slug}']`),
    click(`[data-registry-card='${slug}'] [data-pane-trigger='source']`),
    waitForSelector(`[data-registry-card='${slug}'] pre code`),
    click(`[data-registry-card='${slug}'] [data-pane-trigger='preview']`),
    waitForSelector(`[data-demo='${slug}']`),
  ];
}

const flows = {
  button: [
    ...baseSteps("button"),
    click("[data-demo='button'] button:nth-of-type(1)"),
    wait(250),
    click("[data-demo='button'] button:nth-of-type(2)"),
    wait(250),
    click("[data-demo='button'] button:nth-of-type(4)"),
    wait(250),
  ],
  "icon-button": [
    ...baseSteps("icon-button"),
    click("[data-demo='icon-button'] button[aria-label='Create']"),
    wait(250),
    click("[data-demo='icon-button'] button[aria-label='Saved']"),
    wait(250),
    click("[data-demo='icon-button'] button[aria-label='Settings']"),
    wait(250),
  ],
  "link-button": [
    ...baseSteps("link-button"),
    click("[data-demo='link-button'] a[href='#theme-studio']"),
    wait(500),
    click("[data-sidebar-component='link-button']"),
    wait(700),
    waitForSelector("[data-demo='link-button']"),
  ],
  toggle: [
    ...baseSteps("toggle"),
    click("[data-demo='toggle'] button:nth-of-type(1)"),
    wait(250),
    click("[data-demo='toggle'] button:nth-of-type(1)"),
    wait(250),
    click("[data-demo='toggle'] button:nth-of-type(2)"),
    wait(250),
  ],
  "toggle-group": [
    ...baseSteps("toggle-group"),
    click("[data-demo='toggle-group'] [role='toolbar']:nth-of-type(1) button:nth-of-type(2)"),
    wait(250),
    click("[data-demo='toggle-group'] [role='toolbar']:nth-of-type(2) button:nth-of-type(2)"),
    wait(250),
    click("[data-demo='toggle-group'] [role='toolbar']:nth-of-type(2) button:nth-of-type(3)"),
    wait(250),
    press("ArrowRight"),
    wait(250),
  ],
  breadcrumb: [
    ...baseSteps("breadcrumb"),
    click("[data-demo='breadcrumb'] button[aria-label='Show collapsed breadcrumb items']"),
    wait(250),
    click("[data-demo='breadcrumb'] a[href='#tier-1-actions-navigation']"),
    wait(500),
    click("[data-sidebar-component='breadcrumb']"),
    wait(700),
    waitForSelector("[data-demo='breadcrumb']"),
  ],
  pagination: [
    ...baseSteps("pagination"),
    click("[data-demo='pagination'] button:has(svg.lucide-chevron-right)"),
    wait(250),
    click("[data-demo='pagination'] button[data-current='false']:nth-of-type(2)"),
    wait(250),
    click("[data-demo='pagination'] button:has(svg.lucide-chevron-left)"),
    wait(250),
  ],
};

mkdirSync(outDir, { recursive: true });

for (const [slug, steps] of Object.entries(flows)) {
  writeFileSync(resolve(outDir, `${slug}.yaml`), `${JSON.stringify(steps, null, 2)}\n`);
}

console.log(`Generated ${Object.keys(flows).length} Webknife flows in ${outDir}`);
