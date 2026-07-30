/**
 * Platform ranking equations, reconstructed from primary sources:
 * open-sourced code, official engineering blogs, leaked internal docs
 * reported by major outlets, and peer-reviewed papers.
 *
 * Full provenance and citations: docs/virality-research.md
 *
 * The platforms compute the input probabilities (p(like), p(share), …)
 * with internal ML models over user×item features we cannot see. What IS
 * public is how those probabilities are COMBINED into a ranking score.
 * This module implements the public combination math; the engine estimates
 * the inputs from content attributes (see scoring.ts).
 */

// ---------------------------------------------------------------------------
// X / Twitter — "heavy ranker" weighted engagement sum
// Source: github.com/twitter/the-algorithm-ml (open-sourced 2023),
// projects/home/recap — final score = Σ weight_i × p(engagement_i).
// Weight values below are the published production config values.
// ---------------------------------------------------------------------------

export const X_HEAVY_RANKER_WEIGHTS = {
  favorite: 0.5,
  retweet: 1.0,
  reply: 13.5,
  goodProfileClick: 12.0,
  videoPlayback50: 0.005,
  /** Author replies to your reply — the single strongest positive signal. */
  replyEngagedByAuthor: 75.0,
  /** Click into the conversation and reply or like. */
  goodClickConvo: 11.0,
  /** Click into the conversation and dwell ≥ 2 minutes. */
  goodClickDwell: 10.0,
  negativeFeedback: -74.0,
  report: -369.0,
} as const

export type XEngagement = keyof typeof X_HEAVY_RANKER_WEIGHTS

/**
 * X heavy-ranker score: Σ weight_i × p_i over predicted engagement
 * probabilities (each 0–1). Note the asymmetry: one predicted report
 * (-369) erases ~738 likes (0.5 each) — negative signals dominate.
 */
export function xHeavyRankerScore(p: Partial<Record<XEngagement, number>>): number {
  let score = 0
  for (const key of Object.keys(X_HEAVY_RANKER_WEIGHTS) as XEngagement[]) {
    score += X_HEAVY_RANKER_WEIGHTS[key] * (p[key] ?? 0)
  }
  return score
}

// ---------------------------------------------------------------------------
// TikTok — leaked "TikTok Algo 101" scoring shape
// Source: internal doc reported by the New York Times (Dec 2021):
//   score = p(like)·v_like + p(comment)·v_comment + E(playtime)·v_playtime + p(play)·v_play
// The v weights were not disclosed; defaults below encode the doc's stated
// priority (watch time and completion dominate) and are tunable.
// ---------------------------------------------------------------------------

export interface TikTokWeights {
  vLike: number
  vComment: number
  vPlaytime: number
  vPlay: number
}

/** Undisclosed in the leak; defaults reflect the documented priority order. */
export const TIKTOK_DEFAULT_WEIGHTS: TikTokWeights = {
  vLike: 1,
  vComment: 2,
  vPlaytime: 4,
  vPlay: 3,
}

export function tiktokScore(
  p: { pLike: number; pComment: number; ePlaytime: number; pPlay: number },
  w: TikTokWeights = TIKTOK_DEFAULT_WEIGHTS,
): number {
  return p.pLike * w.vLike + p.pComment * w.vComment + p.ePlaytime * w.vPlaytime + p.pPlay * w.vPlay
}

/**
 * TikTok distributes in staged batches: a new video is shown to a small
 * test pool (~a few hundred views), and promotion to the next, larger pool
 * depends on ratios measured in the current one. Thresholds below are the
 * commonly reported promotion gates; treat as heuristics, not contracts.
 */
export const TIKTOK_PROMOTION_GATES = {
  completionRate: 0.5,
  likeRate: 0.05,
  commentRate: 0.005,
  shareRate: 0.005,
} as const

// ---------------------------------------------------------------------------
// Instagram — modern signal order + legacy EdgeRank
// Source: Meta engineering blog + Adam Mosseri's published rankings
// explainers. For Reels, ranked signals: watch time, likes-per-reach,
// sends-per-reach — with SENDS PER REACH called out as the top signal
// for reach expansion. EdgeRank (affinity × weight × time-decay) is the
// deprecated 2010-era feed formula, kept as the historical baseline shape.
// ---------------------------------------------------------------------------

export function edgeRank(affinity: number, weight: number, timeDecay: number): number {
  return affinity * weight * timeDecay
}

/**
 * Reels reach potential per Mosseri's stated signal order. Inputs are
 * per-reach rates; each is normalized against a top-percentile benchmark
 * rate before weighting — otherwise watch-% (scale ~1) would drown out
 * sends-per-reach (scale ~0.03) and invert the published ordering
 * (sends > watch time > likes). Weights encode the ordering, not
 * disclosed constants.
 */
export const REELS_BENCHMARK_TOPS = {
  sendsPerReach: 0.032,
  avgWatchPct: 0.95,
  likesPerReach: 0.08,
  commentsPerReach: 0.016,
} as const

export function reelsSignalScore(p: {
  sendsPerReach: number
  avgWatchPct: number
  likesPerReach: number
  commentsPerReach: number
}): number {
  const b = REELS_BENCHMARK_TOPS
  return (
    5 * (p.sendsPerReach / b.sendsPerReach) +
    3 * (p.avgWatchPct / b.avgWatchPct) +
    1.5 * (p.likesPerReach / b.likesPerReach) +
    1 * (p.commentsPerReach / b.commentsPerReach)
  )
}

// ---------------------------------------------------------------------------
// YouTube — expected watch time as the ranking objective
// Source: Covington, Adams & Sargin, "Deep Neural Networks for YouTube
// Recommendations" (RecSys 2016). Ranking is trained with weighted logistic
// regression where positives are weighted by watch time, so the learned
// odds e^(Wx+b) approximate expected watch time per impression.
// Shorts feed additionally optimizes viewed-vs-swiped-away.
// ---------------------------------------------------------------------------

/**
 * Expected watch seconds per impression: p(click/view) × E(watch seconds).
 * This is the quantity YouTube's ranker approximates.
 */
export function expectedWatchTime(pView: number, expectedWatchSeconds: number): number {
  return pView * expectedWatchSeconds
}

/**
 * Shorts proxy score: fraction not swiped away × average % of the video
 * watched (values > 1 mean loops, which count).
 */
export function shortsScore(stayedRate: number, avgViewPct: number): number {
  return stayedRate * avgViewPct
}

// ---------------------------------------------------------------------------
// Reddit "hot" — fully public, from Reddit's open-sourced code
//   hot = log10(max(|ups-downs|, 1)) + sign · (t_created - 1134028003) / 45000
// Every ~12.5 hours of recency is worth one order of magnitude of votes.
// ---------------------------------------------------------------------------

const REDDIT_EPOCH_SECONDS = 1134028003 // 2005-12-08T07:46:43Z

export function redditHot(ups: number, downs: number, createdUtcSeconds: number): number {
  const s = ups - downs
  const order = Math.log10(Math.max(Math.abs(s), 1))
  const sign = s > 0 ? 1 : s < 0 ? -1 : 0
  return sign * order + (createdUtcSeconds - REDDIT_EPOCH_SECONDS) / 45000
}

// ---------------------------------------------------------------------------
// Hacker News — public gravity formula
//   rank_score = (points - 1)^0.8 / (age_hours + 2)^1.8
// Sub-linear reward for points, super-linear decay with age: velocity in
// the first hours decides everything.
// ---------------------------------------------------------------------------

export function hackerNewsRank(points: number, ageHours: number, gravity = 1.8): number {
  return Math.pow(Math.max(points - 1, 0), 0.8) / Math.pow(ageHours + 2, gravity)
}

// ---------------------------------------------------------------------------
// Cascade projection — early velocity predicts final size
// Source: SEISMIC (Zhao et al., KDD 2015) and the Hawkes self-exciting
// process literature: early engagement velocity, discounted by a decaying
// memory kernel, estimates the "infectiousness" of a post and thereby its
// final cascade size. Simplified single-snapshot form below: project final
// engagement from current engagement assuming exponential decay of the
// arrival rate with the given half-life.
// ---------------------------------------------------------------------------

export function projectedFinalEngagement(
  currentEngagement: number,
  ageHours: number,
  halfLifeHours: number,
): number {
  if (ageHours <= 0) return currentEngagement
  const lambda = Math.LN2 / halfLifeHours
  // Fraction of the total area under e^(-λt) already elapsed by ageHours.
  const elapsedFraction = 1 - Math.exp(-lambda * ageHours)
  return currentEngagement / Math.max(elapsedFraction, 0.05)
}
