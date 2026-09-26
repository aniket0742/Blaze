import { EmptyState } from "@/components/empty-state";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <EmptyState
        title="We couldn't find that page"
        description="The link may be wrong, or the page may not exist."
        actionHref="/"
        actionLabel="Back to home"
        secondaryHref="/#aisles"
        secondaryLabel="Browse the aisles"
      />
    </div>
  );
}
