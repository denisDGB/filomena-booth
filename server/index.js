import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";
import { createInvite, getByToken, listInvites, deleteInvite, publicInvite } from "./db.js";
import { issueBoothUrl } from "./booth-url.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT || 3001);
const publicUrl = (process.env.PUBLIC_URL || `http://localhost:${port}`).replace(/\/$/, "");
const adminSecret = process.env.ADMIN_SECRET || "";
const boothPassword = process.env.BOOTH_AUTH_PASSWORD ?? "";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function json(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return null;
  }
}

function requireAdmin(req, res) {
  if (!adminSecret || req.headers["x-admin-secret"] !== adminSecret) {
    json(res, 401, { error: "unauthorized" });
    return false;
  }
  return true;
}

function invitePageUrl(token) {
  return `${publicUrl}/i/${token}`;
}

async function serveFile(res, filePath) {
  try {
    const st = await stat(filePath);
    if (!st.isFile()) return json(res, 404, { error: "not found" });
    const data = await readFile(filePath);
    const type = MIME[extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    res.end(data);
  } catch {
    json(res, 404, { error: "not found" });
  }
}

function adminRow(row) {
  return {
    token: row.token,
    name: row.name,
    email: row.email,
    phone: row.phone,
    expiry: row.expiry,
    created_at: row.created_at,
    url: invitePageUrl(row.token),
  };
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const { pathname } = url;
  const method = req.method || "GET";

  try {
    if ((method === "GET" || method === "HEAD") && /^\/i\/[^/]+\/?$/.test(pathname)) {
      return serveFile(res, join(root, "i", "index.html"));
    }
    if (method === "GET" && (pathname === "/admin" || pathname === "/admin/")) {
      return serveFile(res, join(root, "admin", "index.html"));
    }

    if (pathname === "/api/health" && method === "GET") {
      return json(res, 200, {
        ok: true,
        boothPasswordSet: Boolean(String(boothPassword).trim()),
      });
    }

    if (pathname === "/api/admin/ping" && method === "GET") {
      if (!requireAdmin(req, res)) return;
      return json(res, 200, { ok: true, publicUrl });
    }

    if (pathname === "/api/invites" && method === "GET") {
      if (!requireAdmin(req, res)) return;
      return json(res, 200, { invites: listInvites().map(adminRow), publicUrl });
    }

    if (pathname === "/api/invites" && method === "POST") {
      if (!requireAdmin(req, res)) return;
      const body = await readBody(req);
      if (!body?.name) return json(res, 400, { error: "name required" });
      try {
        const row = createInvite(body, boothPassword);
        return json(res, 201, { invite: adminRow(row) });
      } catch (e) {
        return json(res, 400, { error: e.message });
      }
    }

    const tokMatch = pathname.match(/^\/api\/invites\/([^/]+)(?:\/(qr))?$/);
    if (tokMatch) {
      const token = decodeURIComponent(tokMatch[1]);
      const action = tokMatch[2] || null;
      const row = getByToken(token);
      if (!row) return json(res, 404, { error: "not found" });

      if (method === "GET" && action === "qr") {
        const png = await QRCode.toBuffer(row.booth_url, {
          type: "png",
          width: 480,
          margin: 1,
          errorCorrectionLevel: "M",
        });
        res.writeHead(200, {
          "Content-Type": "image/png",
          "Cache-Control": "no-store",
        });
        return res.end(png);
      }

      if (method === "GET" && !action) {
        return json(res, 200, { invite: publicInvite(row) });
      }

      if (method === "DELETE" && !action) {
        if (!requireAdmin(req, res)) return;
        deleteInvite(token);
        return json(res, 200, { ok: true, invites: listInvites().map(adminRow) });
      }
    }

    if (pathname === "/api/booth/preview" && method === "GET") {
      if (!requireAdmin(req, res)) return;
      const sample = issueBoothUrl(boothPassword);
      return json(res, 200, {
        json: sample.jsonStr,
        url: sample.url,
        passwordSet: Boolean(String(boothPassword).trim()),
      });
    }

    if (method === "GET" || method === "HEAD") {
      const rel = pathname === "/" ? "i/index.html" : pathname.slice(1);
      if (rel.startsWith("data/") || rel === ".env" || rel.startsWith("server/")) {
        return json(res, 404, { error: "not found" });
      }
      return serveFile(res, join(root, rel));
    }

    json(res, 405, { error: "method not allowed" });
  } catch (err) {
    console.error(err);
    json(res, 500, { error: "server error" });
  }
});

server.listen(port, () => {
  console.log(`Filomena booth → ${publicUrl}`);
  console.log(`Admin: ${publicUrl}/admin`);
  if (!adminSecret) console.log("ADMIN_SECRET vacío — el panel no aceptará login");
  if (!String(boothPassword).trim()) {
    console.log("BOOTH_AUTH_PASSWORD vacío — el QR se firma con secreto vacío (la cabina no activará hasta poner la clave de Gera)");
  }
});
