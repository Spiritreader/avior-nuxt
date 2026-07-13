// Replacement for Nuxt 2's $http (@nuxt/http, a ky wrapper). The call sites port
// one-to-one: $http.$get/$post/$put/$delete -> get/post/put/del.
//
// Three of @nuxt/http's behaviours are load-bearing and are reproduced here
// deliberately. Losing any of them is a silent behavioural regression.

// nuxt.config.js configured `http: { clientTimeout: 2500 }`, which @nuxt/http
// passed to ky as its request timeout, so EVERY browser request in the old app
// aborted after 2.5s. That matters most for the address-resolution race, which is
// designed around most candidate addresses being dead: a client whose addresses
// are unroutable (firewall DROPs, no RST) must fail fast and flip to "offline".
// Bare fetch() has no timeout and would hang until the browser gives up — tens of
// seconds — leaving skeleton loaders spinning.
const DEFAULT_TIMEOUT_MS = 2500

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly statusText: string,
    method: string,
    url: string,
  ) {
    super(`${method} ${url} failed: ${status} ${statusText}`)
    this.name = 'HttpError'
  }
}

async function request<T>(url: string, init?: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let res: Response
  try {
    res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        // ky only sets Content-Type when there is a JSON body. Setting it
        // unconditionally would make every cross-origin GET a non-simple request
        // and force a CORS preflight OPTIONS that the old app never sent —
        // doubling the latency of every /alive probe and every log fetch, and
        // making the app depend on a daemon CORS property it did not need before.
        ...(init?.body != null ? { 'Content-Type': 'application/json' } : {}),
        ...(init?.headers ?? {}),
      },
    })
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) {
    throw new HttpError(res.status, res.statusText, init?.method ?? 'GET', url)
  }

  const text = await res.text()

  // $http.$get was res.text().then(destr). destr('') returns an empty string, and
  // callers rely on getting a string back: Client.vue does log.split('\n') on an
  // empty log body, and globalconfig.vue guards on `typeof result == "string"`.
  // Returning null here would throw on the first and silently null out the second.
  if (!text) return '' as T

  // destr's rule: parse as JSON when the body parses as JSON, otherwise return the
  // raw string. The daemons serve their whole API as text/plain — the status
  // objects happen to be JSON, but /logs/{main,err,processed,skipped} are plain log
  // text that JSON.parse would throw on.
  try {
    return JSON.parse(text) as T
  } catch {
    return text as unknown as T
  }
}

export function get<T = any>(url: string, timeoutMs?: number): Promise<T> {
  return request<T>(url, undefined, timeoutMs)
}

export function post<T = any>(url: string, body?: unknown, timeoutMs?: number): Promise<T> {
  return request<T>(url, { method: 'POST', body: JSON.stringify(body) }, timeoutMs)
}

export function put<T = any>(url: string, body?: unknown, timeoutMs?: number): Promise<T> {
  return request<T>(url, { method: 'PUT', body: JSON.stringify(body) }, timeoutMs)
}

export function del<T = any>(url: string, timeoutMs?: number): Promise<T> {
  return request<T>(url, { method: 'DELETE' }, timeoutMs)
}
