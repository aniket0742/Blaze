import { Shimmer } from "@/components/skeletons";

export default function CartLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Shimmer className="h-8 w-40 sm:h-9" />

      <div className="mt-5 lg:grid lg:grid-cols-[1fr_340px] lg:gap-6">
        <div className="space-y-4 rounded-2xl border border-border-subtle p-4 sm:p-5">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex gap-3 sm:gap-4">
              <Shimmer className="h-20 w-20 shrink-0 rounded-xl sm:h-24 sm:w-24" />
              <div className="flex-1 space-y-2">
                <Shimmer className="h-2.5 w-20" />
                <Shimmer className="h-3.5 w-3/4" />
                <Shimmer className="h-4 w-24" />
                <Shimmer className="h-9 w-32 rounded-full" />
              </div>
            </div>
          ))}
        </div>
        <Shimmer className="mt-5 h-64 rounded-2xl lg:mt-0" />
      </div>
    </div>
  );
}
