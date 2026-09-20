# Blaze

**A modern marketplace storefront — everything, A to Z.**

Blaze is a rebuild of the core Amazon shopping experience, from browsing a catalog to placing an order and reading it back later. Built for the 8x assignment.

> **Demo only.** Catalog data comes from [DummyJSON](https://dummyjson.com). Prices are seeded demo values converted at a fixed rate of ₹85 = $1, **not live exchange rates**. No payment is ever taken and nothing ships.

| | |
|---|---|
| **Live URL** | [Blaze](https://blaze-aniket0742.vercel.app/) |
| **Demo login** | None seeded — sign up with any email. Email confirmation is off, so an account works immediately. |
| **Stack** | Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase Postgres · Drizzle ORM |
| **Catalog** | 24 categories · 194 products · 582 reviews |
| **Tests** | 72 unit · 28 integration (against a real database) |

---

## What this project demonstrates

- **A complete commercial flow**, not a catalog demo: browse → cart → account → checkout → order → history, with the edge cases handled rather than avoided.
- **Server-authoritative money.** Prices, stock and totals are computed on the server from the database on every request that needs them. The browser never sends a price.
- **Orders as immutable records.** An order stores what was bought at what was paid, and renders correctly even after the product is repriced, renamed or deleted.
- **Progressive enhancement.** Sign up, sign in, sign out, search, filtering and the entire two-step checkout work with JavaScript disabled.
- **Performance by architecture.** 218 catalog pages are prerendered at build time, and stay that way because session state is deliberately kept out of the root layout.
- **Decisions written down.** [DECISIONS.md](DECISIONS.md) records every significant design and engineering decision — what was chosen, why, and what was rejected — including the bugs testing surfaced and what they taught.

## Key features

**Browsing**
- Modular home page: deals module, promo tiles, category strip, top-rated rail, new arrivals, A–Z index
- Category pages at `/category/[slug]` — all 24 prerendered
- Product pages at `/product/[slug]` — all 194 prerendered, with gallery, specifications, and seeded read-only reviews with a rating histogram
- Concrete delivery dates on every card, computed from the product's shipping class

**Search**
- Search across title, description, brand, category and tags
- Category, price-range and minimum-rating filters; six sort orders; pagination
- Every filter lives in the URL, so results are shareable and the back button works

**Cart**
- Guest cart in an httpOnly cookie; signed-in cart in Postgres
- Per-line quantity controls, stock clamping, and out-of-stock lines that stay visible and stop counting toward the total
- Header badge hydrated client-side, so catalog pages stay prerendered

**Accounts**
- Email/password via Supabase Auth — Blaze never sees, hashes or stores a password
- Guest cart merges into the account cart on sign in *and* sign up
- `returnTo` validated against open redirects

**Checkout and orders**
- Address form with server-side validation, a demo payment step, and an explicit review before anything is placed
- Stock re-validated at checkout and again at submission
- Order history at `/orders` and order details at `/order/[orderNumber]`, both scoped to the signed-in account in SQL

## Core user journey

```
Home ──► Search / Category ──► Product ──► Add to cart ──► Cart
                                                             │
                                  ┌──────────────────────────┘
                                  ▼
                          Sign up / Sign in
                        (guest cart merges in)
                                  │
                                  ▼
              Checkout ──► Review ──► Demo payment ──► Order placed
                                                             │
                                  ┌──────────────────────────┘
                                  ▼
                    Order confirmation ──► Order details ──► Order history
```

A guest can browse, search and fill a cart with no account. Signing in at checkout carries that cart across rather than discarding it.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16, App Router | Server components and server actions keep cart, pricing and stock logic on the server where it has to live |
| Language | TypeScript (strict) | The schema doubles as the type source |
| Styling | Tailwind CSS v4 | Design tokens in `@theme`; light-only by design |
| Database | Supabase Postgres | Postgres and auth behind one service |
| ORM | Drizzle | SQL-shaped and TypeScript-native; migrations are plain reviewable SQL |
| Auth | Supabase Auth | Credential handling is the part of auth most likely to be got wrong |
| Tests | Node's built-in runner via `tsx` | No test-framework dependency |

No state library, no component library, no form library, no test framework. Every runtime dependency in `package.json` is one the app actually needs.

## Architecture

```
app/                     Routes (App Router)
  page.tsx               Home — prerendered
  category/[slug]/       24 pages, prerendered
  product/[slug]/        194 pages, prerendered
  search/                Dynamic
  cart/  checkout/       Dynamic, session-aware
  orders/  order/[n]/    Dynamic, authenticated
  api/session/           The only API route: { email, cartCount }
components/              Presentational, plus a few client islands
lib/
  <domain>.ts            Pure logic — no next/headers, no database
  <domain>-server.ts     Database reads
  actions/<domain>.ts    Server actions (writes)
  db/schema.ts           Drizzle schema, single source of truth
proxy.ts                 Session refresh + route guards (Next 16's middleware)
drizzle/                 Generated SQL migrations + snapshots
tests/                   *.test.ts (unit) · *.integration.ts (real database)
```

**Three conventions carry most of the weight:**

1. **Pure / server split.** Every domain has a pure module (`cart.ts`, `checkout.ts`, `orders.ts`) with no `next/headers` and no database import, so client components and unit tests can use it. Database access lives in the `-server.ts` sibling. A `"use server"` module may only export async functions, which is why constants and initial states live in the pure file.

2. **Writes are server actions; reads are server components.** There is exactly one API route, and it is a read — it exists so the header can know about your session without making every page dynamic.

3. **Prerendering is protected.** The root layout holds no session state. That single constraint is what keeps 218 catalog pages static, and several decisions exist to defend it.

## Data model

```
categories ──< products ──< product_reviews
                  │
                  ├──< cart_items          (user_id, product_id) composite PK
                  └──< order_items >── orders
```

| Table | Holds | Notes |
|---|---|---|
| `categories` | 24 rows | Slug is the primary key |
| `products` | 194 rows | DummyJSON's own id, so reseeding is stable |
| `product_reviews` | 582 rows | Seeded, read-only |
| `cart_items` | Signed-in carts | Composite PK enforces one row per product per user |
| `orders` | Placed orders | Order number, snapshotted address, payment method, status, totals |
| `order_items` | Order lines | **Snapshots** title, slug, brand, thumbnail, unit price, quantity |

**All money is integer paise**, never floats. DummyJSON supplies floats, and floating-point arithmetic on money produces rounding errors that surface in totals. Formatting to `₹1,499` happens only at the display layer.

**`order_items` is a snapshot, and this is load-bearing.** It stores its own copy of the product's title, image and unit price. `product_id` is a *nullable* reference that clears if the product is deleted. So a product bought for ₹42,500 still reads ₹42,500 after it rises to ₹50,000, and an order whose product has left the catalog still renders in full — it just stops linking out. Order pages never join `products`.

**No foreign key from `user_id` to `auth.users`.** Drizzle does not manage Supabase's `auth` schema, so deleting a user would orphan their cart and order rows.

## Authentication and the guest-cart merge

Supabase Auth owns credentials entirely — Blaze never implements, hashes or stores a password.

**One cart, two backends.** Guests keep a cart in an httpOnly cookie; signed-in shoppers keep it in `cart_items`. Both speak the same `CartLine[]`, so the cart page and every mutation are unchanged by the existence of accounts.

**The merge rule:** guest quantity **+** account quantity, per product, then capped at current stock and the ten-per-order limit. Items whose product has left the catalog are dropped, out-of-stock items are dropped, and the cookie is cleared **only after** the account cart is written — so a failed merge leaves the guest cart intact to retry, and signing in never fails because of a cart.

Summing rather than taking the larger of the two is deliberate: adding two of something on a phone and three on a laptop means you want five. An unwanted extra unit is visible in the cart and one click to fix; a quantity that quietly shrank is invisible until the order arrives wrong.

Protected routes (`/orders`, `/order`, `/checkout`) are guarded in `proxy.ts`, which returns a real 307 before anything renders, and checked again in the page.

## Search

Postgres `ILIKE` with a field-priority relevance score — title matches outrank brand, which outranks category, description and tags. No new indexes were added: at 194 rows the planner's sequential scan is faster than maintaining a GIN index, and pretending otherwise would be theatre.

Filtering, sorting and pagination are all URL state parsed by one function, so a filtered result set is a shareable link and the back button behaves. Everything except the sort dropdown works without JavaScript.

## Checkout and demo payment

**There are no card fields anywhere in Blaze.** The payment step offers two options — "Demo card" and "Cash on delivery" — and renders a styled rectangle that *looks* like a card. It is a picture, not a form. A field shaped like a card number will eventually receive a real card number, however loudly the page says demo; removing the field removes the whole class of problem. The order stores only which of the two was chosen.

**Nothing priced comes from the browser.** The form posts an address and a payment identifier. Every figure is computed server-side by `quoteCart()` from `products` and `cart_items`.

**Two steps, server-driven.** Submitting validates and returns a review step showing what will be bought, where it is going and what it costs. Only a second submit places the order. The step lives in the returned action state rather than in client state, so the whole flow works with JavaScript off.

**The order write is one transaction:** insert the order, insert its snapshotted lines, delete the cart. The cart empties only if the order exists.

**Order numbers** look like `BLZ-260920-K4M7X` — the date plus five characters from a 31-character alphabet with `0`, `1`, `I`, `L` and `O` removed, so they survive being read aloud. Uniqueness is enforced by a unique index, with a retry on collision.

## Local setup

**Prerequisites:** Node 20+ and a Supabase project.

```bash
npm install
cp .env.example .env.local    # then fill in the three values
npm run db:migrate            # create tables from drizzle/*.sql
npm run db:seed               # load the catalog (idempotent, safe to re-run)
npm run dev                   # http://localhost:3000
```

### Environment variables

Copy `.env.example` to `.env.local` and fill in the values from your Supabase project. `.env.local` is gitignored; `.env.example` holds placeholders only and no real values.

| Variable | Where it comes from | Notes |
|---|---|---|
| `DATABASE_URL` | Supabase → Connect → **Session pooler** (port 5432) | Needed at build time as well as runtime, because pages are prerendered from the database |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API | A public, browser-safe key — not a secret, but it still belongs in `.env.local` |

**Two Supabase dashboard settings are required** or sign-up cannot complete:
- Authentication → **Confirm email**: off
- Authentication → **Allow new users to sign up**: on

### Database and migrations

Schema changes go **`db:generate` → review the SQL → `db:migrate`**. There is deliberately no `db:push` script: mixing it with generated migrations is what desynchronised the migration ledger earlier in this project, and the recovery is written up in [DECISIONS.md](DECISIONS.md).

```bash
npm run db:generate    # generate a migration from lib/db/schema.ts
npm run db:migrate     # apply pending migrations
npm run db:seed        # (re)load the catalog from DummyJSON
```

## Testing

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # 72 unit tests — no database needed
npm run test:db     # 28 integration tests — needs DATABASE_URL
npm run build       # production build; also type-checks and prerenders
```

Unit tests cover the pure logic: cart cookie parsing, the merge rule, open-redirect safety, address validation, order-number generation and order routing. Integration tests run against the real catalog and a real database, covering cart persistence, the merge, checkout pricing, stock refusal, order writing, and that one account cannot read another's order. Tests clean up after themselves and leave no seeded catalog row modified.

## Deployment

Not currently deployed. It is built for Vercel:

1. Import the repository into Vercel.
2. Set `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Project Settings → Environment Variables. `DATABASE_URL` must be available at **build** time, since the catalog is prerendered.
3. Run `npm run db:migrate` and `npm run db:seed` against the target database once.
4. Deploy. `npm run build` is the build command; no other configuration is needed.

The database client uses `max: 1` connections per instance deliberately — Supabase's session pooler allows 15, and both the build (multiple workers) and production (many lambdas) open a client each.

## Improvements over Amazon

- **Delivery date on every card.** Amazon makes you open the product to find out when it arrives; Blaze computes a concrete date from the shipping class and shows it in listings.
- **One price, stated plainly.** No EMI tables, exchange offers, protection plans or business-pricing upsells competing with the actual price.
- **Honest stock.** "Only 3 left" instead of vague urgency.
- **An A–Z browse that works.** The A-to-Z principle rendered as a usable alphabetical index of real categories, including which letters are empty.
- **A product page that answers the question.** Delivery date, stock, returns and warranty sit beside the price, not spread across four collapsed panels.
- **A cart that tells the truth.** Out-of-stock items stay visible and stop counting toward the total instead of vanishing; quantities above stock are corrected with a reason.
- **Checkout that says why it can't proceed.** If something sold out, the page names the item and the number rather than failing at the last step.
- **No dark patterns.** No upsell interstitial, nothing pre-ticked, and one honest review screen before the order goes in.
- **Orders stay true.** An order page reads only what was saved at purchase, so a later price change, rename or delisting cannot alter what your receipt says.

## Intentional limitations

These are deliberate scope decisions, not oversights. Each is explained in [DECISIONS.md](DECISIONS.md).

| Limitation | Why |
|---|---|
| **Stock is validated but never decremented** | The catalog is shared demo data and 218 pages are prerendered with stock baked in. Decrementing would drain the demo and be undone by the next reseed. Two shoppers can each buy the last unit. |
| **No real payments** | By design. There are no card fields at all. |
| **Delivery is always free** | There is no shipping-cost model. |
| **Order status is always `placed`** | There is no fulfilment lifecycle to drive transitions. |
| **The header account menu needs JavaScript** | It is a client island so catalog pages stay prerendered. Without JavaScript the header falls back to a plain "Sign in" link, and sign-out lives on the `/signin` panel. |
| **Reviews are read-only** | Seeded from DummyJSON. Writing reviews is out of scope. |
| **No foreign key to `auth.users`** | Drizzle does not manage Supabase's `auth` schema. |
| **Light theme only** | No dark mode, by design — depth comes from a soft grey page behind white cards. |

**Out of scope for the whole project:** order cancellation, returns, refunds, reorder, wishlists, recommendations, profile and address management, seller tools, and Prime/video/music equivalents.

## Assignment notes

- **`.agent-logs/`** holds the complete, unedited prompt-and-response record of how this project was built, captured automatically by hooks in `.claude/`. [CAPTURE-TEST.md](CAPTURE-TEST.md) documents that mechanism.
- **[DECISIONS.md](DECISIONS.md)** is the design record: what was chosen, what was rejected, and the bugs that testing surfaced — an open-redirect vector, a redirect that silently overrode `returnTo`, and a migration chain that would have failed in a fresh environment.
- **`recon/`** holds reference screenshots of Amazon captured during research. Blaze deliberately shares none of Amazon's visual design, logo or naming — the A-to-Z idea is treated as a product principle, expressed in the wordmark and the browse index.
- The product is **Blaze** throughout. The Amazon name and visual identity are not used anywhere in the application.

## Project docs

| Document | Contents |
|---|---|
| [DECISIONS.md](DECISIONS.md) | Every design and engineering decision, with rejected alternatives |
| [CAPTURE-TEST.md](CAPTURE-TEST.md) | How the automatic agent-log capture works, and proof that it does |
| [CLAUDE.md](CLAUDE.md) | Working rules for the AI agent on this project |
