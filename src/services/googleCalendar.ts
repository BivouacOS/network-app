// Minimal GIS type declarations (loaded dynamically at runtime)
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: TokenClientConfig): TokenClient
          revoke(token: string, done: () => void): void
        }
      }
    }
  }
}

interface TokenClientConfig {
  client_id: string
  scope: string
  callback: (response: TokenResponse) => void
}

interface TokenClient {
  requestAccessToken(opts?: { prompt?: string }): void
  callback: (response: TokenResponse) => void
}

interface TokenResponse {
  access_token: string
  error?: string
  expires_in: number
}

// Module-level singletons — session-only, not persisted
let _tokenClient: TokenClient | null = null
let _accessToken: string | null = null

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(s)
  })
}

export async function initGoogleServices(clientId: string): Promise<void> {
  await loadScript('https://accounts.google.com/gsi/client')
  _tokenClient = window.google!.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/tasks',
    ].join(' '),
    callback: () => {},
  })
}

export function requestAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!_tokenClient) { reject(new Error('Google services not initialized')); return }
    _tokenClient.callback = (resp) => {
      if (resp.error) { reject(new Error(resp.error)); return }
      _accessToken = resp.access_token
      resolve(resp.access_token)
    }
    _tokenClient.requestAccessToken({ prompt: '' })
  })
}

export function signOut(): void {
  if (_accessToken) {
    window.google?.accounts.oauth2.revoke(_accessToken, () => {})
    _accessToken = null
  }
}

export function isConnected(): boolean {
  return _accessToken !== null
}

// API fetch with one auto-retry on 401 (token expired)
export async function apiFetch<T>(url: string, options: RequestInit = {}, retried = false): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${_accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> ?? {}),
    },
  })
  if (res.status === 401 && !retried) {
    await requestAccessToken()
    return apiFetch(url, options, true)
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${body}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
