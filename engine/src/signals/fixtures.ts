import type { TrendSignal } from '../types.js'

/**
 * Representative snapshot for offline runs (tests, demos, sandboxes without
 * egress). Shapes and magnitudes mirror what the live fetchers return.
 * Ages are fixed, so staging is deterministic.
 */
export const FIXTURE_SIGNALS: TrendSignal[] = [
  {
    source: 'fixture',
    id: 'fx-reddit-1',
    title: 'I rebuilt my barbershop client\'s dated website in a weekend — before/after inside',
    url: 'https://www.reddit.com/r/web_design/',
    category: 'design',
    ageHours: 3,
    engagement: 240,
    comments: 58,
    accelerating: true,
  },
  {
    source: 'fixture',
    id: 'fx-reddit-2',
    title: 'Small business owners: what made you finally replace your DIY Wix site?',
    url: 'https://www.reddit.com/r/smallbusiness/',
    category: 'smallbiz',
    ageHours: 5,
    engagement: 180,
    comments: 92,
    accelerating: true,
  },
  {
    source: 'fixture',
    id: 'fx-hn-1',
    title: 'Show HN: A CSS-only 3D hero section that scores 100 on Lighthouse',
    url: 'https://news.ycombinator.com/',
    category: 'design',
    ageHours: 4,
    engagement: 320,
    comments: 140,
  },
  {
    source: 'fixture',
    id: 'fx-hn-2',
    title: 'AI coding assistants are changing how agencies price web projects',
    url: 'https://news.ycombinator.com/',
    category: 'ai',
    ageHours: 9,
    engagement: 410,
    comments: 260,
  },
  {
    source: 'fixture',
    id: 'fx-gtrends-1',
    title: 'google core update',
    category: 'marketing',
    ageHours: 7,
    engagement: 200000,
    accelerating: true,
  },
  {
    source: 'fixture',
    id: 'fx-gtrends-2',
    title: 'retro pixel aesthetic',
    category: 'culture',
    ageHours: 12,
    engagement: 50000,
  },
  {
    source: 'fixture',
    id: 'fx-hn-3',
    title: 'Why every restaurant website still has a PDF menu',
    url: 'https://news.ycombinator.com/',
    category: 'webdev',
    ageHours: 30,
    engagement: 520,
    comments: 340,
  },
  {
    source: 'fixture',
    id: 'fx-reddit-3',
    title: 'Typography trend check: are oversized serifs already over?',
    url: 'https://www.reddit.com/r/graphic_design/',
    category: 'design',
    ageHours: 55,
    engagement: 900,
    comments: 120,
  },
]
