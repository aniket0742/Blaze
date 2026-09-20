import { Shimmer } from "@/components/skeletons";

export default function OrdersLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <Shimmer className="h-8 w-48 sm:h-9" />

      <div className="mt-5 space-y-4">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-border-subtle">
            <div className="flex flex-wrap gap-x-6 gap-y-3 border-b border-border-subtle bg-surface px-4 py-3 sm:px-5">
              {Array.from({ length: 4 }, (_, j) => (
                <div key={j} className="space-y-1.5">
                  <Shimmer className="h-2.5 w-16" />
                  <Shimmer className="h-3.5 w-24" />
                </div>
              ))}
            </div>
            <div className="space-y-3 px-4 py-4 sm:px-5">
              <Shimmer className="h-6 w-28 rounded-full" />
              <div className="flex gap-2">
                {Array.from({ length: 3 }, (_, j) => (
                  <Shimmer key={j} className="h-14 w-14 rounded-lg" />
                ))}
              </div>
              <Shimmer className="h-3.5 w-2/3" />
              <Shimmer className="h-9 w-40 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
