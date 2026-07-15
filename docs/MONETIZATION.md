# Monetization Plan (v1)

Status: Draft / brainstorm — pricing numbers and quotas are starting points to be tuned once real LLM/infra costs are known.

## Goals

- Let free users get real value from one resume, a capped amount of AI help, and ATS checks, funded partly by non-intrusive ads.
- Give committed job seekers a low-friction way to go Pro (recurring subscription) with a usage wallet that scales with how much AI help they actually need.
- Lay a data model that can grow into job tracking, a Chrome extension, and auto-apply agents without a rewrite.

## Free tier

- **Resumes:** 1 active resume slot.
- **AI chat messages:** small renewing allowance (e.g. daily/monthly reset) — exact number TBD from real usage/cost data (starting guess: ~5/day).
- **ATS checks:** small renewing allowance (starting guess: ~1/day).
- **Ads:** both of the following, not either/or:
  - Static banner in low-traffic areas of the UI (e.g. the empty state in `MyResumesView.jsx`, a sidebar/footer slot) — never placed inside the chat panel or editor, since interrupting the core workflow is the fastest way to churn users.
  - Rewarded ads at the quota wall: "watch a short ad → get 1 more message/check today," shown only when a free user actually hits their limit.
- No MCP access, no job tracker, no auto-apply — these are Pro/future-only.

## Free-tier ATS Paywall (Quota Wall Behaviour)

When a free user exhausts their ATS check allowance, the ATS results panel enters a **blur gate** state. The score is always shown — it is the primary conversion hook ("Your score is 42/100 🔴" is a strong upgrade trigger). Everything else is obscured:

| ATS Component | Within free quota | Quota exhausted | Pro |
|---|---|---|---|
| Score (0–100) | ✅ Visible | ✅ Always visible | ✅ Visible |
| Matched keywords | ✅ Visible | 🔒 Blurred | ✅ Visible |
| Missing keywords | ✅ Visible | 🔒 Blurred | ✅ Visible |
| AI Suggestions | ✅ Visible | 🔒 Blurred | ✅ Visible |
| Summary text | ✅ Visible | 🔒 Blurred | ✅ Visible |
| "Improve Resume" button | ✅ Visible | 🔒 Hidden + upgrade CTA | ✅ Visible |

**Dummy content behind the blur:** Use realistic-looking placeholder text (e.g. skill names, plausible suggestion sentences) — not lorem ipsum. The content should look credible and tantalizing so the blur gate motivates upgrades rather than looking obviously fake.

**Upgrade CTA placement:** A "Go Pro" button / card overlaid on the blurred region, not a separate page. Keeps the user in context (they can see the score) and reduces friction to subscribing.

## Pro tier — subscription + wallet, unified into one balance

Pro is a **recurring subscription** (not a pure pay-as-you-go wallet), but AI usage is metered through a **credits wallet** layered on top. Two concepts, cleanly split:

| Concept | Governs | Behavior |
|---|---|---|
| Subscription (Monthly / Annual) | Pro status: N resumes, MCP access, monthly credit grant | Renews each billing cycle; lapsing reverts perks (not the wallet) |
| Wallet balance (credits) | Metered AI actions: chat messages, ATS checks, future paid agent actions | Single balance, tops up via subscription grants + manual purchases, **never expires** (full rollover) |

### Pricing

- **Monthly:** ₹95-equivalent (or local-currency equivalent — see "Localized pricing" below).
- **Annual:** 10x the monthly price (i.e. 2 months free) — same perks, better value, reduces churn.
- Users can top up any additional amount at any time on top of their subscription grant.

### Credits

- Unit: abstract "credits," not raw LLM tokens — keeps the user-facing price stable even if the underlying model changes.
- Suggested mapping: 1 credit ≈ ₹1, so a ₹95/mo plan grants ~95 credits per cycle.
- Starting credit costs per action (tune later from real usage data):
  - 1 AI chat message = 1 credit
  - 1 ATS check = 2 credits (heavier compute — full resume + JD analysis)
  - 1 MCP tool call = **free** (Pro perk, not credit-metered — see MCP section)
  - Future auto-apply submission = 5 credits (deliberately expensive; throttles reckless mass-applying)
- **Full rollover:** unused credits never expire, whether granted by subscription renewal or purchased as a top-up. This simplifies the data model to a single wallet balance rather than tracking separate "included" vs "purchased" buckets with different expiry rules.

### On cancellation / lapse

- Pro perks (extra resume slots beyond the free cap, MCP access) revert to free-tier limits. Resumes above the free cap should become read-only/archived, not deleted — nudges resubscription without being punitive.
- The wallet balance is untouched and remains spendable even on the free tier. Keeps trust high and gives a natural win-back hook ("you still have 40 credits — come back and use them").

## MCP access

- Available to Pro users while their subscription is active.
- Treated as a **free perk**, not a credit-metered action — since MCP tools primarily read/write the user's own resume data rather than triggering additional LLM calls on our side.
- Still needs per-user MCP API keys/tokens and rate limiting to prevent abuse of an unsupervised external API surface into user data.
- If a future MCP tool does trigger an LLM call on our backend, it should be credit-metered like any other AI action — the "free perk" framing only holds as long as MCP calls stay cheap for us.

## Localized pricing

Rather than one flat global USD price, maintain a **per-country pricing table** (similar to Spotify/Netflix-style localized pricing), where each region's price is set to be roughly equivalent in local purchasing power while accounting for local tax (GST/VAT) and payment-processing costs:

- India: ₹95/mo via UPI (near-zero processing fees through Razorpay).
- International: a higher price point via Stripe (card fees are ~2.9% + $0.30, which would eat a disproportionate share of a ~$1.13 charge) — or route through a merchant-of-record like Paddle/Lemon Squeezy, which also handles international tax compliance.
- Implementation: a `pricing_tiers` config keyed by country/currency code rather than a hardcoded price, so new regions can be added without touching core billing logic.

## Data model sketch

```
subscriptions        (user_id, plan[free|monthly|annual], status, current_period_end, provider_subscription_id, country_code)
pricing_tiers         (country_code, currency, monthly_price, annual_price)
wallets               (user_id, balance)
credit_transactions   (id, user_id, delta, balance_after, action_type[subscription_grant|topup|referral_bonus|chat_message|ats_check|mcp_call|auto_apply], metadata, created_at)
free_tier_usage        (user_id, period_key, chat_messages_used, ats_checks_used)   -- only needed for non-Pro users
```

- `credit_transactions` is an append-only ledger — gives an audit trail and a base for tuning credit costs from real usage/cost data later.
- Worth logging actual raw LLM token counts in transaction `metadata` — split into `prompt_tokens` and `completion_tokens` (not just total) since completion tokens cost more, and this split enables prompt optimization and margin analysis. Also log `model` and `agent` (`chat_agent` / `ats_agent`) for per-action cost attribution. See [docs/AGENTS_DESIGN.md](AGENTS_DESIGN.md) for the full metadata schema.
- `chatWithAi` and `analyzeAts` (used by `AiChatWidget.jsx` and `AtsPanel.jsx`) need a pre-check dependency: free users check/increment `free_tier_usage`; Pro users check/debit `wallets` via a `credit_transactions` insert.
- Frontend needs quota/paywall states: disable input + show an upgrade CTA when a quota-exceeded response comes back, and a resume-count gate + upgrade prompt in `MyResumesView.jsx`.

## Future roadmap (post v1)

1. **Job application tracker** — lowest engineering risk, high stickiness; extends `MyResumesView.jsx` into a recurring dashboard, which also multiplies ad-impression and upsell surface.
2. **Chrome extension** — assisted autofill first (fills job application forms, user reviews and clicks submit), not full automation. Job boards (LinkedIn Easy Apply, Greenhouse, Lever, Workday, iCIMS) each have different form structures, so start narrow and expand coverage.
3. **Auto-apply agent** — highest risk (job-board ToS violations, potential account bans, reputational risk from mismatched/low-quality applications at scale). Human-in-the-loop by default (agent drafts, user confirms send), priced per-submission in credits so the cost itself throttles spammy mass-applying.

## Open items / to revisit

- Exact free-tier quota numbers (messages/day, checks/day) once real LLM cost data exists.
- Exact credit-to-currency ratio and per-action credit costs, tuned from observed usage.
- Full list of supported countries/currencies in `pricing_tiers` and which payment provider serves each.
- Whether a referral program (invite a friend → both get bonus credits) should launch alongside v1 or later.
