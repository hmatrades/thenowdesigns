import type { ScanCategoryKey, ScanReport } from './siteScan'

export type ConceptDirection = 'auto' | 'clean' | 'bold' | 'warm'
export type ConceptTemplate = 'split-hero' | 'editorial-stack' | 'service-grid'
export type ConceptPalette = 'cream-cherry' | 'navy-sky' | 'forest-sand' | 'plum-blush'
export type ConceptTypography = 'editorial' | 'modern' | 'friendly'

interface ConceptCard {
  title: string
  body: string
}

export interface ConceptPreviewSpec {
  version: 1
  templateId: ConceptTemplate
  paletteId: ConceptPalette
  typographyId: ConceptTypography
  density: 'airy' | 'balanced'
  nav: { labels: [string, string, string] }
  hero: {
    eyebrow: string
    headline: string
    body: string
    primaryCta: string
    secondaryCta: string
  }
  services: {
    heading: string
    intro: string
    items: [ConceptCard, ConceptCard, ConceptCard]
  }
  process: {
    heading: string
    items: [ConceptCard, ConceptCard, ConceptCard]
  }
  closing: {
    headline: string
    body: string
    cta: string
  }
  appliedFixes: Array<{
    category: ScanCategoryKey
    summary: string
  }>
}

export class ConceptPreviewError extends Error {}

const TEMPLATE_IDS = new Set<ConceptTemplate>(['split-hero', 'editorial-stack', 'service-grid'])
const PALETTE_IDS = new Set<ConceptPalette>(['cream-cherry', 'navy-sky', 'forest-sand', 'plum-blush'])
const TYPOGRAPHY_IDS = new Set<ConceptTypography>(['editorial', 'modern', 'friendly'])
const CATEGORY_KEYS = new Set<ScanCategoryKey>(['speed', 'accessibility', 'search', 'trust'])

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function safeText(value: unknown, max: number): value is string {
  return typeof value === 'string'
    && value.trim().length > 0
    && value.length <= max
    && !/[<>]|https?:\/\/|www\.|@|\d/.test(value)
}

function cards(value: unknown): value is [ConceptCard, ConceptCard, ConceptCard] {
  return Array.isArray(value)
    && value.length === 3
    && value.every((item) => {
      const next = record(item)
      return safeText(next?.title, 40) && safeText(next?.body, 100)
    })
}

export function isConceptPreviewSpec(value: unknown): value is ConceptPreviewSpec {
  const spec = record(value)
  const nav = record(spec?.nav)
  const hero = record(spec?.hero)
  const services = record(spec?.services)
  const process = record(spec?.process)
  const closing = record(spec?.closing)
  const appliedFixes = spec?.appliedFixes

  return spec?.version === 1
    && TEMPLATE_IDS.has(spec.templateId as ConceptTemplate)
    && PALETTE_IDS.has(spec.paletteId as ConceptPalette)
    && TYPOGRAPHY_IDS.has(spec.typographyId as ConceptTypography)
    && (spec.density === 'airy' || spec.density === 'balanced')
    && Array.isArray(nav?.labels)
    && nav.labels.length === 3
    && nav.labels.every((label) => safeText(label, 18))
    && safeText(hero?.eyebrow, 40)
    && safeText(hero?.headline, 72)
    && safeText(hero?.body, 180)
    && safeText(hero?.primaryCta, 28)
    && safeText(hero?.secondaryCta, 28)
    && safeText(services?.heading, 60)
    && safeText(services?.intro, 140)
    && cards(services?.items)
    && safeText(process?.heading, 60)
    && cards(process?.items)
    && safeText(closing?.headline, 70)
    && safeText(closing?.body, 140)
    && safeText(closing?.cta, 28)
    && Array.isArray(appliedFixes)
    && appliedFixes.length <= 3
    && appliedFixes.every((item) => {
      const next = record(item)
      return CATEGORY_KEYS.has(next?.category as ScanCategoryKey) && safeText(next?.summary, 90)
    })
}

function previewEndpoint(value: string): URL {
  let endpoint: URL
  try {
    endpoint = new URL(value)
  } catch {
    throw new ConceptPreviewError('The concept service is not configured correctly.')
  }
  const local = ['localhost', '127.0.0.1'].includes(endpoint.hostname)
  if (endpoint.protocol !== 'https:' && !(local && endpoint.protocol === 'http:')) {
    throw new ConceptPreviewError('The concept service must use a secure connection.')
  }
  return endpoint
}

export async function requestConceptPreview(
  report: ScanReport,
  endpointValue: string,
  direction: ConceptDirection,
  signal?: AbortSignal,
): Promise<ConceptPreviewSpec> {
  const endpoint = previewEndpoint(endpointValue)
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      version: 1,
      hostname: report.hostname,
      title: report.title,
      description: report.description,
      direction,
      categories: report.categories.map(({ key, score }) => ({ key, score })),
      issues: report.issues.slice(0, 8).map(({ category, title, impact, fix, evidence }) => ({
        category,
        title,
        impact,
        fix,
        evidence,
      })),
    }),
  })
  const payload = await response.json().catch(() => null) as { spec?: unknown; error?: unknown } | null
  if (!response.ok) {
    throw new ConceptPreviewError(
      typeof payload?.error === 'string'
        ? payload.error
        : 'The concept could not be generated. Your estimate is still ready below.',
    )
  }
  if (!isConceptPreviewSpec(payload?.spec)) {
    throw new ConceptPreviewError('The concept returned incomplete. Your estimate is still ready below.')
  }
  return payload.spec
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character]!)
}

const PALETTES: Record<ConceptPalette, Record<'bg' | 'surface' | 'ink' | 'muted' | 'accent' | 'accentInk', string>> = {
  'cream-cherry': { bg: '#f4efe5', surface: '#fffaf2', ink: '#191612', muted: '#6e665c', accent: '#d94b35', accentInk: '#fffaf2' },
  'navy-sky': { bg: '#d9e9f7', surface: '#f7fbff', ink: '#10243e', muted: '#52677d', accent: '#1f5f99', accentInk: '#ffffff' },
  'forest-sand': { bg: '#e9e0cd', surface: '#f9f5eb', ink: '#183c2f', muted: '#647367', accent: '#286b4e', accentInk: '#ffffff' },
  'plum-blush': { bg: '#f4dfe3', surface: '#fff7f8', ink: '#3d1731', muted: '#7a5b70', accent: '#8b315f', accentInk: '#ffffff' },
}

const FONT_STACKS: Record<ConceptTypography, { display: string; body: string }> = {
  editorial: { display: "Georgia, 'Times New Roman', serif", body: "Arial, Helvetica, sans-serif" },
  modern: { display: "Arial, Helvetica, sans-serif", body: "Arial, Helvetica, sans-serif" },
  friendly: { display: "'Trebuchet MS', Arial, sans-serif", body: "'Trebuchet MS', Arial, sans-serif" },
}

function cardsHtml(items: [ConceptCard, ConceptCard, ConceptCard]): string {
  return items.map((item) => `<article><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p></article>`).join('')
}

export function renderConceptDocument(spec: ConceptPreviewSpec, hostname: string): string {
  const palette = PALETTES[spec.paletteId]
  const fonts = FONT_STACKS[spec.typographyId]
  const nav = spec.nav.labels.map((label) => `<span>${escapeHtml(label)}</span>`).join('')
  const fixes = spec.appliedFixes.map((fix) => `<span>${escapeHtml(fix.summary)}</span>`).join('')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; connect-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src 'none'; media-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
  <style>
    *{box-sizing:border-box}html{background:${palette.bg};color:${palette.ink};font-family:${fonts.body};scroll-behavior:smooth}body{margin:0}h1,h2,h3,p{margin:0}h1,h2{font-family:${fonts.display};font-weight:500;letter-spacing:-.045em}.page{min-height:100vh;background:${palette.bg}}.wrap{width:min(1120px,calc(100% - 48px));margin:auto}.nav{display:flex;align-items:center;justify-content:space-between;padding:22px 0;border-bottom:1px solid color-mix(in srgb,${palette.ink} 16%,transparent)}.brand{font-family:${fonts.display};font-size:20px;font-weight:700}.navlinks{display:flex;gap:24px;color:${palette.muted};font-size:13px}.hero{display:grid;grid-template-columns:${spec.templateId === 'split-hero' ? '1.25fr .75fr' : '1fr'};gap:44px;align-items:center;padding:${spec.density === 'airy' ? '96px 0 112px' : '72px 0 84px'}}.eyebrow{color:${palette.accent};font-size:12px;font-weight:800;letter-spacing:.13em;text-transform:uppercase}.hero h1{max-width:900px;margin-top:16px;font-size:clamp(52px,8vw,104px);line-height:.92}.hero p{max-width:610px;margin-top:24px;color:${palette.muted};font-size:18px;line-height:1.55}.actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}.button{display:inline-flex;padding:14px 20px;border:1px solid ${palette.accent};border-radius:999px;background:${palette.accent};color:${palette.accentInk};font-size:13px;font-weight:800}.button.secondary{background:transparent;color:${palette.ink};border-color:color-mix(in srgb,${palette.ink} 30%,transparent)}.visual{min-height:300px;border-radius:28px;background:linear-gradient(145deg,${palette.accent},${palette.surface});box-shadow:0 35px 90px -45px ${palette.ink};position:relative;overflow:hidden}.visual:before,.visual:after{content:'';position:absolute;border-radius:50%;background:${palette.surface};opacity:.64}.visual:before{width:210px;height:210px;right:-35px;top:-20px}.visual:after{width:125px;height:125px;left:30px;bottom:25px}.section{padding:${spec.density === 'airy' ? '92px 0' : '70px 0'};border-top:1px solid color-mix(in srgb,${palette.ink} 13%,transparent)}.section h2{max-width:760px;font-size:clamp(38px,6vw,70px);line-height:1}.intro{max-width:640px;margin-top:18px;color:${palette.muted};font-size:16px;line-height:1.55}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:42px}.cards article{padding:28px;border-radius:18px;background:${palette.surface};min-height:190px}.cards h3{font-family:${fonts.display};font-size:24px}.cards p{margin-top:13px;color:${palette.muted};font-size:14px;line-height:1.5}.fixes{display:flex;flex-wrap:wrap;gap:8px;margin-top:34px}.fixes span{padding:8px 11px;border:1px solid color-mix(in srgb,${palette.ink} 18%,transparent);border-radius:999px;color:${palette.muted};font-size:11px}.closing{padding:90px 0;text-align:center;background:${palette.ink};color:${palette.bg}}.closing h2{max-width:800px;margin:auto;font-size:clamp(44px,7vw,82px);line-height:.98}.closing p{max-width:570px;margin:20px auto 0;color:color-mix(in srgb,${palette.bg} 70%,transparent);line-height:1.55}.closing .button{margin-top:28px}.watermark{position:fixed;right:12px;bottom:12px;padding:7px 10px;border-radius:999px;background:${palette.ink};color:${palette.bg};font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.86}
    @media(max-width:760px){.wrap{width:min(100% - 30px,1120px)}.navlinks{display:none}.hero{grid-template-columns:1fr;padding:56px 0 70px}.hero h1{font-size:54px}.visual{min-height:220px}.cards{grid-template-columns:1fr}.section{padding:60px 0}.closing{padding:68px 15px}}
  </style>
</head>
<body>
  <main class="page template-${escapeHtml(spec.templateId)}">
    <nav class="wrap nav"><span class="brand">${escapeHtml(hostname)}</span><div class="navlinks">${nav}</div></nav>
    <section class="wrap hero"><div><span class="eyebrow">${escapeHtml(spec.hero.eyebrow)}</span><h1>${escapeHtml(spec.hero.headline)}</h1><p>${escapeHtml(spec.hero.body)}</p><div class="actions"><span class="button">${escapeHtml(spec.hero.primaryCta)}</span><span class="button secondary">${escapeHtml(spec.hero.secondaryCta)}</span></div></div>${spec.templateId === 'split-hero' ? '<div class="visual" aria-hidden="true"></div>' : ''}</section>
    <section class="section"><div class="wrap"><h2>${escapeHtml(spec.services.heading)}</h2><p class="intro">${escapeHtml(spec.services.intro)}</p><div class="cards">${cardsHtml(spec.services.items)}</div><div class="fixes">${fixes}</div></div></section>
    <section class="section"><div class="wrap"><h2>${escapeHtml(spec.process.heading)}</h2><div class="cards">${cardsHtml(spec.process.items)}</div></div></section>
    <section class="closing"><div class="wrap"><h2>${escapeHtml(spec.closing.headline)}</h2><p>${escapeHtml(spec.closing.body)}</p><span class="button">${escapeHtml(spec.closing.cta)}</span></div></section>
  </main>
  <div class="watermark">AI concept · read only</div>
</body>
</html>`
}
