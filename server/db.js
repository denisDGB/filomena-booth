import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { issueBoothUrl } from "./booth-url.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = process.env.DATA_DIR || join(root, "data");
const dbPath = join(dataDir, "invites.sqlite");
mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS invites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    booth_url TEXT NOT NULL,
    booth_json TEXT NOT NULL,
    expiry INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_invites_created ON invites(created_at);
`);

function newToken() {
  return randomBytes(16).toString("base64url");
}

export function createInvite({ name, email, phone }, password) {
  const cleanName = String(name || "").trim();
  if (!cleanName) throw new Error("name required");
  const token = newToken();
  const issued = issueBoothUrl(password);
  const created_at = new Date().toISOString();
  db.prepare(
    `INSERT INTO invites (token, name, email, phone, booth_url, booth_json, expiry, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    token,
    cleanName,
    String(email || "").trim().toLowerCase() || null,
    String(phone || "").replace(/[^\d+]/g, "").trim() || null,
    issued.url,
    issued.jsonStr,
    issued.expiry,
    created_at
  );
  return getByToken(token);
}

export function getByToken(token) {
  return db.prepare(`SELECT * FROM invites WHERE token = ?`).get(token) || null;
}

export function listInvites() {
  return db.prepare(`SELECT * FROM invites ORDER BY id DESC`).all();
}

export function deleteInvite(token) {
  const info = db.prepare(`DELETE FROM invites WHERE token = ?`).run(token);
  return info.changes > 0;
}

export function publicInvite(row) {
  if (!row) return null;
  return {
    token: row.token,
    name: row.name,
    expiry: row.expiry,
  };
}
