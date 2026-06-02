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

function resolvePath(url) {
  const parsed = new URL(url, `http://127.0.0.1:${port}`);
  const clean = decodeURIComponent(parsed.pathname).replace(/^\/+/, "");
  const direct = path.join(dist, clean);
  if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;
  const index = path.join(direct, "index.html");
  if (fs.existsSync(index)) return index;
  return path.join(dist, "index.html");
}

const server = http.createServer((request, response) => {
  const filePath = resolvePath(request.url ?? "/");
  const ext = path.extname(filePath);
  response.setHeader("Content-Type", types[ext] ?? "application/octet-stream");
  response.setHeader("X-Content-Type-Options", "nosniff");
  fs.createReadStream(filePath).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Serving ${dist} at http://127.0.0.1:${port}`);
});
