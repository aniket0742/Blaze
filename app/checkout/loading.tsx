import { Shimmer } from "@/components/skeletons";

export default function CheckoutLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <Shimmer className="h-8 w-40 sm:h-9" />

      <div className="mt-5 lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-6">
        <div className="space-y-4">
          <div className="space-y-3 rounded-2xl border border-border-subtle p-4 sm:p-5">
            <Shimmer className="h-3.5 w-32" />
            {Array.from({ length: 4 }, (_, i) => (
              <Shimmer key={i} className="h-11 w-full rounded-xl" />
            ))}
          </div>
          <Shimmer className="h-52 rounded-2xl" />
          <Shimmer className="ml-auto h-12 w-full rounded-full sm:w-56" />
        </div>

        <Shimmer className="mt-5 h-80 rounded-2xl lg:mt-0" />
      </div>
    </div>
  );
}
