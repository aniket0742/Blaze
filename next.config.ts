import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Browsers load product images straight from Open Food Facts instead of
    // through Next's optimiser. The source already serves pre-sized 400px
    // JPEGs, so optimising them gains little — and the optimiser fetches under
    // a seven-second limit, which Open Food Facts' image host sometimes
    // exceeds, leaving a product with a broken image. Loaded directly, a slow
    // image is only slow. See DECISIONS.md.
    //
    // Only the optimiser enforces remotePatterns, so the list below is inert
    // while this is on. It stays so that switching the optimiser back on is
    // a one-line change that still renders every image.
    unoptimized: true,
    remotePatterns: [
      // The catalog: every product image comes from Open Food Facts.
      { protocol: "https", hostname: "images.openfoodfacts.org" },
      // Not a catalog source. Orders placed before the Open Food Facts
      // migration snapshotted their line images from DummyJSON's CDN, and an
      // order must keep rendering what was bought. Remove this only if those
      // orders are gone. See DECISIONS.md.
      { protocol: "https", hostname: "cdn.dummyjson.com" },
    ],
  },
};

export default nextConfig;
