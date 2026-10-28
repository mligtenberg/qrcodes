const SCHEME_RE = /^(https?):\/\//i;

/** Splits a URL into its scheme ('http' | 'https') and the remainder. Defaults to https. */
export function splitUrl(value) {
  const m = value.match(SCHEME_RE);
  return m
    ? { scheme: m[1].toLowerCase(), rest: value.slice(m[0].length) }
    : { scheme: 'https', rest: value };
}

/** Builds a URL from typed or pasted text. A scheme in the text wins over the fallback scheme. */
export function buildUrl(text, fallbackScheme) {
  const trimmed = text.trim();
  return SCHEME_RE.test(trimmed)
    ? trimmed.replace(SCHEME_RE, (_, scheme) => `${scheme.toLowerCase()}://`)
    : `${fallbackScheme}://${text}`;
}
