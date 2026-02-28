import { extname, join, normalize } from "node:path";

const distDir = join(import.meta.dir, "..", "dist");
const port = Number(process.env.PORT ?? 5173);
const controlApiUrl = process.env.CONTROL_API_URL ?? "http://localhost:3000";
const runtimeAdminUrl =
  process.env.RUNTIME_ADMIN_URL ?? "http://localhost:9100";
const internalToken = process.env.NEXIS_INTERNAL_TOKEN?.trim() ?? "";

const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const normalizedDist = normalize(distDir);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sessionCheckHeaders(request: Request): Headers {
  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  if (cookie) {
    headers.set("cookie", cookie);
  }
  const userAgent = request.headers.get("user-agent");
  if (userAgent) {
    headers.set("user-agent", userAgent);
  }
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    headers.set("x-forwarded-for", forwardedFor);
  }
  return headers;
}

async function hasAuthenticatedDashboardSession(
  request: Request,
): Promise<boolean> {
  const sessionUrl = new URL("/auth/get-session", controlApiUrl);
  try {
    const response = await fetch(
      new Request(sessionUrl, {
        method: "GET",
        headers: sessionCheckHeaders(request),
      }),
    );
    if (!response.ok) {
      return false;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return false;
    }
    const payload: unknown = await response.json();
    return (
      isRecord(payload) && isRecord(payload.session) && isRecord(payload.user)
    );
  } catch {
    return false;
  }
}

function contentTypeFor(pathname: string): string {
  return (
    mimeTypes[extname(pathname).toLowerCase()] ?? "application/octet-stream"
  );
}

function safeResolve(pathname: string): string | null {
  const normalizedPath = pathname.replace(/^\/+/, "");
  const candidate = normalize(join(distDir, normalizedPath));
  if (!candidate.startsWith(normalizedDist)) {
    return null;
  }
  return candidate;
}

async function serveStatic(pathname: string): Promise<Response | null> {
  const resolved = safeResolve(pathname);
  if (!resolved) {
    return new Response("Forbidden", { status: 403 });
  }

  const file = Bun.file(resolved);
  if (!(await file.exists())) {
    return null;
  }

  const cacheControl = pathname.endsWith(".html")
    ? "no-store"
    : "public, max-age=31536000, immutable";
  return new Response(file, {
    headers: {
      "content-type": contentTypeFor(pathname),
      "cache-control": cacheControl,
    },
  });
}

function buildProxyRequest(
  upstreamUrl: URL,
  request: Request,
  extraHeaders: Record<string, string> = {},
): Request {
  const headers = new Headers(request.headers);
  for (const [key, value] of Object.entries(extraHeaders)) {
    if (value) {
      headers.set(key, value);
    }
  }

  return new Request(upstreamUrl, {
    method: request.method,
    headers,
    body: request.body,
    redirect: request.redirect,
  });
}

Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response("ok", {
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }

    if (url.pathname.startsWith("/api/")) {
      const upstreamPath = url.pathname.slice("/api".length) || "/";
      const upstreamUrl = new URL(
        `${upstreamPath}${url.search}`,
        controlApiUrl,
      );
      return fetch(buildProxyRequest(upstreamUrl, request));
    }

    if (url.pathname.startsWith("/rt/")) {
      const authenticated = await hasAuthenticatedDashboardSession(request);
      if (!authenticated) {
        return Response.json(
          { error: "unauthorized" },
          {
            status: 401,
            headers: {
              "cache-control": "no-store",
            },
          },
        );
      }

      const upstreamPath = url.pathname.slice("/rt".length) || "/";
      const upstreamUrl = new URL(
        `${upstreamPath}${url.search}`,
        runtimeAdminUrl,
      );
      return fetch(
        buildProxyRequest(upstreamUrl, request, {
          "x-nexis-internal-token": internalToken,
        }),
      );
    }

    const staticPath = url.pathname === "/" ? "/index.html" : url.pathname;
    const staticResponse = await serveStatic(staticPath);
    if (staticResponse) {
      return staticResponse;
    }

    // Serve SPA entry for route-like paths and let client-side router handle it.
    if (!extname(url.pathname)) {
      const spaEntry = await serveStatic("/index.html");
      if (spaEntry) {
        return spaEntry;
      }
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`dashboard-ui listening on :${port}`);
