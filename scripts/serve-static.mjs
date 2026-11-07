import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const dist = path.join(root, "dist");
const port = Number(process.env.PORT ?? process.argv[2] ?? 5178);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

// Mirrors nginx.conf: generated 301s first, then files, then a real 404 with the app shell.
const redirectsFile = path.join(root, "build", "redirects.json");
const redirects = new Map();
if (fs.existsSync(redirectsFile)) {
  for (const item of JSON.parse(fs.readFileSync(redirectsFile, "utf8"))) {
    redirects.set(item.from, item.to);
    redirects.set(item.from.replace(/\/$/, ""), item.to);
  }
}

function resolvePath(pathname) {
  const clean = decodeURIComponent(pathname).replace(/^\/+/, "");
  const direct = path.join(dist, clean);
  if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return { file: direct };
  const index = path.join(direct, "index.html");
  if (fs.existsSync(index)) return pathname.endsWith("/") ? { file: index } : { redirect: `${pathname}/` };
  return { file: path.join(dist, "404.html"), status: 404 };
}

const server = http.createServer((request, response) => {
  const parsed = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);
  const target = redirects.get(parsed.pathname);
  const resolved = target ? { redirect: target } : resolvePath(parsed.pathname);
  response.setHeader("X-Content-Type-Options", "nosniff");
  if (resolved.redirect) {
    response.writeHead(301, { Location: resolved.redirect });
    return response.end();
  }
  const ext = path.extname(resolved.file);
  response.statusCode = resolved.status ?? 200;
  response.setHeader("Content-Type", types[ext] ?? "application/octet-stream");
  fs.createReadStream(resolved.file).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Serving ${dist} at http://127.0.0.1:${port}`);
});
