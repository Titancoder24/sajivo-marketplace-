import { NextResponse } from "next/server";

const MAX_TEXTS = 80;
const MAX_LENGTH = 450;
const BATCH_LENGTH = 430;
const SEPARATOR = "\n|||\n";

async function translateBatch(texts: string[]) {
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("langpair", "en|hi");
  url.searchParams.set("q", texts.join(SEPARATOR));
  const response = await fetch(url, { next: { revalidate: 604_800 } });
  if (!response.ok) return null;
  const payload = await response.json().catch(() => null) as { responseData?: { translatedText?: string }; responseStatus?: number } | null;
  const translated = payload?.responseData?.translatedText;
  if (!translated || payload?.responseStatus !== 200) return null;
  const parts = translated.split(/\s*\|\|\|\s*/);
  return parts.length === texts.length ? parts.map((part) => part.trim()) : null;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { texts?: unknown } | null;
  const texts = Array.isArray(body?.texts)
    ? body.texts.filter((text): text is string => typeof text === "string").slice(0, MAX_TEXTS).map((text) => text.slice(0, MAX_LENGTH))
    : [];
  if (!texts.length) return NextResponse.json({ translations: [] });

  const translations = [...texts];
  const batches: Array<{ indexes: number[]; texts: string[] }> = [];
  texts.forEach((text, index) => {
    const current = batches.at(-1);
    const nextLength = (current?.texts.join(SEPARATOR).length ?? 0) + SEPARATOR.length + text.length;
    if (!current || nextLength > BATCH_LENGTH) batches.push({ indexes: [index], texts: [text] });
    else { current.indexes.push(index); current.texts.push(text); }
  });

  for (const batch of batches) {
    try {
      const translated = await translateBatch(batch.texts);
      translated?.forEach((value, index) => { translations[batch.indexes[index]] = value; });
    } catch {
      // Keep the English source if the translation provider is unavailable.
    }
  }
  return NextResponse.json({ translations }, { headers: { "cache-control": "public, max-age=86400" } });
}
