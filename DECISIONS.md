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

## 2026-09-20 — Search: ILIKE with a field-priority relevance score

**Chosen:** Search matches `title`, `description`, `brand`, `category_slug` and `tags` with `ILIKE`. Relevance is a `CASE` expression scoring a title prefix match above a title substring, then brand, then category, then description-only, breaking ties on rating.

**Why:** The catalog is 194 rows in a 456 kB table. A representative filtered, sorted query plans and executes in **0.73 ms**. Postgres full-text search with a `tsvector` column, or trigram indexes via `pg_trgm`, would add an extension, a generated column and index maintenance to solve a problem this catalog does not have.

**Rejected:**
- *`tsvector` full-text search* — better stemming and ranking, but real setup cost for no measurable gain at this size. This is the first thing to revisit if the catalog grows by an order of magnitude.
- *Trigram indexes* — requires enabling `pg_trgm` on the Supabase instance; unjustifiable for 456 kB.

**Wildcards are escaped.** `%` and `_` in a shopper's query are escaped to literals, so searching for `%` finds products containing a percent sign rather than matching everything.

---

## 2026-09-20 — No new indexes for search

**Chosen:** No indexes were added for Milestone 2.

**Why:** Measured rather than assumed. `EXPLAIN ANALYZE` on a text + rating + sort query shows the planner already using `products_rating_idx` via a bitmap index scan, with the whole table resident in 28 shared buffers. The existing indexes on `category_slug`, `rating` and `created_at` cover every filter and sort the UI offers.

**Rejected:** *An index on `price_paise`* — price sorting is a quicksort over at most a few hundred rows that are already in memory. The index would cost writes on every reseed and save nothing.

---

## 2026-09-20 — Filtering works without JavaScript

**Chosen:** Category and rating filters are links, the price range is a GET form carrying the other filters as hidden fields, and the mobile filter panel is a native `<details>` disclosure. Only the sort dropdown is a client component.

**Why:** Every filter state is a real URL, so results are shareable and the browser's back button behaves correctly — both explicit requirements. It also keeps almost the whole results page as server components, with one small client island.

**Known limitation:** the header search box does not pre-fill with the current query on `/search`.

---

## 2026-09-20 — One seeded product renamed away from the Amazon name

**Chosen:** DummyJSON product 99 — titled "Amazon Echo Plus", brand "Amazon", with a description naming Alexa — is renamed at seed time to **"Smart Speaker with Voice Assistant"**, brand **"Blaze Audio"**, with a description that drops both trademarks. Its price, rating, stock, SKU, tags, reviews and imagery are untouched.

**Why:** The brief forbids using the Amazon name. It surfaced as the top result for `sort=rating`, so it was the first product a reviewer would see.

**Where:** a `RENAMED` map in `scripts/seed.ts`, not a manual `UPDATE`. A database edit would be silently reverted by the next reseed.

**Residual references, both outside anything a shopper reads:**
- The CDN image path is still `…/mobile-accessories/amazon-echo-plus/thumbnail.webp`. It appears in the `src` attribute and the RSC payload. Removing it means self-hosting or proxying that image; not done.
- The source SKU is `MOB-AMA-AMA-099`, an abbreviation carried over from the original brand. Kept, since the instruction was to preserve the product's other data. Nothing displays the SKU today.

Verified: zero occurrences of "Amazon" or "Alexa" in the visible text of the home page, search results and the product's own category page. Reading the query there needs `useSearchParams`, which would make the header a client component and force a Suspense fallback into the statically prerendered home and category pages — a visible loading placeholder on the most important pages. Not worth it for a pre-filled input.

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

---

## 2026-09-20 — Product pages are prerendered, so the page never reads the cart

**Chosen:** `/product/[slug]` uses `generateStaticParams` over all 194 products with `dynamicParams = false`, matching the category pages. The page renders no cart state at all: the Add to Cart control is a client component, and the **server action returns the resulting line and cart quantities**, which is what the confirmation displays.

**Why:** Reading the cart cookie during render would call `cookies()` and make the route dynamic, losing the prerendering. Returning the quantities from the mutation gives the shopper the same feedback without the page ever needing request-time state.

**Consequence, accepted:** on first load the page cannot show "you already have 2 of these in your cart". It only reports what just happened. The cart milestone can revisit this when there is a cart page to link to.

---

## 2026-09-20 — Milestone 3 ships a cookie-backed guest cart, not a cart feature

**Chosen:** Add to Cart writes an httpOnly `blaze_cart` cookie through a single server action in `lib/actions/cart.ts`. The cookie holds `[{ i: productId, q: quantity }]`. There is no cart page, no cart table, and no header badge.

**Why:** It is the smallest thing that is not throwaway. It satisfies the two decisions already recorded — mutations go through server actions, and a guest cart exists before sign-in so it can be merged on login — so the cart milestone extends this rather than replacing it.

**Cookie attributes:** `httpOnly`, `sameSite=lax`, `path=/`, `secure` in production only (so local HTTP development works), `max-age` 30 days.

**The cookie is never trusted.** It is re-parsed on every write: non-array or unparseable JSON becomes an empty cart, and lines are dropped unless `i` and `q` are integers with `0 < q <= 10`. The cart is capped at 50 lines. Product existence, stock, and the per-line quantity are re-checked against the database inside the action, so the quantity selector in the browser is a convenience, not a control.

**Rejected:** *A localStorage cart* — simpler to write, but it contradicts the server-action decision and would be discarded in the cart milestone.

---

## 2026-09-20 — The header cart icon stays disabled through Milestone 3

**Chosen:** No cart badge or count in the header yet. Feedback after adding lives on the product page itself.

**Why:** The header is in the root layout, so reading the cart cookie there would make **every** page dynamic — undoing the prerendering of the home page and all 24 category pages. That is a real cost for a badge that has nowhere to link to until `/cart` exists.

---

## 2026-09-20 — Ten units per line, and `minimumOrderQuantity` stays ignored

**Chosen:** The quantity selector offers `min(stock, 10)`. The server clamps to the same bound.

**Why:** Amazon caps its selector at 30. Ten is more than enough for a demo catalog and keeps the native select short enough to use on a phone. Consistent with the earlier decision to ignore DummyJSON's unrealistic `minimumOrderQuantity`.

---

## 2026-09-20 — SKU is not displayed on the product page

**Chosen:** The specifications table shows brand, category, dimensions, weight, warranty, returns and shipping. It deliberately omits the SKU.

**Why:** An earlier entry accepted the residual `MOB-AMA-AMA-099` SKU on the grounds that **nothing displays it**. A specifications table is exactly where that assumption would break, putting a source-brand abbreviation in front of a shopper. The SKU is not decision-making information anyway.

---

## 2026-09-20 — The header badge hydrates client-side, so catalog pages stay prerendered

**Chosen:** A `CartCountProvider` client component wraps the app in the root layout. It fetches `GET /api/cart/count` once on mount, and every cart mutation returns the new total so the badge updates without a second round trip.

**Why:** The header lives in the root layout. Reading the cart cookie there would call `cookies()` during layout render and turn **all 219 prerendered pages dynamic** — the home page, 24 category pages and 194 product pages. The badge is the only thing on those pages that needs request-time state, so it is the only thing that goes to the client. Verified: after this change `/` is still `○ Static` and the catalog is still `●` SSG.

**Why a route handler and not a server action:** the existing decision routes *mutations* through server actions. This is a read, so a `GET` handler is the honest HTTP verb and can carry `Cache-Control: no-store`. It is the only `/api/*` route in the project.

**Rejected:**
- *`cacheComponents` (Next 16's PPR successor)* — the correct framework answer, and it would let a dynamic badge sit inside a static shell. But it changes caching semantics for every route and needs `"use cache"` annotations throughout. Far too large a change to make inside a cart milestone.
- *Reading the cookie in the layout* — one line, and it costs the prerendering of the entire catalog.
- *Making the cookie readable by JavaScript* — would let the badge read it synchronously with no fetch, but it means dropping `httpOnly`, which we deliberately set.

**Consequence, accepted:** the badge is absent for one paint on a cold load, then appears. It renders nothing rather than a zero, so the gap reads as "no badge yet" rather than "empty cart".

---

## 2026-09-20 — The badge counts what is in the cart; the subtotal counts what is orderable

**Chosen:** The header badge is the sum of cookie quantities and needs no database. The cart page's "Subtotal (N items)" counts only orderable units, excluding out-of-stock lines.

**Why:** The badge must be cheap — it is fetched on every cold page load, and joining the catalog for a number in the corner of the header is not worth a query. The subtotal has to be truthful about what can actually be bought.

**Consequence:** with an out-of-stock item in the cart the two numbers differ. The cart page explains the difference on the line itself, which is where a shopper would ask the question.

---

## 2026-09-20 — Cart reconciliation: stale lines are dropped, out-of-stock lines are kept

**Chosen:** Every mutation reconciles the cookie against the catalog. A line whose product has left the catalog is **dropped**. A line whose product is out of stock is **kept** at its quantity, shown as unavailable, and excluded from the total until the shopper removes it.

**Why:** Found by testing, not by design. The first version dropped out-of-stock lines too, which meant changing the quantity of an unrelated item silently deleted them — while the page was telling the shopper "remove it to check out". Silent deletion of something the shopper is being asked to act on is the wrong failure. A product that no longer exists is different: there is nothing to render and nothing to decide.

**Where rendering and writing differ:** a React render cannot set cookies, so `getCartView` reconciles for **display only** and the cookie is corrected by the next mutation, which reconciles again. Both paths apply the same `clampQuantity` rule, so they cannot disagree about what is orderable.

---

## 2026-09-20 — Cart tests run on Node's built-in runner, with no test dependency

**Chosen:** `npm test` runs `tsx --test tests/*.test.ts`, using Node 22's built-in test runner through the `tsx` dev dependency the seed script already needs.

**Why:** The brief asked for cart tests, and adding a test framework is a dependency decision that was not ours to make unilaterally. Node ships a runner; `tsx` is already installed. Zero new packages.

**What is covered:** the pure logic that decides what a cookie is allowed to mean — `parseCart`, `cartQuantity` and `clampQuantity` — across malformed JSON, non-array payloads, non-integer ids and quantities, negative and over-limit quantities, line caps, and non-finite input. Fourteen cases.

**What is not, and why:** the server actions need a live database and a request context. They are exercised against the production build over HTTP instead, the same way the product page was. A DB-backed integration suite is the obvious next step if this grows.

---

## 2026-09-20 — Checkout renders as a disabled CTA

**Chosen:** The cart shows a full-width "Proceed to checkout" button, disabled, with one line of text saying checkout arrives in the next milestone.

**Why:** Consistent with how the header already treats Account — a disabled control rather than a link that dead-ends. A cart page with no checkout affordance at all reads as unfinished; a checkout button that 404s is worse.

---

## 2026-09-20 — Guest cart merge: SUM quantities, then cap at stock

**Chosen:** When a guest signs in or signs up, the cookie cart and the account cart are unioned by product and their quantities are **summed**. The sum is then capped at the product's current stock (and at the ten-per-order limit). Items whose product has left the catalog are dropped, out-of-stock items are dropped, and the cookie is cleared **only after** the account cart has been written.

The rule, stated once in code: `sumCarts()` does the arithmetic, `reconcileLines()` does the capping. Guest lines come first in the result, because those are the items the shopper was looking at when they signed in.

**Why summing:** items a guest added represent real intent to buy. Adding two of something on a phone and three on a laptop means you want five. Summing preserves that intent; the stock cap keeps the result orderable.

**Rejected — taking `max(guest_qty, user_qty)`:** safer against accidental double-counting, and it cannot surprise a shopper with a larger quantity than they remember choosing. But it silently discards items the shopper deliberately added in one of the two sessions. Losing intent is the worse failure: an unwanted extra unit is visible in the cart and one click to fix, whereas a quantity that quietly shrank is invisible until the order arrives wrong.

**Why out-of-stock items are dropped here but kept on the cart page:** a merge is a one-time consolidation the shopper does not watch, so carrying an unorderable line into a fresh account cart adds nothing. The cart page is the opposite — the shopper is looking right at it, and is being asked to remove the item, so it stays visible. `reconcileLines` takes a `keepOutOfStock` flag for exactly this difference.

**Failure behaviour:** if the merge throws, sign-in still succeeds and the cookie is left intact, so the next sign-in retries it. Signing in must never fail because of a cart.

---

## 2026-09-20 — Guests keep a cookie cart, signed-in shoppers keep a database cart

**Chosen:** One `CartLine[]` shape, two backends behind `lib/cart-store.ts`: the httpOnly cookie for guests, the `cart_items` table for signed-in shoppers. `loadCart()` and `saveCart()` pick the backend from the current session.

**Why:** the cart page, the product page and all three cart mutations were written before accounts existed and are unchanged by them — the seam absorbed the whole difference. A database cart is also what makes "available across sessions and devices" true.

**Table shape:** `cart_items(user_id uuid, product_id int, quantity int, updated_at)` with a composite primary key on `(user_id, product_id)`, so one-line-per-product is enforced by the database rather than by code. Writes replace the user's rows wholesale inside a transaction — at most fifty lines, so a delete-then-insert is simpler than diffing and just as correct.

**No foreign key to `auth.users`:** Drizzle does not manage Supabase's `auth` schema, and account deletion is out of scope for this milestone. The consequence is that deleting a user would orphan cart rows. Worth adding when account management is built.

---

## 2026-09-20 — No profiles table yet

**Chosen:** Cart rows reference the Supabase Auth user id directly. The `profiles`-style table sketched in the earlier auth entry is **not** created.

**Why:** nothing in this milestone reads or writes a profile, and CLAUDE.md is explicit that we do not write code for later. An empty table would be a claim about a design we have not built.

**When to revisit:** the first time we need something Supabase Auth does not store — a display name, a default address, marketing preferences.

---

## 2026-09-20 — The session endpoint replaced the cart-count endpoint

**Chosen:** `/api/cart/count` became `/api/session`, returning `{ email, cartCount }` in one request.

**Why:** the header now needs both who you are and what you have. Two endpoints would mean two round trips on every cold page load for one header. It remains the only `/api/*` route, and it remains a read.

**Unchanged consequence:** keeping session state out of the root layout is still what lets the home page, 24 category pages and 194 product pages stay prerendered. Verified again after this milestone: `/` is `○ Static` and the catalog is `●` SSG.

---

## 2026-09-20 — Protected routes are guarded in `proxy.ts`, and again in the page

**Chosen:** `/orders` is guarded in `proxy.ts` (Next 16's renamed middleware convention) and checks the user again in the page component.

**Why, found by testing:** the page-level `redirect()` alone returned **HTTP 200** with a one-second `<meta http-equiv="refresh">` fallback, because the response had already begun streaming by the time the session resolved. No protected content leaked, but the status code was wrong and a no-JS client would sit on a blank page for a second. Guarding in the proxy runs before anything renders and returns a real **307** with `returnTo` preserved.

**Why keep the page check:** a route should not depend on a matcher pattern being right. The two together cost one extra call that the proxy was making anyway.

---

## 2026-09-20 — `returnTo` is validated against open redirects

**Chosen:** after sign-in we follow `returnTo` only when it is a same-origin relative path. `//host`, `/\host`, absolute URLs and `javascript:` are all rejected in favour of `/`.

**Why:** the sign-in URL carries an attacker-controllable parameter, and a redirect straight after authentication is the classic phishing hand-off. Eight unit tests cover it.

---

## 2026-09-20 — Drizzle's 0000 snapshot had drifted from the live database

**Chosen:** `drizzle/0001_lame_pixie.sql` was hand-trimmed to the `cart_items` statements only.

**Why:** recording this because it would have failed loudly in a fresh environment. Milestone 1 applied `products.created_at` with `db:push`, which does not update the migration journal, so the 0000 snapshot never learned about it. Generating 0001 diffed the current schema against that stale snapshot and emitted `ALTER TABLE products ADD COLUMN created_at` — a statement that would error against the live database, where the column already exists. Verified against `information_schema` before applying rather than assumed.

**Lesson:** `db:push` and generated migrations are not interchangeable. Pick one per project. From here on, schema changes go through `db:generate` so the journal stays truthful.

---

## 2026-09-20 — A signed-in visitor to /signin sees a panel, not a redirect

**Chosen:** `/signin` and `/signup` render an "You're signed in" panel when a session exists. They do **not** call `redirect()`.

**Why, found by testing:** the obvious version — `if (await getUser()) redirect("/")` — silently broke `returnTo`. After the sign-in action succeeds, Next re-renders the POST target (`/signin`) as part of the action's response. By then the shopper *is* signed in, so that guard fired and redirected to `/`, overriding the action's own `redirect(returnTo)`. The action was provably doing the right thing: instrumenting it showed `returnTo: "/cart" -> safe: "/cart"` while the response still carried `Location: /`.

Making the guard honour `returnTo` did not fix it either, because the re-render does not carry the original query string. The only reliable fix is for the page not to redirect at all, so nothing can run after the action and overwrite its decision.

**Verified after the change:** `/cart` → `/cart`, `/orders` → `/orders`, and `https://evil`, `//evil` and `javascript:` all → `/`.

**Lesson:** a `redirect()` in a page that is also a server-action POST target runs *after* the action and wins. Guard such pages by rendering, not redirecting.

---

## 2026-09-20 — The header re-reads the session on every navigation

**Chosen:** `SessionProvider` fetches `/api/session` keyed on `usePathname()`, not once on mount. Sign out additionally clears the header state on click.

**Why, found in manual verification:** after signing in, `/signin` correctly rendered "You're signed in" but the header still showed "Sign in", with no account menu and therefore no way to sign out. The provider lives in the **root layout**, so a client-side navigation never remounts it — its `useEffect(…, [])` had already run once, as a guest, and that stale state survived the sign-in redirect. A hard reload fixed it, which is exactly the signature of client state outliving a server-side change.

Signing in, signing up and signing out all end in a redirect, so re-reading per navigation covers all three through the one mechanism that already existed. No second auth source was introduced: the browser still learns about the session only from `/api/session`, which still reads it through the same Supabase server client as everything else.

**Why sign out also clears locally:** it redirects to `/`, which is not a path change when you are already on `/`, so the per-navigation read would not fire. Clearing on click is optimistic; if the sign-out somehow failed, the next navigation's read puts the session back.

**Cost, accepted:** one small `no-store` JSON request per client navigation. That is the price of keeping the header session-aware while the home page, 24 category pages and 194 product pages stay prerendered — still verified `○ Static` and `●` SSG after this change.

**Ordering:** a cart mutation returns the authoritative count immediately, so a `/api/session` response already in flight must not overwrite it with a pre-mutation number. `applySessionResponse` takes the email from the server always and the count from whichever write is newer. Six unit tests cover it.
