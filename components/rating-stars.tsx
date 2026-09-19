/** Star row with a partially filled star for the fractional part. */
export function RatingStars({ rating, className = "" }: { rating: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  return (
    <span
      className={`relative inline-block align-middle ${className}`}
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5`}
    >
      <span className="text-border-subtle">★★★★★</span>
      <span
        className="absolute inset-0 overflow-hidden whitespace-nowrap text-brand-500"
        style={{ width: `${pct}%` }}
        aria-hidden
      >
        ★★★★★
      </span>
    </span>
  );
}
