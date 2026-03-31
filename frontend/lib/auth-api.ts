import { API_URL } from "./constants";
import type { AuthSession } from "./types";

type PublicUser = {
  id: string;
  email: string;
  username: string;
  accentColor: string;
};

type AuthResponse = {
  access_token: string;
  user: PublicUser;
};

export function mapAuthResponse(data: AuthResponse): AuthSession {
  return {
    accessToken: data.access_token,
    id: data.user.id,
    email: data.user.email,
    username: data.user.username,
    accentColor: data.user.accentColor,
  };
}

export async function fetchMe(accessToken: string) {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    return null;
  }
  return res.json() as Promise<PublicUser>;
}

export async function postRegister(body: {
  email: string;
  username: string;
  password: string;
  accentColor?: string;
}) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as
    | AuthResponse
    | { message?: string | string[]; statusCode?: number };
  return { ok: res.ok, data } as const;
}

export async function postLogin(body: { email: string; password: string }) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as
    | AuthResponse
    | { message?: string | string[]; statusCode?: number };
  return { ok: res.ok, data } as const;
}

export async function patchProfile(
  accessToken: string,
  body: { username?: string; accentColor?: string },
) {
  const res = await fetch(`${API_URL}/auth/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as
    | PublicUser
    | { message?: string | string[]; statusCode?: number };
  return { ok: res.ok, data } as const;
}
