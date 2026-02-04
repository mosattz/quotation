import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductRow from "../components/ProductRow";
import Spinner from "../components/Spinner";
import { apiGet, apiPost } from "../api/api";
import { clearAuth } from "../utils/auth";
import { useI18n } from "../i18n/i18n";
import { useTheme } from "../theme/theme";

const RECENT_KEY = "quotation_recent_items";

export default function CreateJob() {
  const navigate = useNavigate();
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const [items, setItems] = useState([]);
  const isAdmin = false;
  const [tab, setTab] = useState("order");
  const [form, setForm] = useState({
    zone: "",
    customerName: "",
    distanceValue: "",
    distanceUnit: "m",
    pipeSizeValue: "",
    pipeSizeUnit: "cm",
  });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [recentItems, setRecentItems] = useState(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addItem = () => {
    setItems([...items, { name: "", qty: 0, unit: "", price: 0 }]);
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  const addRecent = (entry) => {
    if (!entry?.name) return;
    setRecentItems((prev) => {
      const next = [
        { name: entry.name, unit: entry.unit || "" },
        ...prev.filter(
          (item) =>
            item.name.toLowerCase() !== entry.name.toLowerCase() ||
            String(item.unit || "").toLowerCase() !==
              String(entry.unit || "").toLowerCase()
        ),
      ].slice(0, 8);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  };

  const validateForm = () => {
    if (
      !form.zone ||
      !form.customerName ||
      !form.distanceValue ||
      !form.distanceUnit ||
      !form.pipeSizeValue ||
      !form.pipeSizeUnit
    ) {
      return t("tech.validationRequired");
    }
    if (
      Number.isNaN(Number(form.distanceValue)) ||
      Number.isNaN(Number(form.pipeSizeValue))
    ) {
      return t("tech.validationNumeric");
    }
    if (!items.length) {
      return t("tech.validationItems");
    }
    const invalid = items.find(
      (item) =>
        !String(item.name || "").trim() ||
        !String(item.unit || "").trim() ||
        !Number(item.qty || 0)
    );
    if (invalid) {
      return t("tech.validationItemFields");
    }
    return "";
  };

  const handleSave = async () => {
    setStatus({ type: "", message: "" });
    if (tab !== "order") return;
    const errorMessage = validateForm();
    if (errorMessage) {
      setStatus({ type: "error", message: errorMessage });
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      const distance = `${form.distanceValue} ${form.distanceUnit}`.trim();
      const pipeSize = `${form.pipeSizeValue} ${form.pipeSizeUnit}`.trim();
      await apiPost("/api/orders", {
        zone: form.zone,
        customerName: form.customerName,
        distance,
        pipeSize,
        items,
      });
      items.forEach((entry) => addRecent(entry));
      setStatus({ type: "success", message: t("tech.statusSuccess") });
    } catch (error) {
      setStatus({ type: "error", message: t("tech.statusFail") });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[var(--ui-bg)]">
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 px-6 py-6 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-slate-800 dark:bg-[var(--ui-card)]/95 md:w-64 md:border-b-0 md:border-r md:px-5 md:py-8 md:backdrop-blur-none md:supports-[backdrop-filter]:bg-white md:dark:supports-[backdrop-filter]:bg-[var(--ui-card)]">
          <div className="mb-8">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {t("tech.title")}
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t("tech.subtitle")}
            </p>
          </div>
          <div className="flex flex-row gap-2 md:flex-col">
            <button
              type="button"
              onClick={() => setTab("order")}
              className={`flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition md:w-full md:text-left ${
                tab === "order"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {t("tech.orderDetails")}
            </button>
            <button
              type="button"
              onClick={() => setTab("settings")}
              className={`flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition md:w-full md:text-left ${
                tab === "settings"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {t("settings.title")}
            </button>
            <button
              onClick={handleSave}
              disabled={submitting || tab !== "order"}
              className={`flex-1 rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70 md:w-full md:text-left ${
                tab !== "order"
                  ? "bg-slate-200 text-slate-500"
                  : "bg-emerald-700 text-white hover:bg-emerald-800"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                {submitting && <Spinner size={14} />}
                {t("common.submit")}
              </span>
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-[var(--ui-card)] dark:text-slate-200 dark:hover:bg-slate-900 md:w-full md:text-left"
            >
              {t("common.logout")}
            </button>
          </div>
        </aside>

        <main className="flex min-h-screen flex-1 flex-col px-6 py-8 text-slate-900 dark:text-slate-100">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {tab === "settings" ? t("settings.title") : t("tech.orderDetails")}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {tab === "settings" ? t("settings.subtitle") : t("tech.orderDetailsSub")}
            </p>
          </div>

          {tab === "settings" && (
            <div className="card-surface rounded-2xl p-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {t("common.language")}
                  </label>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {t("settings.languageHelp")}
                  </p>
                  <div className="mt-4 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-[var(--ui-card)]">
                <button
                  type="button"
                  onClick={() => setLang("sw")}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    lang === "sw"
                      ? "bg-emerald-700 text-white"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                  }`}
                >
                  {t("common.swahili")}
                </button>
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    lang === "en"
                      ? "bg-emerald-700 text-white"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                  }`}
                >
                  {t("common.english")}
                </button>
              </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {t("settings.theme")}
                  </label>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {t("settings.themeHelp")}
                  </p>
                  <div className="mt-4 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-[var(--ui-card)]">
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                        theme === "light"
                          ? "bg-emerald-700 text-white"
                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                      }`}
                    >
                      {t("settings.light")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                        theme === "dark"
                          ? "bg-emerald-700 text-white"
                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                      }`}
                    >
                      {t("settings.dark")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab !== "settings" && (
            <>
          {status.message && (
            <div
              className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
                status.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {status.message}
            </div>
          )}

          {/* Google-Forms Style Fields */}
        <div className="mb-8 space-y-4">
            <div className="card-surface rounded-xl px-4 py-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                {t("tech.zoneLabel")}<span className="text-rose-500"> *</span>
              </label>
              <select
                className="mt-3 w-full max-w-[220px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-900"
                value={form.zone}
                onChange={(e) => updateForm("zone", e.target.value)}
              >
                <option value="">{t("tech.choose")}</option>
                <option>CHALINZE</option>
                <option>LUGOBA</option>
                <option>MSOGA</option>
                <option>MIONO</option>
                <option>MDAULA</option>
                <option>MBWEWE</option>
                <option>KIWANGWA</option>
                <option>MSATA</option>
              </select>
            </div>

            <div className="card-surface rounded-xl px-4 py-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                {t("tech.customerLabel")}<span className="text-rose-500"> *</span>
              </label>
              <input
                className="mt-3 w-full border-b border-slate-200 bg-transparent pb-2 text-sm text-slate-800 outline-none transition focus:border-slate-900"
                placeholder="Your answer"
                value={form.customerName}
                onChange={(e) => updateForm("customerName", e.target.value)}
              />
            </div>

            <div className="card-surface rounded-xl px-4 py-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                {t("tech.distanceLabel")}<span className="text-rose-500"> *</span>
              </label>
              <div className="mt-3 flex items-center gap-3">
                <input
                  inputMode="decimal"
                  className="w-full border-b border-slate-200 bg-transparent pb-2 text-sm text-slate-800 outline-none transition focus:border-slate-900"
                  placeholder={t("tech.enterNumber")}
                  value={form.distanceValue}
                  onChange={(e) => updateForm("distanceValue", e.target.value)}
                />
                <select
                  className="w-28 rounded-md border border-slate-200 bg-white px-2 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-900"
                  value={form.distanceUnit}
                  onChange={(e) => updateForm("distanceUnit", e.target.value)}
                >
                  <option value="m">m</option>
                  <option value="cm">cm</option>
                  <option value="km">km</option>
                  <option value="ft">ft</option>
                </select>
              </div>
            </div>

            <div className="card-surface rounded-xl px-4 py-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                {t("tech.pipeSizeLabel")}<span className="text-rose-500"> *</span>
              </label>
              <div className="mt-3 flex items-center gap-3">
                <input
                  inputMode="decimal"
                  className="w-full border-b border-slate-200 bg-transparent pb-2 text-sm text-slate-800 outline-none transition focus:border-slate-900"
                  placeholder={t("tech.enterNumber")}
                  value={form.pipeSizeValue}
                  onChange={(e) => updateForm("pipeSizeValue", e.target.value)}
                />
                <select
                  className="w-28 rounded-md border border-slate-200 bg-white px-2 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-900"
                  value={form.pipeSizeUnit}
                  onChange={(e) => updateForm("pipeSizeUnit", e.target.value)}
                >
                  <option value="mm">mm</option>
                  <option value="cm">cm</option>
                  <option value="m">m</option>
                  <option value="inch">inch</option>
                </select>
              </div>
            </div>
        </div>

        {/* Items Table */}
        <div className="card-surface overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-sm font-semibold text-slate-700">
              {t("tech.itemsTitle")}
            </h2>
            <button
              onClick={addItem}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-800"
            >
              {t("tech.addItem")}
            </button>
          </div>
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed text-sm">
            <colgroup>
              <col className={isAdmin ? "w-1/2" : "w-1/2"} />
              {isAdmin && <col className="w-1/6" />}
              {isAdmin && <col className="w-1/6" />}
              {!isAdmin && <col className="w-1/6" />}
              <col className={isAdmin ? "w-1/6" : "w-1/3"} />
            </colgroup>
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3">Item</th>
                {isAdmin && <th className="px-6 py-3">Unit</th>}
                {isAdmin && <th className="px-6 py-3 text-right">Price (VAT)</th>}
                {!isAdmin && <th className="px-6 py-3">Unit</th>}
                <th className="px-6 py-3 text-right">Qty</th>
              </tr>
            </thead>

              <tbody className="divide-y divide-slate-100">
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={isAdmin ? 4 : 3}
                      className="px-6 py-10 text-center text-sm text-slate-500"
                    >
                      {t("tech.noItems")}
                    </td>
                  </tr>
                )}
                {items.map((item, index) => (
                  <ProductRow
                    key={index}
                    item={item}
                    index={index}
                    items={items}
                    setItems={setItems}
                    products={[]}
                    isAdmin={isAdmin}
                    recentItems={recentItems}
                    onSelectRecent={addRecent}
                    fetchSuggestions={async (query) =>
                      apiGet(`/api/items?query=${encodeURIComponent(query)}`)
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="card-surface rounded-2xl p-6 text-sm text-slate-600 lg:max-w-md">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">
              {t("tech.notesTitle")}
            </h3>
            <p>
              {t("tech.notesBody")}
            </p>
          </div>
        </div>

        <footer className="mt-auto border-t border-slate-200 bg-white px-6 py-4 text-xs text-slate-500">
          <div className="flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
            <div>Developer: Mohamed Said Shango</div>
            <div>Location: UDOM, Dodoma</div>
            <div className="max-w-full break-words">
              Phone: 0615082570 / 0750690012 · Email:
              mosatgentlemedy@gmail.com / montanafrenv@gmail.com
            </div>
          </div>
        </footer>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
