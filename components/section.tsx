import Link from "next/link";

type Props = {
  id?: string;
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  /** Render inside a white module card instead of bare on the page. */
  card?: boolean;
  children: React.ReactNode;
};

export function Section({ id, title, description, href, hrefLabel, card, children }: Props) {
  return (
    <section
      id={id}
      className={
        card
          ? "scroll-mt-36 rounded-2xl border border-border-subtle bg-background p-4 shadow-card sm:p-5"
          : "scroll-mt-36"
      }
    >
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
        </div>
        {href && hrefLabel && (
          <Link
            href={href}
            className="shrink-0 text-[13px] font-medium text-brand-600 hover:underline"
          >
            {hrefLabel} →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
