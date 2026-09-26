import { orderStatus } from "@/lib/orders";

export function OrderStatusBadge({ status }: { status: string }) {
  const { label, className } = orderStatus(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium ${className}`}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
