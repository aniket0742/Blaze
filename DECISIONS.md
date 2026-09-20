# Decisions

Design and engineering decisions for Blaze, newest section last. Each entry says what we chose, why, and what we rejected.

---

## 2026-09-20 — Stack

**Chosen:** Next.js (App Router) + TypeScript, Tailwind, Supabase Postgres, Drizzle ORM, deployed on Vercel. Catalog seeded from DummyJSON.

**Why:** Next.js on Vercel gets a real URL up within the first milestone, which the brief asks for explicitly. Everything else follows from that.

---

## 2026-09-20 — Supabase for database and auth

**Chosen:** Supabase for both Postgres and authentication (email + password).

**Why:** Sign-in and order history need an auth system, and none was named in the brief's stack. Supabase gives us Postgres and auth behind one service and one set of environment variables, which is the smallest amount of new surface area for a 24-hour build.

**Rejected:**
- *Auth.js (NextAuth) on Neon* — an additional dependency with non-trivial App Router configuration, for no gain over what Supabase already bundles.
- *Hand-rolled sessions on Neon* — roughly 150 lines of security-sensitive code (password hashing, session tokens, cookie handling). Not worth writing under time pressure when a maintained implementation exists.

---

## 2026-09-20 — Drizzle ORM

**Chosen:** Drizzle for schema definition, migrations, and queries.

**Why:** TypeScript-native and SQL-shaped, so the schema doubles as the type source and queries stay readable in review. Migrations are plain SQL files. It matches the brief's preference for short, reviewable code over clever abstractions.

**Rejected:**
- *Prisma* — heavier, a separate schema language, and a generated client that adds cold-start cost on Vercel.
- *Raw SQL via postgres.js* — maximum transparency, but hand-written types across ~10 tables cost time we would rather spend on the shopping experience.

---

## 2026-09-20 — Catalog priced in INR, converted once at seed time

**Chosen:** DummyJSON's USD-style prices are converted to INR by a **fixed rate applied once during seeding**, and the resulting INR value is stored as the product's price. No conversion happens per request.

**Why:** The recon is amazon.in and the product is presented in rupees, but DummyJSON ships small USD-style floats such as `9.99`. Converting at seed time keeps every read path free of currency logic and keeps prices stable across requests.

**Important:** The catalog uses **seeded demo pricing, not live exchange rates.** The rate is a fixed constant in the seed script, chosen to make prices look plausible. It is not fetched, not current, and must not be presented as a real conversion. This is stated in the README as well.

**Rejected:**
- *Keep USD as-is* — honest to the source data, but diverges from the recon and the intended market.
- *Convert per request* — adds currency logic to every read path and makes prices depend on when a page was rendered, for no benefit in a demo.
- *Display raw DummyJSON numbers with a ₹ symbol* — ₹9.99 for mascara reads as obviously broken.

---

## 2026-09-20 — Money stored as integer minor units

**Chosen:** All monetary values are stored as integer paise (`price_cents`, `total_cents`, and so on), never as floats.

**Why:** DummyJSON supplies floats, and floating-point arithmetic on money produces rounding errors that surface in cart totals and tax lines. Integers make the arithmetic exact. Formatting to `₹1,499` happens only at the display layer.

---

## 2026-09-20 — Order line items are snapshots

**Chosen:** `order_items` stores its own copy of the product title, thumbnail, and unit price at the time of purchase, alongside the product id.

**Why:** Order history has to stay truthful. If the catalog is reseeded or a price changes, a past order must still show what was actually bought at what was actually paid. The product id is kept only so the order can link back to a live product page.

---

## 2026-09-20 — Mutations use server actions, not API routes

**Chosen:** Cart changes, checkout, and auth mutations go through server actions rather than `/api/*` route handlers.

**Why:** Less boilerplate than hand-written routes plus client fetch code, and it keeps cart and stock logic on the server where it has to live anyway.

---

## 2026-09-20 — Product reviews are seeded and read-only

**Chosen:** The product page renders the rating histogram and review list from DummyJSON's three seeded reviews per product. There is no path to write a review.

**Why:** Writing reviews is explicitly out of scope, but the data ships with the catalog, and the product page looks thin without it. Displaying it costs almost nothing.

---

## 2026-09-20 — Supabase Auth owns credentials; we never store passwords

**Chosen:** Authentication is handled entirely by Supabase Auth. We do not implement, hash, or store passwords or password hashes. Application-side user and profile rows reference the Supabase Auth user id (a UUID) as a foreign key.

**Why:** Credential handling is the part of auth most likely to be got wrong, and there is no reason to own that risk when the chosen service already does it. Keeping our tables keyed to the auth user id means profile, address, cart, and order data can all hang off a single stable identifier.

**Consequence:** The `users` table sketched during planning is replaced by a `profiles`-style table with no `password_hash` column. This lands in the auth milestone, not now.

---

## 2026-09-20 — Guest cart merges by summing quantities, capped at stock

**Chosen:** When a guest signs in, the two carts are unioned by product and quantities are **summed**, with the result capped at the product's available stock.

**Why:** Items a guest added represent real intent to buy. Summing preserves that intent rather than discarding it, and the stock cap keeps the result orderable.

**Rejected:** *Taking `max(guest_qty, user_qty)`* — safer against accidental double-counting, but it silently drops items the shopper deliberately added in one of the two sessions. Losing intent is the worse failure.

---

## 2026-09-20 — DummyJSON's `minimumOrderQuantity` is ignored

**Chosen:** The field is not imported and not enforced. Every product can be bought in a quantity of one.

**Why:** The values are not realistic retail data — the first product in the catalog has a minimum order quantity of 48. Honoring it would mean a shopper could not buy a single mascara, which breaks the core shopping loop the brief asks us to get right. It is an artifact of the sample dataset, not a product requirement.

---

## 2026-09-20 — "A-to-Z" is a browse affordance, not a logo treatment

**Chosen:** Blaze expresses the A-to-Z marketplace principle as a **functional A–Z category browser**: an alphabetical index of the catalog's categories on the home page, built in Blaze's own visual language.

**Why:** The brief asks for the breadth principle, explicitly not Amazon's branding. An alphabetical index communicates "we carry everything" by actually helping people browse, which is more useful than a graphic. With 24 categories it is genuinely navigable rather than decorative.

**Rejected:** *An arrow or smile mark echoing Amazon's logo* — copies the visual identity we were told to avoid, and does nothing for the user.

---

## 2026-09-20 — Product cards stay information-rich

**Chosen:** Listing cards carry price, rating, delivery estimate, and an Add to Cart control.

**Why:** The goal is less clutter, not less information. The recon's listing cards are the strongest part of Amazon's experience — the noise is concentrated on the product detail page (protection plans, exchange offers, EMI tables, business upsells). Stripping useful decision-making information off cards in the name of minimalism would make the product worse, not better.

**Note:** Add to Cart is not on the card in Milestone 1, because no cart exists yet. It arrives with the cart milestone rather than shipping as a dead control.

---

## 2026-09-20 — One database connection per client (`max: 1`)

**Chosen:** The postgres.js client is created with `max: 1`.

**Why:** Found by a build failure, not by theory. Supabase's session pooler allows 15 clients; `next build` runs 6 workers that each open their own pool, and the default pool size of 10 exhausted the limit immediately (`EMAXCONNSESSION`). One connection per client keeps builds and Vercel's many short-lived lambdas well inside the budget, and a serverless function only serves one request at a time regardless.

---

## 2026-09-20 — Category pages are prerendered, unknown slugs are hard 404s

**Chosen:** `/category/[slug]` uses `generateStaticParams` over all 24 categories with `dynamicParams = false`.

**Why:** Prerendering avoids a database round trip on every category view. `dynamicParams = false` was needed for correctness: with dynamic params enabled, an unknown slug rendered the not-found page but returned **HTTP 200**, which is wrong for crawlers and caches. Disabling them produces a real 404.

**Trade-offs, accepted:** a newly seeded category needs a rebuild before it is reachable, and Next logs an internal `NoFallbackError` for each unknown-slug request even though the 404 returned is correct.

**Consequence:** `DATABASE_URL` must be present at **build** time, not only at runtime.

---

## 2026-09-20 — Marketplace density over editorial layout

**Chosen:** The home page leads with product and category content rather than a hero. A two-row header (wordmark, search, account/cart) sits above a category nav row; the oversized hero is replaced by a single-line heading with the 24-category grid directly beneath, followed by three horizontally scrolling product rails and the A–Z index.

**Why:** On review, the first version read as a DTC marketing landing page — a `text-6xl` headline and two CTAs consumed the first screen before a single product appeared. A marketplace has to make discovery the primary act. Section padding dropped from `py-10`/`py-20` to `py-5`, and cards tightened without losing any information.

**Rejected:** *Keeping a reduced hero banner* — even a small hero competes with the category grid for the most valuable space on the page.

---

## 2026-09-20 — Modular home page: sections differ in weight and layout

**Chosen:** The home page is a set of modules with deliberately different shapes rather than a stack of identical rails:

| Module | Treatment |
|---|---|
| Deals delivered fast | Wide tinted block, 2×2 image-first tiles, spans half the row |
| Biggest saving today | Narrow standalone promo card for a single product |
| A–Z promo | Narrow saturated brand tile — the one bold colour field on the page |
| Shop across categories | Image-forward horizontal strip, no card frame |
| Top rated | Horizontal rail inside a white module card |
| New arrivals | Plain six-column grid on the page background |
| Browse A–Z | Alphabetical index inside a white module card |

**Why:** Uniform rails read as a template. Varying width, background, and card size creates the merchandising hierarchy a marketplace needs, and gives product imagery more room in the modules that matter.

**Restraint:** only the A–Z tile uses a saturated brand fill. Elsewhere orange is confined to discount badges, links, and one tinted module background, so the accent stays selective.

---

## 2026-09-20 — Light-only. No dark theme, no theme switching.

**Chosen:** Blaze ships a single light theme. The dark palette and every `dark:` variant were removed outright, not merely deprioritised.

**Why:** Superseded an earlier round where light was the default and dark an OS-driven alternative. Maintaining two themes costs review effort on every component for a demo where nobody will see the second one. One theme, designed properly.

**How depth works instead of inversion:** a soft grey page (`#f5f6f8`) sits behind white cards with restrained shadows (`--shadow-card`, `--shadow-lift`). The design was reworked for light rather than inverted from the dark version.

**Also:** `brand-600` is the tone for text and fills rather than `brand-500`, which does not clear 4.5:1 contrast on white.

---

## 2026-09-20 — Upsert must reference `excluded`

**Chosen:** The seed's `onConflictDoUpdate` sets each column from `sql\`excluded.<column>\``.

**Why:** Recording this because the first version was wrong and the test that should have caught it did not. Writing `set: { title: products.title }` compiles and runs, but generates `SET title = products.title` — assigning each column to its own existing value, so conflicting rows were never updated. Row counts stayed identical either way, so the idempotency check passed for the wrong reason. It only surfaced when a newly added column stayed at its default after a reseed.

**Lesson applied:** verify a reseed by checking that *values* changed, not that counts matched.
