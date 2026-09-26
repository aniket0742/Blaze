import { ReceiptSkeleton, TitleSkeleton } from "@/components/skeletons";

export default function OrdersLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
      <TitleSkeleton />
      <div className="mt-8 space-y-6">
        <ReceiptSkeleton />
        <ReceiptSkeleton />
      </div>
    </div>
  );
}
