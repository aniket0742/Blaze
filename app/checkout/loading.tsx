import { ReceiptSkeleton, Shimmer, TitleSkeleton } from "@/components/skeletons";

export default function CheckoutLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <TitleSkeleton />
      <div className="mt-8 lg:grid lg:grid-cols-[1fr_380px] lg:items-start lg:gap-12">
        <div>
          <Shimmer className="h-7 w-72" />
          <Shimmer className="mt-8 h-7 w-56" />
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Shimmer key={i} className={`h-16 ${i === 0 || i === 3 ? "sm:col-span-2" : ""}`} />
            ))}
          </div>
          <Shimmer className="mt-8 h-44" />
        </div>
        <div className="mt-10 lg:mt-0">
          <ReceiptSkeleton />
        </div>
      </div>
    </div>
  );
}
