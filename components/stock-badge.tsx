const STYLES: Record<string, string> = {
  "In Stock": "text-emerald-700 dark:text-emerald-400",
  "Low Stock": "text-amber-700 dark:text-amber-400",
  "Out of Stock": "text-muted",
};

export function StockBadge({ status, stock }: { status: string; stock: number }) {
  const label = status === "Low Stock" ? `Only ${stock} left` : status;
  return <span className={`text-xs font-medium ${STYLES[status] ?? "text-muted"}`}>{label}</span>;
}
