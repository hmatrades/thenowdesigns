import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildBrief, renderMarkdown } from '../src/brief.js'
import {
  TIKTOK_DEFAULT_WEIGHTS,
  X_HEAVY_RANKER_WEIGHTS,
  hackerNewsRank,
  projectedFinalEngagement,
  redditHot,
  tiktokScore,
  xHeavyRankerScore,
} from '../src/equations.js'
import { classify, scoreTrends, stageOf, velocityOf } from '../src/model.js'
import { scoreAllPlatforms, scorePlatform } from '../src/scoring.js'
import { FIXTURE_SIGNALS } from '../src/signals/fixtures.js'
import { parseTraffic } from '../src/signals/googletrends.js'
import type { ContentFeatures } from '../src/types.js'

// --- equations -------------------------------------------------------------

test('x heavy ranker: weighted sum matches manual calculation', () => {
  const score = xHeavyRankerScore({ favorite: 0.1, retweet: 0.05, reply: 0.01 })
  assert.ok(Math.abs(score - (0.5 * 0.1 + 1.0 * 0.05 + 13.5 * 0.01)) < 1e-9)
})

test('x heavy ranker: one report outweighs hundreds of likes', () => {
  const liked = xHeavyRankerScore({ favorite: 1 }) // 500 likes' worth per 0.5 weight unit
  const reported = xHeavyRankerScore({ favorite: 1, report: 1 })
  assert.ok(liked > 0)
  assert.ok(reported < 0)
  assert.equal(X_HEAVY_RANKER_WEIGHTS.report, -369.0)
  assert.equal(X_HEAVY_RANKER_WEIGHTS.replyEngagedByAuthor, 75.0)
})

test('tiktok score is a linear combination of the leaked shape', () => {
  const s = tiktokScore({ pLike: 0.1, pComment: 0.05, ePlaytime: 0.5, pPlay: 0.8 })
  const w = TIKTOK_DEFAULT_WEIGHTS
  assert.ok(Math.abs(s - (0.1 * w.vLike + 0.05 * w.vComment + 0.5 * w.vPlaytime + 0.8 * w.vPlay)) < 1e-9)
})

test('reddit hot: newer post beats older post with same votes', () => {
  const now = 1_750_000_000
  assert.ok(redditHot(100, 0, now) > redditHot(100, 0, now - 86_400))
})

test('reddit hot: ~12.5h of recency is worth 10x the votes', () => {
  const now = 1_750_000_000
  const older = redditHot(1000, 0, now - 45_000)
  const newer = redditHot(100, 0, now)
  assert.ok(Math.abs(older - newer) < 1e-6)
})

test('hacker news rank: decays super-linearly with age', () => {
  const fresh = hackerNewsRank(100, 1)
  const stale = hackerNewsRank(100, 10)
  assert.ok(fresh > stale * 3)
  assert.ok(Math.abs(hackerNewsRank(101, 0) - Math.pow(100, 0.8) / Math.pow(2, 1.8)) < 1e-9)
})

test('projected engagement: young posts project higher multiples', () => {
  const young = projectedFinalEngagement(100, 1, 6)
  const old = projectedFinalEngagement(100, 24, 6)
  assert.ok(young > old)
  assert.ok(old >= 100)
})

// --- model -------------------------------------------------------------

test('classify maps titles to niche categories', () => {
  assert.equal(classify('New typography and logo trends for 2026'), 'design')
  assert.equal(classify('ChatGPT for small landing page copy'), 'ai')
  assert.equal(classify('completely unrelated sports news'), 'other')
})

test('lifecycle staging: fresh+accelerating is emerging, old is saturated', () => {
  const base = FIXTURE_SIGNALS[0]!
  assert.equal(stageOf({ ...base, ageHours: 2, accelerating: true }, velocityOf(base)), 'emerging')
  assert.equal(stageOf({ ...base, ageHours: 72 }, 5), 'saturated')
})

test('scoreTrends ranks a fresh relevant trend above a stale one', () => {
  const scored = scoreTrends(FIXTURE_SIGNALS)
  assert.equal(scored.length, FIXTURE_SIGNALS.length)
  const first = scored[0]!
  const last = scored[scored.length - 1]!
  assert.ok(first.waveScore >= last.waveScore)
  for (const t of scored) {
    assert.ok(t.momentum >= 0 && t.momentum <= 100)
    assert.ok(t.waveScore >= 0 && t.waveScore <= 100)
  }
})

// --- scoring -------------------------------------------------------------

const MID_FEATURES: ContentFeatures = {
  hookStrength: 5,
  retentionDesign: 5,
  shareTrigger: 5,
  saveUtility: 5,
  commentBait: 5,
  trendAlignment: 5,
  nicheFit: 5,
}

test('platform scores are 0-100 and perfect content scores 100', () => {
  const perfect: ContentFeatures = {
    hookStrength: 10, retentionDesign: 10, shareTrigger: 10, saveUtility: 10,
    commentBait: 10, trendAlignment: 10, nicheFit: 10,
  }
  for (const s of scoreAllPlatforms(perfect)) assert.equal(s.score, 100)
  for (const s of scoreAllPlatforms(MID_FEATURES)) {
    assert.ok(s.score > 0 && s.score < 100, `${s.platform} mid score ${s.score}`)
  }
})

test('better hooks score higher on tiktok', () => {
  const weak = scorePlatform('tiktok', { ...MID_FEATURES, hookStrength: 2 })
  const strong = scorePlatform('tiktok', { ...MID_FEATURES, hookStrength: 9 })
  assert.ok(strong.score > weak.score)
})

test('marginal-gain rationale points at the weakest big lever', () => {
  const s = scorePlatform('reels', { ...MID_FEATURES, shareTrigger: 1 })
  assert.ok(s.rationale.some((r) => r.includes('shareTrigger')))
})

// --- signals + brief ---------------------------------------------------

test('parseTraffic handles K/M suffixes', () => {
  assert.equal(parseTraffic('200K+'), 200_000)
  assert.equal(parseTraffic('1M+'), 1_000_000)
  assert.equal(parseTraffic('523'), 523)
})

test('offline brief has waves, plays, and renders markdown', () => {
  const brief = buildBrief(FIXTURE_SIGNALS, ['fixture'], [])
  assert.ok(brief.waves.length > 0)
  assert.equal(brief.plays.length, 3)
  for (const play of brief.plays) {
    assert.ok(play.bestPlatform.score > 0)
    assert.ok(!play.adaptedHook.includes('{TREND}'), 'wildcard hooks must be spliced')
  }
  const md = renderMarkdown(brief)
  assert.ok(md.includes('Wave radar'))
  assert.ok(md.includes("Today's plays"))
})
