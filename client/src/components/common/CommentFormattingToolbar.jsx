import React from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Link2,
  EyeOff,
  Quote,
  Code,
} from "lucide-react";

/**
 * Inserts or wraps text with formatting in a textarea.
 *
 * @param {HTMLTextAreaElement} textarea
 * @param {string} prefix
 * @param {string} suffix
 * @param {string} defaultText
 * @param {Function} onChange
 */
export function insertFormat(textarea, prefix, suffix, defaultText, onChange) {
  if (!textarea) return;

  const start = textarea.selectionStart || 0;
  const end = textarea.selectionEnd || 0;
  const currentVal = textarea.value || "";

  const selected = currentVal.substring(start, end);
  const textToWrap = selected.length > 0 ? selected : defaultText;
  const replacement = `${prefix}${textToWrap}${suffix}`;

  const newVal =
    currentVal.substring(0, start) +
    replacement +
    currentVal.substring(end);

  onChange(newVal);

  // Restore cursor inside the formatted token or around it
  setTimeout(() => {
    textarea.focus();
    if (selected.length > 0) {
      // Keep selection or place after
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length
      );
    } else {
      // Select the placeholder default text so user can just type to replace it
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + defaultText.length
      );
    }
  }, 0);
}

/**
 * Universal formatting toolbar for comment and review textareas.
 */
export function CommentFormattingToolbar({
  textareaRef,
  value,
  onChange,
  className = "",
}) {
  const handleFormat = (type) => {
    const el = textareaRef?.current;
    if (!el) return;

    switch (type) {
      case "bold":
        insertFormat(el, "**", "**", "bold text", onChange);
        break;
      case "italic":
        insertFormat(el, "*", "*", "italic text", onChange);
        break;
      case "strike":
        insertFormat(el, "~~", "~~", "strikethrough", onChange);
        break;
      case "link":
        insertFormat(el, "[", "](https://)", "link title", onChange);
        break;
      case "spoiler":
        insertFormat(el, "||", "||", "spoiler content", onChange);
        break;
      case "quote": {
        const start = el.selectionStart || 0;
        const isLineStart = start === 0 || value[start - 1] === "\n";
        const pre = isLineStart ? "> " : "\n> ";
        insertFormat(el, pre, "", "quote", onChange);
        break;
      }
      case "code": {
        const selected = value.substring(
          el.selectionStart || 0,
          el.selectionEnd || 0
        );
        if (selected.includes("\n")) {
          insertFormat(el, "```\n", "\n```", "code", onChange);
        } else {
          insertFormat(el, "`", "`", "code", onChange);
        }
        break;
      }
      default:
        break;
    }
  };

  return (
    <div
      className={`flex items-center gap-0.5 py-1 px-1.5 rounded-lg bg-[#111111]/90 border border-[#222222] select-none ${className}`}
      role="toolbar"
      aria-label="Comment formatting tools"
    >
      <button
        type="button"
        title="Bold (Ctrl+B / **text**)"
        onClick={() => handleFormat("bold")}
        className="p-1 rounded text-[#7A7A7A] hover:text-[#F5F5F5] hover:bg-white/[0.08] transition-colors cursor-pointer"
      >
        <Bold size={13} />
      </button>

      <button
        type="button"
        title="Italic (Ctrl+I / *text*)"
        onClick={() => handleFormat("italic")}
        className="p-1 rounded text-[#7A7A7A] hover:text-[#F5F5F5] hover:bg-white/[0.08] transition-colors cursor-pointer"
      >
        <Italic size={13} />
      </button>

      <button
        type="button"
        title="Strikethrough (~~text~~)"
        onClick={() => handleFormat("strike")}
        className="p-1 rounded text-[#7A7A7A] hover:text-[#F5F5F5] hover:bg-white/[0.08] transition-colors cursor-pointer"
      >
        <Strikethrough size={13} />
      </button>

      <div className="w-[1px] h-3 bg-[#242424] mx-1" />

      <button
        type="button"
        title="Insert Link (Ctrl+K / [title](url))"
        onClick={() => handleFormat("link")}
        className="p-1 rounded text-[#7A7A7A] hover:text-[#3b82f6] hover:bg-white/[0.08] transition-colors cursor-pointer"
      >
        <Link2 size={13} />
      </button>

      <button
        type="button"
        title="Spoiler (||hidden text||)"
        onClick={() => handleFormat("spoiler")}
        className="p-1 rounded text-[#7A7A7A] hover:text-amber-400 hover:bg-white/[0.08] transition-colors cursor-pointer"
      >
        <EyeOff size={13} />
      </button>

      <button
        type="button"
        title="Quote (> text)"
        onClick={() => handleFormat("quote")}
        className="p-1 rounded text-[#7A7A7A] hover:text-[#61F1AC] hover:bg-white/[0.08] transition-colors cursor-pointer"
      >
        <Quote size={13} />
      </button>

      <button
        type="button"
        title="Inline Code (`code`)"
        onClick={() => handleFormat("code")}
        className="p-1 rounded text-[#7A7A7A] hover:text-[#61F1AC] hover:bg-white/[0.08] transition-colors cursor-pointer"
      >
        <Code size={13} />
      </button>
    </div>
  );
}

/**
 * Keyboard shortcuts handler for textareas.
 * Add onKeyDown={(e) => handleFormattingKeyDown(e, textareaRef.current, value, onChange)}
 */
export function handleFormattingKeyDown(e, textarea, value, onChange) {
  if (!textarea || (!e.ctrlKey && !e.metaKey)) return;

  const key = e.key.toLowerCase();
  if (key === "b") {
    e.preventDefault();
    insertFormat(textarea, "**", "**", "bold text", onChange);
  } else if (key === "i") {
    e.preventDefault();
    insertFormat(textarea, "*", "*", "italic text", onChange);
  } else if (key === "k") {
    e.preventDefault();
    insertFormat(textarea, "[", "](https://)", "link title", onChange);
  }
}

export default CommentFormattingToolbar;
