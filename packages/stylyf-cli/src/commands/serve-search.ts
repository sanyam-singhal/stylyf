import { createServer } from "node:http";
import { buildSearchIndex, querySearchIndex } from "../search/index.js";

export async function runServeSearchCommand(args: string[]) {
  const portIndex = args.findIndex(arg => arg === "--port");
  const port = portIndex >= 0 ? Number(args[portIndex + 1]) : 4310;
  const index = await buildSearchIndex();

  const server = createServer(async (request, response) => {
    if (!request.url) {
      response.writeHead(400, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Missing request URL" }));
      return;
    }

    const url = new URL(request.url, `http://127.0.0.1:${port}`);

    if (url.pathname === "/health") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ ok: true, entries: index.metadata.count }));
      return;
    }

    if (url.pathname === "/search") {
      const query = url.searchParams.get("q") ?? "";
      const limit = Number(url.searchParams.get("limit") ?? "10");
      const results = await querySearchIndex(query, { limit: Number.isFinite(limit) ? limit : 10 });
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify(results));
      return;
    }

    if (url.pathname.startsWith("/item/")) {
      const id = decodeURIComponent(url.pathname.replace(/^\/item\//, ""));
      const entry = index.byId[id];

      if (!entry) {
        response.writeHead(404, { "content-type": "application/json" });
        response.end(JSON.stringify({ error: `Unknown item: ${id}` }));
        return;
      }

      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify(entry));
      return;
    }

    response.writeHead(404, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "Not found" }));
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve());
  });

  process.stdout.write(`Stylyf search server listening on http://127.0.0.1:${port}\n`);

  return await new Promise<number>(resolve => {
    const shutdown = () => {
      server.close(() => resolve(0));
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  });
}

