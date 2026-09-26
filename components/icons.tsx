type IconProps = { className?: string };

const base = "h-5 w-5 shrink-0";

export function SearchIcon({ className = "" }: IconProps) {
  return (
    <svg className={`${base} ${className}`} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="5.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="m13.25 13.25 3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function UserIcon({ className = "" }: IconProps) {
  return (
    <svg className={`${base} ${className}`} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="6.75" r="3.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 17c.6-3 3.1-4.75 6-4.75S15.4 14 16 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** A market bag — "bag" rather than "cart" is part of Blaze's voice. */
export function BagIcon({ className = "" }: IconProps) {
  return (
    <svg className={`${base} ${className}`} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M4.25 7h11.5l-.8 9.1a1.25 1.25 0 0 1-1.25 1.15h-7.4a1.25 1.25 0 0 1-1.25-1.15L4.25 7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M7.25 7V5.75a2.75 2.75 0 0 1 5.5 0V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function MenuIcon({ className = "" }: IconProps) {
  return (
    <svg className={`${base} ${className}`} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M3.5 6.5h13M3.5 13.5h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ArrowIcon({ className = "" }: IconProps) {
  return (
    <svg className={`h-4 w-4 shrink-0 ${className}`} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Blaze's mark: a single flame. */
export function FlameMark({ className = "" }: IconProps) {
  return (
    <svg className={`shrink-0 ${className}`} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12.4 2.2c.8 3.3 4.6 5.7 4.6 10.6a5 5 0 0 1-10 .1c0-2.3 1.1-4 2.5-5.3.3 1.6 1 2.6 2.1 3-.6-2.9-.3-5.8.8-8.4Z"
      />
    </svg>
  );
}
