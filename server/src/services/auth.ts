import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { loadStore, saveStore } from "../db.js";

const TOKEN_DAYS = 30;

export type AuthUserRow = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: "user" | "admin";
};

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 32);
  const prev = Buffer.from(hash, "hex");
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
}

export function newToken() {
  return randomBytes(32).toString("hex");
}

export function tokenExpiry() {
  return new Date(Date.now() + TOKEN_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export function publicUser(u: AuthUserRow) {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role || "user" };
}

export function readToken(req: Request) {
  const h = req.headers.authorization || "";
  if (h.startsWith("Bearer ")) return h.slice(7).trim();
  return String(req.headers["x-auth-token"] || "");
}

export function getUserFromReq(req: Request) {
  const token = readToken(req);
  if (!token) return null;
  const store = loadStore();
  const user = store.users.find((u) => u.token === token && new Date(u.token_expires) > new Date());
  return user || null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  (req as Request & { userId: number }).userId = user.id;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  if ((user.role || "user") !== "admin") return res.status(403).json({ error: "forbidden" });
  (req as Request & { userId: number }).userId = user.id;
  next();
}

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(5),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().min(3),
  password: z.string().min(6),
});

export function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { name, email, phone, password } = parsed.data;
  const store = loadStore();
  const emailNorm = email.trim().toLowerCase();
  if (store.users.some((u) => u.email === emailNorm)) {
    return res.status(409).json({ error: "email_taken" });
  }
  const user = {
    id: store.seq.user++,
    created_at: new Date().toISOString(),
    name: name.trim(),
    email: emailNorm,
    phone: phone.trim(),
    password_hash: hashPassword(password),
    token: newToken(),
    token_expires: tokenExpiry(),
    role: "user" as const,
  };
  store.users.push(user);
  saveStore(store);
  res.status(201).json({ token: user.token, user: publicUser(user) });
}

export function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const store = loadStore();
  const key = parsed.data.email.trim().toLowerCase();
  const user = store.users.find((u) => u.email === key || u.phone === parsed.data.email.trim());
  if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
    return res.status(401).json({ error: "invalid_credentials" });
  }
  if (!user.role) user.role = "user";
  user.token = newToken();
  user.token_expires = tokenExpiry();
  saveStore(store);
  res.json({ token: user.token, user: publicUser(user) });
}

export function me(req: Request, res: Response) {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  res.json({ user: publicUser(user) });
}

export function logout(req: Request, res: Response) {
  const user = getUserFromReq(req);
  if (user) {
    const store = loadStore();
    const row = store.users.find((u) => u.id === user.id);
    if (row) {
      row.token = "";
      row.token_expires = new Date(0).toISOString();
      saveStore(store);
    }
  }
  res.json({ ok: true });
}
