/** Platforms the engine scores content for. */
export type Platform = 'tiktok' | 'reels' | 'shorts' | 'x' | 'linkedin'

export type TrendCategory =
  | 'design'
  | 'webdev'
  | 'ai'
  | 'smallbiz'
  | 'marketing'
  | 'culture'
  | 'other'

export type SignalSource = 'reddit' | 'hackernews' | 'googletrends' | 'fixture'

/** A raw trend observation pulled from one public source. */
export interface TrendSignal {
  source: SignalSource
  id: string
  title: string
  url?: string
  category: TrendCategory
  /** Hours since the item was created / started trending. */
  ageHours: number
  /** Upvotes, points, or traffic index — whatever the source counts. */
  engagement: number
  comments?: number
  /** True when the source itself flags acceleration (e.g. Reddit /rising). */
  accelerating?: boolean
}

export type LifecycleStage = 'emerging' | 'surging' | 'peaking' | 'saturated'

/** A trend after the model has scored it. */
export interface ScoredTrend extends TrendSignal {
  /** Engagement per hour. */
  velocity: number
  /** 0–100 percentile-ranked velocity within today's batch. */
  momentum: number
  /** 0–1 fit to the thenowdesigns niche. */
  relevance: number
  stage: LifecycleStage
  /** momentum × relevance blend, 0–100. Sort key for the brief. */
  waveScore: number
  /** Human guidance: when to post to catch this wave. */
  window: string
}

/**
 * Content attributes the engine can estimate engagement probabilities from.
 * All 0–10. These are the levers a creator actually controls.
 */
export interface ContentFeatures {
  /** First 1–3 s: pattern interrupt, curiosity gap, bold claim. */
  hookStrength: number
  /** Pacing, loops, payoffs that keep viewers to the end. */
  retentionDesign: number
  /** Utility / identity / awe that makes people send it to a friend. */
  shareTrigger: number
  /** Reference value that makes people save it for later. */
  saveUtility: number
  /** Questions, mild controversy, fill-in-the-blank prompts. */
  commentBait: number
  /** How closely it rides a currently rising trend/sound/format. */
  trendAlignment: number
  /** Fit to the account's proven niche (consistency signal). */
  nicheFit: number
}

export interface MetricTarget {
  metric: string
  target: string
  source: string
}

export interface PlatformScore {
  platform: Platform
  /** 0–100 relative virality potential on this platform. */
  score: number
  rationale: string[]
  targets: MetricTarget[]
}

/** A reusable content concept from the thenowdesigns idea bank. */
export interface ContentIdea {
  slug: string
  title: string
  format: string
  hook: string
  categories: TrendCategory[]
  features: ContentFeatures
  platforms: Platform[]
}

/** One recommended post: an idea matched to a live trend. */
export interface ContentPlay {
  idea: ContentIdea
  trend?: ScoredTrend
  adaptedHook: string
  bestPlatform: PlatformScore
  allPlatforms: PlatformScore[]
}

export interface DailyBrief {
  date: string
  generatedAt: string
  sourcesUsed: string[]
  sourcesFailed: string[]
  waves: ScoredTrend[]
  plays: ContentPlay[]
}
