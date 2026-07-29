import type { IssueSeverity, ScanCategoryKey, ScanReport } from './siteScan'

export type SitePlatform =
  | 'webflow'
  | 'framer'
  | 'squarespace'
  | 'wix'
  | 'shopify'
  | 'wordpress'
  | 'custom'
  | 'unsure'

export type PageBand = '1' | '2-5' | '6-10' | '11-20' | '21+'
export type RepairTierId =
  | 'website-tune-up'
  | 'repair-sprint'
  | 'expanded-repair'
  | 'deep-repair'
  | 'major-remediation'

export interface RepairTier {
  id: RepairTierId
  label: string
  price: number
  rangeLow: number
  rangeHigh: number | null
  pointCeiling: number
  summary: string
}

export interface RepairEstimate {
  version: 1
  effortPoints: number
  estimatedHoursLow: number
  estimatedHoursHigh: number
  confidence: 'guided' | 'manual-review'
  tier: RepairTier | null
  drivers: string[]
}

export const PLATFORM_OPTIONS: Array<{ value: SitePlatform; label: string }> = [
  { value: 'webflow', label: 'Webflow' },
  { value: 'framer', label: 'Framer' },
  { value: 'squarespace', label: 'Squarespace' },
  { value: 'wix', label: 'Wix' },
  { value: 'shopify', label: 'Shopify' },
  { value: 'wordpress', label: 'WordPress' },
  { value: 'custom', label: 'Custom code / app' },
  { value: 'unsure', label: 'Not sure' },
]

export const PAGE_OPTIONS: Array<{ value: PageBand; label: string }> = [
  { value: '1', label: '1 page' },
  { value: '2-5', label: '2–5 pages' },
  { value: '6-10', label: '6–10 pages' },
  { value: '11-20', label: '11–20 pages' },
  { value: '21+', label: '21+ pages or templates' },
]

export const REPAIR_TIERS: RepairTier[] = [
  {
    id: 'website-tune-up',
    label: 'Website Tune-Up',
    price: 750,
    rangeLow: 600,
    rangeHigh: 900,
    pointCeiling: 8,
    summary: 'A contained set of technical fixes, quality assurance, and a verified retest.',
  },
  {
    id: 'repair-sprint',
    label: 'Website Repair Sprint',
    price: 1_500,
    rangeLow: 1_200,
    rangeHigh: 1_900,
    pointCeiling: 22,
    summary: 'A concentrated repair pass for the highest-impact verified leaks.',
  },
  {
    id: 'expanded-repair',
    label: 'Expanded Repair',
    price: 2_500,
    rangeLow: 2_000,
    rangeHigh: 2_900,
    pointCeiling: 32,
    summary: 'Broader remediation across several categories or page templates.',
  },
  {
    id: 'deep-repair',
    label: 'Deep Repair',
    price: 3_500,
    rangeLow: 3_000,
    rangeHigh: 4_200,
    pointCeiling: 45,
    summary: 'Platform-heavy remediation that needs deeper implementation and QA work.',
  },
  {
    id: 'major-remediation',
    label: 'Rebuild / Major Remediation',
    price: 4_500,
    rangeLow: 4_500,
    rangeHigh: null,
    pointCeiling: Number.POSITIVE_INFINITY,
    summary: 'The repair surface is large enough that rebuilding may be the smarter investment.',
  },
]

const PLATFORM_MULTIPLIER: Record<SitePlatform, number> = {
  webflow: 1,
  framer: 1,
  squarespace: 1,
  wix: 1,
  shopify: 1.1,
  wordpress: 1.15,
  custom: 1.25,
  unsure: 1.2,
}

const PAGE_MULTIPLIER: Record<PageBand, number> = {
  '1': 1,
  '2-5': 1.1,
  '6-10': 1.25,
  '11-20': 1.5,
  '21+': 2,
}

const SEVERITY_MULTIPLIER: Record<IssueSeverity, number> = {
  high: 1.25,
  medium: 1,
  low: 0.75,
}

const AUDIT_EFFORT: Record<string, number> = {
  'html-has-lang': 1,
  'document-title': 1,
  'meta-description': 1,
  'image-alt': 2,
  'button-name': 2,
  'link-name': 2,
  label: 2,
  'robots-txt': 2,
  'first-contentful-paint': 3,
  'color-contrast': 3,
  'crawlable-anchors': 3,
  'largest-contentful-paint': 4,
  'cumulative-layout-shift': 4,
  'is-crawlable': 4,
  'total-blocking-time': 5,
  'errors-in-console': 5,
  'is-on-https': 6,
}

function formatDriverCount(count: number): string {
  return `${count} verified ${count === 1 ? 'issue' : 'issues'}`
}

export function estimateRepairs(
  report: ScanReport,
  platform: SitePlatform,
  pages: PageBand,
): RepairEstimate {
  const grouped = new Map<ScanCategoryKey, number[]>()
  for (const issue of report.issues) {
    const weighted = (AUDIT_EFFORT[issue.id] ?? 2) * SEVERITY_MULTIPLIER[issue.severity]
    grouped.set(issue.category, [...(grouped.get(issue.category) ?? []), weighted])
  }

  const categoryEffort = [...grouped.values()].reduce((total, points) => {
    const sorted = [...points].sort((a, b) => b - a)
    return total + (sorted[0] ?? 0) + sorted.slice(1).reduce((sum, value) => sum + value * 0.5, 0)
  }, 0)
  const affectedCategoryCount = grouped.size
  const rawPoints = report.issues.length
    ? (3 + categoryEffort + 0.5 * Math.max(0, affectedCategoryCount - 1))
      * PLATFORM_MULTIPLIER[platform]
      * PAGE_MULTIPLIER[pages]
    : 0
  const effortPoints = Math.ceil(rawPoints)
  const majorRoute = REPAIR_TIERS[REPAIR_TIERS.length - 1]!
  const tier = report.issues.length
    ? REPAIR_TIERS.find((candidate) => effortPoints <= candidate.pointCeiling) ?? majorRoute
    : null
  const estimatedHoursLow = effortPoints ? Math.max(2, Math.round(effortPoints * 0.6)) : 0
  const estimatedHoursHigh = effortPoints ? Math.max(4, Math.ceil(effortPoints * 0.9)) : 0

  const drivers = [
    formatDriverCount(report.issues.length),
    PAGE_OPTIONS.find((option) => option.value === pages)?.label ?? pages,
    PLATFORM_OPTIONS.find((option) => option.value === platform)?.label ?? platform,
  ]
  if (affectedCategoryCount) {
    drivers.push(`${affectedCategoryCount} affected ${affectedCategoryCount === 1 ? 'category' : 'categories'}`)
  }

  return {
    version: 1,
    effortPoints,
    estimatedHoursLow,
    estimatedHoursHigh,
    confidence:
      pages === '21+' || platform === 'custom' || platform === 'unsure' || tier?.id === 'major-remediation'
        ? 'manual-review'
        : 'guided',
    tier,
    drivers,
  }
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatEstimateRange(tier: RepairTier): string {
  if (tier.rangeHigh === null) return `${formatMoney(tier.rangeLow)}+`
  return `${formatMoney(tier.rangeLow)}–${formatMoney(tier.rangeHigh)}`
}
