import { createServer as createHTTP, type Server } from "node:http";
import { createServer as createHTTPS } from "node:https";
import { connect, type Socket } from "node:net";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Browser, Page } from "@playwright/test";

async function listen(server: Server): Promise<number> {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Missing fixture address");
  return address.port;
}

/** All HTTP, including browser-followed 302 hops, terminates on this local fixture.
 * No application collaborators, Storage methods or browser redirect results are replaced.
 */
export async function withRedirectFixture(
  browser: Browser,
  fixture: {
    origin: string;
    redirect: string;
    document: (url: URL) => string;
    readHeaders?: Record<string, string>;
  },
  run: (page: Page, reads: string[], redirects: string[]) => Promise<void>,
) {
  const directory = mkdtempSync(join(tmpdir(), "tsdm-http-fixture-"));
  const key = join(directory, "key.pem"),
    cert = join(directory, "cert.pem");
  execFileSync(
    "openssl",
    [
      "req",
      "-x509",
      "-newkey",
      "rsa:2048",
      "-nodes",
      "-keyout",
      key,
      "-out",
      cert,
      "-days",
      "1",
      "-subj",
      "/CN=fixture.invalid",
    ],
    { stdio: "ignore" },
  );
  const built = readFileSync("dist/tsdm-workspace.user.js", "utf8");
  const reads: string[] = [],
    redirects: string[] = [];
  const sockets = new Set<Socket>();
  const track = (socket: Socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
    socket.on("error", () => socket.destroy());
  };
  const server = createHTTPS(
    { key: readFileSync(key), cert: readFileSync(cert) },
    (request, response) => {
      const url = new URL(
        request.url ?? "/",
        `https://${request.headers.host}`,
      );
      if (request.method !== "GET" || url.origin !== fixture.origin) {
        response.writeHead(404);
        response.end();
        return;
      }
      if (url.pathname === "/__workspace-fixture.js") {
        response.writeHead(200, {
          "content-type": "text/javascript; charset=utf-8",
        });
        response.end(built);
        return;
      }
      if (url.searchParams.get("mod") === "redirect") {
        redirects.push(url.searchParams.has("tsdmapp") ? "fetch" : "document");
        response.writeHead(302, { location: fixture.redirect });
        response.end();
        return;
      }
      if (url.searchParams.get("tsdmapp") === "json") {
        reads.push(url.href);
        response.writeHead(200, {
          "content-type": "application/json",
          ...fixture.readHeaders,
        });
        response.end(JSON.stringify({ document: fixture.document(url) }));
        return;
      }
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(
        `<html><body>Native fixture<script src="${fixture.origin}/__workspace-fixture.js"></script></body></html>`,
      );
    },
  );
  server.on("connection", track);
  const proxy = createHTTP((_request, response) => {
    response.writeHead(404);
    response.end();
  });
  proxy.on("connection", track);
  const port = await listen(server);
  proxy.on("connect", (_request, socket, head) => {
    const upstream = connect(port, "127.0.0.1", () => {
      socket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
      if (head.length) upstream.write(head);
      socket.pipe(upstream);
      upstream.pipe(socket);
    });
    track(upstream);
    socket.on("close", () => upstream.destroy());
    upstream.on("close", () => socket.destroy());
  });
  const proxyPort = await listen(proxy);
  const context = await browser.newContext({
    // Override the routed suite default; all network still ends at the local proxy.
    offline: false,
    proxy: { server: `http://127.0.0.1:${proxyPort}` },
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 900 },
  });
  try {
    await run(await context.newPage(), reads, redirects);
  } finally {
    await context.close();
    for (const socket of sockets) socket.destroy();
    await Promise.all([
      new Promise<void>((resolve) => server.close(() => resolve())),
      new Promise<void>((resolve) => proxy.close(() => resolve())),
    ]);
    rmSync(directory, { recursive: true, force: true });
  }
}
