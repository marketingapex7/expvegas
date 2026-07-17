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

export function CardImage({ src, alt, category, sizes, className = "object-cover" }: {
  src?: string;
  alt: string;
  category: keyof typeof categoryIcons;
  sizes: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(!src);
  const Icon = categoryIcons[category] || ImageOff;

  if (failed || !src) {
    return (
      <div role="img" aria-label={`${alt} image unavailable`} className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-fuchsia-950 via-zinc-950 to-amber-950 text-white">
        <Icon className="h-9 w-9 text-amber-200" />
        <span className="mt-3 max-w-[80%] text-center text-xs font-black uppercase tracking-[0.16em] text-white/75">ExperienceVegas</span>
      </div>
    );
  }

  return <Image src={src} alt={alt} fill sizes={sizes} className={className} onError={() => setFailed(true)} />;
}
