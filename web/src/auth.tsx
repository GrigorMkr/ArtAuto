import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const TOKEN_KEY = "artauto_token";

export type AuthUser = { id: number; name: string; email: string; phone: string; role?: "user" | "admin" };

type AuthCtx = {
  user: AuthUser | null;
  ready: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (payload: { name: string; email: string; phone: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = (data as { error?: string }).error;
    if (code === "email_taken") throw new Error("Этот email уже зарегистрирован");
    if (code === "invalid_credentials") throw new Error("Неверный email или пароль");
    throw new Error("Не получилось. Проверьте данные.");
  }
  return data as T;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setReady(true);
      return;
    }
    api<{ user: AuthUser }>("/api/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => setReady(true));
  }, [token]);

  async function login(email: string, password: string) {
    const d = await api<{ token: string; user: AuthUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem(TOKEN_KEY, d.token);
    setToken(d.token);
    setUser(d.user);
    return d.user;
  }

  async function register(payload: { name: string; email: string; phone: string; password: string }) {
    const d = await api<{ token: string; user: AuthUser }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    localStorage.setItem(TOKEN_KEY, d.token);
    setToken(d.token);
    setUser(d.user);
  }

  async function logout() {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  return <Ctx.Provider value={{ user, ready, token, login, register, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
