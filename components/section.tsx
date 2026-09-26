import Link from "next/link";
import { ArrowIcon } from "./icons";

type Props = {
  id?: string;
  /** The section's number in the issue — "01", "02"… Purely editorial. */
  index?: string;
  title: string;
  dek?: string;
  href?: string;
  hrefLabel?: string;
  children: React.ReactNode;
};

/** A numbered section of the home page, set like a magazine department. */
export function Section({ id, index, title, dek, href, hrefLabel, children }: Props) {
  return (
    <section id={id} className="scroll-mt-32 border-t border-foreground pt-5">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex items-baseline gap-4">
          {index && (
            <span aria-hidden className="font-mono text-[13px] text-muted">
              {index}
            </span>
          )}
          <div>
            <h2 className="font-display text-3xl leading-none tracking-tight sm:text-4xl">{title}</h2>
            {dek && <p className="mt-2 max-w-xl text-[14px] text-muted">{dek}</p>}
          </div>
        </div>
        {href && hrefLabel && (
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 text-sm font-medium underline decoration-border-field underline-offset-4 transition-colors hover:decoration-foreground"
          >
            {hrefLabel}
            <ArrowIcon />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
