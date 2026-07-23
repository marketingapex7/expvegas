"use client";

import Image from "next/image";
import { Building2, Drama, ImageOff, ShoppingBag, Sparkles, Utensils } from "lucide-react";
import { useState } from "react";

const categoryIcons = {
  hotel: Building2,
  restaurant: Utensils,
  event: Drama,
  attraction: Sparkles,
  free: Sparkles,
  shopping: ShoppingBag,
};

export function CardImage({ src, alt, category, sizes, className = "object-cover", priority = false, fallbackLabel }: {
  src?: string;
  alt: string;
  category: keyof typeof categoryIcons;
  sizes: string;
  className?: string;
  priority?: boolean;
  fallbackLabel?: string | false;
}) {
  const [failed, setFailed] = useState(!src);
  const [loaded, setLoaded] = useState(false);
  const Icon = categoryIcons[category] || ImageOff;
  const fallback = (unavailable: boolean) => (
    <div
      role={unavailable ? "img" : undefined}
      aria-label={unavailable ? `${alt} image unavailable` : undefined}
      aria-hidden={unavailable ? undefined : true}
      className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-white"
    >
      <Icon className="h-9 w-9 text-amber-200" />
      {fallbackLabel !== false ? <span className="mt-3 max-w-[80%] text-center text-xs font-black uppercase tracking-[0.16em] text-white/75">{fallbackLabel || alt}</span> : null}
    </div>
  );

  if (failed || !src) {
    return fallback(true);
  }

  return (
    <>
      {!loaded ? fallback(false) : null}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={`${className} ${loaded ? "opacity-100" : "opacity-0"}`}
        priority={priority}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </>
  );
}
