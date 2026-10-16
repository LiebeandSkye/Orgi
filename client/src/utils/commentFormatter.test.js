import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseCommentBlocks,
  parseInlineTokens,
  sanitizeUrl,
  stripCommentFormatting,
} from "./commentFormatter.js";

describe("commentFormatter", () => {
  describe("sanitizeUrl", () => {
    it("allows https and http urls", () => {
      assert.equal(sanitizeUrl("https://example.com"), "https://example.com");
      assert.equal(sanitizeUrl("http://example.com/path?q=1"), "http://example.com/path?q=1");
    });

    it("normalizes www. prefixes to https://", () => {
      assert.equal(sanitizeUrl("www.example.com"), "https://www.example.com");
    });

    it("allows mailto: and relative paths", () => {
      assert.equal(sanitizeUrl("mailto:user@example.com"), "mailto:user@example.com");
      assert.equal(sanitizeUrl("/movies/123"), "/movies/123");
    });

    it("rejects dangerous protocols (javascript:, data:, vbscript:)", () => {
      assert.equal(sanitizeUrl("javascript:alert(1)"), null);
      assert.equal(sanitizeUrl("data:text/html,<script>alert(1)</script>"), null);
      assert.equal(sanitizeUrl("vbscript:msgbox(1)"), null);
    });
  });

  describe("parseInlineTokens", () => {
    it("returns plain text unchanged", () => {
      const tokens = parseInlineTokens("Hello world");
      assert.deepEqual(tokens, [{ type: "text", value: "Hello world" }]);
    });

    it("parses bold syntax (**bold** and __bold__)", () => {
      const tokens = parseInlineTokens("This is **bold** and __also bold__");
      assert.equal(tokens[1].type, "bold");
      assert.equal(tokens[1].children[0].value, "bold");
      assert.equal(tokens[3].type, "bold");
      assert.equal(tokens[3].children[0].value, "also bold");
    });

    it("parses italic syntax (*italic* and _italic_)", () => {
      const tokens = parseInlineTokens("This is *italic* and _also italic_");
      assert.equal(tokens[1].type, "italic");
      assert.equal(tokens[1].children[0].value, "italic");
      assert.equal(tokens[3].type, "italic");
      assert.equal(tokens[3].children[0].value, "also italic");
    });

    it("parses bold + italic (***bolditalic***)", () => {
      const tokens = parseInlineTokens("Check ***super bold italic*** here");
      assert.equal(tokens[1].type, "bold_italic");
      assert.equal(tokens[1].children[0].value, "super bold italic");
    });

    it("parses strikethrough (~~text~~)", () => {
      const tokens = parseInlineTokens("This is ~~cancelled~~ now");
      assert.equal(tokens[1].type, "strike");
      assert.equal(tokens[1].children[0].value, "cancelled");
    });

    it("parses spoilers (||spoiler content||)", () => {
      const tokens = parseInlineTokens("The villain is ||Bruce Wayne||!");
      assert.equal(tokens[1].type, "spoiler");
      assert.equal(tokens[1].children[0].value, "Bruce Wayne");
    });

    it("parses inline code (`code`) without evaluating markdown inside", () => {
      const tokens = parseInlineTokens("Use `const **x** = 1;` here");
      assert.equal(tokens[1].type, "code");
      assert.equal(tokens[1].value, "const **x** = 1;");
    });

    it("parses markdown links [label](url)", () => {
      const tokens = parseInlineTokens("Visit [Google](https://google.com) today");
      assert.equal(tokens[1].type, "link");
      assert.equal(tokens[1].url, "https://google.com");
      assert.equal(tokens[1].children[0].value, "Google");
    });

    it("parses autolinks for raw URLs and trims trailing punctuation", () => {
      const tokens = parseInlineTokens("Check https://orgi.app/review! It is great.");
      assert.equal(tokens[1].type, "link");
      assert.equal(tokens[1].url, "https://orgi.app/review");
      assert.equal(tokens[1].children[0].value, "https://orgi.app/review");
      assert.equal(tokens[2].value, "! It is great.");
    });

    it("handles nested bold and italic inside links and spoilers", () => {
      const tokens = parseInlineTokens("||Spoiler: **Luke** dies||");
      assert.equal(tokens[0].type, "spoiler");
      assert.equal(tokens[0].children[0].value, "Spoiler: ");
      assert.equal(tokens[0].children[1].type, "bold");
      assert.equal(tokens[0].children[1].children[0].value, "Luke");
    });
  });

  describe("parseCommentBlocks", () => {
    it("parses blockquotes", () => {
      const blocks = parseCommentBlocks("> This is a quote\n> Second line");
      assert.equal(blocks[0].type, "blockquote");
      assert.equal(blocks[0].lines.length, 2);
    });

    it("parses code blocks with language", () => {
      const blocks = parseCommentBlocks("```javascript\nconsole.log(1);\n```");
      assert.equal(blocks[0].type, "codeblock");
      assert.equal(blocks[0].language, "javascript");
      assert.equal(blocks[0].code.trim(), "console.log(1);");
    });

    it("parses unordered and ordered lists", () => {
      const blocks = parseCommentBlocks("- Item 1\n- Item 2\n* Item 3");
      assert.equal(blocks[0].type, "bullet_list");
      assert.equal(blocks[0].items.length, 3);

      const ordered = parseCommentBlocks("1. First\n2. Second");
      assert.equal(ordered[0].type, "ordered_list");
      assert.equal(ordered[0].items.length, 2);
    });

    it("separates paragraphs on double newlines", () => {
      const blocks = parseCommentBlocks("First paragraph\nstill first\n\nSecond paragraph");
      assert.equal(blocks.length, 2);
      assert.equal(blocks[0].type, "paragraph");
      assert.equal(blocks[1].type, "paragraph");
    });
  });

  describe("stripCommentFormatting", () => {
    it("strips markdown tags for clean excerpt search/previews", () => {
      const raw = "Check **bold** and *italic* with [Link](https://test.com) and `code`!";
      const plain = stripCommentFormatting(raw);
      assert.equal(plain, "Check bold and italic with Link and code!");
    });
  });
});
