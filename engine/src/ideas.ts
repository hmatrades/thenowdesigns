import type { ContentIdea } from './types.js'

/**
 * The Now Designs content idea bank.
 *
 * Every idea sells one of the studio's actual services (web design,
 * branding, SEO, WordPress support, maintenance) through formats the
 * ranking math favors: strong 3-second hooks, watchable transformations,
 * send-to-a-friend utility, and comment-provoking takes.
 *
 * Feature scores are 0–10 priors for the format itself; the brief adjusts
 * trendAlignment per matched trend at runtime. Ideas with "{TREND}" in the
 * hook are wildcards that get the day's trend spliced in.
 */
export const IDEA_BANK: ContentIdea[] = [
  {
    slug: 'before-after-rebuild',
    title: 'Before/after: real local business site rebuilt',
    format: 'Transformation timelapse (15–30 s) with a hard cut from old to new at the loop point',
    hook: 'This website was built in 2011. Watch what happens to it.',
    categories: ['design', 'webdev', 'smallbiz'],
    features: { hookStrength: 9, retentionDesign: 8, shareTrigger: 7, saveUtility: 5, commentBait: 6, trendAlignment: 5, nicheFit: 10 },
    platforms: ['tiktok', 'reels', 'shorts'],
  },
  {
    slug: 'site-teardown',
    title: 'Live teardown of a local business website',
    format: 'Screen-record roast → rebuild tease; ends on the free-teardown CTA',
    hook: 'I found the worst restaurant website in your city. Let me fix it.',
    categories: ['design', 'webdev', 'smallbiz'],
    features: { hookStrength: 9, retentionDesign: 8, shareTrigger: 8, saveUtility: 6, commentBait: 9, trendAlignment: 5, nicheFit: 10 },
    platforms: ['tiktok', 'reels', 'shorts', 'x'],
  },
  {
    slug: 'speed-build',
    title: '3D hero section speed-build',
    format: '60-second build timelapse of a Three.js/WebGL hero, code + canvas split screen',
    hook: 'Building the website intro that makes people stop scrolling — in 60 seconds.',
    categories: ['design', 'webdev'],
    features: { hookStrength: 8, retentionDesign: 9, shareTrigger: 6, saveUtility: 8, commentBait: 5, trendAlignment: 6, nicheFit: 10 },
    platforms: ['tiktok', 'reels', 'shorts'],
  },
  {
    slug: 'loss-hook',
    title: 'The 5-second website test',
    format: 'Direct-to-camera + screen overlay; viewer runs the test on their own site',
    hook: 'Your website is quietly losing you customers. Here is the 5-second test.',
    categories: ['smallbiz', 'marketing', 'webdev'],
    features: { hookStrength: 9, retentionDesign: 7, shareTrigger: 8, saveUtility: 8, commentBait: 7, trendAlignment: 4, nicheFit: 9 },
    platforms: ['tiktok', 'reels', 'shorts', 'linkedin'],
  },
  {
    slug: 'template-vs-custom',
    title: 'Template site vs hand-coded — spot the difference',
    format: 'Side-by-side A/B with escalating tells; audience votes in comments',
    hook: 'One of these websites costs $3,000. The other is a $30 template. Can you tell?',
    categories: ['design', 'webdev', 'smallbiz'],
    features: { hookStrength: 8, retentionDesign: 8, shareTrigger: 7, saveUtility: 6, commentBait: 9, trendAlignment: 4, nicheFit: 9 },
    platforms: ['tiktok', 'reels', 'shorts', 'x'],
  },
  {
    slug: 'ai-workflow',
    title: 'AI-accelerated, human-finished workflow reveal',
    format: 'Fast workflow montage: AI drafts, designer hand-finishes; myth-bust framing',
    hook: 'We use AI to build websites 10× faster — and you cannot tell. Here is how.',
    categories: ['ai', 'design', 'webdev'],
    features: { hookStrength: 8, retentionDesign: 8, shareTrigger: 7, saveUtility: 7, commentBait: 8, trendAlignment: 9, nicheFit: 9 },
    platforms: ['tiktok', 'reels', 'shorts', 'x', 'linkedin'],
  },
  {
    slug: 'seo-mythbust',
    title: 'Local SEO myth-busting',
    format: 'Rapid-fire myths with receipts from real search data; save-worthy checklist ending',
    hook: 'Local SEO myths your marketing guy still believes — #3 is costing you money.',
    categories: ['marketing', 'smallbiz'],
    features: { hookStrength: 7, retentionDesign: 7, shareTrigger: 7, saveUtility: 9, commentBait: 8, trendAlignment: 4, nicheFit: 8 },
    platforms: ['tiktok', 'reels', 'linkedin', 'x'],
  },
  {
    slug: 'lighthouse-speedrun',
    title: 'Lighthouse 100 speedrun',
    format: 'Speedrun timer overlay while fixing a slow site to a perfect score',
    hook: 'Speedrunning a perfect Google score on a real client site. Timer starts now.',
    categories: ['webdev', 'marketing'],
    features: { hookStrength: 7, retentionDesign: 8, shareTrigger: 6, saveUtility: 7, commentBait: 5, trendAlignment: 5, nicheFit: 9 },
    platforms: ['shorts', 'tiktok', 'x'],
  },
  {
    slug: 'wordpress-rescue',
    title: 'WordPress rescue story',
    format: 'Horror-story reveal → cleanup montage → speed test payoff',
    hook: 'This WordPress site had 47 plugins and hadn\'t been updated since 2019.',
    categories: ['webdev', 'smallbiz'],
    features: { hookStrength: 8, retentionDesign: 8, shareTrigger: 6, saveUtility: 6, commentBait: 7, trendAlignment: 4, nicheFit: 9 },
    platforms: ['tiktok', 'reels', 'shorts'],
  },
  {
    slug: 'trend-react',
    title: 'Design trend check (wildcard)',
    format: 'React + recreate: rebuild the trending thing in brand, verdict at the end',
    hook: 'Design trend check: {TREND} — timeless or landfill?',
    categories: ['design', 'culture', 'ai', 'marketing', 'webdev'],
    features: { hookStrength: 8, retentionDesign: 7, shareTrigger: 7, saveUtility: 5, commentBait: 9, trendAlignment: 10, nicheFit: 7 },
    platforms: ['tiktok', 'reels', 'shorts', 'x'],
  },
  {
    slug: 'client-pov',
    title: 'Small business owner POV skit',
    format: 'POV skit: owner sees their analytics/site through a customer\'s eyes',
    hook: 'POV: you Google your own business and your website loads… eventually.',
    categories: ['smallbiz', 'culture', 'marketing'],
    features: { hookStrength: 8, retentionDesign: 7, shareTrigger: 8, saveUtility: 4, commentBait: 7, trendAlignment: 7, nicheFit: 8 },
    platforms: ['tiktok', 'reels', 'shorts'],
  },
  {
    slug: 'pricing-transparency',
    title: 'What $2k vs $10k websites actually get you',
    format: 'Receipts-on-screen breakdown; carousel/long-form friendly',
    hook: 'What a $2,000 website actually buys you vs a $10,000 one — line by line.',
    categories: ['smallbiz', 'design', 'marketing'],
    features: { hookStrength: 7, retentionDesign: 7, shareTrigger: 8, saveUtility: 9, commentBait: 9, trendAlignment: 3, nicheFit: 9 },
    platforms: ['linkedin', 'x', 'reels'],
  },
]

export function ideaBySlug(slug: string): ContentIdea | undefined {
  return IDEA_BANK.find((i) => i.slug === slug)
}
