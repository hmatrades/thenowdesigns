# How Platform Algorithms Decide What Goes Viral

Research synthesis powering `engine/` — the daily virality prediction engine for
thenowdesigns.com content.

**Method.** Deep-research workflow: 6 search angles → 11 sources fetched → 40 falsifiable
claims extracted → 3-vote adversarial verification per claim. The search and extraction
phases completed; the verification phase hit an infrastructure limit and is being re-run —
claims below are marked **[extracted]** (pulled from the cited source by an extraction agent,
adversarial verification pending) or **[public fact]** (formula published in open-source code
or a peer-reviewed paper). This file is updated when verification completes.

---

## 0. The one equation that rules all of them

Every major platform ranks content the same way at the final stage:

```
score(post, viewer) = Σᵢ  weightᵢ × P(engagementᵢ | post, viewer)
```

A machine-learning model predicts the probability of each engagement type for *this viewer*
seeing *this post*; the platform multiplies each probability by a business-assigned weight
and sums. X's open-sourced code does exactly this, TikTok's leaked internal doc does exactly
this, and YouTube's published ranking paper is a watch-time-weighted variant of it.
**[extracted]** — corroborated across three independent source classes (open-source code,
leaked doc, peer-reviewed paper).

Two consequences for creators:

1. **You can't control the probabilities directly — you control the content attributes the
   model reads.** Hook quality drives P(play/stay), retention design drives E(playtime),
   utility drives P(share/save).
2. **The weights tell you what to optimize.** They differ per platform, and they are the
   closest public thing to "the algorithm's values."

---

## 1. X / Twitter — the only fully published weight set

**Source (primary):** [twitter/the-algorithm-ml, projects/home/recap README](https://github.com/twitter/the-algorithm-ml/blob/main/projects/home/recap/README.md)
and [weights commit b852108](https://github.com/twitter/the-algorithm-ml/commit/b85210863f7a94efded0ef5c5ccf4ff42767876c);
[official engineering blog](https://blog.x.com/engineering/en_us/topics/open-source/2023/twitter-recommendation-algorithm).

The "Heavy Ranker" (a ~48M-parameter parallel MaskNet) outputs ten engagement probabilities
per tweet; the final score is the weighted sum. Published weights (snapshot April 5, 2023):
**[extracted]**

| Predicted engagement | Weight | Relative to 1 like |
|---|---|---|
| Reply **and author engages with your reply** | **+75.0** | 150× |
| Reply | +13.5 | 27× |
| Good profile click (click profile → like/reply) | +12.0 | 24× |
| Good click v1 (click convo → like/reply) | +11.0 | 22× |
| Good click v2 (click convo → dwell ≥ 2 min) | +10.0 | 20× |
| Retweet | +1.0 | 2× |
| Favorite / like | +0.5 | 1× |
| Video watched ≥ 50% | +0.005 | 0.01× |
| Negative feedback (show-less / mute / block) | **−74.0** | −148× |
| Report | **−369.0** | −738× |

> ⚠️ One secondary compilation ([awesome-twitter-algo](https://github.com/igorbrigadir/awesome-twitter-algo))
> lists reply = 27.0 — an earlier snapshot; the repo's own README notes weights were
> calibrated so each engagement type contributed roughly equally on average, then
> **periodically adjusted**. Treat all values as a dated parameterization of a stable shape.

What the pipeline does around the ranker **[extracted]**:

- ~500M daily tweets → ~1,500 candidates per timeline request; the For You feed averages a
  **50/50 in-network / out-of-network split** — half your ceiling is strangers.
- ~6,000 features hydrated per tweet before scoring.
- Post-ranking heuristics modulate reach independent of score: author diversity, feedback
  fatigue, dedup, visibility filtering.
- In-network reach is gated by **Real Graph** (predicted author↔viewer engagement
  likelihood): the more your followers historically engage with you, the more of your posts
  they're even shown.

**Creator translation:** conversation is ~everything on X. A post engineered to get replies
*that you then answer* (75.0 per predicted author-engaged reply) beats a post engineered for
likes by two orders of magnitude. One predicted report erases ~738 likes — rage-bait is
mathematically self-defeating.

## 2. TikTok — the leaked scoring formula and staged distribution

**Sources:** leaked internal "TikTok Algo 101" doc (Beijing engineering team), reported by
NYT ("How TikTok Reads Your Mind", Dec 2021); corroborating full-formula coverage:
[Gizmodo](https://gizmodo.com/leaked-tiktok-doc-reveals-its-obvious-secret-to-an-addi-1848166901),
[deeplearning.ai The Batch](https://www.deeplearning.ai/the-batch/what-makes-tiktok-tick/),
and an [independent Chinese-platform copy circulating since Jan 2021](https://pxlnv.com/linklog/tiktok-leak-nyt/)
that matches the NYT doc word-for-word — strong authenticity signal. **[extracted]**

```
score = P(like)·V_like + P(comment)·V_comment + E(playtime)·V_playtime + P(play)·V_play
```

- `P·` terms = ML-predicted probabilities, `E` = estimated playtime, `V·` = value weights
  TikTok assigns (never disclosed). Structurally identical to X's ranker. **[extracted]**
- Top-level objective per the doc: **DAU growth via retention and time spent** — not likes,
  not shares. Watch time is the currency. **[extracted]**
- Distribution is **staged**: new videos enter a small test pool (commonly reported
  ~200–500 views); promotion to each larger pool depends on the ratios measured in the
  current one — completion rate, rewatch, like/view, comment/view, share/view.
  *(Staging widely reported by practitioners; specific pool sizes not in the leaked doc —
  lower confidence.)*

**Creator translation:** the first 200 views are the audition. Completion rate (and loops)
gate everything downstream; a mediocre completion rate caps you at the test pool no matter
how good the likes ratio is. Short + rewatchable beats long + impressive.

## 3. Instagram Reels — sends-per-reach is the lever

**Sources:** [Instagram Ranking Explained (official, Mosseri)](https://about.instagram.com/blog/announcements/instagram-ranking-explained);
Mosseri's 2024–2025 creator-Q&A statements. *(Official-blog fetch was rate-limited in this
run — re-verification queued; signal ordering below from search-phase source snippets +
widely reported Mosseri statements.)*

- Reels ranking's top signals, in order: **watch time, likes per reach, sends per reach** —
  with Mosseri explicitly calling **sends per reach** ("shares to a friend per viewer
  reached") the top signal creators should optimize for reach growth.
- Ranking is per-surface (Feed / Stories / Explore / Reels each have their own model), all
  following the weighted-engagement-probability shape.
- Legacy **EdgeRank** (`affinity × weight × time-decay`, ~2010) is long dead as an
  implementation but survives as the conceptual skeleton: relationship × content-type value
  × recency.

**Creator translation:** make things people *send to one specific friend* ("this is so you",
"we need this for the shop"). A save is good; a DM-send is the growth signal.

## 4. YouTube (+ Shorts) — expected watch time is the objective

**Source (peer-reviewed):** Covington, Adams & Sargin,
[*Deep Neural Networks for YouTube Recommendations*](https://research.google/pubs/deep-neural-networks-for-youtube-recommendations/),
RecSys 2016. **[public fact]**

- Two stages: candidate generation (millions → hundreds) then ranking (hundreds → dozens).
- The ranking model is trained with **weighted logistic regression where positive examples
  are weighted by watch time**, so the learned odds `e^(Wx+b)` approximate **expected watch
  time per impression** — that is literally the ranking objective.
- Shorts feed additionally optimizes **viewed vs swiped away** and average % viewed
  (loops > 100% count). *(Shorts specifics from YouTube analytics guidance + practitioner
  measurement — lower confidence than the paper.)*

**Creator translation:** `p(stay) × E(seconds watched)` is the product to maximize:
a hook that stops the swipe, multiplied by retention that holds to the end and loops.

## 5. Fully public baseline formulas (and why they matter)

**[public fact]** — both shipped in open source:

- **Reddit hot:** `log₁₀(max(|ups−downs|,1)) + sign × (t_created − 1134028003)/45000`
  → every ~12.5 hours of recency is worth **one order of magnitude of votes**.
- **Hacker News:** `(points − 1)^0.8 / (age_hours + 2)^1.8`
  → sub-linear reward for points, super-linear age decay: early velocity decides everything.

These two are the Rosetta Stone: they show, in plain arithmetic, the same recency-×-velocity
trade the big platforms implement with ML.

**Academic cascade prediction:** SEISMIC ([Zhao et al., KDD 2015, arXiv:1506.02594](https://arxiv.org/abs/1506.02594))
models resharing as a self-exciting (Hawkes) point process and estimates a post's
"infectiousness" from its **early engagement velocity** — the robust finding across this
literature: share velocity in the first hour(s) predicts final cascade size far better than
any content feature. *(Fetch rate-limited; re-verification queued.)*

**Engine implication:** the engine ranks trends by velocity percentile and stages them on a
lifecycle curve (`emerging → surging → peaking → saturated`), because by the time absolute
volume looks impressive, the alpha window is closed.

## 6. Benchmarks and the catch-the-wave window (2025–26, practitioner-grade)

*Lower confidence tier: creator-analytics vendors, not platform disclosures. Fetches were
rate-limited this run; numbers below are from search-phase snippets and are queued for
re-verification. Treat as starting targets and recalibrate against your own analytics.*

| Platform | Metric | Median | Strong (top-percentile) |
|---|---|---|---|
| TikTok (<15 s) | completion rate | 60–70% | **80%+** |
| YouTube Shorts | completion rate | 60–75% | **85%+** |
| TikTok | likes/view | ~3–5% | 8%+ |
| TikTok | shares/view | ~0.3–0.5% | 1%+ |
| Reels | watch % | ~50–70% | 90%+ (loop) |
| LinkedIn | comments, first 90 min | — | 5–10 substantive |

Trend lifecycle timing (practitioner consensus): TikTok sound/format trends run roughly
**emergence → 3–7 days → peak → 1–2 weeks → saturation**; Reels trends lag TikTok by days to
~2 weeks (cross-posting window); X trends live hours-to-days. The engine's actionable
window: **emerging/surging stages only** — content posted into a peaking trend competes
against maximum supply with decaying novelty.

Free daily trend-detection sources (what `engine/src/signals/` uses or can add):

- Reddit `/r/*/rising.json` — acceleration flag built into the endpoint ✅ implemented
- Hacker News Algolia API (`tags=front_page`) ✅ implemented
- Google Trends daily-trends JSON (unofficial, pytrends-style) ✅ implemented (best-effort)
- TikTok Creative Center trending sounds/hashtags — scriptable, add next
- YouTube `mostPopular` chart API (needs free API key) — add next

---

## 7. How the research maps into the engine

| Research finding | Where it lives in code |
|---|---|
| X weighted-sum + published weights | `equations.ts → X_HEAVY_RANKER_WEIGHTS`, `xHeavyRankerScore()` |
| TikTok leaked formula + staged gates | `equations.ts → tiktokScore()`, `TIKTOK_PROMOTION_GATES` |
| Mosseri signal order, sends/reach #1 | `equations.ts → reelsSignalScore()` (benchmark-normalized so the published ordering holds) |
| Covington expected-watch-time | `equations.ts → expectedWatchTime()`, `shortsScore()` |
| Reddit hot / HN gravity | `equations.ts → redditHot()`, `hackerNewsRank()` |
| SEISMIC early-velocity finding | `equations.ts → projectedFinalEngagement()`, `model.ts` velocity-percentile momentum |
| Trend lifecycle windows | `model.ts → stageOf()`, stage multipliers + posting windows |
| Benchmark thresholds | `scoring.ts → TARGETS` (shown in every daily brief) |

**Standing caveats.** (1) Platforms A/B-test and retune weights continuously; every number
here is a dated snapshot of a stable *shape*. (2) The engine estimates input probabilities
from content attributes — the platforms compute them from thousands of user×item features we
can't see. Scores are for prioritizing between your own options, not absolute predictions.
(3) The verification pass re-runs after the rate-limit reset; claims failing adversarial
verification will be corrected here and in code.
