import Link from "next/link";
import { FlameMark } from "./icons";
import { button } from "./ui";

type Props = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  /** A second, quieter way out. */
  secondaryHref?: string;
  secondaryLabel?: string;
};

/** The one shape for "nothing here": a quiet mark, a serif line, a way on. */
export function EmptyState({ title, description, actionHref, actionLabel, secondaryHref, secondaryLabel }: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-border-field px-6 py-16 text-center">
      <FlameMark className="mx-auto h-7 w-7 text-border-field" />
      <p className="mt-4 font-display text-2xl tracking-tight">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-muted">{description}</p>
      {(actionHref || secondaryHref) && (
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {actionHref && actionLabel && (
            <Link href={actionHref} className={button("primary")}>
              {actionLabel}
            </Link>
          )}
          {secondaryHref && secondaryLabel && (
            <Link href={secondaryHref} className={button("secondary")}>
              {secondaryLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
