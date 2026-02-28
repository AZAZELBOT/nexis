import type { DashboardAuthSession, RuntimeAdminSnapshot } from "@/types";

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function requestJson<T>(
  base: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    credentials: "include",
    ...init,
  });
  const contentType = response.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const payloadError =
      isRecord(payload) && typeof payload.error === "string"
        ? payload.error
        : isRecord(payload) && typeof payload.message === "string"
          ? payload.message
          : null;
    const message = payloadError ?? `Request failed (${response.status})`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export function controlApi<T>(path: string, init?: RequestInit): Promise<T> {
  return requestJson<T>("/api", path, init);
}

export function runtimeApi<T>(path: string, init?: RequestInit): Promise<T> {
  return requestJson<T>("/rt", path, init);
}

export async function signInWithEmailPassword(
  email: string,
  password: string,
): Promise<void> {
  await controlApi<unknown>("/auth/sign-in/email", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      rememberMe: true,
    }),
  });
}

export async function signOutCurrentSession(): Promise<void> {
  await controlApi<unknown>("/auth/sign-out", {
    method: "POST",
  });
}

function toDashboardAuthSession(payload: unknown): DashboardAuthSession | null {
  if (!isRecord(payload)) {
    return null;
  }
  if (!isRecord(payload.user) || !isRecord(payload.session)) {
    return null;
  }
  if (typeof payload.user.id !== "string") {
    return null;
  }
  if (typeof payload.user.email !== "string") {
    return null;
  }
  if (typeof payload.user.name !== "string") {
    return null;
  }
  if (typeof payload.session.id !== "string") {
    return null;
  }
  if (typeof payload.session.userId !== "string") {
    return null;
  }
  if (typeof payload.session.expiresAt !== "string") {
    return null;
  }

  return {
    user: {
      id: payload.user.id,
      email: payload.user.email,
      name: payload.user.name,
      image: typeof payload.user.image === "string" ? payload.user.image : null,
    },
    session: {
      id: payload.session.id,
      user_id: payload.session.userId,
      expires_at: payload.session.expiresAt,
    },
  };
}

export async function getCurrentDashboardSession(): Promise<DashboardAuthSession | null> {
  const response = await fetch("/api/auth/get-session", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
  if (response.status === 401) {
    return null;
  }
  const contentType = response.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      isRecord(payload) && typeof payload.message === "string"
        ? payload.message
        : `Request failed (${response.status})`;
    throw new ApiError(message, response.status, payload);
  }

  return toDashboardAuthSession(payload);
}

export type ServiceHealthStatus = {
  ok: boolean;
  status: number | null;
  error: string;
};

async function checkServiceHealth(url: string): Promise<ServiceHealthStatus> {
  try {
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: `Request failed (${response.status})`,
      };
    }
    return {
      ok: true,
      status: response.status,
      error: "",
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      error: extractErrorMessage(error),
    };
  }
}

export function getControlPlaneHealth(): Promise<ServiceHealthStatus> {
  return checkServiceHealth("/api/health");
}

export function getRuntimePlaneHealth(): Promise<ServiceHealthStatus> {
  return checkServiceHealth("/rt/health");
}

export function getRuntimeSnapshot(options?: {
  includeState?: boolean;
  roomId?: string;
}): Promise<RuntimeAdminSnapshot> {
  const params = new URLSearchParams();
  if (options?.includeState) {
    params.set("include_state", "1");
  }
  if (options?.roomId) {
    params.set("room_id", options.roomId);
  }
  const query = params.toString();
  return runtimeApi<RuntimeAdminSnapshot>(
    `/admin/runtime${query ? `?${query}` : ""}`,
  );
}

export function extractErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected request error";
}
