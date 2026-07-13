async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    throw new Error(`${init?.method ?? 'GET'} ${url} failed: ${res.status} ${res.statusText}`)
  }

  // Some daemon endpoints reply 204 or with an empty body.
  const text = await res.text()
  if (!text) return null as T

  // Nuxt's $http returned destr(body): JSON when the body parses as JSON, the
  // raw string otherwise. The daemons serve their whole API as text/plain --
  // the status objects happen to be JSON, but /logs/{main,err,processed,skipped}
  // are plain log text that JSON.parse would throw on. Preserve destr's rule.
  try {
    return JSON.parse(text) as T
  } catch {
    return text as unknown as T
  }
}

export function get<T = any>(url: string): Promise<T> {
  return request<T>(url)
}

export function post<T = any>(url: string, body?: unknown): Promise<T> {
  return request<T>(url, { method: 'POST', body: JSON.stringify(body) })
}

export function put<T = any>(url: string, body?: unknown): Promise<T> {
  return request<T>(url, { method: 'PUT', body: JSON.stringify(body) })
}

export function del<T = any>(url: string): Promise<T> {
  return request<T>(url, { method: 'DELETE' })
}
