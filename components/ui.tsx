/**
 * The handful of primitives every page shares, so a button, a heading or a
 * price looks the same wherever it appears. Presentational only.
 */
import { discountPercent, formatPrice } from "@/lib/format";

type ButtonVariant = "primary" | "secondary" | "inverse" | "quiet";
type ButtonSize = "sm" | "md" | "lg";

const VARIANT: Record<ButtonVariant, string> = {
  // Ink, not orange: the primary action reads as confident rather than loud.
  primary: "bg-foreground text-page hover:bg-foreground/85",
  secondary: "border border-foreground text-foreground hover:bg-foreground hover:text-page",
  // For the few ink-coloured panels.
  inverse: "border border-page text-page hover:bg-page hover:text-foreground",
  quiet: "text-foreground underline decoration-border-field underline-offset-4 hover:decoration-foreground",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

/** Class names for a button, usable on <button> and <Link> alike. */
export function button(variant: ButtonVariant = "primary", size: ButtonSize = "md"): string {
  const shape = variant === "quiet" ? "" : `${SIZE[size]} rounded-md`;
  return `inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${shape} ${VARIANT[variant]}`;
}

/** Text inputs and selects. The border clears 3:1 against its background. */
export const field =
  "h-11 w-full rounded-md border border-border-field bg-background px-3 text-sm outline-none transition-colors focus:border-foreground aria-[invalid=true]:border-red-700";

/** The small spaced label above a heading. */
export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] text-muted ${className}`}>
      {children}
    </p>
  );
}

/** A page's title block: eyebrow, serif headline, optional standfirst. */
export function PageTitle({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h1 className="mt-2 font-display text-[2rem] leading-[1.05] tracking-tight sm:text-5xl">
        {title}
      </h1>
      {children && <div className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">{children}</div>}
    </header>
  );
}

/**
 * A price as Open Prices recorded it: the shelf price, and — only when the
 * shopper recorded one — the higher MRP and the real saving.
 */
export function Price({
  pricePaise,
  mrpPaise,
  size = "md",
  saving = true,
}: {
  pricePaise: number;
  mrpPaise: number;
  size?: "sm" | "md" | "lg";
  /** Off where the saving is already stated nearby, e.g. a card's corner tag. */
  saving?: boolean;
}) {
  const off = discountPercent(pricePaise, mrpPaise);
  const main = { sm: "text-[15px]", md: "text-lg", lg: "text-4xl" }[size];
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={`font-semibold tabular-nums tracking-tight ${main}`}>{formatPrice(pricePaise)}</span>
      {off >= 1 && (
        <>
          <span className="text-[12px] text-muted">
            <span className="sr-only">MRP </span>
            <span className="line-through">{formatPrice(mrpPaise)}</span>
          </span>
          {saving && <span className="text-[12px] font-semibold text-brand-600">{off}% below MRP</span>}
        </>
      )}
    </p>
  );
}

/** One line of a receipt: label, dotted leader, figure. */
export function ReceiptRow({
  label,
  value,
  strong = false,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className={`flex items-baseline ${strong ? "text-[15px] font-semibold" : "text-[13px]"}`}>
      <dt className={strong ? "" : "text-muted"}>{label}</dt>
      <span aria-hidden className="mx-2 min-w-4 flex-1 -translate-y-1 border-b border-dotted border-border-field" />
      <dd className="text-right font-mono tabular-nums">{value}</dd>
    </div>
  );
}

/** A panel set on receipt paper, with a torn bottom edge. */
export function Receipt({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`receipt px-5 pt-5 ${className}`}>{children}</div>;
}
