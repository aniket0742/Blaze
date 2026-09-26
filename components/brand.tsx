import Link from "next/link";
import { FlameMark } from "./icons";

/**
 * The Blaze wordmark: a serif name and a single vermilion flame, with the
 * "everything, A to Z" line beside it from `md` up. Blaze's own mark — no
 * borrowed logo treatment.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2.5 ${className}`} aria-label="Blaze — home">
      <span className="flex items-center gap-1">
        <FlameMark className="h-5 w-5 text-brand-500 transition-transform duration-300 group-hover:-rotate-6" />
        <span className="font-display text-[26px] font-semibold leading-none tracking-tight">Blaze</span>
      </span>
      <span className="hidden border-l border-border-subtle pl-2.5 text-[11px] leading-tight text-muted md:block">
        everything,
        <br />A to Z
      </span>
    </Link>
  );
}
