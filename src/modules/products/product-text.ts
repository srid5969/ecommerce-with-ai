/**
 * Splits marketing copy like {"Why you'll love it": "Crunchy | Tasty"} into ["Crunchy", "Tasty"].
 */
export function toHighlights(marketingDescription: Record<string, string> | null): string[] {
  return Object.values(marketingDescription ?? {})
    .flatMap((value) => value.split('|'))
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Collapses whitespace/newlines and optionally truncates on a word boundary. */
export function cleanText(text: string | null, maxLength = Infinity): string {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, clean.lastIndexOf(' ', maxLength))}…`;
}
