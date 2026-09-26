import { ProductGridSkeleton, Shimmer, TitleSkeleton } from "@/components/skeletons";

export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <TitleSkeleton />
      <div className="mt-8 lg:grid lg:grid-cols-[240px_1fr] lg:gap-10">
        <div className="hidden space-y-3 lg:block">
          {Array.from({ length: 9 }, (_, i) => (
            <Shimmer key={i} className="h-7 w-full" />
          ))}
        </div>
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
