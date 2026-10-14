/**
 * Scores a TMDB review to pick the highest quality review.
 *
 * Scoring formula:
 * score = (author_details.rating != null ? 40 : 0)
 *       + (author_details.rating ?? 0) * 2
 *       + lengthScore       // 0-30: ramp up to ~300 chars, flat to ~1200, decay after
 *       - (content contains "spoiler" ? 15 : 0)
 *       - (content is mostly URLs / ALL CAPS / under 80 chars ? 50 : 0)
 *
 * @param {object} review - TMDB review object
 * @returns {number} Score
 */
export function scoreReview(review) {
  if (!review || !review.content) return -1000;

  const content = review.content.trim();
  const len = content.length;

  // Heavy penalty for too short content
  if (len < 80) return -100;

  let score = 0;

  // 1. Rating presence and value
  const rating = review.author_details?.rating;
  if (rating !== null && rating !== undefined && !Number.isNaN(Number(rating))) {
    score += 40 + Number(rating) * 2;
  }

  // 2. Length scoring (0 - 30):
  // Ramp up to 300 chars (0 -> 30)
  // Flat from 300 to 1200 (30)
  // Mild decay past 1200 down to minimum 10
  if (len < 300) {
    score += Math.round((len / 300) * 30);
  } else if (len <= 1200) {
    score += 30;
  } else {
    const excess = len - 1200;
    const decay = Math.min(20, Math.floor(excess / 200));
    score += 30 - decay;
  }

  // 3. Spoiler penalty
  if (/spoiler/i.test(content)) {
    score -= 15;
  }

  // 4. Spam / low quality detection
  const upperCount = (content.match(/[A-Z]/g) || []).length;
  const letterCount = (content.match(/[a-zA-Z]/g) || []).length;
  const isAllCaps = letterCount > 40 && upperCount / letterCount > 0.65;
  const urlCount = (content.match(/https?:\/\//gi) || []).length;

  if (isAllCaps || urlCount >= 3) {
    score -= 50;
  }

  return score;
}

/**
 * Selects the best review from an array of TMDB reviews.
 * Returns null if no suitable review is found.
 *
 * @param {Array} reviews
 * @returns {object|null}
 */
export function selectBestReview(reviews) {
  if (!Array.isArray(reviews) || reviews.length === 0) return null;

  let best = null;
  let highestScore = -Infinity;

  for (const rev of reviews) {
    const s = scoreReview(rev);
    if (s > highestScore && s > -20) {
      highestScore = s;
      best = rev;
    }
  }

  return best;
}
