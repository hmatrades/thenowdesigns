import { Head } from 'vite-react-ssg'
import { Link } from 'react-router-dom'
import HashLink from '../components/HashLink'
import PageHero from '../components/PageHero'
import Marquee from '../components/Marquee'
import KineticHeading from '../components/KineticHeading'

const DETAILS = [
  {
    num: '01',
    name: 'Web Design',
    intro: 'Editorial, conversion-minded websites built by hand — not dragged out of a template. Beautiful on every screen, fast as hell, engineered to turn visitors into customers.',
    points: [
      'Custom design in your brand, not a theme',
      'Hand-coded — no page-builder bloat',
      'Sub-second load times, top Lighthouse scores',
      'Responsive and accessible on every device',
      'SEO architecture baked in from line one',
    ],
    img: '/img/web-design.jpg',
    tag: 'Design + Build',
  },
  {
    num: '02',
    name: 'Branding',
    intro: 'A look with a point of view. We build marks, palettes, and type systems that feel inevitable — so your site reads as a real brand, not a stock kit.',
    points: [
      'Logo / wordmark + variations',
      'Color palette & typography system',
      'Brand guidelines you can hand to anyone',
      'Social, email, and collateral templates',
      'A visual identity that scales with you',
    ],
    img: '/img/brand-identity.jpg',
    tag: 'Logo + System',
  },
  {
    num: '03',
    name: 'Search Engine Optimization',
    intro: 'A beautiful site nobody finds is a waste. We make yours rank, convert, and improve — with search work built on real data, not guesswork.',
    points: [
      'Technical SEO & site-speed tuning',
      'Local SEO that actually ranks',
      'Keyword & content strategy from search data',
      'Google Business profile optimization',
      'Conversion tracking & 60-second monthly reports',
    ],
    img: '/img/growth.jpg',
    tag: 'SEO + Content',
  },
  {
    num: '04',
    name: 'WordPress Support',
    intro: "Already on WordPress? We keep it fast, secure, and current — theme tweaks, plugin work, bug fixes, and the hands-on help that keeps it running like it should.",
    points: [
      'Theme & template customization',
      'Plugin setup, updates & cleanup',
      'Speed & security hardening',
      'Bug fixes and broken-layout repair',
      'Content edits, done for you',
    ],
    img: '/img/development.jpg',
    tag: 'Care + Fixes',
  },
  {
    num: '05',
    name: 'Website Maintenance',
    intro: 'Launch is the start, not the finish. We keep your site quick, patched, backed up, and looking sharp — so it never quietly drifts out of date.',
    points: [
      'Software, plugin & dependency updates',
      'Daily backups & uptime monitoring',
      'Security patches & SSL renewal',
      'Small content & design tweaks',
      'A 60-second monthly health report',
    ],
    img: '/img/cherry-plate.jpg',
    tag: 'Updates + Backups',
  },
]

const FAQ = [
  { q: 'How long does a website take?', a: "Most builds go live in 4–6 weeks, not 4–6 months. Bigger projects can take longer — we'll give you a real timeline on the first call, with weekly progress so you're never wondering." },
  { q: "Do I own the website when it's done?", a: 'Completely. You own the code, the domain, and the data — forever. No vendor lock-in. If you ever leave, you walk away with everything.' },
  { q: 'Do you build custom, or on WordPress?', a: 'Whatever serves you best. We hand-code custom sites for maximum speed and control, and we also support and maintain WordPress if that’s the right call. The goal is your result, not our preference.' },
  { q: 'What if I just need a redesign or upkeep?', a: 'That’s fine. We take on redesigns, single pages, custom sections, SEO-only and maintenance-only engagements. Tell us where you are and we’ll scope exactly what you need.' },
  { q: 'Will my site actually rank on Google?', a: 'SEO architecture is built into every site from line one, and speed (which Google rewards) is a given. For ongoing rankings, our Search Engine Optimization service handles the technical work, content, and reporting month to month.' },
]

export default function Services() {
  return (
    <>
      <Head>
        <title>Services — The Now Designs</title>
        <meta name="description" content="Web design, branding, search engine optimization, WordPress support, and website maintenance — done for you, end to end. Fast, beautiful, conversion-first." />
        <meta property="og:title" content="Services — The Now Designs" />
        <meta property="og:description" content="Web design, branding, SEO, WordPress support, and maintenance — done for you, end to end." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://thenowdesigns.com/services/" />
        <meta property="og:image" content="https://thenowdesigns.com/img/og-card.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://thenowdesigns.com/services/" />
      </Head>

      <PageHero
        eyebrow="Services"
        heading={[{ text: 'Everything you need to ' }, { text: 'win online.', em: true }]}
        lead="Five services, one studio, zero handoffs. A whole site, a fresh identity, the SEO to get found, or the ongoing care to keep it sharp — it's all done for you."
      />

      <Marquee />

      {/* SERVICE DETAILS */}
      <section className="sec">
        <div className="wrap">
          {DETAILS.map((d) => (
            <div className="svc-detail" data-reveal key={d.num}>
              <div className="svc-detail__text">
                <span className="svc-detail__num">{d.num}</span>
                <h3>{d.name}</h3>
                <p className="svc-detail__intro">{d.intro}</p>
                <ul>
                  {d.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
              <div className="svc-detail__media">
                <img src={d.img} alt={d.name + ' by The Now Designs'} loading="lazy" />
                <div className="tag">{d.tag}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROCESS */}
      <section className="sec sec--cream" id="process">
        <div className="wrap">
          <div className="sec-head" data-reveal>
            <span className="eyebrow">How it works</span>
            <h2 className="h-sec">Live in <em>weeks</em>, not months.</h2>
            <p>Four steps. One direct line to the person building it. No approval chains, no waiting rooms.</p>
          </div>
          <div className="steps">
            <div className="step" data-reveal data-d="1"><div className="step__n">01</div><h4>The Call</h4><p>A free, no-pitch conversation. You tell us what you're building; we tell you exactly what we'd do.</p></div>
            <div className="step" data-reveal data-d="2"><div className="step__n">02</div><h4>The Design</h4><p>We design it in your brand. You see real screens — and shape it with us before a line ships.</p></div>
            <div className="step" data-reveal data-d="3"><div className="step__n">03</div><h4>The Build</h4><p>We hand-code it: fast, responsive, SEO-ready. Weekly updates, revisions until it's right.</p></div>
            <div className="step" data-reveal data-d="4"><div className="step__n">04</div><h4>The Launch</h4><p>We ship it locked-down and lightning quick — then hand you the keys. Cherry on top included.</p></div>
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section className="sec sec--ink" id="security">
        <div className="wrap">
          <div className="sec-head" data-reveal>
            <span className="eyebrow">Security · not optional</span>
            <h2 className="h-sec">It's not about the website. It's about <em>keeping what's yours.</em></h2>
            <p>AI changed how websites get attacked. Bots, phishing nets, and scrapers run around the clock, headless, below the surface. A website is the easy part — keeping <em>you</em> safe online is the real work.</p>
          </div>
          <div className="shield-grid">
            <div className="shield" data-reveal data-d="1"><h3><span className="ic">⚠</span> The threat is invisible</h3><p>Most attacks never touch a browser. Automated bots probe, scrape, and phish 24/7. If a site isn't locked down at the wire, you only see the damage.</p></div>
            <div className="shield" data-reveal data-d="2"><h3><span className="ic">💡</span> Your ideas are the target</h3><p>In an AI world, your ideas are what make you money. The wrong setup lets anyone copy your content and lift your data. We make sure your ideas keep paying <em>you.</em></p></div>
            <div className="shield" data-reveal data-d="3"><h3><span className="ic">🔒</span> We lock it down</h3><p>Every site ships with end-to-end HTTPS and secure DNS through <b>Cloudflare</b> — battle-tested infrastructure, standard on every build.</p></div>
          </div>
          <div className="trust-band" data-reveal>
            <span className="trust-band__lbl">Secured with</span>
            <span className="trust-chip"><b>Cloudflare</b> DNS</span>
            <span className="trust-chip"><b>HTTPS</b> / TLS 1.3</span>
            <span className="trust-chip"><b>DNSSEC</b></span>
            <span className="trust-chip"><b>SSL</b> on every page</span>
            <span className="trust-chip">Bot &amp; DDoS protection</span>
          </div>
          <p className="secure-kicker" data-reveal>Your identity, your data, your ideas — <em>safe, and yours to keep.</em></p>
        </div>
      </section>

      {/* BUDGET (replaces pricing) */}
      <section className="sec budget" id="pricing">
        <div className="wrap budget__wrap">
          <span className="eyebrow" data-reveal>What it costs</span>
          <KineticHeading as="h2" className="budget__head" segments={[{ text: 'Clear prices for repairs. ' }, { text: 'Custom scope for builds.', em: true }]} />
          <p className="budget__line" data-reveal data-d="1">
            Fixed repair routes keep contained technical work predictable. Full builds are still
            scoped around your goals, constraints, and budget—and you own everything when it ships.
          </p>
          <div data-reveal data-d="2"><HashLink to="/#contact" className="btn btn--cherry btn--lg">Plan my project <span className="arrow">→</span></HashLink></div>
        </div>
      </section>

      {/* FAQ */}
      <section className="sec sec--blue">
        <div className="wrap">
          <div className="sec-head" data-reveal>
            <span className="eyebrow">Good questions</span>
            <h2 className="h-sec">Before you <em>ask.</em></h2>
          </div>
          <div className="faq" data-reveal data-d="1">
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-band">
        <div className="wrap">
          <h2 data-reveal>Tell us what you're <em>building.</em></h2>
          <p data-reveal data-d="1">We'll tell you exactly what we'd do — and what it'd cost. Free, no pitch, no pressure.</p>
          <div data-reveal data-d="2"><HashLink to="/#contact" className="btn btn--cherry">Book a free call <span className="arrow">→</span></HashLink></div>
        </div>
      </section>
    </>
  )
}
