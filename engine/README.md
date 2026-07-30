# The Now Designs — Virality Prediction Engine

A daily prediction engine that (1) implements the *documented* ranking math of the major
social platforms, (2) pulls live trend signals from free public sources every morning, and
(3) outputs a daily content brief: which waves to ride, which idea from the bank to shoot,
which platform to post it on, and which metric targets to hit.

The research behind every equation and constant lives in
[`docs/virality-research.md`](../docs/virality-research.md).

## Quick start

```bash
npm ci
npm run engine:daily            # live sources (falls back to fixtures if all fail)
npm run engine:daily -- --offline   # deterministic fixture run
npm run engine:score -- --idea site-teardown
npm run engine:score -- --file my-idea.json
npm run engine:test
```

Output lands in `engine/briefs/` (`YYYY-MM-DD.md`, `latest.md`, `latest.json`).
The GitHub Action `.github/workflows/daily-brief.yml` runs it every day at 11:00 UTC
and publishes the brief to the run's job summary + a downloadable artifact.

## How it works

```
signals (reddit /rising · HN Algolia · Google daily trends)
   │  velocity = engagement / age          ← every platform formula rewards early velocity
   ▼
trend model (model.ts)
   │  momentum  = velocity percentile in today's batch
   │  stage     = emerging | surging | peaking | saturated
   │  waveScore = momentum × niche-relevance × stage multiplier
   ▼
idea bank (ideas.ts) ── matched by category, trendAlignment lifted to wave momentum
   ▼
platform scoring (scoring.ts → equations.ts)
   │  content features (0–10) → estimated engagement probabilities
   │  → documented platform combination math → 0–100 score + biggest-lever advice
   ▼
daily brief (brief.ts) → markdown + JSON
```

## The equations (`equations.ts`)

| Platform | Shape | Source |
|----------|-------|--------|
| X / Twitter | `Σ wᵢ·p(engagementᵢ)` with published weights (reply-engaged-by-author **+75**, report **−369**, like 0.5…) | open-sourced `twitter/the-algorithm-ml` (2023) |
| TikTok | `p(like)·v₁ + p(comment)·v₂ + E(playtime)·v₃ + p(play)·v₄` + staged pool promotion gates | internal doc reported by NYT (2021) |
| Instagram Reels | benchmark-normalized weighted sum, ordering **sends/reach > watch% > likes/reach** | Meta ranking explainers / Mosseri |
| YouTube (+Shorts) | expected watch time per impression; Shorts: stayed-rate × avg-view-% | Covington et al., RecSys 2016 |
| Reddit | `log₁₀(votes) + t/45000` (≈12.5 h of recency = 10× votes) | Reddit's open-sourced code |
| Hacker News | `(points−1)^0.8 / (age+2)^1.8` | public formula |
| Cascade projection | early-velocity → final-size (Hawkes/SEISMIC-inspired half-life projection) | Zhao et al., KDD 2015 |

## Honest limits

- The platforms compute engagement probabilities with internal ML we cannot see;
  this engine **estimates the inputs** from content attributes and applies the
  platforms' **documented combination math** to them.
- Scores are relative prioritization across your own options — not absolute
  predictions. Post, measure against `latest.json`, and recalibrate the feature
  scores in `ideas.ts` toward what your account's data says.
- The Google Trends fetcher uses an unofficial endpoint that can break without
  notice; every source is optional and failures degrade gracefully to fixtures.

## Extending

- **New signal source** → add a file under `src/signals/` returning `TrendSignal[]`,
  register it in `src/signals/index.ts`.
- **New idea** → append to `IDEA_BANK` in `src/ideas.ts` (features are 0–10 priors).
- **Recalibrate** → the probability mappings live in one place, `src/scoring.ts`.
