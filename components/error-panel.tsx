"use client";

import Link from "next/link";
import { FlameMark } from "./icons";
import { button } from "./ui";

type Props = {
  title: string;
  description: string;
  reset: () => void;
  href: string;
  hrefLabel: string;
};

/**
 * Every route's error boundary renders this, so a failure looks and reads
 * the same everywhere: what happened, that nothing was lost, and two ways on.
 */
export function ErrorPanel({ title, description, reset, href, hrefLabel }: Props) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <FlameMark className="mx-auto h-8 w-8 text-border-field" />
      <h1 className="mt-5 font-display text-4xl tracking-tight">{title}</h1>
      <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-muted">{description}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={reset} className={button("primary")}>
          Try again
        </button>
        <Link href={href} className={button("secondary")}>
          {hrefLabel}
        </Link>
      </div>
    </div>
  );
}
