import Link from "next/link";
import { categories } from "@/data/nav";

export function CategoryGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <Link key={category.href} href={category.href} className="group rounded-3xl border border-white/10 bg-white/[0.06] p-6 transition hover:-translate-y-1 hover:border-fuchsia-200/25 hover:bg-white/[0.09]">
          <div className="mb-5 h-1.5 w-12 rounded-full bg-fuchsia-300/80 transition group-hover:w-16" />
          <h3 className="text-2xl font-black leading-tight text-white">{category.title}</h3>
          <p className="mt-3 leading-7 text-white/65">{category.description}</p>
          <p className="mt-5 text-sm font-black text-fuchsia-100">Browse {category.title}</p>
        </Link>
      ))}
    </div>
  );
}
