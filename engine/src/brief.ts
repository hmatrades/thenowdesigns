import { IDEA_BANK } from './ideas.js'
import { scoreTrends } from './model.js'
import { scoreAllPlatforms } from './scoring.js'
import type { ContentIdea, ContentPlay, DailyBrief, ScoredTrend, TrendSignal } from './types.js'

const MAX_WAVES = 8
const MAX_PLAYS = 3

/** Splice a live trend into a wildcard hook, or prefix context otherwise. */
function adaptHook(idea: ContentIdea, trend?: ScoredTrend): string {
  if (!trend) return idea.hook
  if (idea.hook.includes('{TREND}')) return idea.hook.replaceAll('{TREND}', trend.title)
  return idea.hook
}

/**
 * Pair the day's top waves with the best-fitting ideas. An idea riding a
 * matched wave gets its trendAlignment lifted toward the wave's momentum —
 * that is the whole point of posting into a rising trend.
 */
function buildPlays(waves: ScoredTrend[]): ContentPlay[] {
  const plays: ContentPlay[] = []
  const usedIdeas = new Set<string>()

  for (const wave of waves) {
    if (plays.length >= MAX_PLAYS) break
    if (wave.stage === 'saturated') continue
    const candidates = IDEA_BANK.filter(
      (idea) => !usedIdeas.has(idea.slug) && idea.categories.includes(wave.category),
    )
    const idea = candidates[0]
    if (!idea) continue
    usedIdeas.add(idea.slug)

    const lifted = Math.max(idea.features.trendAlignment, Math.round(wave.momentum / 10))
    const features = { ...idea.features, trendAlignment: lifted }
    const allPlatforms = scoreAllPlatforms(features, idea.platforms)
    const bestPlatform = allPlatforms[0]
    if (!bestPlatform) continue

    plays.push({ idea, trend: wave, adaptedHook: adaptHook(idea, wave), bestPlatform, allPlatforms })
  }

  // Not enough trend matches today: fill with evergreen bank ideas on priors.
  for (const idea of IDEA_BANK) {
    if (plays.length >= MAX_PLAYS) break
    if (usedIdeas.has(idea.slug)) continue
    usedIdeas.add(idea.slug)
    const allPlatforms = scoreAllPlatforms(idea.features, idea.platforms)
    const bestPlatform = allPlatforms[0]
    if (!bestPlatform) continue
    plays.push({ idea, adaptedHook: idea.hook, bestPlatform, allPlatforms })
  }

  return plays
}

export function buildBrief(
  signals: TrendSignal[],
  sourcesUsed: string[],
  sourcesFailed: string[],
  now = new Date(),
): DailyBrief {
  const waves = scoreTrends(signals).slice(0, MAX_WAVES)
  return {
    date: now.toISOString().slice(0, 10),
    generatedAt: now.toISOString(),
    sourcesUsed,
    sourcesFailed,
    waves,
    plays: buildPlays(waves),
  }
}

const STAGE_EMOJI: Record<ScoredTrend['stage'], string> = {
  emerging: '🌱',
  surging: '🌊',
  peaking: '⛰️',
  saturated: '🏜️',
}

export function renderMarkdown(brief: DailyBrief): string {
  const lines: string[] = []
  lines.push(`# The Now Designs — Daily Virality Brief`)
  lines.push('')
  lines.push(`**${brief.date}** · sources: ${brief.sourcesUsed.join(', ') || 'none'}${brief.sourcesFailed.length ? ` · failed: ${brief.sourcesFailed.join(', ')}` : ''}`)
  lines.push('')

  lines.push(`## 🌊 Wave radar`)
  lines.push('')
  lines.push(`| # | Trend | Stage | Momentum | Fit | Wave | Window |`)
  lines.push(`|---|-------|-------|----------|-----|------|--------|`)
  brief.waves.forEach((w, i) => {
    const title = w.url ? `[${w.title.slice(0, 60)}](${w.url})` : w.title.slice(0, 60)
    lines.push(
      `| ${i + 1} | ${title} | ${STAGE_EMOJI[w.stage]} ${w.stage} | ${w.momentum} | ${Math.round(w.relevance * 100)}% | **${w.waveScore}** | ${w.window} |`,
    )
  })
  lines.push('')

  lines.push(`## 🎬 Today's plays`)
  lines.push('')
  brief.plays.forEach((play, i) => {
    lines.push(`### ${i + 1}. ${play.idea.title}`)
    lines.push('')
    if (play.trend) {
      lines.push(`*Riding:* ${play.trend.title} (${play.trend.stage}, wave ${play.trend.waveScore}) — ${play.trend.window}`)
      lines.push('')
    }
    lines.push(`> **Hook:** ${play.adaptedHook}`)
    lines.push('')
    lines.push(`**Format:** ${play.idea.format}`)
    lines.push('')
    lines.push(
      `**Platforms:** ${play.allPlatforms.map((p) => `${p.platform} **${p.score}**`).join(' · ')}`,
    )
    lines.push('')
    if (play.bestPlatform.rationale.length) {
      lines.push(`**Optimize:** ${play.bestPlatform.rationale.join('; ')}`)
      lines.push('')
    }
    lines.push(`**Hit these numbers on ${play.bestPlatform.platform}:**`)
    lines.push('')
    for (const t of play.bestPlatform.targets) {
      lines.push(`- ${t.metric}: ${t.target} _(${t.source})_`)
    }
    lines.push('')
  })

  lines.push('---')
  lines.push('')
  lines.push(
    `*Scores are relative prioritization, not guarantees: the equations are the platforms' documented ranking math (see docs/virality-research.md), but the engagement-probability inputs are estimates. Post, measure, recalibrate.*`,
  )
  lines.push('')
  return lines.join('\n')
}
