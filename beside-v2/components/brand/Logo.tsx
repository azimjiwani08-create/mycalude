/**
 * Lowercase "beside" in Zodiak Regular. The dot over the "i" is drawn separately so it can
 * be a different colour: size the logo with a font-size class and colour the letters with a text class.
 */
export function Logo({ className = "", dotClassName = "bg-pink", as: Tag = "span" }: { className?: string; dotClassName?: string; as?: "span" | "h1" }) {
  return (
    <Tag aria-label="beside" className={`inline-block whitespace-nowrap font-serif leading-none tracking-[-0.02em] ${className}`}>
      <span aria-hidden>
        bes
        <span className="relative inline-block">
          ı
          <span className={`absolute left-1/2 top-[0.055em] size-[0.15em] -translate-x-1/2 rounded-full ${dotClassName}`} />
        </span>
        de
      </span>
    </Tag>
  );
}
