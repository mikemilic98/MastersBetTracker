import type { FetchHtmlOptions } from "./types";

const DEFAULT_UA =
  "MastersBetTracker/0.1 (+https://github.com/mikemilic98/MastersBetTracker)";

export async function fetchHtml(
  url: string,
  options: FetchHtmlOptions = {},
): Promise<string> {
  const timeoutMs = options.timeoutMs ?? 25_000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": options.userAgent ?? DEFAULT_UA,
      },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
    }
    return await res.text();
  } finally {
    clearTimeout(id);
  }
}
