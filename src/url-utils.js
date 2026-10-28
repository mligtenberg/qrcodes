const SCHEME_PATTERN = /^(https?):\/\//i;

/** Splits a URL into its scheme ('http' | 'https') and the address after it. Defaults to https. */
export function splitUrl(url) {
  const match = url.match(SCHEME_PATTERN);
  return match
    ? { scheme: match[1].toLowerCase(), address: url.slice(match[0].length) }
    : { scheme: 'https', address: url };
}

/** Builds a URL from typed or pasted text. A scheme in the text wins over the fallback scheme. */
export function buildUrl(text, fallbackScheme) {
  const trimmedText = text.trim();
  return SCHEME_PATTERN.test(trimmedText)
    ? trimmedText.replace(SCHEME_PATTERN, (_, pastedScheme) => `${pastedScheme.toLowerCase()}://`)
    : `${fallbackScheme}://${text}`;
}
