/** Shared fetch helper: timeout, UA, and single retry on transient failure. */
export async function getJson<T>(url: string, timeoutMs = 15000): Promise<T> {
  const attempt = async (): Promise<T> => {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        'User-Agent': 'thenowdesigns-trend-engine/1.0 (daily content brief; contact via thenowdesigns.com)',
        Accept: 'application/json, text/plain',
      },
    })
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`)
    const text = await res.text()
    // Google Trends JSON endpoints prefix responses with ")]}'," to prevent
    // JSON hijacking; strip anything before the first bracket.
    const start = text.search(/[[{]/)
    return JSON.parse(start > 0 ? text.slice(start) : text) as T
  }
  try {
    return await attempt()
  } catch {
    await new Promise((r) => setTimeout(r, 1500))
    return attempt()
  }
}

export function hoursSince(epochMs: number, now = Date.now()): number {
  return Math.max((now - epochMs) / 3_600_000, 0)
}
