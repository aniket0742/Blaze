import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "@/components/session-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
// Receipt figures, order numbers and barcodes.
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// Headlines. A soft, editorial serif — the one voice that is only Blaze's.
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Blaze — everything, A to Z", template: "%s · Blaze" },
  description:
    "Blaze is a modern marketplace of real products at real shelf prices, with Nutri-Scores shown up front.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        {/* A client provider around server children: the pages inside stay
            server-rendered and prerendered. */}
        <SessionProvider>
          {/* First thing a keyboard reaches, so the header is not a toll gate
              on every page. */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-page"
          >
            Skip to content
          </a>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </SessionProvider>
      </body>
    </html>
  );
}
