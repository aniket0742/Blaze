import { orderStatus } from "@/lib/orders";

export function OrderStatusBadge({ status }: { status: string }) {
  const { label, className } = orderStatus(status);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[12px] font-medium ${className}`}
    >
      {label}
    </span>
  );
}
