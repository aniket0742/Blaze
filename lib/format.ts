const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Money is stored as integer paise; display it as whole rupees. */
export function formatPrice(paise: number): string {
  return rupees.format(Math.round(paise / 100));
}

/**
 * DummyJSON ships one of six fixed shipping strings, so this is an exact map
 * rather than string parsing. Values are calendar days.
 */
const SHIPPING_DAYS: Record<string, [number, number]> = {
  "Ships overnight": [1, 1],
  "Ships in 1-2 business days": [1, 2],
  "Ships in 3-5 business days": [3, 5],
  "Ships in 1 week": [7, 7],
  "Ships in 2 weeks": [14, 14],
  "Ships in 1 month": [30, 30],
};

const dayMonth = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });
const weekdayDayMonth = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

function addDays(from: Date, days: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * A concrete arrival date, shown early and everywhere. Amazon buries this
 * until you are deep in the funnel; we put it on the card.
 */
export function deliveryEstimate(shippingInformation: string, from: Date = new Date()): string {
  const range = SHIPPING_DAYS[shippingInformation];
  if (!range) return shippingInformation;

  const [min, max] = range;
  if (min === max) return `Arrives ${weekdayDayMonth.format(addDays(from, min))}`;
  return `Arrives ${dayMonth.format(addDays(from, min))} – ${dayMonth.format(addDays(from, max))}`;
}

export function discountLabel(discountPercentage: number): string {
  return `${Math.round(discountPercentage)}% off`;
}

const reviewDate = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatReviewDate(date: Date): string {
  return reviewDate.format(date);
}
