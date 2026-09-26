import { ReceiptSkeleton, Shimmer, TitleSkeleton } from "@/components/skeletons";

export default function CartLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <TitleSkeleton />
      <div className="mt-4 lg:grid lg:grid-cols-[1fr_360px] lg:gap-12">
        <div className="divide-y divide-border-subtle">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex gap-4 py-6">
              <Shimmer className="h-28 w-24 shrink-0 rounded-xl sm:h-32 sm:w-28" />
              <div className="flex-1 space-y-2">
                <Shimmer className="h-2.5 w-20" />
                <Shimmer className="h-4 w-3/4" />
                <Shimmer className="h-3.5 w-24" />
                <Shimmer className="mt-4 h-10 w-32" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <ReceiptSkeleton />
        </div>
      </div>
    </div>
  );
}
