import { Shimmer } from "@/components/skeletons";

export default function OrderDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <Shimmer className="h-3.5 w-28" />

      <div className="mt-3 flex flex-wrap justify-between gap-3">
        <div className="space-y-2">
          <Shimmer className="h-8 w-52 sm:h-9" />
          <Shimmer className="h-3.5 w-32" />
        </div>
        <div className="space-y-2">
          <Shimmer className="h-2.5 w-24" />
          <Shimmer className="h-4 w-36" />
        </div>
      </div>

      <Shimmer className="mt-3 h-7 w-28 rounded-full" />

      <div className="mt-5 lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-6">
        <div className="space-y-4 rounded-2xl border border-border-subtle p-4 sm:p-5">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="flex gap-3 sm:gap-4">
              <Shimmer className="h-16 w-16 shrink-0 rounded-xl sm:h-20 sm:w-20" />
              <div className="flex-1 space-y-2">
                <Shimmer className="h-2.5 w-20" />
                <Shimmer className="h-3.5 w-3/4" />
                <Shimmer className="h-3.5 w-28" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-4 lg:mt-0">
          <Shimmer className="h-40 rounded-2xl" />
          <Shimmer className="h-52 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
