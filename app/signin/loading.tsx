import { Shimmer } from "@/components/skeletons";

export default function AuthLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-center lg:gap-20">
        <div className="hidden lg:block">
          <Shimmer className="h-12 w-full max-w-md" />
          <Shimmer className="mt-3 h-12 w-2/3" />
          <Shimmer className="mt-5 h-4 w-80" />
        </div>
        <div>
          <Shimmer className="h-3 w-24" />
          <Shimmer className="mt-3 h-10 w-40" />
          <Shimmer className="mt-6 h-16 w-full" />
          <Shimmer className="mt-4 h-16 w-full" />
          <Shimmer className="mt-4 h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
