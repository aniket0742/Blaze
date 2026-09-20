import type { productReviews } from "@/lib/db/schema";
import { formatReviewDate } from "@/lib/format";
import { RatingStars } from "./rating-stars";

type Review = typeof productReviews.$inferSelect;

const STARS = [5, 4, 3, 2, 1];

export function ProductReviews({ reviews, rating }: { reviews: Review[]; rating: number }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-muted">No reviews for this product yet.</p>;
  }

  const counts = new Map(
    STARS.map((s) => [s, reviews.filter((r) => Math.round(r.rating) === s).length]),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold tracking-tight">{rating.toFixed(1)}</span>
          <span className="text-sm text-muted">out of 5</span>
        </div>
        <RatingStars rating={rating} className="mt-1 text-lg" />
        <p className="mt-1 text-[13px] text-muted">
          {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
        </p>

        <ul className="mt-4 space-y-1.5">
          {STARS.map((star) => {
            const n = counts.get(star) ?? 0;
            const pct = Math.round((n / reviews.length) * 100);
            return (
              <li key={star} className="flex items-center gap-2 text-[12px] text-muted">
                <span className="w-10 shrink-0">{star} star</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
                  <span className="block h-full bg-brand-500" style={{ width: `${pct}%` }} />
                </span>
                <span className="w-7 shrink-0 text-right tabular-nums">{n}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <ul className="divide-y divide-border-subtle">
        {reviews.map((review) => (
          <li key={review.id} className="py-4 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <RatingStars rating={review.rating} className="text-sm" />
              <span className="text-sm font-medium">{review.reviewerName}</span>
              <span className="text-[12px] text-muted">
                {formatReviewDate(review.reviewedAt)}
              </span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{review.comment}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
