import Link from "next/link";
import { Drama, Laugh, Music, Sparkles, Trophy, WalletCards } from "lucide-react";
import { categories } from "@/data/nav";

const iconMap = {
  Shows: Drama,
  Comedy: Laugh,
  Sports: Trophy,
  Concerts: Music,
  Attractions: Sparkles,
  "Cheap Things To Do": WalletCards,
};

export function CategoryGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <Link key={category.href} href={category.href} className="group rounded-lg border border-white/10 bg-white/[0.055] p-5 transition hover:-translate-y-1 hover:border-amber-100/30 hover:bg-white/[0.09] sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-black/25 text-amber-100">
              {(() => {
                const Icon = iconMap[category.title as keyof typeof iconMap] ?? Sparkles;
                return <Icon className="h-5 w-5" />;
              })()}
            </span>
            <span className="h-px w-16 bg-gradient-to-r from-amber-100/70 to-transparent transition group-hover:w-24" />
          </div>
          <h3 className="text-2xl font-black leading-tight text-white">{category.title}</h3>
          <p className="mt-3 leading-7 text-white/65">{category.description}</p>
          <p className="mt-5 text-sm font-black text-amber-100">Browse {category.title}</p>
        </Link>
      ))}
    </div>
  );
}
