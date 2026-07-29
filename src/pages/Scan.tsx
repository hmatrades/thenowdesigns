import { type CSSProperties, type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Head } from 'vite-react-ssg'
import { Link } from 'react-router-dom'
import ConceptPreview from '../components/ConceptPreview'
import {
  type PageBand,
  PAGE_OPTIONS,
  type RepairEstimate,
  type RepairTierId,
  type SitePlatform,
  PLATFORM_OPTIONS,
  estimateRepairs,
  formatEstimateRange,
  formatMoney,
} from '../lib/repairEstimate'
import { type ScanReport, ScanError, scanSite } from '../lib/siteScan'
import '../styles/scan.css'

const SCAN_STAGES = [
  'Opening the page on a mobile-sized screen',
  'Measuring first impression and responsiveness',
  'Checking readability and accessibility',
  'Testing search-engine fundamentals',
  'Reading security and trust signals',
  'Ranking the highest-impact verified leaks',
]

const WEB3FORMS_KEY =
  (import.meta.env.VITE_WEB3FORMS_ACCESS_KEY as string | undefined)?.trim() ||
  'cefe34f9-7266-4558-a8ee-f3a8ad09e6de'

const CHECKOUT_MODE =
  (import.meta.env.VITE_CHECKOUT_MODE as string | undefined)?.trim() === 'whop_waitlist'
    ? 'whop_waitlist'
    : 'scope_review'

function validCheckoutUrl(value: string | undefined): string | null {
  const candidate = value?.trim()
  if (!candidate) return null
  try {
    const url = new URL(candidate)
    const whopHost = url.hostname === 'whop.com' || url.hostname.endsWith('.whop.com')
    return url.protocol === 'https:' && whopHost ? url.toString() : null
  } catch {
    return null
  }
}

const CHECKOUT_URLS: Record<RepairTierId, string | null> = {
  'website-tune-up': validCheckoutUrl(import.meta.env.VITE_WHOP_TIER_1_URL as string | undefined),
  'repair-sprint': validCheckoutUrl(
    (import.meta.env.VITE_WHOP_TIER_2_URL as string | undefined)
      || (import.meta.env.VITE_WHOP_REPAIR_URL as string | undefined),
  ),
  'expanded-repair': validCheckoutUrl(import.meta.env.VITE_WHOP_TIER_3_URL as string | undefined),
  'deep-repair': validCheckoutUrl(import.meta.env.VITE_WHOP_TIER_4_URL as string | undefined),
  'major-remediation': validCheckoutUrl(import.meta.env.VITE_WHOP_TIER_5_URL as string | undefined),
}

function estimateReference(report: ScanReport): string {
  const host = report.hostname.replace(/[^a-z\d]/gi, '').toUpperCase().slice(0, 8) || 'SITE'
  const generated = Date.parse(report.scannedAt)
  const stamp = (Number.isFinite(generated) ? generated : 0).toString(36).toUpperCase().slice(-7)
  return `TND-${host}-${stamp}`
}

function scoreTone(score: number | null): string {
  if (score === null) return 'is-na'
  if (score >= 90) return 'is-good'
  if (score >= 70) return 'is-watch'
  return 'is-risk'
}

function scoreLabel(score: number | null): string {
  return score === null ? '—' : String(score)
}

function humanDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function RepairRequestForm({
  report,
  estimate,
  platform,
  pages,
}: {
  report: ScanReport
  estimate: RepairEstimate
  platform: SitePlatform
  pages: PageBand
}) {
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<{ type: '' | 'ok' | 'err'; message: string }>({
    type: '',
    message: '',
  })
  const tier = estimate.tier
  const reference = estimateReference(report)

  if (!tier) return null

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    setSending(true)
    setStatus({ type: '', message: '' })

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: new FormData(form),
      })
      const payload = (await response.json()) as { success?: boolean; message?: string }
      if (!response.ok || !payload.success) throw new Error(payload.message || 'Request failed')

      form.reset()
      setStatus({
        type: 'ok',
        message: 'You’re in. We’ll verify the repair scope and send the secure Whop checkout.',
      })
    } catch {
      setStatus({
        type: 'err',
        message: 'That did not send. Email aiden@thenowdesigns.com with your website and we’ll pick it up.',
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <form className="scan-repair-form" onSubmit={onSubmit}>
      <input type="hidden" name="access_key" value={WEB3FORMS_KEY} />
      <input type="hidden" name="subject" value={`${tier.label} request — ${report.hostname}`} />
      <input type="hidden" name="from_name" value="The Now Designs website scanner" />
      <input type="hidden" name="Website" value={report.finalUrl} />
      <input type="hidden" name="Automated score" value={`${report.overall}/100`} />
      <input type="hidden" name="Platform" value={platform} />
      <input type="hidden" name="Approximate pages" value={pages} />
      <input type="hidden" name="Preliminary estimate" value={formatEstimateRange(tier)} />
      <input type="hidden" name="Recommended package" value={tier.label} />
      <input type="hidden" name="Fixed price" value={formatMoney(tier.price)} />
      <input type="hidden" name="Estimate effort points" value={estimate.effortPoints} />
      <input type="hidden" name="Scan reference" value={reference} />
      <input
        type="hidden"
        name="Verified issues"
        value={report.issues.map((issue) => `${issue.severity}: ${issue.title}`).join(' | ') || 'No automated failures'}
      />
      <input
        type="checkbox"
        name="botcheck"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ display: 'none' }}
      />
      <div className="scan-repair-form__row">
        <div className="scan-field">
          <label htmlFor="repair-name">Your name</label>
          <input id="repair-name" name="name" autoComplete="name" required />
        </div>
        <div className="scan-field">
          <label htmlFor="repair-email">Work email</label>
          <input id="repair-email" type="email" name="email" autoComplete="email" required />
        </div>
      </div>
      <button type="submit" className="btn btn--cherry btn--lg scan-repair-form__button" disabled={sending}>
        {sending ? 'Claiming your slot…' : `Request ${tier.label}`} <span className="arrow">→</span>
      </button>
      <p className="scan-repair-form__note">No charge yet. We verify the scope first, then send the Whop checkout.</p>
      <p className={`scan-repair-form__status ${status.type}`} role="status" aria-live="polite">
        {status.message}
      </p>
    </form>
  )
}

function RepairOffer({ report }: { report: ScanReport }) {
  const [platform, setPlatform] = useState<SitePlatform | ''>('')
  const [pages, setPages] = useState<PageBand | ''>('')
  const estimate = useMemo(
    () => (platform && pages ? estimateRepairs(report, platform, pages) : null),
    [pages, platform, report],
  )
  const reference = estimateReference(report)
  const whopUrl = CHECKOUT_MODE === 'whop_waitlist' && estimate?.tier && estimate.confidence === 'guided'
    ? CHECKOUT_URLS[estimate.tier.id]
    : null

  return (
    <section className="scan-offer" id="repair" aria-labelledby="repair-heading">
      <div className="scan-offer__copy">
        <span className="scan-kicker">Measured scope · five fixed routes</span>
        <h2 id="repair-heading">Turn the report into a priced repair plan.</h2>
        <p className="scan-offer__lead">
          Add two details we cannot learn from a public page. The estimator combines them with the
          verified scan to select the closest fixed-scope route.
        </p>
        <ul className="scan-offer__list">
          <li>Five clear price levels from tune-up to rebuild</li>
          <li>Severity, platform, and page-count adjusted</li>
          <li>Verified speed, accessibility, search, and trust repairs</li>
          <li>Before-and-after scan with a clean handoff</li>
        </ul>
        <p className="scan-offer__boundary">
          This preliminary estimate extrapolates from the submitted page. New copy, brand work,
          pages, integrations, and app features are excluded unless the selected route says otherwise.
          Scope is confirmed before work begins.
        </p>
      </div>
      <div className="scan-offer__checkout">
        <span className="scan-offer__eyebrow">Preliminary repair estimate</span>
        <div className="scan-estimator-fields">
          <label className="scan-estimator-field">
            <span>What is it built with?</span>
            <select value={platform} onChange={(event) => setPlatform(event.target.value as SitePlatform)}>
              <option value="">Choose a platform</option>
              {PLATFORM_OPTIONS.map((option) => (
                <option value={option.value} key={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="scan-estimator-field">
            <span>How many core pages?</span>
            <select value={pages} onChange={(event) => setPages(event.target.value as PageBand)}>
              <option value="">Choose a range</option>
              {PAGE_OPTIONS.map((option) => (
                <option value={option.value} key={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        {estimate?.tier ? (
          <div className="scan-estimate" aria-live="polite">
            <span className="scan-estimate__label">Estimated repair range</span>
            <strong className="scan-estimate__range">{formatEstimateRange(estimate.tier)}</strong>
            <div className="scan-estimate__route">
              <span>Recommended fixed route</span>
              <b>{estimate.tier.label}</b>
              <strong>{formatMoney(estimate.tier.price)}</strong>
            </div>
            <div className="scan-estimate__drivers" aria-label="Estimate inputs">
              {estimate.drivers.map((driver) => <span key={driver}>{driver}</span>)}
            </div>
            <p className="scan-estimate__summary">{estimate.tier.summary}</p>
            {estimate.confidence === 'manual-review' ? (
              <p className="scan-estimate__review">This route needs a scope check before payment because the selected site is large or structurally complex.</p>
            ) : null}
            {whopUrl ? (
              <>
                <a className="btn btn--cherry btn--lg scan-offer__button" href={whopUrl} target="_blank" rel="noopener noreferrer">
                  Request approval · {formatMoney(estimate.tier.price)} <span className="arrow">↗</span>
                </a>
                <span className="scan-offer__secure">
                  Whop approval request · use scan reference <b>{reference}</b> · no charge unless the scope is approved
                </span>
              </>
            ) : (
              <RepairRequestForm
                report={report}
                estimate={estimate}
                platform={platform as SitePlatform}
                pages={pages as PageBand}
              />
            )}
          </div>
        ) : estimate ? (
          <div className="scan-estimate-pending is-clean" aria-live="polite">
            <strong>No verified technical repair to price from this page.</strong>
            <p>The automated fundamentals passed. A human conversion review can still evaluate the offer, proof, messaging, and buyer journey.</p>
            <Link className="btn btn--ghost scan-offer__button" to="/#contact">Request a human review <span className="arrow">→</span></Link>
          </div>
        ) : (
          <div className="scan-estimate-pending" aria-live="polite">
            <strong>Your live scan already supplied the technical evidence.</strong>
            <p>Choose a platform and page range to reveal the preliminary cost and matching repair route.</p>
          </div>
        )}
        <p className="scan-offer__rebuild">
          Need more than repairs? <Link to="/#contact">Full rebuilds start at $4,500 →</Link>
        </p>
      </div>
    </section>
  )
}

export default function Scan() {
  const [website, setWebsite] = useState('')
  const [state, setState] = useState<'idle' | 'scanning' | 'done' | 'error'>('idle')
  const [stage, setStage] = useState(0)
  const [report, setReport] = useState<ScanReport | null>(null)
  const [error, setError] = useState('')
  const resultRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const supplied = new URLSearchParams(window.location.search).get('url')
    if (supplied) setWebsite(supplied)
  }, [])

  useEffect(() => {
    if (state !== 'scanning') return
    const timer = window.setInterval(() => {
      setStage((current) => Math.min(current + 1, SCAN_STAGES.length - 1))
    }, 2200)
    return () => window.clearInterval(timer)
  }, [state])

  useEffect(() => {
    if (state === 'done' || state === 'error') {
      window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }
  }, [state])

  const onScan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setState('scanning')
    setStage(0)
    setError('')
    setReport(null)

    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 90000)

    try {
      const nextReport = await scanSite(website, controller.signal)
      setReport(nextReport)
      setWebsite(nextReport.requestedUrl)
      setState('done')

      const nextUrl = new URL(window.location.href)
      nextUrl.searchParams.set('url', nextReport.hostname)
      window.history.replaceState({}, '', nextUrl)
    } catch (caught) {
      setError(
        caught instanceof ScanError
          ? caught.message
          : 'Something interrupted the scan. Check the address and try again.',
      )
      setState('error')
    } finally {
      window.clearTimeout(timeout)
    }
  }

  const retry = () => {
    setState('idle')
    setError('')
    setReport(null)
  }

  const progress = state === 'scanning' ? Math.min(92, 12 + stage * 16) : 0

  return (
    <>
      <Head>
        <title>Free Website Leak Scanner — The Now Designs</title>
        <meta
          name="description"
          content="Scan your website for verified speed, accessibility, search, and trust leaks. See the evidence free, then have The Now Designs fix it for you."
        />
        <meta property="og:title" content="Is your website losing you clients? Find out free." />
        <meta
          property="og:description"
          content="A free, evidence-backed website scan from The Now Designs. No email gate and no invented revenue claims."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://thenowdesigns.com/scan/" />
        <meta property="og:image" content="https://thenowdesigns.com/img/og-card.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://thenowdesigns.com/scan/" />
      </Head>

      <header className="scan-hero">
        <div className="wrap scan-hero__grid">
          <div className="scan-hero__copy">
            <span className="scan-kicker"><span className="live-dot" aria-hidden="true"></span> Free · live · no email gate</span>
            <h1>Is your website <em>losing you clients?</em></h1>
            <p>
              Find the measurable leaks making visitors wait, hesitate, or miss you in search.
              Get the evidence first. Decide what to fix second.
            </p>
            <div className="scan-hero__proof" aria-label="What the scan includes">
              <span>Mobile test</span>
              <span>Real page load</span>
              <span>Clear evidence</span>
            </div>
          </div>

          <form className="scan-console" onSubmit={onScan} aria-label="Website scanner">
            <div className="scan-console__top">
              <span className="scan-console__light"></span>
              <span className="scan-console__light"></span>
              <span className="scan-console__light"></span>
              <span>buyer-readiness scan</span>
            </div>
            <label htmlFor="scan-url">Your website</label>
            <div className="scan-console__field">
              <span aria-hidden="true">https://</span>
              <input
                id="scan-url"
                name="url"
                type="text"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="yourwebsite.com"
                value={website.replace(/^https?:\/\//, '')}
                onChange={(event) => setWebsite(event.target.value)}
                disabled={state === 'scanning'}
                required
                aria-describedby="scan-privacy"
              />
            </div>
            <button className="btn btn--cherry btn--lg scan-console__button" type="submit" disabled={state === 'scanning'}>
              {state === 'scanning' ? 'Scanning live page…' : 'Scan my website free'} <span className="arrow">→</span>
            </button>

            {state === 'scanning' ? (
              <div className="scan-progress" aria-live="polite">
                <div className="scan-progress__bar" aria-hidden="true">
                  <span style={{ width: `${progress}%` }}></span>
                </div>
                <p>{SCAN_STAGES[stage]}</p>
                <ol>
                  {SCAN_STAGES.map((item, index) => (
                    <li className={index < stage ? 'is-done' : index === stage ? 'is-current' : ''} key={item}>
                      <span>{index < stage ? '✓' : String(index + 1).padStart(2, '0')}</span> {item}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            <p className="scan-console__privacy" id="scan-privacy">
              We test the public page you submit. No login, no email, no invented “lost revenue.”{' '}
              <a href="/privacy/">Privacy</a>
            </p>
          </form>
        </div>
      </header>

      <section className="scan-explainer" aria-label="How the scan works">
        <div className="wrap scan-explainer__grid">
          <div><b>01</b><span>Paste a public page</span></div>
          <div><b>02</b><span>We run a live mobile diagnostic</span></div>
          <div><b>03</b><span>You get ranked, fixable evidence</span></div>
        </div>
      </section>

      {state === 'error' ? (
        <section
          className="scan-error wrap"
          ref={(node) => { resultRef.current = node }}
          aria-live="assertive"
        >
          <span className="scan-kicker">Scan interrupted</span>
          <h2>That one didn’t finish.</h2>
          <p>{error}</p>
          <div className="scan-error__actions">
            <button className="btn btn--cherry" type="button" onClick={retry}>Try again</button>
            <a className="btn btn--ghost" href={`mailto:aiden@thenowdesigns.com?subject=Manual website scan&body=Website: ${encodeURIComponent(website)}`}>
              Send it manually
            </a>
          </div>
        </section>
      ) : null}

      {report ? (
        <div
          className="scan-report"
          ref={(node) => { resultRef.current = node }}
          id="scan-results"
        >
          <section className="scan-report__summary">
            <div className="wrap">
              <div className="scan-report__stamp">
                <span>Live report</span>
                <time dateTime={report.scannedAt}>{humanDate(report.scannedAt)}</time>
              </div>
              <div className="scan-summary-grid">
                <div
                  className={`scan-ring ${scoreTone(report.overall)}`}
                  style={{ '--scan-score': `${report.overall}%` } as CSSProperties}
                  role="img"
                  aria-label={`Overall buyer-readiness score ${report.overall} out of 100`}
                >
                  <div><strong>{report.overall}</strong><span>/ 100</span></div>
                </div>
                <div className="scan-summary-copy">
                  <span className="scan-kicker">{report.verdict.label} · {report.hostname}</span>
                  <h2>{report.verdict.headline}</h2>
                  <p>{report.verdict.detail}</p>
                  <div className="scan-summary-copy__actions">
                    <a className="btn btn--cherry" href="#leaks">Show me the leaks <span className="arrow">↓</span></a>
                    <button className="scan-text-button" type="button" onClick={retry}>Scan another site</button>
                  </div>
                </div>
              </div>

              <div className="scan-score-grid">
                {report.categories.map((category) => (
                  <article className={`scan-score-card ${scoreTone(category.score)}`} key={category.key}>
                    <div><span>{category.label}</span><strong>{scoreLabel(category.score)}</strong></div>
                    <div className="scan-score-card__bar" aria-hidden="true">
                      <span style={{ width: `${category.score ?? 0}%` }}></span>
                    </div>
                    <p>{category.note}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="scan-page-proof">
            <div className="wrap scan-page-proof__grid">
              <div className="scan-page-proof__screen">
                {report.screenshotUrl ? (
                  <img src={report.screenshotUrl} alt={`Automated mobile preview of ${report.hostname}`} />
                ) : (
                  <div className="scan-page-proof__placeholder">Live page tested</div>
                )}
                <span>{report.hostname}</span>
              </div>
              <div className="scan-page-proof__copy">
                <span className="scan-kicker">The page we tested</span>
                <h2>{report.title}</h2>
                <p>{report.description}</p>
                <a href={report.finalUrl} target="_blank" rel="noopener">Open tested page ↗</a>
                <small>
                  One submitted page, tested on a simulated mobile device. This is an automated
                  diagnostic, not a conversion guarantee or full-site accessibility certification.
                </small>
              </div>
            </div>
          </section>

          <section className="scan-leaks sec" id="leaks">
            <div className="wrap">
              <div className="scan-section-head">
                <div>
                  <span className="scan-kicker">Verified on the live page</span>
                  <h2>{report.issues.length ? `${report.issues.length} leaks worth fixing.` : 'No automated red flags.'}</h2>
                </div>
                <p>
                  Ranked by likely impact on attention, usability, search, and trust—not by invented
                  revenue-loss claims. {report.issues.length > 8 ? 'The eight highest-impact findings are shown; every verified issue is included in the estimate.' : ''}
                </p>
              </div>

              {report.issues.length ? (
                <div className="scan-issue-list">
                  {report.issues.slice(0, 8).map((issue, index) => (
                    <article className={`scan-issue is-${issue.severity}`} key={issue.id}>
                      <div className="scan-issue__rank">{String(index + 1).padStart(2, '0')}</div>
                      <div className="scan-issue__body">
                        <div className="scan-issue__meta">
                          <span>{issue.categoryLabel}</span>
                          <span className="scan-issue__severity">{issue.severity} impact</span>
                          <span>{issue.evidence}</span>
                        </div>
                        <h3>{issue.title}</h3>
                        <p>{issue.impact}</p>
                        <div className="scan-issue__fix"><b>Repair:</b> {issue.fix}</div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="scan-clean">
                  <span>✓</span>
                  <div>
                    <h3>The tested technical fundamentals look healthy.</h3>
                    <p>A human review can still uncover unclear offers, weak proof, and buyer-flow friction that automated tools cannot judge.</p>
                  </div>
                </div>
              )}

              {report.wins.length ? (
                <div className="scan-wins">
                  <span>What’s already working</span>
                  <div>{report.wins.map((win) => <b key={win.id}>✓ {win.label}</b>)}</div>
                </div>
              ) : null}
            </div>
          </section>

          <ConceptPreview report={report} />

          <div className="wrap scan-offer-wrap">
            <RepairOffer report={report} />
          </div>

          <section className="scan-method sec">
            <div className="wrap scan-method__grid">
              <div>
                <span className="scan-kicker">What the number means</span>
                <h2>A score with receipts.</h2>
              </div>
              <div className="scan-method__copy">
                <p>
                  The overall score weights speed 35%, accessibility 25%, search 25%, and trust 15%.
                  The underlying checks come from a live Lighthouse diagnostic; every issue shown
                  above corresponds to a failed or weak measured audit.
                </p>
                <p>
                  Automated tools cannot know whether your offer is compelling, whether the right
                  proof appears at the right moment, or how many sales you lost. We do not pretend
                  they can. Those questions require a human conversion review.
                </p>
                <p>
                  The preliminary repair estimate combines the verified issue severity and category
                  with your selected platform and page range. It maps that effort to one of five fixed
                  routes; access and final scope are still confirmed before work begins.
                </p>
                <small>
                  Lighthouse versions and lab conditions change, so scores can vary between runs.
                  Use the findings as directional technical evidence, not a legal, accessibility,
                  security, SEO, or revenue guarantee.
                </small>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      <section className="scan-faq sec sec--cream">
        <div className="wrap scan-faq__grid">
          <div>
            <span className="scan-kicker">Straight answers</span>
            <h2>Before you scan.</h2>
          </div>
          <div className="faq">
            <details>
              <summary>Does the scanner crawl my whole website?</summary>
              <p>No. It tests the exact public page you submit. Start with your homepage or the landing page receiving ad traffic.</p>
            </details>
            <details>
              <summary>Do you need my email to show the results?</summary>
              <p>No. The report appears on this page. We only ask for contact details if you choose to request the repair sprint.</p>
            </details>
            <details>
              <summary>Can an automated score prove I’m losing clients?</summary>
              <p>No—and any tool claiming an exact lost-revenue number without your analytics is guessing. This scan identifies measurable friction that can weaken attention, access, search, and trust.</p>
            </details>
            <details>
              <summary>What happens to the website address I submit?</summary>
              <p>It is sent to our diagnostic provider so the public page can be loaded and tested. Do not submit private, password-protected, or internal addresses. See our <a href="/privacy/">Privacy Policy</a>.</p>
            </details>
            <details>
              <summary>What if my site needs more than repairs?</summary>
              <p>We will say so before you pay. Full rebuilds start at $4,500; the repair sprint is for a sound site with a fixable foundation.</p>
            </details>
          </div>
        </div>
      </section>

      {!report ? (
        <section className="scan-bottom-cta">
          <div className="wrap">
            <h2>Evidence first. <em>Then decide.</em></h2>
            <p>Paste the page your next customer sees.</p>
            <a className="btn btn--cherry btn--lg" href="#top">Scan my website free <span className="arrow">↑</span></a>
          </div>
        </section>
      ) : null}
    </>
  )
}
