import Image from "next/image";
import Link from "next/link";

type Props = {
  slug: string;
  name: string;
  heroImage: string | null;
  productCount: number;
};

export function CategoryCard({ slug, name, heroImage, productCount }: Props) {
  return (
    <Link
      href={`/category/${slug}`}
      className="group flex items-center gap-3 rounded-2xl border border-border-subtle bg-background p-3 transition-colors hover:border-brand-300 hover:bg-surface"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface">
        {heroImage && (
          <Image
            src={heroImage}
            alt=""
            fill
            sizes="56px"
            className="object-contain p-1.5 transition-transform group-hover:scale-110"
          />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="text-xs text-muted">
          {productCount} {productCount === 1 ? "item" : "items"}
        </p>
      </div>
    </Link>
  );
}
