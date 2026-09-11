export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    const proto = window.location.protocol;
    const host = window.location.hostname;
    if (window.location.port === '3000') {
      return `${proto}//${host}:8000/api`;
    }
    return `${proto}//${window.location.host}/api`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
}


export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const base = getApiBase();
  const url = `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  
  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `Request failed with status ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    console.error(`API Error on ${url}:`, err);
    throw err;
  }
}

/**
 * Sovereign WebRTC STUN/TURN Discovery (MHA Directive §6a compliance)
 * Fetches ephemeral HMAC-authenticated Coturn credentials from the backend.
 * Never queries commercial foreign STUN servers (e.g. Google/Twilio public STUN).
 */
export async function getSovereignIceServers(): Promise<RTCIceServer[]> {
  try {
    const creds = await apiFetch('/signaling/turn-credentials');
    if (creds && creds.ice_servers && creds.ice_servers.length > 0) {
      return creds.ice_servers;
    }
  } catch (e) {
    console.warn('[WebRTC] Sovereign Coturn credentials unavailable; falling back to intranet STUN (MHA Directive §6a)', e);
  }
  const host = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
  return [
    { urls: [`stun:${host}:3478`] }
  ];
}
