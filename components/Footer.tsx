import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 px-5 py-10 text-sm text-white/55">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p>&copy; {new Date().getFullYear()} ExperienceVegas.com</p>
        <div className="flex gap-5">
          <Link href="/planner" className="hover:text-white">Planner</Link>
          <Link href="/tonight" className="hover:text-white">Tonight</Link>
          <Link href="/this-weekend" className="hover:text-white">This Weekend</Link>
        </div>
      </div>
    </footer>
  );
}
