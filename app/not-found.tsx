import { EmptyState } from "@/components/empty-state";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <EmptyState
        title="We couldn't find that page"
        description="The link may be wrong, or the page may not exist yet."
        actionHref="/"
        actionLabel="Back to home"
      />
    </div>
  );
}
