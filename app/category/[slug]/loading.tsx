import { ProductGridSkeleton } from "@/components/skeletons";

export default function CategoryLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="h-4 w-32 animate-pulse rounded bg-surface" />
      <div className="mt-4 h-9 w-64 animate-pulse rounded-lg bg-surface sm:h-11" />
      <div className="mt-8">
        <ProductGridSkeleton count={10} />
      </div>
    </div>
  );
}
