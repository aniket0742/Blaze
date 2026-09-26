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

---

## 2026-09-20 — Checkout is one page with a server-driven review step

**Chosen:** `/checkout` is a single page holding the address form, the payment choice and a live order summary. Submitting does not place the order — it returns a **review** step showing what will be bought, where it is going and what it costs. Only a second submit, carrying `intent=place`, writes anything.

**Why the review lives in the returned action state, not in client state:** a `useState` wizard would break with JavaScript off, and this project has kept every form working without it (auth, search filters). The step is a field on `CheckoutState`, so the whole two-step flow is plain form posts. Verified by driving it over HTTP with no JavaScript at all.

**Rejected:**
- *A multi-page wizard (`/checkout/address`, `/checkout/payment`, …)* — three routes, partial state to carry between them, and three places to re-check auth and stock. More surface area for no benefit at this size.
- *One submit that places the order immediately* — the brief asks for a review before submission, and an irreversible action taken on first click is a bad shape for an order anyway.

**Consequence:** the action runs twice per order, so the cart is re-read and re-priced twice. That is deliberate — what the shopper reviewed and what gets stored are computed by the same function, from the database, moments apart.

---

## 2026-09-20 — There are no card fields anywhere in Blaze

**Chosen:** the demo payment step offers two radio options — "Demo card" and "Cash on delivery" — and renders a styled rectangle that *looks* like a card. There is no input for a card number, expiry or CVV anywhere in the application. The order stores only which of the two methods was chosen.

**Why:** the safest way not to store real payment details is never to collect them. A form field shaped like a card number will eventually receive a real card number, however loudly the page says "demo" — and then it is in a request body, a server log, and possibly a database. Removing the field removes the whole class of problem.

**Rejected:** *a fake card form pre-filled with 4242 4242 4242 4242* — more convincing as a payment step, and the obvious thing to build. Not worth the risk of accepting a real card in a portfolio project.

**Stated in the UI, twice:** an amber banner above the options on the checkout page, and again on the confirmation. Both say plainly that nothing is charged.

---

## 2026-09-20 — Nothing priced comes from the browser

**Chosen:** the checkout form posts an address and one of two payment identifiers. That is all. Prices, quantities, line totals, the subtotal, delivery and the order total are read from `products` and `cart_items` on the server, by `quoteCart()`, on every request that needs them.

**Why:** a total submitted by a client is a total an attacker chooses. The cart already lives on the server, so there was never a reason to send one.

**How it is enforced:** `placeOrder` ignores every form field except the address and `payment`, then builds the order from `quoteCart(await loadCart())`. The integration tests assert that each stored line equals `quantity × products.price_paise` and that the stored total is the sum of the stored lines.

---

## 2026-09-20 — Stock is re-validated at checkout, but not decremented

**Chosen:** placing an order checks every line against current stock and refuses the order if anything is missing, out of stock, or above what is available. It does **not** reduce `products.stock`.

**Why:** decrementing stock was not part of this milestone, and it is not a neutral change. The catalog is seeded demo data shared by every visitor, 218 catalog pages are prerendered with stock baked into them, and the seed is idempotent — so a decrement would drain the demo, make prerendered pages wrong until revalidation, and be undone by the next reseed.

**The consequence, stated plainly:** two shoppers can each buy the last unit of a product. Nothing in the demo breaks, but it is not how a real store behaves.

**When to revisit:** the moment stock is meant to be a real constraint rather than display data. That is a product decision, not an implementation detail, so it is flagged rather than assumed.

---

## 2026-09-20 — The order snapshots the address and the lines; there is no address book

**Chosen:** `orders` stores the shipping address in its own columns, and `order_items` stores the product title, slug, brand, thumbnail, unit price and quantity at the time of purchase. `order_items.product_id` is a nullable reference that clears if the product leaves the catalog.

**Why:** an order has to keep saying what was bought, at what price, and where it was sent, no matter what later happens to the catalog or to a profile. The product link is a convenience for "buy it again"; the snapshot is the record. This is the "Order line items are snapshots" decision from planning, now actually built.

**Why no `addresses` table:** nothing reuses an address yet. Profile and address management are out of scope, and an empty table would be a claim about a design we have not built — the same reasoning as the `profiles` table we did not create in Milestone 5.

**Verified:** an integration test reprices and renames the catalog product inside a transaction it rolls back, then asserts the stored order line is unchanged.

---

## 2026-09-20 — Order numbers are `BLZ-YYMMDD-XXXXX`

**Chosen:** a human-readable number such as `BLZ-260920-K4M7X`: the date, then five characters from a 31-character alphabet with `0`, `1`, `I`, `L` and `O` removed. Uniqueness is enforced by a unique index on `orders.order_number`; the writer retries with a new number on conflict, up to five times.

**Why not the primary key:** a sequential id tells every customer how many orders the store has taken, and lets anyone enumerate them. **Why not a UUID:** nobody can read one out over the phone.

**Why the alphabet is short:** the characters that get misheard and mistyped are the ones left out. Roughly 28 million combinations per day against a demo that will take dozens of orders, so the retry loop is close to theoretical — but the unique index means a collision is a retry, never a duplicate.

---

## 2026-09-20 — The checkout page never calls `redirect()`

**Chosen:** an empty cart, a signed-out visitor and a cart full of unavailable items each **render a panel** on `/checkout`. None of them redirects.

**Why:** `/checkout` is the POST target of the place-order action, and Milestone 5 established what happens then — Next re-renders the POST target as part of the action response, and a `redirect()` in the page runs *after* the action's own redirect and silently overrides it. Placing an order empties the cart, so the obvious `if (cart.isEmpty) redirect("/cart")` would have fired on exactly the successful path and swallowed the trip to the confirmation.

**What guards the route instead:** `proxy.ts` returns a real 307 to `/signin?returnTo=/checkout` before anything renders, and the page checks the session again and renders accordingly. Same two-layer pattern as `/orders`.

---

## 2026-09-20 — Addresses are validated as Indian addresses

**Chosen:** full name, a 10-digit mobile number, two address lines, city, a **select** of the 28 states and 8 union territories, and a 6-digit PIN code that cannot start with zero.

**Why:** the whole storefront is priced in rupees and formatted `en-IN`. A generic "Country / State / ZIP" form would be a different product. A select rather than a text field for the state is faster on a phone and makes the field genuinely checkable, instead of accepting "Californiya".

**Why the phone is normalised:** people type `+91 98765 43210`, `098765 43210` and `98765-43210`. All three are the same number, and the order stores the ten digits.

**Where it is enforced:** `validateAddress()` on the server, always. The `required`, `maxLength` and `inputMode` attributes on the inputs are a convenience for the shopper, not the check — the HTTP tests post straight past them.

---

## 2026-09-20 — Migrations are now real, and the 0000 gap is repaired

**Chosen:** added `npm run db:migrate` (`drizzle-kit migrate`), baselined the migration ledger against the live database, and appended two `IF NOT EXISTS` statements to `0002` that add `products.created_at` and its index.

**Why the baseline was needed:** `drizzle.__drizzle_migrations` did not exist. Milestone 1 applied `0000` with `db:push` and Milestone 5 applied `0001` by hand, so drizzle had no record of either. Running `migrate` would have replayed both against tables that already exist. The ledger now records all three with their real file hashes, and `0002` applied on its own.

**Why the repair was needed:** `0000` never creates `products.created_at` — it was pushed, not migrated — while every snapshot from `0001` on claims it exists. Replaying the chain into a **fresh** database therefore produced a `products` table without it, and the New Arrivals rail and the "newest" sort would have failed there. The two repair statements are no-ops against the live database (verified — Postgres reported `skipping` for both) and fix the chain for anyone starting clean.

**Rejected:** *editing `0000` in place* — tidier to read, but it rewrites a migration that has already been applied elsewhere, and the repair is more honest recorded as a repair.

**Standing rule, restated:** `db:push` is not used again on this project. Schema changes go `db:generate` → review the SQL → `db:migrate`.

---

## 2026-09-20 — Every order read carries the user id in its WHERE clause

**Chosen:** all three order reads live in `lib/orders-server.ts`, and each one puts the signed-in user's id into the SQL: `listOrders(userId)` and `getOrderDetail(orderNumber, userId)`. There is no function anywhere that fetches an order by number alone.

**Why:** the alternative shape — fetch by number, then compare `order.userId` to the session — is one forgotten `if` away from leaking someone's address and purchase history. Putting the owner in the query makes the safe version the only version: a wrong user id returns no row, exactly like a wrong order number.

**Consequence, deliberate:** the checkout confirmation now uses `getOrderDetail` too, and `getOwnOrder` in `checkout-server.ts` was deleted. One scoped read, three pages. `checkout-server.ts` keeps the writes.

**Verified over HTTP, not just in unit tests:** signed in as a second account, `/order/<someone else's number>` returns the same not-found panel as a number that never existed, with no order data in the response and a tab that does not name the order. Six malformed segments — a lowercased number, `BLZ-%`, `' OR '1'='1`, `../../secrets`, an 80-character string and an unknown number — all land on the same panel.

---

## 2026-09-20 — "Not found", "not yours" and "not an order number" are one response

**Chosen:** `getOrderDetail` returns `null` for all three, and the page renders one panel: "There is no order with that number on your account."

**Why:** distinguishing them tells a prober which order numbers exist. It is also the honest answer from the shopper's point of view — for them, all three mean the same thing.

**Rejected:** *a 404 for unknown and a 403 for someone else's* — conventional, and it confirms the existence of any order number an attacker guesses.

---

## 2026-09-20 — Order pages never join `products`

**Chosen:** `/orders` and `/order/[orderNumber]` read `orders` and `order_items` only. The catalog is not consulted, not joined, and not needed.

**Why:** an order is a historical record. If a product was bought for ₹42,500 and now costs ₹50,000, the order must say ₹42,500 — and if the product has been removed entirely, the order must still render. Joining `products` would make both of those wrong, and would turn a deleted product into a broken page.

**The one thing `products` still governs:** `order_items.product_id` is a nullable reference that clears when the product is deleted, and it decides only whether the item title is a link. A line whose `product_id` is null renders identically, plus a quiet "No longer sold on Blaze."

**Verified end to end:** a test product was bought at ₹42,500, then repriced to ₹50,000 and renamed in the catalog, then deleted. The order page kept showing ₹42,500 and the original title throughout, never rendered ₹50,000, and after deletion still rendered the line, dropped the product link and said the product was gone. Covered both by an integration test and over HTTP.

---

## 2026-09-20 — `isOrderNumberShaped` is looser than the order-number format

**Chosen:** the URL segment is checked against `/^[A-Za-z0-9-]{1,32}$/`, not against `BLZ-YYMMDD-XXXXX`.

**Why:** the check exists to bound what reaches the database, not to re-specify the format. Pinning it to today's exact shape would mean that changing `generateOrderNumber` later silently makes every older order unreachable — a data-loss bug that no test of the new format would catch. The unique index does the real lookup, and the query is owner-scoped either way, so a permissive shape check costs nothing.

---

## 2026-09-20 — `/order/[orderNumber]` is singular, `/orders` is the list

**Chosen:** the list lives at `/orders` and one order at `/order/<number>`, and `proxy.ts` protects `/orders`, `/order` and `/checkout`.

**Why the two prefixes do not collide:** the guard matches `pathname === p || pathname.startsWith(p + "/")`, so `/order` covers `/order/BLZ-…` without swallowing `/orders`, which is listed separately.

**Note:** `/orders` still redirects when signed out, unlike `/checkout`, which renders a panel. That difference is intentional — `/checkout` is the POST target of a server action and a redirect there would override the action's own. Neither order page is an action target, so the simpler redirect is safe.

---

## 2026-09-20 — Milestone 7 needed no migration

**Chosen:** no schema change. `orders` and `order_items` as built in Milestone 6 already carry everything the history and detail pages show.

**Why worth recording:** it is the payoff for snapshotting at write time. The only thing added anywhere near the data layer was a read module.

---

## 2026-09-20 — One global focus ring instead of seven per-control ones

**Chosen:** a single unlayered `:focus-visible` rule in `globals.css` giving every interactive element a 2px brand outline, rather than adding focus utilities to each control.

**Why:** seven controls across the app set `outline-none` and then signalled focus only by changing their border colour from grey to orange — a change too subtle to track a keyboard caret by, and invisible to anyone who cannot distinguish those hues. Only the header search field had a real ring.

**Why it works:** Tailwind's utilities live in `@layer utilities`, and unlayered CSS beats any layered CSS regardless of specificity. So one plain rule overrides every `outline-none` in the codebase without touching them. `:focus-visible` rather than `:focus` means pointer users never see it.

**Rejected:** *editing all seven controls* — the same result, seven places to forget next time.

---

## 2026-09-20 — The header account menu needs JavaScript; the dead ends it created do not

**Found in QA:** the server-rendered HTML contains no account control at all. `AccountMenu` is a client island that renders an empty box until the first `/api/session` read lands, so with JavaScript off there was no way to sign in from the header, no indication you were signed in, and **no way to sign out anywhere in the application**.

**Chosen:** leave the header architecture alone and close the two dead ends additively — a `<noscript>` "Sign in" link in the loading branch, and a real Sign out button on the "You're signed in" panel at `/signin`, which is a server component and therefore a plain form post.

**Why not make the header session-aware on the server:** that is precisely what the last four milestones were arranged to avoid. Reading the session in the root layout makes every page dynamic and costs the 218 prerendered catalog pages. The blank-until-loaded state is also deliberate — it exists so the header never flashes "Sign in" at someone who is already signed in.

**Bonus:** sign-out became verifiable over HTTP for the first time, because it is now reachable without client hydration. The full-journey QA exercises it.

---

## 2026-09-20 — `db:push` removed from package.json

**Chosen:** the `db:push` script is deleted. `db:generate` → review → `db:migrate` is the only path.

**Why:** the standing rule was already recorded, but a rule that lives only in a document is one `npm run` away from being broken. Mixing push with generated migrations is what desynchronised the migration ledger in Milestone 6, and the recovery took a hand-written baseline plus a repair migration. Removing the script removes the temptation.

**Also tidied:** `.gitignore` had a duplicated block appended to it, including a second `.env*` rule that sat *after* the `!.env.example` negation. The behaviour happened to be correct, but the file read as though `.env.example` should have been ignored. Deduplicated, with a comment saying why the negation must stay last.

---

## 2026-09-20 — A visually hidden `<h1>` on the home page

**Chosen:** the home page gets `<h1 class="sr-only">Blaze — everything, A to Z</h1>`.

**Why:** the page is a stack of modules that each own an `<h2>`, so the document had no top-level heading at all — every other page has one. That is both a screen-reader outline problem and an SEO one, on the single most important page.

**Why hidden:** the design's entry point is the deals module, not a page title. Rendering a visible `<h1>` would mean redesigning the top of the page to justify it; the heading is for the document outline, so the outline is where it belongs.

---

## 2026-09-26 — The catalog is Open Food Facts, priced from Open Prices

**Context:** 8x changed the brief. The backend must run on a working database and a real API — not mock data. DummyJSON is a mock-data service, so it had to go.

**Chosen:** products come from **Open Food Facts**; prices come from **Open Prices**, the Open Food Facts project's companion database of real prices recorded from real shops (receipts and shelf photos). The catalog is Indian products priced in rupees.

**Why a second service was needed — measured, not assumed:** an Open Food Facts product carries 374 fields and not one of them is commercial. No price, stock, rating, review, shipping, warranty, discount or MRP (checked on Nutella, `3017620422003`). A store cannot check out on that, and inventing prices is exactly the mock data the new brief rules out. Open Prices is documented, public, and is the only real source of prices for these products.

**Why India and rupees:** Open Prices holds 239,593 EUR observations but only 400 in INR — yet those 400 cover 374 distinct products, enough for a catalog, and they are recognisable Indian products (Maggi, Karachi Bakery, Epigamia, Country Delight) at real shelf prices. Staying in rupees means **no currency conversion at all** — the fixed ₹85 = $1 rate is gone — and the checkout's India-specific address rules (PIN, states, +91) still fit.

**Rejected:**
- *Europe / EUR* — a far larger catalog, but the store would switch currency and the India-shaped checkout would no longer make sense.
- *Assigning prices ourselves* — any number we chose would be invented.

---

## 2026-09-26 — Open Food Facts products only

**Chosen:** the import requests prices with `product__source=off`, so every product is an Open Food Facts product. Open Prices also covers items from Open Beauty Facts, Open Products Facts and Open Pet Food Facts; those are separate databases with separate APIs, and are left out.

**Also left out:** a barcode Open Food Facts answers with `product_found_with_a_different_product_type` — the barcode exists, but not as a food product. Found by the importer's dry run, which initially treated that 404 as a network failure and stopped.

---

## 2026-09-26 — Import into Postgres; never call the APIs at request time

**Chosen:** `npm run db:seed` imports the catalog into the existing tables. Pages keep reading Postgres, and the catalog stays prerendered.

**Why:** the documented limits are 15 product reads and 10 searches a minute per IP, and a bulk search returned **HTTP 503** — "not available to anonymous users" — when tested. Calling Open Food Facts per page view would fail on the first busy afternoon. The docs ask anyone needing more than a few hundred products not to crawl, and the import reads each product once.

**How the importer behaves:**
- Reads are paced at one per 6.5 s — about 9 a minute, well inside 15.
- 429 and 503 are retried with a growing wait; any other failure **aborts** the import, so a flaky network can never produce a half-empty catalog.
- Each product is cached under `node_modules/.cache`, so an interrupted import resumes and a repeat import is fast.
- `--dry-run` fetches and reports without writing, which is how the import was checked before the old catalog was touched.
- It is a full sync in one transaction: upsert on barcode, then remove what the sources no longer support.
- `OFF_USER_AGENT` identifies the client, as both services require. It is server-only — not `NEXT_PUBLIC_` — so it never reaches a browser.

---

## 2026-09-26 — Which observation sets the price

**Chosen:** the latest *usable* observation. Usable means a per-unit (not per-kilogram) rupee price for a specific product, not flagged as a duplicate, and not a clearance, second-hand or multi-buy price — none of those is a normal shelf price for one new unit.

**MRP:** the pre-discount price the shopper recorded, when they recorded one; otherwise the MRP equals the price and no discount is shown. Every "% off" in Blaze is a real one, which is why the deals module is now headed **Below MRP** rather than promising anything.

**Transparency:** the product page states when and where the price comes from — "Shelf price seen in a shop on 13 Sep 2025, via Open Prices".

---

## 2026-09-26 — No stock (supersedes the stock decisions from Milestones 4 and 6)

**Chosen:** stock counts are gone. A product is available if it is in the catalog — and it is in the catalog only if it has a real current price. The ten-per-line cap is now the only quantity limit.

**Why:** neither API has stock, and any number we seeded would be invented. This supersedes "Cart reconciliation: stale lines are dropped, out-of-stock lines are kept", the stock half of "Guest cart merge: SUM quantities, then cap at stock", and "Stock is re-validated at checkout, but not decremented".

**What still holds:** the merge still sums, then caps at the limit; products that left the catalog are still dropped; checkout still re-quotes from the database. It now refuses a stored quantity above the limit rather than trimming it, since the app never writes one.

---

## 2026-09-26 — Nutri-Score and "Most scanned" replace ratings and reviews

**Chosen:** the rating stars, reviews and histogram are removed, and the `product_reviews` table is dropped. The rating filter and sort become **Nutri-Score** (A–E, computed by Open Food Facts), and "Top rated" becomes **Most scanned**, ordered by Open Food Facts' own count of unique scans.

**Why:** no source has ratings or reviews. Nutri-Score is a real, meaningful quality signal for food, and scan counts are a real popularity signal. Both are shown with the schemes' own wording.

**Accessibility:** the badge uses the scheme's official colours with whichever text colour clears WCAG AA. Grade E's official red fails with both white (4.15:1) and dark text (4.37:1), so it is darkened the minimum needed — `#E63E11` → `#D83A0F`, 4.63:1 with white.

---

## 2026-09-26 — No delivery dates

**Chosen:** "Arrives …" is removed from cards, product pages, the cart and checkout, and new orders store no promised date.

**Why:** the dates were computed from DummyJSON's shipping strings. Nothing real replaces them, and a delivery promise is a claim a store should be able to keep.

**What stays:** `orders.arrives_by`. Orders placed before the migration were promised a date, and that promise is part of their record.

---

## 2026-09-26 — Ingredients, allergens and nutrition on the product page

**Chosen:** the import reads each product's ingredients, allergens and per-100 nutrition from the Open Food Facts product API. The product page shows them, with the product's Nutri-Score, NOVA group, pack size, labels and barcode.

**Two details that matter:**
- Nutrition is labelled per 100 g **or per 100 ml**, as the source reports it. A milkshake's figures are per 100 ml; printing "per 100 g" would be wrong.
- A section the source has nothing for says so. An empty allergen list reads "None recorded on Open Food Facts. Check the pack before relying on this" — never "contains no allergens".

---

## 2026-09-26 — Departments are real Open Food Facts categories

**Chosen:** 17 departments, each a real tag from the Open Food Facts category taxonomy, named with the taxonomy's own English names. A product lands in the first department its tags contain, most specific first — a chocolate milkshake tagged as both a dairy and a beverage is filed under Dairies.

**Left out:** products with no category tags, or only free-text tags outside the taxonomy (`en:lime-pickle`, `en:butter-milk`). Filing them anywhere would mean inventing a category.

**Why the taxonomy's names, even the clumsy ones:** "Beverages and beverages preparations" is not how a merchandiser would write it, but it is Open Food Facts' name. Choosing which tags are departments is a store decision; renaming them would be putting words in the source's mouth.

---

## 2026-09-26 — Barcode is the natural key; ids start at 1000

**Chosen:** `products.barcode` (text, unique) identifies a product. `id` stays the integer primary key, now generated as an identity starting at **1000**.

**Why text:** EAN and UPC codes can start with zero, which an integer silently drops.

**Why keep the integer id:** carts and order lines reference it. Keeping it means no foreign key changes type, and the import upserts on barcode so a product keeps its id across syncs.

**Why 1000:** DummyJSON ids ran 1–194, and a returning guest's cart cookie may still hold them. Starting above that range means an old cookie can only ever point at nothing — dropped as stale — and never at a different product.

---

## 2026-09-26 — Prices show their paise

**Chosen:** `formatPrice` prints whole rupees as `₹120`, and anything else with its paise, `₹3,766.68`.

**Why, found during this migration:** it rounded everything to whole rupees. DummyJSON hid that, because its converted prices were never shown against anything. Real shelf prices can carry paise, and a price that does not match what was recorded is wrong. Rounding per line also lets a cart's lines stop adding up to its total — 3 × ₹12.50 shows as 3 × ₹13 against a ₹37.50 total.

---

## 2026-09-26 — Missing data is shown as missing

**Chosen:** a product with no brand in Open Food Facts shows no brand line — not "Unbranded", not "Blaze Marketplace". A product with no generic name has no description.

**Why:** an absent field in the source means *unknown*, not *none*. Printing a placeholder turns a gap in the data into a claim about the product.

---

## 2026-09-26 — Licensing and attribution

Both sources were checked before shipping.

| Source | Data | Images | What reuse requires |
|---|---|---|---|
| Open Food Facts | Open Database License; individual contents under the Database Contents License | CC BY-SA | "Mention the licence and attribute the authorship to Open Food Facts with a link to https://openfoodfacts.org … or the product page, when the information and data … pertain to a specific product." Derivative works under the same conditions. Data is provided as-is. |
| Open Prices | Open Database License | — | "Comply with the OdBL licence, mentioning the source of your data, and ensuring to avoid combining non free data you can't release legally as open data." |

**How Blaze meets them:**
- The site footer names both sources and both licences, with links.
- Every product page links to **that product's own** Open Food Facts page and Open Prices page, names the licences, and says the data is as-is.
- The catalog tables are a derivative database of two ODbL databases. Blaze adds no non-free data to them, and they would be shared under the ODbL if the database itself were ever published.

---

## 2026-09-26 — The migration: two files, one transaction, a verified backup

**Backup first.** `pg_dump` is not installed, so two independent rollback points were taken and verified before anything changed:
1. an exact copy of every app table in a separate schema, `backup_m9a`, in the same database — drizzle never touches it;
2. a JSON export of every row, in `backups/` (gitignored, because orders contain names, addresses and phone numbers).

Both matched the live tables by row count and by an md5 over every row in primary-key order. `backups/2026-09-26-pre-off-migration/rollback.sql` restores the old catalog from `backup_m9a`; it was proved by running it against the migrated database inside a transaction and rolling that back.

**Two migrations.** `0003` drops the DummyJSON-only columns and the reviews table; `0004` adds the Open Food Facts columns. They are split because drizzle-kit asks interactively whether a new column is a rename whenever one migration both drops and adds columns on the same table, and the prompt cannot be answered non-interactively. Splitting also leaves each file doing one thing.

**The data transition is inside `0003`.** The new columns are `NOT NULL`, so the old rows must go first, and drizzle applies every pending migration in one transaction — a failure anywhere leaves the old catalog untouched. On a fresh database the two deletes are no-ops.

**Order snapshots are untouched.** Deleting the DummyJSON products set `order_items.product_id` to `NULL`, as designed in Milestone 7; every order still renders its own title, price and image. Those images live on DummyJSON's CDN, so `cdn.dummyjson.com` stays in `next.config.ts` — not as a catalog source, but so orders placed before the migration keep rendering.

---

## 2026-09-26 — What the import produced

The first import, run 2026-09-26, after a full dry run against the live APIs:

| | |
|---|---|
| Open Food Facts products with a rupee price on Open Prices | 315 |
| … with a usable shelf price | 314 |
| **Imported** | **265 products in 17 departments** |
| Left out — no category in the taxonomy | 30 |
| Left out — no product name | 12 |
| Left out — no image | 4 |
| Left out — not a food product on Open Food Facts | 3 |
| Real discounts below a recorded MRP | 44 |
| With a Nutri-Score / ingredients / nutrition / allergens | 196 / 237 / 240 / 148 |
| Prices | ₹5 – ₹3,766.68, observed 23 Nov 2023 – 26 Sep 2026 |

Three products chosen at random were re-derived from the live APIs, bypassing the import's cache: all three matched on name, price, MRP and observation date.

These numbers move with the sources — the price feed returned one product fewer between two runs an hour apart. That is what live data does.

---

## 2026-09-26 — Product images come from Open Food Facts' own host

**Chosen:** the import accepts an image only if it is an `https://images.openfoodfacts.org/` URL, and `next.config.ts` allows exactly that host for the catalog.

**Why enforced rather than assumed:** `next/image` throws at render for a host that is not allowed, so one off-host URL would crash a product page. All 791 image URLs in the source are on that host today; the check makes sure a future import cannot break a page.

**Known limitation, measured:** the image host is sometimes slow. In testing, one first-time fetch exceeded Next's seven-second optimisation limit and showed as missing; a retry succeeded, and twelve further first-time fetches took a median of 0.7 s. Once optimised, an image is cached. The timeout is left at its default — raising it only makes a slow page wait longer.

---

## 2026-09-27 — An original editorial identity replaces the marketplace layout

**Supersedes:** "Marketplace density over editorial layout", "Modular home page", "Product cards stay information-rich" and "'A-to-Z' is a browse affordance" (all 2026-09-20).

**Chosen:** the frontend is rebuilt around its own identity rather than a marketplace template:

| | |
|---|---|
| Palette | Warm paper (`#f6f2ea`), near-black ink (`#1d1a16`) and one accent, vermilion (`#d4481c` / `#b3390f`). Light only, as before. |
| Type | Fraunces for display headings, Geist for text, Geist Mono for every money figure, barcode and order number. |
| Header | One row: wordmark, three editorial entry points (Aisles, Price watch, Most scanned), search, account, bag. The category nav strip is gone. |
| Home | A masthead with a real headline, a cover of the four most-scanned products, then numbered sections: 01 Price watch, 02 Most scanned (a ranked list, not a rail), 03 The aisles (an alphabetical table of contents), 04 New to the shelf, and a Nutri-Score explainer. |
| Cards | Image, Nutri-Score, discount, brand, name, pack size, price. Nothing else. |
| Product page | The full A–E Nutri-Score scale, the price with the date it was seen, and a food-label nutrition panel. |

**Why:** 8x changed the requirement from a clone to an original interface. Re-skinning was not enough: the old layout's shape — two-row header with a category strip, deals modules, horizontal rails, dense cards — was Amazon's information architecture in new colours. The new structure starts from what the data actually is after the Open Food Facts migration: packaged food, a label, a shelf price and the date someone saw it. Numbered sections and an aisle directory give the page a reading order instead of a merchandising grid.

**Cards got lighter, not emptier:** the old card carried rating, delivery date and stock. None of those exist any more (see the 2026-09-26 entries), and the ones that replaced them — Nutri-Score and a real discount — are on the card.

**Removed:** `az-index`, `az-promo`, `category-strip`, `deal-card`, `deals-module`, `product-rail`. The A-to-Z principle is now the aisle directory, sorted A to Z.

**Rejected:** *keeping the layout and changing the palette* — the same page in different colours is still the same page. *A dark theme* — the light-only decision stands.

---

## 2026-09-27 — The receipt motif is reserved for money

**Chosen:** the bag summary, checkout summary, order confirmation, order details and order-history cards are drawn as receipts: a torn zig-zag bottom edge, dotted leaders, and figures in a monospaced column. It appears nowhere else.

**Why:** it is the one recognisable motif in the identity, and it has a job — aligned mono figures are easier to check than proportional ones. Confining it to surfaces where money is totalled keeps it meaningful.

**How:** a CSS mask on one `.receipt` class — no images, no SVG, and the page background shows through the teeth whatever it is.

---

## 2026-09-27 — "Bag" in the interface, "cart" in the code

**Chosen:** shoppers see "bag" — "Add to bag", "Your bag", the header badge. Routes (`/cart`), the cookie, tables and code keep "cart".

**Why:** voice, not necessity; "cart" is generic rather than Amazon's. Keeping the change to copy makes it cheap to reverse and avoids renaming routes that people may have bookmarked.

---

## 2026-09-27 — The home page `<h1>` is visible now

**Supersedes:** "A visually hidden `<h1>` on the home page" (2026-09-20).

**Chosen:** the masthead headline, "Real groceries, at real shelf prices.", is the page's `<h1>`. The hidden one is gone.

**Why:** the old one was hidden because the design had no title to show. The redesign opens with one, so the outline and the page now say the same thing.

---

## 2026-09-27 — Contrast is measured, and form fields got a real border

**Chosen:** every new colour pair was computed against WCAG 2.2 rather than judged by eye:

| Pair | Ratio | Needs |
|---|---|---|
| Ink on paper | 15.5:1 | 4.5:1 |
| Muted text on paper / on the image well | 5.99:1 / 5.43:1 | 4.5:1 |
| Vermilion links (`brand-600`) on white / on paper | 5.89:1 / 5.36:1 | 4.5:1 |
| Field border (`--border-field`) on white / on paper | 3.40:1 / 3.05:1 | 3:1 |
| Focus ring (`brand-500`) on paper / on ink panels | 3.97:1 / 3.91:1 | 3:1 |
| Nutri-Score letters on their official colours (E darkened from `#E63E11` to `#D83A0F`) | 4.63:1 at worst | 4.5:1 |

**The fix it found:** inputs, selects and payment options had always used the decorative hairline colour — 1.24:1 against white in the old design, a text field whose edge most people could barely see. WCAG 1.4.11 asks 3:1 for the boundary of a control. They now use a separate `--border-field` token; the hairline stays for dividers, where it is decoration.

---

## 2026-09-27 — Accessibility fixes made during the redesign

- **Phone header:** the account and bag controls collapse to icons, but their text stays in the accessibility tree (`sr-only sm:not-sr-only`, `aria-label="Bag, 3 items"`), so a screen reader never meets an unnamed icon.
- **Password hint:** "At least 6 characters" was visible but not connected to the field. It is now linked with `aria-describedby`.
- **Mobile menu:** a native `<details>` element — it opens, closes and is announced without JavaScript.
- **Search:** has an explicit, labelled submit button instead of relying on the Enter key.
- **Nutri-Score:** never colour alone — the letter is always shown and the chip carries its meaning as text.
- **Checkout steps:** the current step is marked `aria-current="step"`, and each part of the form is a numbered `<fieldset>` with a `<legend>`.

---

## 2026-09-27 — Buttons are class functions, errors share one panel

**Chosen:** `components/ui.tsx` exports `button(variant, size)`, which returns a class string, plus a few small presentational pieces (`PageTitle`, `Price`, `Receipt`, `ReceiptRow`). All nine `error.tsx` boundaries render one `ErrorPanel`.

**Why a function and not a `<Button>`:** the same look is applied to `<Link>`, `<button>` and form submit buttons. A component would need a polymorphic `as` prop to cover all three; a class string does not.

**Why one error panel:** the nine boundaries were nine copies of the same markup with different words. Restyling them meant nine identical edits, so the markup now lives once and each boundary passes only its words.

---

## 2026-09-27 — Product images load directly from Open Food Facts

**Supersedes** the "timeout left at its default" part of "Product images come from Open Food Facts' own host" (2026-09-26).

**Chosen:** `images.unoptimized: true`. Browsers fetch product images straight from `images.openfoodfacts.org`.

**Why:** the redesign's visual review hit the limitation recorded the day before, repeatedly — several product images broke with "upstream image response timed out". The optimiser gives up at seven seconds and the image is then missing; loaded directly, a slow image is only slow. And the optimiser gained little here: Open Food Facts already serves pre-sized 400px JPEGs.

**Cost, accepted:** no WebP/AVIF conversion, and no per-width `srcset`. At 400px source images, both would save little.

**Note:** only the optimiser enforces `remotePatterns`, so the host list is inert while this is on. The import's own host check is what guarantees every catalog image comes from Open Food Facts. The list stays so that turning the optimiser back on is a one-line change.

---

## 2026-09-27 — "Shelf prices", not "receipt prices"

**Found while writing the redesign's copy:** the README and one earlier entry here said Blaze is priced "from real receipts". The imported data says otherwise: 334 of the 335 price observations are price tags photographed on a shelf, and one is a receipt.

**Chosen:** the wording is now "shelf prices, photographed in real shops and recorded on Open Prices", in the README, this file, code comments and the product page ("Shelf price seen in a shop on …").

---

## 2026-09-27 — A flaky order-number test, fixed by arithmetic

**Found:** "real calls are random" drew 500 order numbers and asserted all 500 suffixes differ. It failed once during this milestone and passed on every rerun.

**Why it was flaky:** 500 draws from 31⁵ (28.6 million) suffixes collide by the birthday paradox about 0.44% of the time — roughly once every 230 runs. The test was asserting something the generator does not promise.

**Chosen:** 40 draws, which collide 0.003% of the time and still catch a generator that is constant or barely random. Uniqueness is the database's job — a unique index plus a retry — and that is covered by `tests/orders.integration.ts`.

---

## 2026-09-27 — Price records with a placeholder MRP are rejected

**Found:** "Ultra milk full cream" (Ultrajaya, 250 ml) led Price watch at −100%. Its only Open Prices record (#163721, a price tag) gives 9,999,999 as the pre-discount price, against a price of ₹3,766.68. It also set the top of the search price range.

**Chosen:** `isUsableObservation` rejects any record whose pre-discount price is more than **10× its price** (`MAX_MRP_MULTIPLE` in `scripts/catalog-source.ts`). 10× is a 90% markdown.

**Why 10×:** measured against all 55 discounted rupee records. The largest real markdowns are 5.1× (₹49 against ₹250), 3.7× and 2.9×; the placeholder is 2,655×. Nothing lies between 5.1× and 2,655×, so 10× leaves double headroom above the largest real markdown.

**Rejected:** *matching runs of nines* — catches 9,999,999 but not 1,000,000 or a slipped decimal. *An absolute rupee cap* — ties the rule to today's catalog.

**Why the whole record, not just its MRP (Aniket's call):** a record with a placeholder in one field is not trusted for the others — and this one's price, ₹3,766.68 for 250 ml of milk, was higher than a 907 g tub of whey. Dropping only the MRP would have kept it as the catalog's most expensive item. A product whose latest record is rejected falls back to its next usable one; this product had none, so it left the catalog like any other product without a usable price. It was in no bag and on no order.

**Affects:** 1 of 335 price records, 1 of 265 products. No other product's price, MRP or date changed. The import now prints every record the rule rejects.

**Corrects** "What the import produced" (2026-09-26): 43 real discounts, not 44; prices run ₹5 – ₹3,099.

---

## 2026-09-27 — The price feed is paged by id, not by date

**Found while applying the rule above:** consecutive dry runs disagreed — 316 products observed in one, 315 in the next. The importer paged Open Prices sorted by date, which many records share. At the boundary after record 300, two records dated 14 Dec 2024 came back in a different order from one request to the next, so one could be served twice and the other never. In two of three test reads, one was.

**What it had already cost:** the first import (2026-09-26) missed #59048, the only price for **Fresh Paneer** (₹120), a product that meets every catalog rule. The "one product fewer between two runs" noted in "What the import produced" was this bug, not the live data moving. The other record on that date is the only price for Paper Boat Zero Sparkling Coffee, so any re-import could as easily have deleted that product.

**Chosen:** page by `-id`, which is unique, and skip an id already seen. After the read, the number of distinct records must equal the total the API reports, or the import stops — a record added or removed mid-read shifts the pages, and the sync deletes every product it does not see.

**Verified:** two reads by id returned identical records; three dry runs and the import all saw the same 335. The re-import ran after a backup of `products` and `categories` (`backups/2026-09-27-pre-mrp-rule`, gitignored). Result: Ultra milk removed, Fresh Paneer added, the other 264 rows unchanged in every column — still 265 products in 17 aisles.
