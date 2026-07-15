export function SectionHeader({ eyebrow, title, description, theme = "dark" }: { eyebrow?: string; title: string; description?: string; theme?: "dark" | "light" }) {
  return (
    <div className="mb-8 max-w-3xl">
      {eyebrow ? <p className={`mb-3 text-xs font-black uppercase tracking-[0.35em] ${theme === "light" ? "text-fuchsia-700" : "text-fuchsia-200"}`}>{eyebrow}</p> : null}
      <h2 className={`text-3xl font-black tracking-tight md:text-5xl ${theme === "light" ? "text-zinc-950" : "text-white"}`}>{title}</h2>
      {description ? <p className={`mt-4 text-lg leading-8 ${theme === "light" ? "text-zinc-600" : "text-white/65"}`}>{description}</p> : null}
    </div>
  );
}
