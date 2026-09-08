import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Request, Response } from "express";
import { createHash } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cacheDir = path.join(__dirname, "..", "..", "data", "imgcache");

const ALLOW = [
  "ci.encar.com",
  "www.encar.com",
  "encar.com",
  "byteimg.com",
  "dcarimg.com",
  "dcdapp.com",
  "dongchedi.com",
  "toutiaoimg.com",
  "ibytedtos.com",
  "pstatp.com",
  "autohome.com.cn",
  "che168.com",
  "wsrv.nl",
  "images.weserv.nl",
];

function hostOk(hostname: string) {
  const h = hostname.toLowerCase();
  return ALLOW.some((d) => h === d || h.endsWith(`.${d}`));
}

function isChinaHost(hostname: string) {
  const h = hostname.toLowerCase();
  return (
    h.includes("byteimg") ||
    h.includes("dcarimg") ||
    h.includes("dcd") ||
    h.includes("toutiao") ||
    h.includes("dongchedi") ||
    h.includes("pstatp")
  );
}

function refererFor(hostname: string) {
  if (hostname.includes("encar")) return "https://www.encar.com/";
  if (isChinaHost(hostname)) return "https://www.dongchedi.com/";
  if (hostname.includes("che168") || hostname.includes("autohome")) return "https://www.che168.com/";
  return "https://www.google.com/";
}

function decodeRaw(raw: string) {
  let u = raw;
  for (let i = 0; i < 3; i++) {
    try {
      const next = decodeURIComponent(u);
      if (next === u) break;
      u = next;
    } catch {
      break;
    }
  }
  return u;
}

/** Soft cleanup — keep signed Dongchedi URL intact. */
export function normalizeChinaImageUrl(url: string) {
  if (!url) return "";
  return url.trim();
}

function mirrorUrl(raw: string) {
  const bare = raw.replace(/^https?:\/\//i, "");
  return [
    `https://wsrv.nl/?url=${encodeURIComponent(raw)}&output=jpg&w=900&q=80`,
    `https://images.weserv.nl/?url=${encodeURIComponent(bare)}&output=jpg&w=900`,
  ];
}

function candidates(raw: string) {
  const list: string[] = [];
  try {
    const u = new URL(raw);
    const china = isChinaHost(u.hostname);

    if (china) {
      // Public mirrors first — ByteDance often blocked from RU
      list.push(...mirrorUrl(raw));
      const unsigned = normalizeChinaImageUrl(raw);
      if (unsigned && unsigned !== raw) list.push(...mirrorUrl(unsigned));
      list.push(unsigned || raw, raw);
    } else {
      list.push(raw);
    }

    if (u.hostname.includes("encar.com") && /_\d{3}\.(jpg|jpeg|png)$/i.test(u.pathname)) {
      const base = u.href.replace(/_\d{3}\.(jpg|jpeg|png)(\?.*)?$/i, "");
      const ext = (u.pathname.match(/\.(jpg|jpeg|png)$/i) || [".jpg"])[0];
      for (const n of ["001", "002", "003", "004", "005", "006", "007", "008", "009", "010", "027"]) {
        list.push(`${base}_${n}${ext}`);
      }
    }
  } catch {
    list.push(raw);
  }
  return [...new Set(list.filter(Boolean))];
}

function ensureCache() {
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
}

function cacheKey(url: string) {
  return createHash("sha1").update(url).digest("hex");
}

async function fetchImage(url: string, timeoutMs = 10000) {
  const host = new URL(url).hostname;
  const isMirror = host.includes("wsrv.nl") || host.includes("weserv.nl");
  const upstream = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      ...(isMirror
        ? {}
        : {
            Referer: refererFor(host),
            Origin: refererFor(host).replace(/\/$/, ""),
          }),
    },
    redirect: "follow",
  });
  if (!upstream.ok) return null;
  const type = upstream.headers.get("content-type") || "image/jpeg";
  if (!type.startsWith("image/") && type !== "application/octet-stream") return null;
  const buf = Buffer.from(await upstream.arrayBuffer());
  if (buf.length < 200) return null;
  return { buf, type: type.startsWith("image/") ? type : "image/jpeg" };
}

function cachePaths(raw: string) {
  const key = cacheKey(raw);
  return {
    key,
    metaPath: path.join(cacheDir, `${key}.json`),
    binPath: path.join(cacheDir, `${key}.bin`),
  };
}

export function isImageCached(raw: string) {
  ensureCache();
  const { metaPath, binPath } = cachePaths(raw);
  return fs.existsSync(metaPath) && fs.existsSync(binPath);
}

export async function warmImageUrl(rawInput: string): Promise<boolean> {
  const raw = decodeRaw(rawInput);
  if (!raw || raw.length > 2000) return false;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
  if (!hostOk(parsed.hostname) && !isChinaHost(parsed.hostname)) return false;

  ensureCache();
  const { metaPath, binPath } = cachePaths(raw);
  if (fs.existsSync(metaPath) && fs.existsSync(binPath)) return true;

  for (const url of candidates(raw)) {
    try {
      const short = url.includes("wsrv") || url.includes("weserv") ? 15000 : 7000;
      const got = await fetchImage(url, short);
      if (!got) continue;
      fs.writeFileSync(binPath, got.buf);
      fs.writeFileSync(metaPath, JSON.stringify({ type: got.type, url }));
      return true;
    } catch {
      /* try next */
    }
  }
  return false;
}

export async function warmImageUrls(urls: string[], concurrency = 4) {
  const unique = [...new Set(urls.filter(Boolean))];
  let ok = 0;
  let fail = 0;
  let i = 0;
  async function worker() {
    while (i < unique.length) {
      const idx = i++;
      const u = unique[idx];
      const good = await warmImageUrl(u);
      if (good) ok += 1;
      else fail += 1;
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, unique.length || 1) }, () => worker()));
  return { total: unique.length, ok, fail };
}

export async function imageProxy(req: Request, res: Response) {
  const fromParam = req.params.b64
    ? Buffer.from(String(req.params.b64), "base64url").toString("utf8")
    : String(req.query.u || "");
  const raw = decodeRaw(fromParam);
  if (!raw || raw.length > 2000) return res.status(400).end();

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return res.status(400).end();
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return res.status(400).end();
  if (!hostOk(parsed.hostname)) return res.status(403).end();

  ensureCache();
  const { metaPath, binPath } = cachePaths(raw);
  if (fs.existsSync(metaPath) && fs.existsSync(binPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf8")) as { type: string };
      res.setHeader("Content-Type", meta.type || "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=604800");
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.send(fs.readFileSync(binPath));
    } catch {
      /* refetch */
    }
  }

  for (const url of candidates(raw)) {
    try {
      const short = url.includes("wsrv") || url.includes("weserv") ? 15000 : 6000;
      const got = await fetchImage(url, short);
      if (!got) continue;
      fs.writeFileSync(binPath, got.buf);
      fs.writeFileSync(metaPath, JSON.stringify({ type: got.type, url }));
      res.setHeader("Content-Type", got.type);
      res.setHeader("Cache-Control", "public, max-age=604800");
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.send(got.buf);
    } catch {
      /* try next */
    }
  }

  res.status(404).end();
}

/**
 * Public CDNs (China + Encar): browser loads via wsrv.nl mirror.
 * Works on GitHub Pages without Express `/api/img`. Only real distinct photos.
 */
export function proxiedImages(urls: string[]) {
  const list = (urls || []).filter(Boolean).map((u) => String(u));
  if (!list.length) return [];

  const toWsrv = (u: string) =>
    `https://wsrv.nl/?url=${encodeURIComponent(u)}&output=jpg&w=900&q=80`;

  // Already proxied via wsrv — pass through unique frames
  if (list[0].includes("wsrv.nl/")) {
    const unique = [...new Set(list.map((u) => u.split("&a=")[0].split("&crop=")[0]))];
    // If these are only crop variants of one image, keep first only
    if (unique.length === 1 && list.length > 1) return [list[0]];
    return list.slice(0, 12);
  }

  try {
    const first = list[0];
    const host = new URL(first).hostname;
    if (isChinaHost(host)) {
      const cleaned = list.map((u) => normalizeChinaImageUrl(u) || u).filter(Boolean);
      const byHash = new Map<string, string>();
      for (const u of cleaned) {
        const m = u.match(/tos-cn-i-f042mdwyw7\/([a-f0-9]{32})/i);
        const key = m ? m[1].toLowerCase() : u;
        if (!byHash.has(key)) byHash.set(key, u);
      }
      return [...byHash.values()].slice(0, 12).map(toWsrv);
    }
    if (host.includes("encar")) {
      return [...new Set(list)].slice(0, 12).map(toWsrv);
    }
  } catch {
    /* fall through */
  }

  // Fallback still uses wsrv so static hosting never depends on /api/img
  return list.slice(0, 12).map(toWsrv);
}
