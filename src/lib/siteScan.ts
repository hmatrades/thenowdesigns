export type ScanCategoryKey = 'speed' | 'accessibility' | 'search' | 'trust'
export type IssueSeverity = 'high' | 'medium' | 'low'

export interface ScanCategory {
  key: ScanCategoryKey
  label: string
  score: number | null
  note: string
}

export interface ScanIssue {
  id: string
  category: ScanCategoryKey
  categoryLabel: string
  severity: IssueSeverity
  title: string
  impact: string
  fix: string
  evidence: string
}

export interface ScanWin {
  id: string
  label: string
}

export interface ScanReport {
  reportVersion: 1
  requestedUrl: string
  finalUrl: string
  hostname: string
  title: string
  description: string
  screenshotUrl: string | null
  scannedAt: string
  lighthouseVersion: string | null
  overall: number
  verdict: {
    label: string
    headline: string
    detail: string
  }
  categories: ScanCategory[]
  issues: ScanIssue[]
  wins: ScanWin[]
}

type JsonRecord = Record<string, unknown>

interface AuditDefinition {
  id: string
  category: ScanCategoryKey
  categoryLabel: string
  title: string
  impact: string
  fix: string
  pass: string
  passAt?: number
  highAt?: number
  highWhenFailed?: boolean
}

const AUDITS: AuditDefinition[] = [
  {
    id: 'largest-contentful-paint',
    category: 'speed',
    categoryLabel: 'Speed',
    title: 'Your main content arrives late',
    impact: 'Visitors can leave before the page delivers its main message.',
    fix: 'Prioritise the hero, compress its media, and remove work that blocks the first render.',
    pass: 'Main content appears quickly',
    passAt: 0.9,
    highAt: 0.5,
  },
  {
    id: 'first-contentful-paint',
    category: 'speed',
    categoryLabel: 'Speed',
    title: 'The page feels blank at first',
    impact: 'A slow first response makes the site feel broken or untrustworthy.',
    fix: 'Reduce render-blocking assets and deliver critical styles and text first.',
    pass: 'The first impression loads promptly',
    passAt: 0.9,
    highAt: 0.5,
  },
  {
    id: 'total-blocking-time',
    category: 'speed',
    categoryLabel: 'Speed',
    title: 'The page locks up while loading',
    impact: 'Buttons and menus can feel unresponsive exactly when a visitor tries them.',
    fix: 'Split heavy scripts, defer non-essential code, and remove unnecessary third parties.',
    pass: 'The page stays responsive while loading',
    passAt: 0.9,
    highAt: 0.5,
  },
  {
    id: 'cumulative-layout-shift',
    category: 'speed',
    categoryLabel: 'Speed',
    title: 'The layout moves under the visitor',
    impact: 'Unexpected movement causes mis-clicks and makes the page feel unstable.',
    fix: 'Reserve space for media and fonts so the layout stays fixed as assets arrive.',
    pass: 'The layout stays visually stable',
    passAt: 0.9,
    highAt: 0.5,
  },
  {
    id: 'color-contrast',
    category: 'accessibility',
    categoryLabel: 'Clarity',
    title: 'Some text is harder to read',
    impact: 'Low contrast hides your message from visitors with common visual impairments.',
    fix: 'Raise contrast on the flagged text while preserving the brand palette.',
    pass: 'Text contrast clears the automated check',
    highWhenFailed: true,
  },
  {
    id: 'image-alt',
    category: 'accessibility',
    categoryLabel: 'Clarity',
    title: 'Important images have no useful alternative',
    impact: 'Visitors using assistive technology can miss context or actions.',
    fix: 'Add concise alternative text to meaningful imagery and mark decorative images correctly.',
    pass: 'Images include accessible alternatives',
  },
  {
    id: 'button-name',
    category: 'accessibility',
    categoryLabel: 'Clarity',
    title: 'A button does not explain itself',
    impact: 'Some visitors cannot tell what the control will do.',
    fix: 'Give every button a clear visible or assistive name.',
    pass: 'Buttons have clear accessible names',
    highWhenFailed: true,
  },
  {
    id: 'link-name',
    category: 'accessibility',
    categoryLabel: 'Clarity',
    title: 'A link has no clear destination',
    impact: 'Ambiguous links add friction and can block screen-reader navigation.',
    fix: 'Use specific link text and label icon-only links.',
    pass: 'Links have clear accessible names',
  },
  {
    id: 'label',
    category: 'accessibility',
    categoryLabel: 'Clarity',
    title: 'A form field is missing its label',
    impact: 'Visitors may not know what information the form expects.',
    fix: 'Connect a clear label to every input and preserve it in every state.',
    pass: 'Form fields are labelled clearly',
    highWhenFailed: true,
  },
  {
    id: 'html-has-lang',
    category: 'accessibility',
    categoryLabel: 'Clarity',
    title: 'The page language is not declared',
    impact: 'Assistive tools may pronounce the page incorrectly.',
    fix: 'Declare the correct language on the page root.',
    pass: 'The page language is declared',
  },
  {
    id: 'document-title',
    category: 'search',
    categoryLabel: 'Search',
    title: 'Searchers are missing a page title',
    impact: 'A missing title weakens both search visibility and the browser experience.',
    fix: 'Write a specific title that matches the page and the buyer intent.',
    pass: 'The page has a search-ready title',
    highWhenFailed: true,
  },
  {
    id: 'meta-description',
    category: 'search',
    categoryLabel: 'Search',
    title: 'The search result has no prepared pitch',
    impact: 'Search engines may invent a weak snippet instead of showing your best reason to click.',
    fix: 'Add a concise description built around the visitor, offer, and outcome.',
    pass: 'The page has a prepared search description',
  },
  {
    id: 'is-crawlable',
    category: 'search',
    categoryLabel: 'Search',
    title: 'Search engines may be blocked',
    impact: 'A page that cannot be crawled has little chance to appear in organic search.',
    fix: 'Remove accidental indexing blocks and verify the page response.',
    pass: 'Search engines can crawl the page',
    highWhenFailed: true,
  },
  {
    id: 'crawlable-anchors',
    category: 'search',
    categoryLabel: 'Search',
    title: 'Some links cannot be followed by search engines',
    impact: 'Important pages may be harder for crawlers and visitors to discover.',
    fix: 'Replace non-standard navigation with crawlable links.',
    pass: 'Page links are crawlable',
  },
  {
    id: 'robots-txt',
    category: 'search',
    categoryLabel: 'Search',
    title: 'The robots file contains an error',
    impact: 'A broken directive can hide valuable pages or waste search-engine attention.',
    fix: 'Correct invalid directives and verify what should be indexed.',
    pass: 'Search crawler instructions are valid',
  },
  {
    id: 'is-on-https',
    category: 'trust',
    categoryLabel: 'Trust',
    title: 'The page is not fully secure',
    impact: 'Browser warnings and insecure resources can stop a buyer before they enquire.',
    fix: 'Serve the page and every asset over HTTPS, then enforce secure redirects.',
    pass: 'The page uses HTTPS',
    highWhenFailed: true,
  },
  {
    id: 'errors-in-console',
    category: 'trust',
    categoryLabel: 'Trust',
    title: 'The browser is reporting errors',
    impact: 'Unresolved errors can break interactions and quietly damage confidence.',
    fix: 'Trace the reported failures, repair the source, and retest the affected journeys.',
    pass: 'No browser errors were detected',
  },
]

export class ScanError extends Error {
  code: 'invalid-url' | 'blocked-url' | 'busy' | 'timeout' | 'provider' | 'network'

  constructor(code: ScanError['code'], message: string) {
    super(message)
    this.name = 'ScanError'
    this.code = code
  }
}

function record(value: unknown): JsonRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : null
}

function textValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function nestedString(value: unknown): string | null {
  const item = record(value)
  return textValue(item?.url)
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split('.').map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false
  }

  return (
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    parts[0] === 0
  )
}

export function normaliseSiteUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) throw new ScanError('invalid-url', 'Enter the website you want to scan.')

  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  let url: URL

  try {
    url = new URL(candidate)
  } catch {
    throw new ScanError('invalid-url', 'That does not look like a complete website address.')
  }

  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) {
    throw new ScanError('invalid-url', 'Use a public http or https website address.')
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (
    hostname === 'localhost' ||
    hostname === '::1' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    isPrivateIpv4(hostname)
  ) {
    throw new ScanError('blocked-url', 'The scanner can only test public websites.')
  }

  url.hash = ''
  return url.toString()
}

function auditScore(audits: JsonRecord, id: string): number | null {
  return numberValue(record(audits[id])?.score)
}

function categoryScore(categories: JsonRecord, id: string): number | null {
  const raw = numberValue(record(categories[id])?.score)
  return raw === null ? null : Math.round(raw * 100)
}

function weightedScore(values: Array<{ score: number | null; weight: number }>): number | null {
  const present = values.filter((item): item is { score: number; weight: number } => item.score !== null)
  if (!present.length) return null
  const totalWeight = present.reduce((sum, item) => sum + item.weight, 0)
  return Math.round(present.reduce((sum, item) => sum + item.score * item.weight, 0) / totalWeight)
}

function trustScore(audits: JsonRecord, statusCode: number | null, bestPractices: number | null): number | null {
  const statusScore = statusCode === null ? null : statusCode >= 200 && statusCode < 400 ? 100 : 0
  return weightedScore([
    { score: auditScore(audits, 'is-on-https') === null ? null : auditScore(audits, 'is-on-https')! * 100, weight: 30 },
    { score: auditScore(audits, 'errors-in-console') === null ? null : auditScore(audits, 'errors-in-console')! * 100, weight: 20 },
    { score: auditScore(audits, 'document-title') === null ? null : auditScore(audits, 'document-title')! * 100, weight: 15 },
    { score: auditScore(audits, 'meta-description') === null ? null : auditScore(audits, 'meta-description')! * 100, weight: 15 },
    { score: statusScore, weight: 10 },
    { score: bestPractices, weight: 10 },
  ])
}

function issueEvidence(audit: JsonRecord): string {
  const display = textValue(audit.displayValue)
  if (display) return `Measured: ${display}`

  const details = record(audit.details)
  const items = Array.isArray(details?.items) ? details.items.length : 0
  if (items > 0) return `${items} ${items === 1 ? 'instance' : 'instances'} detected`

  return 'Automated check failed'
}

function issueSeverity(definition: AuditDefinition, score: number): IssueSeverity {
  if (definition.highWhenFailed || score <= (definition.highAt ?? 0.35)) return 'high'
  if (score < 0.75) return 'medium'
  return 'low'
}

function reportVerdict(score: number, issueCount: number): ScanReport['verdict'] {
  if (score >= 90) {
    return {
      label: issueCount ? 'Strong foundation' : 'Clean automated pass',
      headline: issueCount ? 'A good site with a few quiet leaks.' : 'No major automated leaks found.',
      detail: issueCount
        ? 'The foundation is healthy, but the verified issues below can still weaken trust or attention.'
        : 'The tested page cleared the automated checks. Messaging and buyer flow still deserve a human review.',
    }
  }
  if (score >= 75) {
    return {
      label: 'Some leaks',
      headline: 'A few fixable problems may be costing enquiries.',
      detail: 'Nothing here requires guesswork: the highest-impact measured issues are listed below.',
    }
  }
  if (score >= 60) {
    return {
      label: 'Attention is leaking',
      headline: 'The page is creating avoidable buyer friction.',
      detail: 'Speed, clarity, search, or trust gaps are making the journey harder than it needs to be.',
    }
  }
  return {
    label: 'High friction',
    headline: 'The page needs a serious repair pass.',
    detail: 'Multiple verified problems can stop visitors from reading, trusting, or acting on the offer.',
  }
}

function buildReport(payload: unknown, requestedUrl: string): ScanReport {
  const root = record(payload)
  const data = record(root?.data)
  const insights = record(data?.insights)
  const lighthouse = record(insights?.lighthouse)
  const categories = record(lighthouse?.categories) ?? {}
  const audits = record(lighthouse?.audits) ?? {}

  if (!lighthouse || !Object.keys(audits).length) {
    throw new ScanError('provider', 'The page loaded, but the diagnostic report came back incomplete. Try once more.')
  }

  const performance = categoryScore(categories, 'performance')
  const accessibility = categoryScore(categories, 'accessibility')
  const search = categoryScore(categories, 'seo')
  const bestPractices = categoryScore(categories, 'best-practices')
  const statusCode = numberValue(data?.statusCode)
  const trust = trustScore(audits, statusCode, bestPractices)

  const categoryResults: ScanCategory[] = [
    { key: 'speed', label: 'Speed', score: performance, note: 'How quickly the page appears and responds' },
    { key: 'accessibility', label: 'Clarity', score: accessibility, note: 'Whether more visitors can read and use it' },
    { key: 'search', label: 'Search', score: search, note: 'Technical readiness for organic discovery' },
    { key: 'trust', label: 'Trust', score: trust, note: 'Security, stability, and basic credibility signals' },
  ]

  const issues: ScanIssue[] = []
  const wins: ScanWin[] = []

  for (const definition of AUDITS) {
    const audit = record(audits[definition.id])
    if (!audit || audit.scoreDisplayMode === 'notApplicable') continue
    const score = numberValue(audit.score)
    if (score === null) continue

    const passAt = definition.passAt ?? 1
    if (score >= passAt) {
      wins.push({ id: definition.id, label: definition.pass })
      continue
    }

    issues.push({
      id: definition.id,
      category: definition.category,
      categoryLabel: definition.categoryLabel,
      severity: issueSeverity(definition, score),
      title: definition.title,
      impact: definition.impact,
      fix: definition.fix,
      evidence: issueEvidence(audit),
    })
  }

  const severityRank: Record<IssueSeverity, number> = { high: 0, medium: 1, low: 2 }
  issues.sort((a, b) => severityRank[a.severity] - severityRank[b.severity])

  const overall =
    weightedScore([
      { score: performance, weight: 35 },
      { score: accessibility, weight: 25 },
      { score: search, weight: 25 },
      { score: trust, weight: 15 },
    ]) ?? 0

  const finalUrl = textValue(data?.url) ?? requestedUrl
  let hostname = new URL(requestedUrl).hostname.replace(/^www\./, '')
  try {
    hostname = new URL(finalUrl).hostname.replace(/^www\./, '')
  } catch {
    // Keep the validated requested hostname.
  }

  return {
    reportVersion: 1,
    requestedUrl,
    finalUrl,
    hostname,
    title: textValue(data?.title) ?? hostname,
    description: textValue(data?.description) ?? 'No page description was returned.',
    screenshotUrl: nestedString(data?.screenshot),
    scannedAt: new Date().toISOString(),
    lighthouseVersion: textValue(lighthouse.lighthouseVersion),
    overall,
    verdict: reportVerdict(overall, issues.length),
    categories: categoryResults,
    // Keep every verified issue in the report so the repair estimator cannot
    // underquote. The UI limits the visible list separately.
    issues,
    wins: wins.filter((win, index, all) => all.findIndex((item) => item.label === win.label) === index).slice(0, 5),
  }
}

function providerMessage(payload: unknown, status: number): ScanError {
  const root = record(payload)
  const data = record(root?.data)
  const message = textValue(data?.message) ?? textValue(root?.message) ?? ''
  const combined = `${status} ${message}`.toLowerCase()

  if (status === 429 || combined.includes('quota') || combined.includes('rate limit')) {
    return new ScanError('busy', 'The live scanner is at capacity right now. Try again shortly or send the URL below.')
  }
  if (combined.includes('timeout') || status === 504) {
    return new ScanError('timeout', 'That page took too long to test. It may be blocking automated browsers.')
  }
  return new ScanError('provider', 'The scanner could not finish that page. Check the address or try again in a moment.')
}

export async function scanSite(input: string, signal?: AbortSignal): Promise<ScanReport> {
  const requestedUrl = normaliseSiteUrl(input)
  const configuredEndpoint = (import.meta.env.VITE_SCAN_API_URL as string | undefined)?.trim()
  let endpoint: URL

  if (configuredEndpoint) {
    try {
      endpoint = new URL(configuredEndpoint)
    } catch {
      throw new ScanError('provider', 'The scan service is not configured correctly.')
    }
    endpoint.searchParams.set('url', requestedUrl)
  } else {
    endpoint = new URL('https://api.microlink.io/')
    endpoint.searchParams.set('url', requestedUrl)
    endpoint.searchParams.set('insights', 'true')
    endpoint.searchParams.set('screenshot', 'true')
    endpoint.searchParams.set('screenshot.fullPage', 'false')
  }

  let response: Response
  try {
    response = await fetch(endpoint, {
      signal,
      headers: { Accept: 'application/json' },
      referrerPolicy: 'strict-origin-when-cross-origin',
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ScanError('timeout', 'The scan timed out before the page finished testing. Try again once.')
    }
    throw new ScanError('network', 'The scanner could not connect. Check your connection and try again.')
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new ScanError('provider', 'The scanner returned an unreadable report. Try again in a moment.')
  }

  if (!response.ok || record(payload)?.status !== 'success') {
    throw providerMessage(payload, response.status)
  }

  return buildReport(payload, requestedUrl)
}
