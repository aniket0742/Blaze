import Link from "next/link";

type Props = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function EmptyState({ title, description, actionHref, actionLabel }: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-border-subtle px-6 py-16 text-center">
      <p className="text-base font-medium">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{description}</p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-6 inline-flex rounded-full bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
