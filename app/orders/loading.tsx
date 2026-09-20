import { Shimmer } from "@/components/skeletons";

export default function OrdersLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Shimmer className="h-8 w-48 sm:h-9" />
      <Shimmer className="mt-5 h-56 rounded-2xl" />
    </div>
  );
}
