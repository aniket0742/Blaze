import { ReceiptSkeleton, Shimmer, TitleSkeleton } from "@/components/skeletons";

export default function OrderDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
      <Shimmer className="h-3.5 w-28" />
      <div className="mt-6">
        <TitleSkeleton />
      </div>
      <div className="mt-8 lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-12">
        <div className="divide-y divide-border-subtle border-y border-border-subtle">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="flex gap-4 py-5">
              <Shimmer className="h-24 w-20 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Shimmer className="h-2.5 w-20" />
                <Shimmer className="h-4 w-3/4" />
                <Shimmer className="h-3 w-28" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 lg:mt-0">
          <ReceiptSkeleton />
        </div>
      </div>
    </div>
  );
}
