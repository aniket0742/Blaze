import { Shimmer } from "@/components/skeletons";

export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <Shimmer className="h-3 w-56" />
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <Shimmer className="aspect-square rounded-2xl sm:aspect-[5/4] lg:aspect-square" />
        <div className="lg:pt-4">
          <Shimmer className="h-3 w-24" />
          <Shimmer className="mt-3 h-12 w-3/4" />
          <Shimmer className="mt-3 h-4 w-32" />
          <Shimmer className="mt-6 h-12 w-56" />
          <div className="mt-6 border-y border-border-subtle py-5">
            <Shimmer className="h-10 w-40" />
            <Shimmer className="mt-3 h-3.5 w-72" />
          </div>
          <div className="mt-6 flex gap-3">
            <Shimmer className="h-12 w-24" />
            <Shimmer className="h-12 flex-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
