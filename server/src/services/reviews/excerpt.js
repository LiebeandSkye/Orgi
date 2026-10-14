/**
 * Strips markdown and HTML formatting from raw review/synopsis text,
 * collapses whitespace, and creates a clean excerpt cut at a word boundary.
 *
 * @param {string} text - Raw content
 * @param {number} [maxLength=220] - Maximum target length
 * @returns {string} Clean excerpt ending with ellipsis if truncated
 */
export function createExcerpt(text, maxLength = 220) {
  if (!text || typeof text !== "string") return "";

  // 1. Remove HTML tags
  let clean = text.replace(/<\/?[^>]+(>|$)/g, " ");

  // 2. Remove markdown images & links: ![alt](url) -> "", [text](url) -> text
  clean = clean.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");
  clean = clean.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");

  // 3. Remove headers, blockquotes, horizontal rules, lists
  clean = clean.replace(/^[#>-]+\s+/gm, " ");
  clean = clean.replace(/^[*+-]\s+/gm, " ");
  clean = clean.replace(/^\d+\.\s+/gm, " ");

  // 4. Remove bold/italic markers (*, **, _, __, ~~)
  clean = clean.replace(/(\*\*|__)(.*?)\1/g, "$2");
  clean = clean.replace(/(\*|_)(.*?)\1/g, "$2");
  clean = clean.replace(/~~(.*?)~~/g, "$1");

  // 5. Remove code blocks and inline code
  clean = clean.replace(/```[\s\S]*?```/g, " ");
  clean = clean.replace(/`([^`]+)`/g, "$1");

  // 6. Remove raw URLs
  clean = clean.replace(/https?:\/\/\S+/gi, " ");

  // 7. Collapse all whitespace
  clean = clean.replace(/\s+/g, " ").trim();

  if (!clean) return "";

  if (clean.length <= maxLength) {
    return clean;
  }

  // Find nearest word boundary before maxLength
  const cutIndex = clean.lastIndexOf(" ", maxLength);
  const truncated = cutIndex > 40 ? clean.slice(0, cutIndex) : clean.slice(0, maxLength);

  // Clean trailing punctuation
  const trimmed = truncated.replace(/[\s,.;:!?-]+$/, "");
  return `${trimmed}…`;
}
