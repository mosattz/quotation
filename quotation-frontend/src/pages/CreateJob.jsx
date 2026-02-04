import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductRow from "../components/ProductRow";
import Spinner from "../components/Spinner";
import { apiGet, apiPost } from "../api/api";
import { clearAuth } from "../utils/auth";

const RECENT_KEY = "quotation_recent_items";

export default function CreateJob() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const isAdmin = false;
  const [form, setForm] = useState({
    zone: "",
    customerName: "",
    distance: "",
    pipeSize: "",
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
    if (!form.zone || !form.customerName || !form.distance || !form.pipeSize) {
      return "Please fill all required fields.";
    }
    if (Number.isNaN(Number(form.distance)) || Number.isNaN(Number(form.pipeSize))) {
      return "Distance and pipe size must be numeric.";
    }
    if (!items.length) {
      return "Please add at least one item.";
    }
    const invalid = items.find(
      (item) =>
        !String(item.name || "").trim() ||
        !String(item.unit || "").trim() ||
        !Number(item.qty || 0)
    );
    if (invalid) {
      return "Each item must have name, unit, and quantity.";
    }
    return "";
  };

  const handleSave = async () => {
    setStatus({ type: "", message: "" });
    const errorMessage = validateForm();
    if (errorMessage) {
      setStatus({ type: "error", message: errorMessage });
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      await apiPost("/api/orders", {
        zone: form.zone,
        customerName: form.customerName,
        distance: form.distance,
        pipeSize: form.pipeSize,
        items,
      });
      items.forEach((entry) => addRecent(entry));
      setStatus({ type: "success", message: "Order submitted." });
    } catch (error) {
      setStatus({ type: "error", message: "Failed to submit order." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-100">
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 px-6 py-6 backdrop-blur supports-[backdrop-filter]:bg-white/80 md:w-64 md:border-b-0 md:border-r md:px-5 md:py-8 md:backdrop-blur-none md:supports-[backdrop-filter]:bg-white">
          <div className="mb-8">
            <h1 className="text-lg font-semibold text-slate-900">
              Technician Dashboard
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Submit customer orders from the field.
            </p>
          </div>
          <div className="flex flex-row gap-2 md:flex-col">
            <button
              onClick={handleSave}
              disabled={submitting}
              className="flex-1 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70 md:w-full md:text-left"
            >
              <span className="inline-flex items-center gap-2">
                {submitting && <Spinner size={14} />}
                Submit
              </span>
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 md:w-full md:text-left"
            >
              Logout
            </button>
          </div>
        </aside>

        <main className="flex min-h-screen flex-1 flex-col px-6 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-slate-900">
              Order Details
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Fill out customer information and requested items.
            </p>
          </div>
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
                ZONE<span className="text-rose-500"> *</span>
              </label>
              <select
                className="mt-3 w-full max-w-[220px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-900"
                value={form.zone}
                onChange={(e) => updateForm("zone", e.target.value)}
              >
                <option value="">Choose</option>
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
                JINA LA MTEJA<span className="text-rose-500"> *</span>
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
                UMBALI TOKA BOMBA KUBWA<span className="text-rose-500"> *</span>
              </label>
              <input
                className="mt-3 w-full border-b border-slate-200 bg-transparent pb-2 text-sm text-slate-800 outline-none transition focus:border-slate-900"
                placeholder="Your answer"
                value={form.distance}
                onChange={(e) => updateForm("distance", e.target.value)}
              />
            </div>

            <div className="card-surface rounded-xl px-4 py-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                SIZE YA BOMBA KUBWA<span className="text-rose-500"> *</span>
              </label>
              <input
                className="mt-3 w-full border-b border-slate-200 bg-transparent pb-2 text-sm text-slate-800 outline-none transition focus:border-slate-900"
                placeholder="Your answer"
                value={form.pipeSize}
                onChange={(e) => updateForm("pipeSize", e.target.value)}
              />
            </div>
        </div>

        {/* Items Table */}
        <div className="card-surface overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-sm font-semibold text-slate-700">
              Orodha ya Vifaa vya Mteja
            </h2>
            <button
              onClick={addItem}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-800"
            >
              + Add Item
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
                      No items yet. Click “Add Item” to get started.
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
              Notes
            </h3>
            <p>
              Add all required items for the job before submitting.
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
        </main>
      </div>
    </div>
  );
}
