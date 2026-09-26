import { EmptyState } from "@/components/empty-state";

export default function ProductNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <EmptyState
        title="We couldn't find that product"
        description="It may have left the catalog, or the link may be wrong. Search the shelves to find something close."
        actionHref="/search"
        actionLabel="Search the shelves"
        secondaryHref="/#aisles"
        secondaryLabel="Browse the aisles"
      />
    </div>
  );
}
