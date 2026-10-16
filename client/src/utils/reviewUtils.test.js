import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getReviewAuthor } from "./reviewUtils.js";

describe("getReviewAuthor", () => {
  it("extracts from flat string author and avatar", () => {
    const item = { author: "Alice", avatar: "https://example.com/avatar.jpg" };
    const res = getReviewAuthor(item);
    assert.equal(res.name, "Alice");
    assert.equal(res.avatar, "https://example.com/avatar.jpg");
  });

  it("extracts from object author with name and avatarUrl", () => {
    const item = { author: { name: "Bob", avatarUrl: "https://example.com/bob.jpg" } };
    const res = getReviewAuthor(item);
    assert.equal(res.name, "Bob");
    assert.equal(res.avatar, "https://example.com/bob.jpg");
  });

  it("extracts from object author with username and avatar", () => {
    const item = { author: { username: "charlie_dev", avatar: "https://example.com/charlie.png" } };
    const res = getReviewAuthor(item);
    assert.equal(res.name, "charlie_dev");
    assert.equal(res.avatar, "https://example.com/charlie.png");
  });

  it("extracts from users relation join", () => {
    const item = { users: { user_name: "Diana", profile_url: "https://example.com/diana.jpg" } };
    const res = getReviewAuthor(item);
    assert.equal(res.name, "Diana");
    assert.equal(res.avatar, "https://example.com/diana.jpg");
  });

  it("extracts from user_metadata", () => {
    const item = { user_metadata: { user_name: "Evan", avatar_url: "https://example.com/evan.jpg" } };
    const res = getReviewAuthor(item);
    assert.equal(res.name, "Evan");
    assert.equal(res.avatar, "https://example.com/evan.jpg");
  });

  it("extracts from author_name and author_avatar", () => {
    const item = { author_name: "Fiona", author_avatar: "https://example.com/fiona.jpg" };
    const res = getReviewAuthor(item);
    assert.equal(res.name, "Fiona");
    assert.equal(res.avatar, "https://example.com/fiona.jpg");
  });

  it("falls back to custom fallbackName when author is absent", () => {
    const item = {};
    const res = getReviewAuthor(item, "Anonymous Reviewer");
    assert.equal(res.name, "Anonymous Reviewer");
    assert.equal(res.avatar, undefined);
  });

  it("handles null and undefined input", () => {
    assert.deepEqual(getReviewAuthor(null), { name: "Anonymous", avatar: undefined });
    assert.deepEqual(getReviewAuthor(undefined, "Guest"), { name: "Guest", avatar: undefined });
  });

  it("ignores whitespace-only author and avatar strings", () => {
    const item = { author: "   ", avatar: "   " };
    const res = getReviewAuthor(item, "Anonymous");
    assert.equal(res.name, "Anonymous");
    assert.equal(res.avatar, undefined);
  });
});
