import Image from "next/image";
import Link from "next/link";

type Category = {
  slug: string;
  name: string;
  heroImage: string | null;
  productCount: number;
};

/**
 * Image-forward category row. Scrolls horizontally on every breakpoint so the
 * full catalog breadth sits in one band rather than a multi-row grid.
 */
export function CategoryStrip({ categories }: { categories: Category[] }) {
  return (
    <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {categories.map((c) => (
        <li key={c.slug} className="w-[92px] shrink-0 snap-start sm:w-[104px]">
          <Link href={`/category/${c.slug}`} className="group block text-center">
            <div className="relative aspect-square overflow-hidden rounded-xl border border-border-subtle bg-background shadow-card transition-shadow group-hover:shadow-lift">
              {c.heroImage && (
                <Image
                  src={c.heroImage}
                  alt=""
                  fill
                  sizes="104px"
                  className="object-contain p-2.5 transition-transform duration-300 group-hover:scale-110"
                />
              )}
            </div>
            <p className="mt-1.5 truncate text-[12px] font-medium leading-tight">{c.name}</p>
            <p className="text-[11px] text-muted">{c.productCount}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
