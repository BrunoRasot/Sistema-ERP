const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  statusCode: number;
  code: string;
  errors?: string[];

  constructor(message: string, statusCode: number, code: string, errors?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
  }
}

// ─── Helpers de autenticación ───────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('vivelite_access_token');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('vivelite_refresh_token');
}

function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('vivelite_access_token');
  localStorage.removeItem('vivelite_refresh_token');
  localStorage.removeItem('vivelite_user');
}

function redirectToLogin() {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

/** Intenta renovar el access token usando el refresh token.
 *  Devuelve el nuevo access token o null si no pudo renovar. */
async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return null;

    const json = await response.json();
    const newAccessToken: string | undefined =
      json?.data?.accessToken ?? json?.accessToken;
    const newRefreshToken: string | undefined =
      json?.data?.refreshToken ?? json?.refreshToken;

    if (!newAccessToken) return null;

    localStorage.setItem('vivelite_access_token', newAccessToken);
    if (newRefreshToken) {
      localStorage.setItem('vivelite_refresh_token', newRefreshToken);
    }

    return newAccessToken;
  } catch {
    return null;
  }
}

// ─── API Client principal ────────────────────────────────────────────────────

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const buildHeaders = (t: string | null): Record<string, string> => ({
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  });

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // ── Primera solicitud ────────────────────────────────────────────────────
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: buildHeaders(token),
    });
  } catch (networkErr: any) {
    throw new ApiError(
      'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet o intenta nuevamente en unos momentos.',
      0,
      'NETWORK_ERROR',
    );
  }

  // ── Si recibimos 401, intentar renovar el token y repetir ────────────────
  if (response.status === 401) {
    const newToken = await tryRefreshToken();

    if (newToken) {
      // Repetir la solicitud con el token nuevo
      try {
        response = await fetch(url, {
          ...options,
          headers: buildHeaders(newToken),
        });
      } catch {
        throw new ApiError(
          'Error de conexión al reintentar la solicitud.',
          0,
          'NETWORK_ERROR',
        );
      }
    } else {
      // No se pudo renovar → limpiar sesión y redirigir al login
      clearSession();
      redirectToLogin();
      throw new ApiError(
        'Sesión expirada. Por favor inicie sesión nuevamente.',
        401,
        'SESSION_EXPIRED',
      );
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      data?.message || 'Ocurrió un error inesperado al comunicarse con el servidor',
      response.status,
      data?.code || 'UNKNOWN_ERROR',
      data?.errors,
    );
  }

  // Si la respuesta incluye 'data' y 'meta' (paginación server-side)
  if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
    return { data: data.data, meta: data.meta } as T;
  }

  return (data?.data !== undefined ? data.data : data) as T;
}
