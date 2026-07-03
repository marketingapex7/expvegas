export function SectionHeader({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <div className="mb-8 max-w-3xl">
      {eyebrow ? <p className="mb-3 text-xs font-black uppercase tracking-[0.35em] text-fuchsia-200">{eyebrow}</p> : null}
      <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl">{title}</h2>
      {description ? <p className="mt-4 text-lg leading-8 text-white/65">{description}</p> : null}
    </div>
  );
}
