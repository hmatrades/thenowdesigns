import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildBrief, renderMarkdown } from './brief.js'
import { IDEA_BANK, ideaBySlug } from './ideas.js'
import { scoreAllPlatforms } from './scoring.js'
import { collectSignals } from './signals/index.js'
import type { ContentFeatures, Platform } from './types.js'

const USAGE = `The Now Designs — virality prediction engine

Usage:
  engine daily [--offline] [--out <dir>]   Generate today's brief (markdown + JSON)
  engine score --idea <slug>               Score an idea-bank concept per platform
  engine score --file <features.json>      Score custom content features per platform
  engine ideas                             List idea-bank slugs

features.json shape (all 0-10):
  { "hookStrength": 8, "retentionDesign": 7, "shareTrigger": 6, "saveUtility": 5,
    "commentBait": 7, "trendAlignment": 8, "nicheFit": 9, "platforms": ["tiktok", "reels"] }
`

function argValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag)
  return i >= 0 ? args[i + 1] : undefined
}

async function runDaily(args: string[]): Promise<void> {
  const offline = args.includes('--offline') || process.env.ENGINE_OFFLINE === '1'
  const defaultOut = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'briefs')
  const outDir = resolve(argValue(args, '--out') ?? defaultOut)

  const { signals, sourcesUsed, sourcesFailed } = await collectSignals(offline)
  const brief = buildBrief(signals, sourcesUsed, sourcesFailed)
  const markdown = renderMarkdown(brief)

  await mkdir(outDir, { recursive: true })
  await writeFile(join(outDir, `${brief.date}.md`), markdown)
  await writeFile(join(outDir, 'latest.md'), markdown)
  await writeFile(join(outDir, 'latest.json'), JSON.stringify(brief, null, 2))

  console.log(markdown)
  console.error(`\nWrote ${join(outDir, `${brief.date}.md`)} (+latest.md, latest.json)`)
}

function printScores(features: ContentFeatures, platforms?: Platform[]): void {
  const scores = scoreAllPlatforms(features, platforms)
  for (const s of scores) {
    console.log(`\n${s.platform.toUpperCase().padEnd(10)} ${String(s.score).padStart(3)}/100`)
    for (const r of s.rationale) console.log(`  ↑ ${r}`)
    for (const t of s.targets) console.log(`  ◦ ${t.metric}: ${t.target} (${t.source})`)
  }
  console.log('')
}

async function runScore(args: string[]): Promise<void> {
  const slug = argValue(args, '--idea')
  const file = argValue(args, '--file')

  if (slug) {
    const idea = ideaBySlug(slug)
    if (!idea) {
      console.error(`Unknown idea "${slug}". Run: engine ideas`)
      process.exitCode = 1
      return
    }
    console.log(`\n${idea.title}\nHook: ${idea.hook}`)
    printScores(idea.features, idea.platforms)
    return
  }

  if (file) {
    const parsed = JSON.parse(await readFile(resolve(file), 'utf8')) as ContentFeatures & {
      platforms?: Platform[]
    }
    const { platforms, ...features } = parsed
    printScores(features, platforms)
    return
  }

  console.error(USAGE)
  process.exitCode = 1
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2)
  switch (command) {
    case 'daily':
      await runDaily(args)
      break
    case 'score':
      await runScore(args)
      break
    case 'ideas':
      for (const idea of IDEA_BANK) console.log(`${idea.slug.padEnd(24)} ${idea.title}`)
      break
    default:
      console.error(USAGE)
      process.exitCode = command ? 1 : 0
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
