import { Shimmer } from "@/components/skeletons";

export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Shimmer className="h-3.5 w-56" />

      <div className="mt-4 grid gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <div className="flex gap-2 sm:flex-col">
            {Array.from({ length: 4 }, (_, i) => (
              <Shimmer key={i} className="h-16 w-16 sm:h-20 sm:w-20" />
            ))}
          </div>
          <Shimmer className="aspect-square flex-1 rounded-2xl" />
        </div>

        <div className="space-y-3 lg:max-w-lg">
          <Shimmer className="h-3 w-24" />
          <Shimmer className="h-8 w-full sm:h-9" />
          <Shimmer className="h-4 w-40" />
          <Shimmer className="h-9 w-48" />
          <Shimmer className="h-20 w-full rounded-xl" />
          <Shimmer className="h-11 w-32 rounded-xl" />
          <Shimmer className="h-12 w-full rounded-full" />
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Shimmer className="h-48 rounded-2xl" />
        <Shimmer className="h-48 rounded-2xl" />
      </div>
      <Shimmer className="mt-4 h-64 rounded-2xl" />
    </div>
  );
}
