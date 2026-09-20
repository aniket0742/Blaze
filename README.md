# Blaze

A modern marketplace storefront — everything, A to Z. Built for the 8x assignment as a rebuild of Amazon's core shopping experience.

**Live:** _not deployed yet — pending Vercel connection_
**Demo login:** _not applicable yet — authentication arrives in a later milestone_

> Demo only. Catalog data comes from [DummyJSON](https://dummyjson.com). Prices are seeded demo values converted at a fixed rate of ₹85 = $1, **not live exchange rates**. Nothing here is for sale.

## What's built

**Milestone 1 — foundation, home, category listing**

- Catalog schema (categories, products, reviews) on Supabase Postgres via Drizzle
- Idempotent seed from DummyJSON: 24 categories, 194 products, 582 reviews
- Modular marketplace home page: a wide deals module, standalone promo tiles, an image-forward category strip, a top-rated rail, a new-arrivals grid, and an A–Z category index
- Category listing at `/category/[slug]`, sorted by rating — all 24 prerendered
- Loading skeletons, empty state, error boundary, and a real 404
- Responsive from 360px up; single light theme (no dark mode by design)

**Milestone 2 — search**

- Global header search across title, description, brand, category and tags
- `/search` with category, price-range and minimum-rating filters
- Sorting by relevance, price (both directions), rating, newest and discount
- Pagination, 24 per page
- Every filter lives in the URL, so results are shareable and the back button works
- Works without JavaScript apart from the sort dropdown

**Milestone 3 — product detail page**

- Product page at `/product/[slug]` — all 194 prerendered
- Image gallery with thumbnail selection
- Title, brand, rating, review count, price, MRP, discount, stock state
- Delivery date, returns and warranty shown beside the price, not buried
- Description, specifications, and the seeded read-only reviews with a rating histogram
- Quantity selector and Add to Cart, with an inline confirmation of what was added
- Loading skeleton, a real 404 for unknown slugs, and an error boundary

**Milestone 4 — cart**

- Cart at `/cart` — item list, per-line quantity controls, remove, subtotal, free delivery, arrival date and total
- Header cart badge, hydrated client-side so every catalog page stays prerendered
- Stale items dropped and quantities clamped to stock on the server, on both read and write
- Out-of-stock lines stay visible and excluded from the total until you remove them
- Empty-cart, loading and error states
- Unit tests for the cart cookie logic (`npm test`)

**Milestone 5 — accounts and cart merge**

- Email/password sign up, sign in and sign out via Supabase Auth (we never see or store a password)
- `/signin` and `/signup`, with an auth-aware header account menu
- Protected `/orders` placeholder, guarded in `proxy.ts` and again in the page
- Signed-in carts live in `cart_items`, so they follow you across sessions and devices
- Guest cart merges on sign in **and** sign up: quantities are summed, capped at stock, stale and out-of-stock items dropped, cookie cleared only after the write succeeds
- `returnTo` is validated against open redirects

## What's not built yet

Checkout and order history. `/orders` exists but is a placeholder, and the checkout button is deliberately disabled until there is a checkout to open.

Also not built: password reset, profile management, and social sign-in.

Deliberately out of scope for the whole project: seller tools, Prime/video/music, real payments, writing reviews, recommendations, and returns.

## Improvements over Amazon

- **Delivery date on every card.** Amazon makes you open the product to find out when it arrives. Blaze computes a concrete date from the product's shipping class and shows it in listings.
- **One price, stated plainly.** No EMI tables, exchange offers, protection plans, or business-pricing upsells competing with the actual price.
- **Stock is honest.** "Only 3 left" instead of vague urgency.
- **A–Z browse that works.** The A-to-Z principle rendered as a usable alphabetical index of real categories, including which letters are empty.
- **A product page that answers the question.** Delivery date, stock, returns and warranty sit beside the price, where the decision actually gets made — not spread across four collapsed panels further down.
- **A cart that tells you the truth.** Out-of-stock items stay visible and stop counting toward your total instead of vanishing; quantities above stock are corrected with a reason, not silently.
- **Your cart survives signing in.** Items added as a guest are added to your account cart rather than replacing it or being thrown away.
- **Mobile-first layout** rather than a desktop grid squeezed down.

## Local setup

```bash
npm install
cp .env.example .env.local     # then fill in DATABASE_URL
npm run db:push                # create tables
npm run db:seed                # load the catalog (safe to re-run)
npm run dev
```

`DATABASE_URL` is a Supabase **Session pooler** connection string (port 5432). It is required at build time as well as at runtime, because pages are prerendered from the database.

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` come from Project Settings → API. In the Supabase dashboard, **Confirm email** must be off and **Allow new users to sign up** on, or sign-up cannot complete.

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build (prerenders all pages — needs `DATABASE_URL`) |
| `npm run lint` | ESLint |
| `npm test` | Unit tests — cart cookie, merge rule, redirect safety |
| `npm run test:db` | Integration tests against the real catalog (needs `DATABASE_URL`) |
| `npm run db:generate` | Generate SQL migration from the schema |
| `npm run db:push` | Apply the schema to the database |
| `npm run db:seed` | Seed the catalog from DummyJSON |

## Project docs

- [DECISIONS.md](DECISIONS.md) — what we chose, why, and what we rejected
- [CAPTURE-TEST.md](CAPTURE-TEST.md) — proof of the automatic prompt/response capture
- [CLAUDE.md](CLAUDE.md) — working rules for the AI agent on this project
