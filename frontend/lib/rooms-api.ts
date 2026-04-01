import { API_URL } from "./constants";
import type { AvailableUser, RoomDetail, RoomMember, RoomSummary } from "./types";

type ApiError = { message?: string | string[]; statusCode?: number };

function getErrorMessage(data: ApiError) {
  if (Array.isArray(data.message)) {
    return data.message.join(", ");
  }
  if (typeof data.message === "string") {
    return data.message;
  }
  return "Requête impossible";
}

async function readJson<T>(res: Response) {
  return (await res.json().catch(() => ({}))) as T;
}

export async function fetchRooms(accessToken: string) {
  const res = await fetch(`${API_URL}/rooms`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return [] as RoomSummary[];
  }
  return readJson<RoomSummary[]>(res);
}

export async function fetchRoom(accessToken: string, roomId: string) {
  const res = await fetch(`${API_URL}/rooms/${roomId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return null;
  }
  return readJson<RoomDetail>(res);
}

export async function postRoom(
  accessToken: string,
  body: {
    name: string;
    inviteUsernames: string[];
  },
) {
  const res = await fetch(`${API_URL}/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });
  const data = await readJson<RoomDetail | ApiError>(res);
  return {
    ok: res.ok,
    data,
    error: res.ok ? undefined : getErrorMessage(data as ApiError),
  } as const;
}

export async function fetchAvailableUsers(
  accessToken: string,
  roomId?: string,
) {
  const suffix = roomId
    ? `/rooms/${roomId}/available-users`
    : "/rooms/available-users";
  const res = await fetch(`${API_URL}${suffix}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return [] as AvailableUser[];
  }
  return readJson<AvailableUser[]>(res);
}

export async function postRoomMember(
  accessToken: string,
  roomId: string,
  body: { username: string; canSeePriorHistory: boolean },
) {
  const res = await fetch(`${API_URL}/rooms/${roomId}/members`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });
  const data = await readJson<RoomMember | ApiError>(res);
  return {
    ok: res.ok,
    data,
    error: res.ok ? undefined : getErrorMessage(data as ApiError),
  } as const;
}

export async function patchRoomMember(
  accessToken: string,
  roomId: string,
  userId: string,
  body: { canSeePriorHistory: boolean },
) {
  const res = await fetch(`${API_URL}/rooms/${roomId}/members/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });
  const data = await readJson<RoomMember | ApiError>(res);
  return {
    ok: res.ok,
    data,
    error: res.ok ? undefined : getErrorMessage(data as ApiError),
  } as const;
}
