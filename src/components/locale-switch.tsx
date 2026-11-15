import { cn } from "@/components/ui";
import type { Locale } from "@/lib/locale";

export function LocaleSwitch({
  locale,
  variant = "light",
}: {
  locale: Locale;
  variant?: "light" | "dark";
}) {
  const dark = variant === "dark";

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-lg border p-0.5",
        dark ? "border-white/15 bg-white/5" : "border-line bg-white",
      )}
    >
      {(["ru", "en"] as Locale[]).map((code) => (
        <a
          key={code}
          href={`/api/locale?to=${code}`}
          className={cn(
            "rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wide transition",
            code === locale
              ? dark
                ? "bg-white/15 text-white"
                : "bg-ink text-white"
              : dark
                ? "text-slate-400 hover:text-white"
                : "text-slate-400 hover:text-ink",
          )}
          aria-pressed={code === locale}
          aria-label={code === "ru" ? "Русский" : "English"}
        >
          {code}
        </a>
      ))}
    </div>
  );
}
