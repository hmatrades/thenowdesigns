import {
  TIKTOK_PROMOTION_GATES,
  reelsSignalScore,
  shortsScore,
  tiktokScore,
  xHeavyRankerScore,
} from './equations.js'
import type { ContentFeatures, MetricTarget, Platform, PlatformScore } from './types.js'

/**
 * Maps creator-controllable content attributes (0–10) onto the engagement
 * probabilities each platform's ranking formula consumes, then applies the
 * documented formula from equations.ts.
 *
 * The probability mappings are calibrated to publicly reported per-view /
 * per-reach benchmark rates (docs/virality-research.md §benchmarks), so a
 * feature of ~5 lands near the platform median and 9–10 lands near
 * top-percentile rates. Scores are normalized against a hypothetical
 * all-10s post, so 100 = ceiling, not a guarantee.
 */

const FEATURE_KEYS: (keyof ContentFeatures)[] = [
  'hookStrength',
  'retentionDesign',
  'shareTrigger',
  'saveUtility',
  'commentBait',
  'trendAlignment',
  'nicheFit',
]

export function clampFeatures(f: ContentFeatures): ContentFeatures {
  const out = { ...f }
  for (const k of FEATURE_KEYS) out[k] = Math.min(10, Math.max(0, out[k]))
  return out
}

const PERFECT: ContentFeatures = {
  hookStrength: 10,
  retentionDesign: 10,
  shareTrigger: 10,
  saveUtility: 10,
  commentBait: 10,
  trendAlignment: 10,
  nicheFit: 10,
}

// --- raw platform scores -----------------------------------------------

function tiktokRaw(f: ContentFeatures): number {
  const base = tiktokScore({
    pPlay: 0.3 + 0.06 * f.hookStrength,
    ePlaytime: 0.2 + 0.05 * f.retentionDesign + 0.02 * f.hookStrength,
    pLike: 0.01 + 0.005 * (f.shareTrigger + f.nicheFit) / 2,
    pComment: 0.002 + 0.002 * f.commentBait,
  })
  // Discovery on TikTok is heavily trend/sound-driven; riding a rising
  // sound or format widens the initial test pools.
  return base * (0.8 + 0.04 * f.trendAlignment)
}

function reelsRaw(f: ContentFeatures): number {
  const base = reelsSignalScore({
    sendsPerReach: 0.002 + 0.003 * f.shareTrigger,
    avgWatchPct: 0.25 + 0.05 * f.retentionDesign + 0.02 * f.hookStrength,
    likesPerReach: 0.02 + 0.006 * (f.hookStrength + f.nicheFit) / 2,
    commentsPerReach: 0.001 + 0.0015 * f.commentBait,
  })
  return base * (0.85 + 0.03 * f.trendAlignment)
}

function shortsRaw(f: ContentFeatures): number {
  const base = shortsScore(
    0.4 + 0.05 * f.hookStrength,
    0.3 + 0.06 * f.retentionDesign + 0.01 * f.hookStrength,
  )
  // Channel/topic consistency feeds Shorts' interest clustering.
  return base * (0.8 + 0.02 * f.nicheFit + 0.02 * f.saveUtility)
}

function xRaw(f: ContentFeatures): number {
  return xHeavyRankerScore({
    favorite: 0.005 + 0.004 * (f.hookStrength + f.nicheFit) / 2,
    retweet: 0.001 + 0.002 * f.shareTrigger,
    reply: 0.0005 + 0.0015 * f.commentBait,
    replyEngagedByAuthor: 0.0002 + 0.0008 * f.commentBait,
    goodProfileClick: 0.0005 + 0.001 * f.nicheFit,
    videoPlayback50: 0.1 + 0.04 * f.retentionDesign,
    negativeFeedback: 0.002,
    report: 0.0002,
  })
}

/**
 * LinkedIn has no open-sourced ranker; its engineering blog documents
 * dwell time as a core ranking objective and creators consistently measure
 * a first-60–90-minute engagement window. Heuristic: comments > dwell >
 * reactions, with saves as a dwell proxy.
 */
function linkedinRaw(f: ContentFeatures): number {
  const commentRate = 0.002 + 0.003 * f.commentBait
  const dwellProxy = 0.2 + 0.05 * f.retentionDesign + 0.02 * f.saveUtility
  const reactRate = 0.01 + 0.005 * (f.hookStrength + f.nicheFit) / 2
  return 3 * commentRate + 2 * dwellProxy + 1 * reactRate
}

const RAW_SCORERS: Record<Platform, (f: ContentFeatures) => number> = {
  tiktok: tiktokRaw,
  reels: reelsRaw,
  shorts: shortsRaw,
  x: xRaw,
  linkedin: linkedinRaw,
}

// --- metric targets shown alongside each score ---------------------------

const TARGETS: Record<Platform, MetricTarget[]> = {
  tiktok: [
    { metric: 'Completion rate', target: `≥ ${TIKTOK_PROMOTION_GATES.completionRate * 100}% (aim full watch + loop)`, source: 'reported promotion gate' },
    { metric: 'Likes / view', target: '≥ 5%', source: 'reported promotion gate' },
    { metric: 'Shares / view', target: '≥ 0.5%', source: 'reported promotion gate' },
    { metric: 'First 3 s hold', target: 'no swipe-away spike', source: 'leaked Algo-101 doc priority' },
  ],
  reels: [
    { metric: 'Sends per reach', target: 'your account top-quartile', source: 'Mosseri: #1 reach signal' },
    { metric: 'Avg watch %', target: '≥ 80–100% (loop if < 15 s)', source: 'Meta ranking explainers' },
    { metric: 'Likes per reach', target: '≥ 3–6%', source: 'creator benchmarks' },
  ],
  shorts: [
    { metric: 'Viewed vs swiped away', target: '≥ 70%', source: 'YouTube analytics guidance' },
    { metric: 'Avg view duration', target: '≥ 80–90% of length', source: 'creator benchmarks' },
  ],
  x: [
    { metric: 'Replies (that you answer)', target: 'answer every reply in hour 1 — 75× weight', source: 'open-source heavy ranker' },
    { metric: 'Reports / mutes', target: '≈ 0 — one report ≈ −738 likes', source: 'open-source heavy ranker' },
    { metric: 'Profile clicks', target: 'bio + pinned tweet ready (12× weight)', source: 'open-source heavy ranker' },
  ],
  linkedin: [
    { metric: 'Comments in first 90 min', target: '≥ 5–10 substantive', source: 'golden-hour creator studies' },
    { metric: 'Dwell time', target: 'multi-paragraph value or doc carousel', source: 'LinkedIn engineering blog' },
  ],
}

// --- public API -----------------------------------------------------------

export function scorePlatform(platform: Platform, features: ContentFeatures): PlatformScore {
  const f = clampFeatures(features)
  const raw = RAW_SCORERS[platform](f)
  const ceiling = RAW_SCORERS[platform](PERFECT)
  const score = Math.round((raw / ceiling) * 100)

  // Marginal analysis: which lever moves this platform's score most from here?
  const gains = FEATURE_KEYS.filter((k) => f[k] < 10).map((k) => {
    const bumped = { ...f, [k]: Math.min(10, f[k] + 1) }
    const gain = ((RAW_SCORERS[platform](bumped) - raw) / ceiling) * 100
    return { k, gain }
  })
  gains.sort((a, b) => b.gain - a.gain)

  const rationale: string[] = []
  const top = gains[0]
  if (top && top.gain > 0.2) {
    rationale.push(`Biggest lever: ${top.k} (+${top.gain.toFixed(1)} pts per +1)`)
  }
  const second = gains[1]
  if (second && second.gain > 0.2) {
    rationale.push(`Next lever: ${second.k} (+${second.gain.toFixed(1)} pts per +1)`)
  }

  return { platform, score, rationale, targets: TARGETS[platform] }
}

export function scoreAllPlatforms(
  features: ContentFeatures,
  platforms: Platform[] = ['tiktok', 'reels', 'shorts', 'x', 'linkedin'],
): PlatformScore[] {
  return platforms.map((p) => scorePlatform(p, features)).sort((a, b) => b.score - a.score)
}
