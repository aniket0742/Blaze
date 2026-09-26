const wholeRupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const rupeesAndPaise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Money is stored as integer paise. Whole rupees display as `₹120`; anything
 * else keeps its paise, `₹3,766.68`, because a real shelf price is shown as it
 * was recorded — and because rounding each line separately would let a cart
 * show lines that do not add up to its total.
 */
export function formatPrice(paise: number): string {
  return paise % 100 === 0 ? wholeRupees.format(paise / 100) : rupeesAndPaise.format(paise / 100);
}

/** Whole-percent saving against the MRP, or 0 when there is none. */
export function discountPercent(pricePaise: number, mrpPaise: number): number {
  if (mrpPaise <= pricePaise || mrpPaise <= 0) return 0;
  return Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100);
}

export function discountLabel(pricePaise: number, mrpPaise: number): string {
  return `${discountPercent(pricePaise, mrpPaise)}% off`;
}

const dayMonthYear = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** When an order was placed: "20 Sep 2026". */
export function formatOrderDate(date: Date): string {
  return dayMonthYear.format(date);
}

const calendarDate = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * A calendar date with no time, such as "2025-09-13", as "13 Sep 2025". Read
 * in UTC so the day never shifts with the server's timezone.
 */
export function formatCalendarDate(isoDate: string): string {
  return calendarDate.format(new Date(`${isoDate}T00:00:00Z`));
}
