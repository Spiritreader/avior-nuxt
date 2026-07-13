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
  return (text ? JSON.parse(text) : null) as T
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
