import React, { useState } from "react";
import {
  parseCommentBlocks,
  parseInlineTokens,
} from "../../utils/commentFormatter";

/**
 * Click-to-reveal Spoiler component.
 * Obscures content until clicked, stopping event propagation
 * to avoid triggering parent card click events.
 */
function SpoilerSpan({ children }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setRevealed((prev) => !prev);
      }}
      title={revealed ? "Spoiler (click to hide)" : "Spoiler (click to reveal)"}
      className={`inline-block px-1.5 py-0.5 mx-0.5 rounded text-left transition-all duration-200 cursor-pointer align-baseline text-xs sm:text-sm font-normal ${
        revealed
          ? "bg-[#182333] text-[#F0F6FC] border border-[#3b82f6]/40 shadow-sm"
          : "bg-[#1C1C1C] text-transparent hover:bg-[#252525] border border-[#2E2E2E] select-none"
      }`}
    >
      <span
        className={`inline-block transition-all duration-200 ${
          revealed ? "opacity-100 blur-0" : "opacity-0 blur-[4px] pointer-events-none select-none"
        }`}
      >
        {children}
      </span>
      {!revealed && (
        <span className="sr-only">Spoiler - click to reveal</span>
      )}
    </button>
  );
}

/**
 * Renders an array of inline tokens into React JSX elements.
 */
function renderInlineTokens(tokens, keyPrefix = "tok") {
  return tokens.map((token, index) => {
    const key = `${keyPrefix}-${index}`;

    switch (token.type) {
      case "text":
        // Preserve single newlines within paragraph as line breaks
        if (token.value.includes("\n")) {
          const parts = token.value.split("\n");
          return (
            <React.Fragment key={key}>
              {parts.map((part, pIdx) => (
                <React.Fragment key={`${key}-p-${pIdx}`}>
                  {pIdx > 0 && <br />}
                  {part}
                </React.Fragment>
              ))}
            </React.Fragment>
          );
        }
        return <React.Fragment key={key}>{token.value}</React.Fragment>;

      case "bold":
        return (
          <strong key={key} className="font-bold text-inherit">
            {renderInlineTokens(token.children, `${key}-b`)}
          </strong>
        );

      case "italic":
        return (
          <em key={key} className="italic text-inherit">
            {renderInlineTokens(token.children, `${key}-i`)}
          </em>
        );

      case "bold_italic":
        return (
          <strong key={key} className="font-bold italic text-inherit">
            {renderInlineTokens(token.children, `${key}-bi`)}
          </strong>
        );

      case "strike":
        return (
          <del key={key} className="line-through opacity-70">
            {renderInlineTokens(token.children, `${key}-s`)}
          </del>
        );

      case "code":
        return (
          <code
            key={key}
            className="px-1.5 py-0.5 rounded text-[0.88em] font-mono bg-[#181818] text-[#61F1AC] border border-[#262626] mx-0.5 align-baseline"
          >
            {token.value}
          </code>
        );

      case "spoiler":
        return (
          <SpoilerSpan key={key}>
            {renderInlineTokens(token.children, `${key}-sp`)}
          </SpoilerSpan>
        );

      case "link":
        return (
          <a
            key={key}
            href={token.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[#3b82f6] hover:text-[#60a5fa] underline underline-offset-2 hover:opacity-90 transition-colors inline cursor-pointer font-medium"
          >
            {renderInlineTokens(token.children, `${key}-l`)}
          </a>
        );

      default:
        return null;
    }
  });
}

/**
 * Universal FormattedText Component.
 *
 * Renders comment or review text with full formatting support:
 * - Bold (**bold**), Italic (*italic*), Bold+Italic (***both***)
 * - Strikethrough (~~text~~)
 * - Native default blue links (markdown [text](url) and raw autolinks https://...)
 * - Click-to-reveal spoilers (||spoiler||)
 * - Quotes (> quote)
 * - Inline code (`code`) and Code blocks (```lang ... ```)
 * - Lists (- bullet or 1. numbered)
 *
 * Safe: 100% XSS immune (no dangerouslySetInnerHTML, malicious link schemes blocked).
 */
export function FormattedText({
  content,
  className = "",
  isExcerpt = false,
}) {
  if (!content || typeof content !== "string") {
    return null;
  }

  // In excerpt mode (e.g. inside line-clamp cards), render inline formatting without block elements
  if (isExcerpt) {
    const inlineTokens = parseInlineTokens(content);
    return (
      <span className={className}>
        {renderInlineTokens(inlineTokens, "exc")}
      </span>
    );
  }

  // Full block rendering
  const blocks = parseCommentBlocks(content);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2.5 break-words ${className}`}>
      {blocks.map((block, bIdx) => {
        const key = `block-${bIdx}`;

        switch (block.type) {
          case "paragraph": {
            const tokens = parseInlineTokens(block.text);
            return (
              <p key={key} className="leading-relaxed">
                {renderInlineTokens(tokens, key)}
              </p>
            );
          }

          case "blockquote": {
            const combinedText = block.lines.join("\n");
            const tokens = parseInlineTokens(combinedText);
            return (
              <blockquote
                key={key}
                className="border-l-2 border-[#61F1AC]/80 pl-3.5 py-1 my-2 text-[#A8A8A8] italic bg-white/[0.02] rounded-r-md text-[0.95em]"
              >
                {renderInlineTokens(tokens, key)}
              </blockquote>
            );
          }

          case "codeblock": {
            return (
              <div key={key} className="my-2.5 rounded-lg overflow-hidden border border-[#222222]">
                {block.language && (
                  <div className="text-[10px] uppercase font-mono tracking-wider text-[#7A7A7A] px-3 py-1 bg-[#141414] border-b border-[#222222]">
                    {block.language}
                  </div>
                )}
                <pre className="bg-[#0A0A0A] p-3 text-xs font-mono text-[#D8D8D8] overflow-x-auto leading-relaxed">
                  <code>{block.code}</code>
                </pre>
              </div>
            );
          }

          case "bullet_list": {
            return (
              <ul key={key} className="list-disc list-inside space-y-1 my-1.5 pl-1">
                {block.items.map((item, itemIdx) => {
                  const tokens = parseInlineTokens(item);
                  return (
                    <li key={`${key}-item-${itemIdx}`} className="leading-relaxed">
                      {renderInlineTokens(tokens, `${key}-item-${itemIdx}`)}
                    </li>
                  );
                })}
              </ul>
            );
          }

          case "ordered_list": {
            return (
              <ol key={key} className="list-decimal list-inside space-y-1 my-1.5 pl-1">
                {block.items.map((item, itemIdx) => {
                  const tokens = parseInlineTokens(item);
                  return (
                    <li key={`${key}-item-${itemIdx}`} className="leading-relaxed">
                      {renderInlineTokens(tokens, `${key}-item-${itemIdx}`)}
                    </li>
                  );
                })}
              </ol>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
}

export default FormattedText;
