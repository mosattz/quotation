import { useI18n } from "../i18n/i18n";

export default function LanguageToggle({ compact = false }) {
  const { lang, setLang } = useI18n();
  return (
    <div
      className={`inline-flex items-center rounded-xl border border-slate-200 bg-white/80 p-1 shadow-sm ${
        compact ? "text-[11px]" : "text-xs"
      }`}
      aria-label="Language toggle"
    >
      <button
        type="button"
        onClick={() => setLang("sw")}
        className={`rounded-lg px-2 py-1 font-semibold transition ${
          lang === "sw"
            ? "bg-emerald-700 text-white"
            : "text-slate-700 hover:bg-slate-100"
        }`}
      >
        SW
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`rounded-lg px-2 py-1 font-semibold transition ${
          lang === "en"
            ? "bg-emerald-700 text-white"
            : "text-slate-700 hover:bg-slate-100"
        }`}
      >
        EN
      </button>
    </div>
  );
}

