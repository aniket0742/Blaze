"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Main image with a thumbnail strip. Thumbnails run horizontally under the
 * image on phones and vertically beside it from `sm` up, so the product stays
 * the largest thing on screen at every width.
 */
export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const selected = images[active] ?? images[0];

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      {images.length > 1 && (
        <ul className="no-scrollbar flex gap-2 overflow-x-auto sm:flex-col sm:overflow-visible">
          {images.map((src, i) => (
            <li key={src} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={i === active}
                className={`relative block h-16 w-16 overflow-hidden rounded-lg border bg-background transition-colors sm:h-20 sm:w-20 ${
                  i === active
                    ? "border-brand-500 ring-1 ring-brand-500"
                    : "border-border-subtle hover:border-brand-300"
                }`}
              >
                <Image src={src} alt="" fill sizes="80px" className="object-contain p-1.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative aspect-square flex-1 overflow-hidden rounded-2xl border border-border-subtle bg-background shadow-card">
        <Image
          src={selected}
          alt={title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 480px"
          className="object-contain p-6"
        />
      </div>
    </div>
  );
}
