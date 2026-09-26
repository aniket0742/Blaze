"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * The pack shot, large, on a paper-toned well — with the front, ingredients,
 * nutrition and packaging photographs Open Food Facts has as thumbnails below.
 */
export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const selected = images[active] ?? images[0];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface sm:aspect-[5/4] lg:aspect-square">
        <Image
          src={selected}
          alt={title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 600px"
          className="object-contain p-8 mix-blend-multiply sm:p-12"
        />
      </div>

      {images.length > 1 && (
        <ul className="no-scrollbar mt-2 flex gap-2 overflow-x-auto p-1">
          {images.map((src, i) => (
            <li key={src} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show photo ${i + 1} of ${images.length}`}
                aria-current={i === active}
                className={`relative block h-20 w-20 overflow-hidden rounded-lg bg-surface transition ${
                  i === active ? "ring-2 ring-foreground ring-offset-2 ring-offset-page" : "opacity-70 hover:opacity-100"
                }`}
              >
                <Image src={src} alt="" fill sizes="80px" className="object-contain p-2 mix-blend-multiply" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
