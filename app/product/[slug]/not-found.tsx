import { EmptyState } from "@/components/empty-state";

export default function ProductNotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <EmptyState
        title="We couldn't find that product"
        description="It may have sold out or the link may be wrong. Search the catalog to find something close."
        actionHref="/search"
        actionLabel="Browse all products"
      />
    </div>
  );
}
