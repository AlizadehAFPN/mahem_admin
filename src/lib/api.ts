const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3000/api';

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    const rawMessage =
      body && typeof body === 'object' && 'message' in body
        ? (body as { message: unknown }).message
        : undefined;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join('، ')
      : rawMessage
        ? String(rawMessage)
        : `Request failed with status ${status}`;
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const doFetch = () =>
    fetch(`${BACKEND_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      cache: 'no-store',
    });

  // BACKEND_URL is a bare HTTP IP with no CDN/TLS in front of it, so an
  // occasional connection reset between Vercel's edge and the VPS throws
  // here instead of coming back as a response — otherwise surfacing as
  // dashboard/error.tsx's generic "couldn't reach the server" screen for a
  // single dropped packet. One retry only for GET (safe to repeat; a
  // mutating request that already reached the server shouldn't be resent).
  let res: Response;
  try {
    res = await doFetch();
  } catch (err) {
    if ((options.method ?? 'GET') !== 'GET') {
      throw err;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    res = await doFetch();
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const body = await res.json().catch(() => undefined);

  if (!res.ok) {
    throw new ApiError(res.status, body);
  }

  return body as T;
}

export function apiGet<T>(path: string, token?: string) {
  return request<T>(path, { method: 'GET' }, token);
}

export function apiPost<T>(path: string, data?: unknown, token?: string) {
  return request<T>(
    path,
    { method: 'POST', body: data === undefined ? undefined : JSON.stringify(data) },
    token,
  );
}

export function apiPatch<T>(path: string, data?: unknown, token?: string) {
  return request<T>(
    path,
    { method: 'PATCH', body: data === undefined ? undefined : JSON.stringify(data) },
    token,
  );
}

export function apiDelete<T>(path: string, token?: string) {
  return request<T>(path, { method: 'DELETE' }, token);
}

// Multipart upload — bypasses `request()`'s JSON Content-Type header (the
// browser/runtime sets the correct multipart boundary automatically).
export async function apiUpload<T>(path: string, form: FormData, token?: string): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
    cache: 'no-store',
  });

  const body = await res.json().catch(() => undefined);
  if (!res.ok) {
    throw new ApiError(res.status, body);
  }
  return body as T;
}
