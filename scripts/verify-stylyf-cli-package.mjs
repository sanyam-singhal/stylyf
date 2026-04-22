import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoDir = resolve(scriptDir, "..");
const packageDir = resolve(repoDir, "packages/stylyf-cli");

const verifyIr = {
  name: "Pack Verify",
  shell: "topbar-app",
  theme: {
    preset: "emerald",
    mode: "light",
    radius: "trim",
    density: "comfortable",
    spacing: "tight",
    fonts: {
      fancy: "Fraunces",
      sans: "Manrope",
      mono: "IBM Plex Mono",
    },
  },
  database: {
    dialect: "sqlite",
    migrations: "drizzle-kit",
    schema: [
      {
        table: "records",
        timestamps: true,
        columns: [
          { name: "id", type: "uuid", primaryKey: true },
          { name: "name", type: "varchar" },
        ],
      },
    ],
  },
  auth: {
    provider: "better-auth",
    mode: "session",
    features: {
      emailPassword: true,
    },
  },
  storage: {
    provider: "s3",
    mode: "presigned-put",
    bucketAlias: "uploads",
  },
  apis: [
    {
      path: "/api/uploads/presign",
      method: "POST",
      type: "presign-upload",
      name: "create-record-upload",
      auth: "user",
    },
  ],
  server: [
    {
      name: "records.list",
      type: "query",
      resource: "records",
      auth: "user",
    },
  ],
  routes: [
    {
      path: "/",
      page: "dashboard",
      title: "Package Verification",
      sections: [
        {
          layout: "grid",
          children: [{ component: "stat-card" }, { component: "stat-grid" }],
        },
        {
          layout: "stack",
          children: [{ component: "activity-feed" }, { component: "notification-list" }],
        },
      ],
    },
  ],
};

async function run(cmd, args, cwd) {
  return execFileAsync(cmd, args, {
    cwd,
    maxBuffer: 1024 * 1024 * 50,
  });
}

async function main() {
  await run("npm", ["run", "cli:build"], repoDir);

  const packRoot = await mkdtemp(join(tmpdir(), "stylyf-pack-"));
  const verifyRoot = resolve(packRoot, "verify-install");

  await mkdir(verifyRoot, { recursive: true });

  const { stdout: packStdout } = await run("npm", ["pack", "--json"], packageDir);
  const [packResult] = JSON.parse(packStdout);
  const tarballName = packResult?.filename;

  if (!tarballName) {
    throw new Error("npm pack did not return a tarball filename");
  }

  const tarballPath = resolve(packageDir, tarballName);
  const { stdout: tarList } = await run("tar", ["-tf", tarballPath], packageDir);
  const tarEntries = tarList.split("\n").filter(Boolean);
  const requiredEntries = [
    "package/dist/bin.js",
    "package/dist/manifests/generated/theme-grammar.json",
    "package/dist/manifests/generated/assembly-registry.json",
    "package/dist/manifests/generated/backend-manifests.json",
    "package/dist/templates/app-shells/sidebar-app.tsx.tpl",
    "package/dist/templates/server-functions/list-query.ts.tpl",
    "package/dist/templates/api-routes/presign-upload.ts.tpl",
    "package/dist/assets/source/src/app.css",
    "package/dist/assets/source/src/components/registry/actions-navigation/button.tsx",
  ];

  for (const entry of requiredEntries) {
    if (!tarEntries.includes(entry)) {
      throw new Error(`Packed tarball is missing required entry: ${entry}`);
    }
  }

  await writeFile(
    resolve(verifyRoot, "package.json"),
    JSON.stringify(
      {
        name: "stylyf-pack-verify",
        private: true,
        type: "module",
      },
      null,
      2,
    ) + "\n",
  );

  await run("npm", ["install", tarballPath], verifyRoot);

  const stylyfBin = resolve(verifyRoot, "node_modules/.bin/stylyf");
  const { stdout: helpStdout } = await run(stylyfBin, ["--help"], verifyRoot);
  if (!helpStdout.includes("Stylyf CLI")) {
    throw new Error("Installed stylyf binary did not return expected help output");
  }

  await run(stylyfBin, ["intro", "--output", "STYLYF_INTRO.md"], verifyRoot);
  const intro = await readFile(resolve(verifyRoot, "STYLYF_INTRO.md"), "utf8");
  if (!intro.includes("Better Auth") || !intro.includes("sqlite") || !intro.includes("S3")) {
    throw new Error("Generated intro output does not mention the backend capability surface");
  }

  await writeFile(resolve(verifyRoot, "verify-ir.json"), `${JSON.stringify(verifyIr, null, 2)}\n`);
  await run(stylyfBin, ["generate", "--ir", "verify-ir.json", "--target", "./generated-app"], verifyRoot);
  await run("npm", ["run", "check"], resolve(verifyRoot, "generated-app"));
  await run("npm", ["run", "build"], resolve(verifyRoot, "generated-app"));

  const requiredGeneratedFiles = [
    "generated-app/drizzle.config.ts",
    "generated-app/src/routes/api/auth/[...auth].ts",
    "generated-app/src/routes/api/uploads/presign.ts",
    "generated-app/src/lib/storage.ts",
    "generated-app/src/lib/server/queries/records-list.ts",
  ];

  for (const relativePath of requiredGeneratedFiles) {
    const absolutePath = resolve(verifyRoot, relativePath);
    try {
      await readFile(absolutePath, "utf8");
    } catch {
      throw new Error(`Generated packaged app is missing required file: ${relativePath}`);
    }
  }

  const { stdout: importScan } = await run(
    "rg",
    ["-n", "/root/stylyf|@depths/stylyf-cli|@stylyf/cli", "generated-app"],
    verifyRoot,
  ).catch(error => {
    if (error.code === 1) {
      return { stdout: "" };
    }
    throw error;
  });

  if (importScan.trim()) {
    throw new Error(`Generated packaged app still references the repo or CLI package:\n${importScan}`);
  }

  process.stdout.write(
    [
      `Packed CLI tarball: ${tarballPath}`,
      `Verification root: ${verifyRoot}`,
      "Verified:",
      "  - tarball bundles dist manifests, templates, and source assets",
      "  - installed stylyf binary runs outside the repo",
      "  - packaged intro command reflects backend capabilities",
      "  - packaged generate command works in a clean temp directory",
      "  - generated backend files are present",
      "  - generated app does not import the repo or CLI package",
      "  - generated app checks and builds successfully",
    ].join("\n") + "\n",
  );

  await rm(tarballPath, { force: true });
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
