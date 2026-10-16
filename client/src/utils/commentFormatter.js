/**
 * Universal Comment Formatting Engine
 *
 * Provides safe, zero-dependency parsing for rich comment formatting:
 * - Bold (**bold** or __bold__)
 * - Italic (*italic* or _italic_)
 * - Bold + Italic (***both*** or ___both___)
 * - Strikethrough (~~strikethrough~~)
 * - Spoilers (||click to reveal spoiler||)
 * - Markdown links ([label](url))
 * - Auto-detected URLs (https://... or www....)
 * - Inline code (`code`) and Code blocks (```lang ... ```)
 * - Blockquotes (> quote)
 * - Bullet lists (- item or * item) and Numbered lists (1. item)
 * - Safe URL sanitization (blocks javascript:, data:, etc.)
 */

/**
 * Sanitizes URLs to prevent XSS (blocks javascript:, vbscript:, data:).
 * Normalizes www. to https://www.
 *
 * @param {string} rawUrl
 * @returns {string|null} Safe URL or null if dangerous
 */
export function sanitizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();

  // Allow relative URLs starting with '/' but not '//' (protocol-relative)
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  // Normalize www. to https://www.
  if (/^www\./i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  // Allow http:, https:, mailto:
  if (/^(https?:|mailto:)/i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (["http:", "https:", "mailto:"].includes(parsed.protocol)) {
        return trimmed;
      }
    } catch {
      if (trimmed.startsWith("mailto:")) return trimmed;
    }
  }

  return null;
}

/**
 * Trims trailing punctuation from raw autolink URLs.
 */
function cleanAutolinkUrl(url) {
  let clean = url;
  let trailing = "";
  const trailMatch = clean.match(/[.,!?:;)]+$/);
  if (trailMatch) {
    trailing = trailMatch[0];
    clean = clean.slice(0, -trailing.length);
  }
  return { url: clean, trailing };
}

/**
 * Parses inline string into structured tokens for rich rendering.
 *
 * @param {string} text
 * @returns {Array<object>} Array of tokens
 */
export function parseInlineTokens(text) {
  if (!text || typeof text !== "string") return [];

  const tokens = [];
  let remaining = text;

  // Rules ordered by specificity
  const rules = [
    // 1. Inline code: `code` (highest priority so backticks aren't parsed for markdown)
    {
      type: "code",
      regex: /`([^`\n]+)`/,
      create: (match) => ({
        type: "code",
        value: match[1],
        consumed: match[0].length,
      }),
    },
    // 2. Spoiler: ||spoiler||
    {
      type: "spoiler",
      regex: /\|\|([\s\S]+?)\|\|/,
      create: (match) => ({
        type: "spoiler",
        children: parseInlineTokens(match[1]),
        consumed: match[0].length,
      }),
    },
    // 3. Markdown link: [label](url)
    {
      type: "link",
      regex: /\[([^\]\n]+)\]\(([^)\s]+)\)/,
      create: (match) => {
        const safeUrl = sanitizeUrl(match[2]);
        if (!safeUrl) {
          return {
            type: "text",
            value: match[0],
            consumed: match[0].length,
          };
        }
        return {
          type: "link",
          url: safeUrl,
          children: parseInlineTokens(match[1]),
          consumed: match[0].length,
        };
      },
    },
    // 4. Bold + Italic: ***text*** or ___text___ (before bold/italic)
    {
      type: "bold_italic",
      regex: /(?:\*\*\*([\s\S]+?)\*\*\*|___([\s\S]+?)___)/,
      create: (match) => ({
        type: "bold_italic",
        children: parseInlineTokens(match[1] || match[2]),
        consumed: match[0].length,
      }),
    },
    // 5. Bold: **text** or __text__ (before italic)
    {
      type: "bold",
      regex: /(?:\*\*([\s\S]+?)\*\*|__([\s\S]+?)__)/,
      create: (match) => ({
        type: "bold",
        children: parseInlineTokens(match[1] || match[2]),
        consumed: match[0].length,
      }),
    },
    // 6. Strikethrough: ~~text~~
    {
      type: "strike",
      regex: /~~([\s\S]+?)~~/,
      create: (match) => ({
        type: "strike",
        children: parseInlineTokens(match[1]),
        consumed: match[0].length,
      }),
    },
    // 7. Italic: *text* or _text_
    {
      type: "italic",
      regex: /(?:\*([^\s*][\s\S]*?[^\s*]|[^\s*])\*|_([^\s_][\s\S]*?[^\s_]|[^\s_])_)/,
      create: (match) => ({
        type: "italic",
        children: parseInlineTokens(match[1] || match[2]),
        consumed: match[0].length,
      }),
    },
    // 8. Autolink: https://... or http://... or www....
    {
      type: "autolink",
      regex: /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/,
      create: (match) => {
        const { url } = cleanAutolinkUrl(match[0]);
        const safeUrl = sanitizeUrl(url);
        if (!safeUrl) {
          return {
            type: "text",
            value: match[0],
            consumed: match[0].length,
          };
        }
        return {
          type: "link",
          url: safeUrl,
          children: [{ type: "text", value: url }],
          consumed: url.length,
        };
      },
    },
  ];

  while (remaining.length > 0) {
    let earliest = null;
    let earliestIndex = -1;
    let matchedRule = null;

    for (const rule of rules) {
      const match = rule.regex.exec(remaining);
      if (match) {
        const idx = match.index;
        // If earlier index, or same index but longer match (e.g. bold-italic vs bold)
        if (
          earliestIndex === -1 ||
          idx < earliestIndex ||
          (idx === earliestIndex && match[0].length > earliest[0].length)
        ) {
          earliestIndex = idx;
          earliest = match;
          matchedRule = rule;
        }
      }
    }

    if (earliestIndex === -1 || !earliest) {
      tokens.push({ type: "text", value: remaining });
      break;
    }

    // Push plain text before the match
    if (earliestIndex > 0) {
      tokens.push({ type: "text", value: remaining.slice(0, earliestIndex) });
    }

    // Create the token and advance remaining
    const token = matchedRule.create(earliest);
    tokens.push(token);
    remaining = remaining.slice(earliestIndex + token.consumed);
  }

  // Merge consecutive plain text tokens
  const mergedTokens = [];
  for (const t of tokens) {
    if (t.type === "text" && mergedTokens.length > 0 && mergedTokens[mergedTokens.length - 1].type === "text") {
      mergedTokens[mergedTokens.length - 1].value += t.value;
    } else {
      mergedTokens.push(t);
    }
  }

  return mergedTokens;
}

/**
 * Splits comment text into block-level elements:
 * - Code blocks (```lang\n...```)
 * - Blockquotes (> quote)
 * - Unordered lists (- item or * item)
 * - Ordered lists (1. item)
 * - Paragraphs
 *
 * @param {string} text
 * @returns {Array<object>} Array of block descriptors
 */
export function parseCommentBlocks(text) {
  if (!text || typeof text !== "string") return [];

  // Normalize line endings
  const normalized = text.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const blocks = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // 1. Code blocks
    if (line.trim().startsWith("```")) {
      const language = line.trim().slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i].trim().startsWith("```")) {
        i++; // skip closing ```
      }
      blocks.push({
        type: "codeblock",
        language,
        code: codeLines.join("\n"),
      });
      continue;
    }

    // 2. Blockquotes (> ...)
    if (/^>\s?/.test(line)) {
      const quoteLines = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({
        type: "blockquote",
        lines: quoteLines,
      });
      continue;
    }

    // 3. Bullet lists (- item or * item)
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push({
        type: "bullet_list",
        items,
      });
      continue;
    }

    // 4. Ordered lists (1. item)
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({
        type: "ordered_list",
        items,
      });
      continue;
    }

    // 5. Empty lines
    if (!line.trim()) {
      i++;
      continue;
    }

    // 6. Regular paragraphs (accumulate lines until blank line or block start)
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("```") &&
      !/^>\s?/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }

    if (paraLines.length > 0) {
      blocks.push({
        type: "paragraph",
        text: paraLines.join("\n"),
      });
    }
  }

  return blocks;
}

/**
 * Strips all markdown and formatting syntaxes for clean excerpts, plain search indexing, or tooltips.
 *
 * @param {string} text
 * @returns {string} Plain stripped text
 */
export function stripCommentFormatting(text) {
  if (!text || typeof text !== "string") return "";

  let cleaned = text
    .replace(/```[a-zA-Z0-9_-]*\n?([\s\S]*?)```/g, "$1")
    .replace(/\[([^\]\n]+)\]\([^)\s]+\)/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/(\*\*\*|___)([\s\S]+?)\1/g, "$2")
    .replace(/(\*\*|__)([\s\S]+?)\1/g, "$2")
    .replace(/(\*|_)([\s\S]+?)\1/g, "$2")
    .replace(/~~([\s\S]+?)~~/g, "$1")
    .replace(/\|\|([\s\S]+?)\|\|/g, "$1")
    .replace(/`([^`\n]+)`/g, "$1");

  return cleaned.trim();
}
