import { Shimmer } from "@/components/skeletons";

export default function AuthLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto w-full max-w-sm">
        <Shimmer className="h-8 w-40" />
        <Shimmer className="mt-2 h-3.5 w-64" />
        <Shimmer className="mt-5 h-64 rounded-2xl" />
      </div>
    </div>
  );
}
