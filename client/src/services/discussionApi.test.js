import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getSeasonDiscussionCounts,
  getEpisodeDiscussion,
  postEpisodeComment,
} from "./discussionApi.js";

describe("discussionApi validation & defaults", () => {
  it("getSeasonDiscussionCounts returns empty object if seriesId or seasonNumber missing", async () => {
    const res1 = await getSeasonDiscussionCounts(null, 1);
    assert.deepEqual(res1, {});

    const res2 = await getSeasonDiscussionCounts("1396", null);
    assert.deepEqual(res2, {});
  });

  it("getEpisodeDiscussion returns empty structure if parameters missing", async () => {
    const res = await getEpisodeDiscussion(null, null, null);
    assert.deepEqual(res, { comments: [], totalCount: 0, likedCommentIds: [] });
  });

  it("postEpisodeComment throws if content is empty or whitespace", async () => {
    await assert.rejects(
      async () => {
        await postEpisodeComment({
          seriesId: "1396",
          seasonNumber: 1,
          episodeNumber: 1,
          content: "   ",
        });
      },
      {
        message: "Comment cannot be empty.",
      }
    );
  });
});
