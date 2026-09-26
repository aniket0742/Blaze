```text
 ____    _          _      _____  _____
| __ )  | |        / \    |__  / | ____|
|  _ \  | |       / _ \     / /  |  _|
| |_) | | |___   / ___ \   / /_  | |___
|____/  |_____| /_/   \_\ /____| |_____|
```

**Real products at real shelf prices. Everything, A to Z.**

[![Live demo](https://img.shields.io/badge/live_demo-blaze--aniket0742.vercel.app-d4481c?style=flat-square)](https://blaze-aniket0742.vercel.app/) [![Tests](https://img.shields.io/badge/tests-108_unit_%2B_27_integration-2ea44f?style=flat-square)](#-testing) [![Data](https://img.shields.io/badge/data-Open_Food_Facts_%2B_Open_Prices-f08c00?style=flat-square)](#-data-sources-and-licences)

![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript&logoColor=white) ![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white) ![Supabase](https://img.shields.io/badge/Supabase-Postgres_%2B_Auth-3ecf8e?style=flat-square&logo=supabase&logoColor=white) ![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-c5f74f?style=flat-square&logo=drizzle&logoColor=black)

A complete shopping flow on real data: browse a real catalog, fill a bag, create an account, check out, and read the order back later. Built for the 8x assignment.

| | |
|---|---|
| **Live demo** | [blaze-aniket0742.vercel.app](https://blaze-aniket0742.vercel.app/) · [GitHub](https://github.com/aniket0742/Blaze) |
| **Demo login** | None seeded — sign up with any email. Email confirmation is off, so an account works immediately. |
| **Catalog** | 265 real products in 17 aisles, from [Open Food Facts](https://world.openfoodfacts.org), priced from [Open Prices](https://prices.openfoodfacts.org) |

> **Real data, demo store.** Every product is a real Indian product from Open Food Facts, priced in rupees from a real shop observation on Open Prices — nothing is mocked or invented. No payment is ever taken and nothing ships.

## 🧭 Overview

- **Real catalog, real prices** — products, images, ingredients and nutrition from Open Food Facts; shelf prices photographed in real shops and recorded on Open Prices. A field the sources don't provide is left empty, never guessed.
- **Server-authoritative money** — prices and totals are recomputed on the server from the database. The browser never sends a price.
- **Orders are immutable snapshots** — an order stores what was bought at what was paid, and still renders after a product is repriced, renamed or deleted.
- **Progressive enhancement** — sign up, sign in, sign out, search, filters and the two-step checkout all work without JavaScript.
- **Prerendered catalog** — every aisle and product page is static, because session state stays out of the root layout.

## 🛍️ Key features

- **Browse** — an editorial home page with numbered sections: Price watch (real discounts below MRP), Most scanned, the aisles A to Z, and new arrivals.
- **Product pages** — the full Nutri-Score scale, the shelf price with the date it was seen, ingredients, allergens, a nutrition label per 100 g or 100 ml, and NOVA group.
- **Search** — across title, description, brand, category and labels, with aisle, price and Nutri-Score filters, seven sort orders and pagination. Every filter lives in the URL, so results are shareable and Back works.
- **Bag** (the cart) — a guest bag in an httpOnly cookie, a signed-in bag in Postgres, ten per line. Products that leave the catalog are dropped with a notice.
- **Accounts** — email and password via Supabase Auth. The guest bag merges into the account on sign in and sign up; `returnTo` is validated against open redirects.
- **Checkout and orders** — a validated address, demo payment and an explicit review step; availability is re-checked at checkout and again at submission. History at `/orders`, details at `/order/[orderNumber]`.

## 🎨 Design

Blaze has its own interface, not a marketplace template — the reasoning is in [DECISIONS.md](DECISIONS.md).

- **Identity** — warm paper, ink and a single vermilion accent; Fraunces headings over Geist; numbered editorial sections instead of rails and banners.
- **Money on a receipt** — the bag, checkout, confirmation and orders share one torn-edge receipt, with every price in a monospaced column.
- **Only real data** — no stars, reviews, stock counts or delivery promises.
- **Accessible** — text and control colours measured against WCAG AA; built for 360px and up.

## 🗺️ Core user journey

`Home → Search / Aisle → Product → Add to bag → Bag → Sign up / Sign in (bag merges) → Checkout → Review → Demo payment → Confirmation → Order details → Order history`

A guest can browse, search and fill a bag with no account; signing in at checkout carries that bag across.

## 🧱 Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16, App Router (server components + server actions) |
| Language | TypeScript, strict |
| Styling | Tailwind CSS v4, light theme only; Fraunces and Geist via `next/font` |
| Database · ORM | Supabase Postgres · Drizzle, with plain, reviewable SQL migrations |
| Auth | Supabase Auth |
| Catalog data | Open Food Facts API (v3) and Open Prices API |
| Tests | Node's built-in test runner via `tsx` |

No state library, component library, form library or test framework — every runtime dependency is one the app actually needs.

## 🏗️ Architecture

```
app/          Routes. Catalog pages prerendered; cart, checkout and orders dynamic.
              api/session is the only API route — a read of { email, cartCount }.
components/   Presentational, plus a few client islands.
lib/
  <domain>.ts         Pure logic — no next/headers, no database
  <domain>-server.ts  Database reads
  actions/            Server actions (writes)
  db/schema.ts        Drizzle schema, single source of truth
scripts/      The catalog import: seed.ts (network + database), catalog-source.ts (pure mapping)
proxy.ts      Session refresh + route guards (Next 16's middleware)
drizzle/      Generated SQL migrations
tests/        *.test.ts (unit) · *.integration.ts (real database)
```

- Each domain splits into a pure module and a server module, so client components and unit tests import the logic without the database.
- Writes go through server actions; reads go through server components.
- The APIs are called by the import, never per page view: Open Food Facts allows 15 product reads a minute, so the catalog is imported into Postgres and served from there.

## 🗄️ Data and auth

| Table | Holds |
|---|---|
| `categories` | 17 aisles — real Open Food Facts category tags, with the taxonomy's own names |
| `products` | 265 products keyed by barcode: title, brand, pack size, images, Nutri-Score, NOVA group, labels, allergens, ingredients, nutrition, scan count, and the latest shelf price and MRP with the date seen |
| `cart_items` | Signed-in carts, one row per product per user |
| `orders` | Order number, snapshotted address, payment method, status, totals |
| `order_items` | Line snapshots: title, slug, brand, thumbnail, unit price, quantity |

- **Money** is stored as integer paise, never floats, and shown with its paise exactly as recorded.
- **Credentials** belong to Supabase Auth — Blaze never sees, hashes or stores a password.
- **Merging** — on sign in, quantities are summed and capped at the per-line limit; the cookie is cleared only after the account cart is written.
- **Access** — protected routes are guarded in `proxy.ts` and again in the page, and every order read is scoped to the signed-in user in SQL.

## 💳 Checkout and demo payment

**There are no card fields anywhere in Blaze.** The payment step offers "Demo card" or "Cash on delivery" with a card-shaped graphic — a picture, not a form. The order records only which option was chosen.

The form posts an address and a payment identifier; every figure is computed on the server. The first submit shows a review step and only the second places the order. Writing the order and clearing the cart share one transaction, so the cart empties only if the order exists. Order numbers look like `BLZ-260920-K4M7X`.

## ⚙️ Local setup

Requires Node 20+ and a Supabase project.

```bash
npm install
cp .env.example .env.local    # fill in the four values
npm run db:migrate            # create tables
npm run db:seed               # import the catalog — about 35 minutes the first time
npm run dev                   # http://localhost:3000
```

The import reads Open Food Facts at a polite pace and caches each product, so it resumes if interrupted and a re-run takes seconds. `npm run db:seed -- --dry-run` fetches and reports without writing.

### Environment variables

| Variable | Source |
|---|---|
| `DATABASE_URL` | Supabase → Connect → **Session pooler** (port 5432). Needed at build time too — pages are prerendered from the database. |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API — public and browser-safe, but still not committed |
| `OFF_USER_AGENT` | `Blaze/1.0 (you@example.com)` — both APIs ask clients to identify themselves. Used only by the import, never sent to a browser. |

`.env.example` holds placeholders only; `.env.local` is gitignored. In Supabase, set **Confirm email** off and **Allow new users to sign up** on, or sign-up cannot complete.

### Migrations

Schema changes go `npm run db:generate` → review the SQL → `npm run db:migrate`. There is deliberately no `db:push`: mixing it with generated migrations once desynchronised the migration ledger (see [DECISIONS.md](DECISIONS.md)).

## 🧪 Testing

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # 108 unit tests, no database or network needed
npm run test:db     # 27 integration tests, needs DATABASE_URL and an imported catalog
npm run build       # production build; type-checks and prerenders
```

- **Unit** — the import's rules (which prices are trusted, which products get in, what is left null), price formatting, Nutri-Score filtering, the cart cookie, the merge rule, open-redirect safety, address validation and order numbers.
- **Integration** — against a real database: cart persistence, checkout pricing and refusal, order writing, snapshots surviving a deleted product, and that one account cannot read another's order.

## 🚀 Deployment

Deployed on Vercel at **[blaze-aniket0742.vercel.app](https://blaze-aniket0742.vercel.app/)**.

Set `DATABASE_URL` and the two Supabase variables in Project Settings; `DATABASE_URL` must be available at build time. Run `db:migrate` and `db:seed` against the target database, then redeploy — pages are built from the database, so a re-imported catalog needs a new build. `OFF_USER_AGENT` is only needed wherever the import runs.

## 🚧 Intentional limitations

Scope decisions, not oversights — each is explained in [DECISIONS.md](DECISIONS.md).

| Limitation | Why |
|---|---|
| No stock counts | Neither source records stock. A product with a real current price is available, up to ten per line. |
| Prices are the latest observation | Open Prices records what shoppers saw and when; each product page shows the date. |
| The catalog is as large as the data | Only products with a real rupee price, name, image and category are included. |
| No ratings, reviews or delivery dates | No source has them. Nutri-Score and scan counts are shown instead. |
| No real payments | By design — there are no card fields at all. |
| Free delivery, status always `placed` | There is no shipping-cost model or fulfilment lifecycle. |
| The header account menu needs JavaScript | It's a client island, so catalog pages stay prerendered. Without JS there is a "Sign in" link, and sign-out lives on `/signin`. |
| Light theme only | No dark mode, by design. |

**Out of scope:** cancellation, returns, refunds, reorder, wishlists, recommendations, profile and address management, and seller tools.

## 📜 Data sources and licences

Product information and images come from **[Open Food Facts](https://world.openfoodfacts.org)**; prices from **[Open Prices](https://prices.openfoodfacts.org)**. Both databases are available under the [Open Database License](https://opendatacommons.org/licenses/odbl/1-0/), and product images under Creative Commons Attribution-ShareAlike. As the Open Food Facts terms require, the site footer names both sources and licences, and every product page links to that product's own entries. The data is provided as-is.

## 📝 Assignment notes

- **[DECISIONS.md](DECISIONS.md)** — the design record: what was chosen, what was rejected, and the bugs testing surfaced, including an open-redirect vector and a migration chain that would have failed in a fresh environment.
- **[CAPTURE-TEST.md](CAPTURE-TEST.md)** — how the automatic agent-log capture works, and proof that it does.
- **`.agent-logs/`** — the complete, unedited prompt-and-response record of the build, captured by hooks in `.claude/`.
- The product is **Blaze** throughout, with an original interface; Amazon's name, layouts and visual identity are not used anywhere in the application.
