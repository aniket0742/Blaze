import Link from "next/link";

type Props = {
  id?: string;
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  children: React.ReactNode;
};

export function Section({ id, title, description, href, hrefLabel, children }: Props) {
  return (
    <section id={id} className="scroll-mt-20 py-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        {href && hrefLabel && (
          <Link
            href={href}
            className="shrink-0 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            {hrefLabel}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
