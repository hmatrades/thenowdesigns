# thenowdesigns

Visuals, Art and Design.

## Website leak scanner

`/scan/` runs a real mobile Lighthouse diagnostic, turns failed audits into
plain-language buyer friction, and calculates a preliminary repair route from
the verified issues, platform, and core-page count.

The scanner works at low volume with Microlink's public endpoint. Before paid
traffic, set the `VITE_SCAN_API_URL` GitHub Actions variable to a server-side
proxy with commercial capacity. Checkout fails closed: `VITE_CHECKOUT_MODE`
defaults to `scope_review`, which sends the scan and estimate through the
no-payment scope form. To use Whop, configure each product as an approval
waitlist with required `Website URL` and `Scan reference` questions, set
`VITE_WHOP_TIER_1_URL` through `VITE_WHOP_TIER_5_URL`, then set the mode to
`whop_waitlist`. Missing and manual-review tiers still use the scope form. The
`$4,500+` route remains manual until it is defined as a fixed base payment or
deposit. Direct-charge checkout stays disabled until the scope-mismatch and
refund policy is explicitly set.

The optional concept preview uses the Cloudflare Worker in `worker/index.js`.
It sends a fixed, bounded scan summary to OpenRouter and accepts only strict
structured JSON. The frontend renders that data through a trusted, sandboxed
read-only template; the model never returns executable HTML or chooses a price.

For local Worker development, keep `OPENROUTER_API_KEY` in `.env.local` and run
Wrangler. For production, store it as a Cloudflare Worker secret, deploy the
Worker, then set `VITE_PREVIEW_API_URL` to its full `/v1/preview` URL. The Worker
deploy workflow is manual until Cloudflare credentials and the Worker secret
are configured. Provider data collection is denied per request. Set
`OPENROUTER_REQUIRE_ZDR` to `true` only when the selected model and account
privacy settings have a compatible zero-retention endpoint.

Copy `.env.example` to `.env.local` for local configuration. Never place a
private provider key in a `VITE_` variable because those values ship to the
browser.
