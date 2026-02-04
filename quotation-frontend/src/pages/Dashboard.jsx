import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Spinner from "../components/Spinner";
import { apiDelete, apiGet, apiPut } from "../api/api";
import { clearAuth } from "../utils/auth";
import { useI18n } from "../i18n/i18n";
import { useTheme } from "../theme/theme";
import {
  exportAllOrdersToExcel,
  exportAllOrdersToPdf,
  exportOrderToExcel,
  exportOrderToPdf,
} from "../utils/export";

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("orders");
  const [technicians, setTechnicians] = useState([]);
  const [technicianLoading, setTechnicianLoading] = useState(false);
  const [activeTechnician, setActiveTechnician] = useState(null);
  const [filters, setFilters] = useState({
    customer: "",
    technicianId: "",
    zone: "",
    startDate: "",
    endDate: "",
  });
  const [currentQuery, setCurrentQuery] = useState({});
  const [technicianProfile, setTechnicianProfile] = useState(null);
  const [editOrder, setEditOrder] = useState(null);
  const [editForm, setEditForm] = useState({
    customerName: "",
    zone: "",
    distance: "",
    pipeSize: "",
    items: [],
  });
  const [editSaving, setEditSaving] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [settings, setSettings] = useState({ lang: "sw" });

  const buildQuery = (query) => {
    const params = new URLSearchParams();
    Object.entries(query || {}).forEach(([key, value]) => {
      if (!value) return;
      params.append(key, value);
    });
    const suffix = params.toString();
    return suffix ? `?${suffix}` : "";
  };

  const fetchOrders = async (query = {}) => {
    setLoading(true);
    try {
      const data = await apiGet(`/api/orders${buildQuery(query)}`);
      setJobs(data);
      setCurrentQuery(query);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchTechnicians = async () => {
    setTechnicianLoading(true);
    try {
      const data = await apiGet("/api/technicians");
      setTechnicians(data);
    } catch (error) {
      console.error(error);
    } finally {
      setTechnicianLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnicians();
  }, []);

  useEffect(() => {
    if (tab !== "technicians") return;
    fetchTechnicians();
  }, [tab]);

  const totals = useMemo(
    () => ({
      jobs: jobs.length,
      items: jobs.reduce((sum, job) => sum + (job.item_count || 0), 0),
    }),
    [jobs]
  );

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatTechnicianEmail = (email) => {
    const value = String(email || "").trim();
    if (!value) return "—";
    // Technicians can submit orders without accounts; backend may create a "shadow" user record.
    if (value.endsWith("@quotation.local")) return "—";
    return value;
  };

  const applyFilters = async () => {
    setActiveTechnician(null);
    setFilterLoading(true);
    await fetchOrders(filters);
    setFilterLoading(false);
  };

  const clearFilters = async () => {
    setFilters({
      customer: "",
      technicianId: "",
      zone: "",
      startDate: "",
      endDate: "",
    });
    setFilterLoading(true);
    await fetchOrders({});
    setFilterLoading(false);
  };

  const openEdit = (job) => {
    setEditOrder(job);
    setEditForm({
      customerName: job.customer_name || "",
      zone: job.zone || "",
      distance: job.distance || "",
      pipeSize: job.pipe_size || "",
      items: (job.items || []).map((item) => ({
        name: item.name || "",
        unit: item.unit || "",
        qty: item.qty || 0,
      })),
    });
  };

  const updateEditItem = (index, field, value) => {
    setEditForm((prev) => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const saveEdit = async () => {
    if (!editOrder) return;
    if (editSaving) return;
    if (
      !editForm.customerName ||
      !editForm.zone ||
      !editForm.distance ||
      !editForm.pipeSize
    ) {
      alert("Please fill all required fields.");
      return;
    }
    if (
      Number.isNaN(Number(editForm.distance)) ||
      Number.isNaN(Number(editForm.pipeSize))
    ) {
      alert("Distance and pipe size must be numeric.");
      return;
    }
    const hasInvalid = editForm.items.some(
      (item) =>
        !String(item.name || "").trim() ||
        !String(item.unit || "").trim() ||
        !Number(item.qty || 0)
    );
    if (hasInvalid) {
      alert("Each item must have name, unit, and quantity.");
      return;
    }

    try {
      setEditSaving(true);
      await apiPut(`/api/orders/${editOrder.id}`, {
        customerName: editForm.customerName,
        zone: editForm.zone,
        distance: editForm.distance,
        pipeSize: editForm.pipeSize,
        items: editForm.items,
      });
      setEditOrder(null);
      setEditForm({
        customerName: "",
        zone: "",
        distance: "",
        pipeSize: "",
        items: [],
      });
      await fetchOrders(currentQuery);
    } finally {
      setEditSaving(false);
    }
  };

  const deleteOrder = async (job) => {
    const ok = window.confirm(
      `Delete order #${job.id} for ${job.customer_name}? This cannot be undone.`
    );
    if (!ok) return;
    if (deletingId) return;
    try {
      setDeletingId(job.id);
      await apiDelete(`/api/orders/${job.id}`);
      await fetchOrders(currentQuery);
    } finally {
      setDeletingId(null);
    }
  };

  const loadTechnicianProfile = async (tech) => {
    try {
      const data = await apiGet(`/api/technicians/${tech.id}`);
      setTechnicianProfile(data);
    } catch (error) {
      console.error(error);
    }
  };

  const exportTechnicianOrders = async (tech, format) => {
    try {
      const data = await apiGet(`/api/orders?technicianId=${tech.id}`);
      const baseName = `quotation-tech-${tech.id}-${new Date()
        .toISOString()
        .slice(0, 10)}`;
      if (format === "excel") {
        exportAllOrdersToExcel({ filename: baseName, orders: data });
      } else {
        exportAllOrdersToPdf({ filename: baseName, orders: data });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const hasFilters = Object.values(filters).some((value) => value);
  const exportSuffix = [
    filters.customer ? `customer-${filters.customer}` : "",
    filters.technicianId ? `tech-${filters.technicianId}` : "",
    filters.zone ? `zone-${filters.zone}` : "",
    filters.startDate ? `from-${filters.startDate}` : "",
    filters.endDate ? `to-${filters.endDate}` : "",
  ]
    .filter(Boolean)
    .join("-");

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  const loadOrdersForTechnician = async (technician) => {
    setActiveTechnician(technician);
    await fetchOrders({ technicianId: technician.id });
  };

  const loadAllOrders = async () => {
    setActiveTechnician(null);
    await fetchOrders({});
  };

  useEffect(() => {
    setSettings({ lang });
  }, [lang]);

  return (
    <div className="min-h-screen w-screen bg-[var(--ui-bg)]">
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 px-6 py-6 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-slate-800 dark:bg-[var(--ui-card)]/95 md:w-64 md:border-b-0 md:border-r md:px-5 md:py-8 md:backdrop-blur-none md:supports-[backdrop-filter]:bg-white md:dark:supports-[backdrop-filter]:bg-[var(--ui-card)]">
          <div className="mb-8">
            <h1 className="text-lg font-semibold text-[color:var(--ui-text)]">
              {t("admin.title")}
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t("admin.subtitle")}
            </p>
          </div>
          <nav className="flex flex-row gap-2 md:flex-col">
            <button
              onClick={() => {
                setTab("orders");
                loadAllOrders();
              }}
              className={`flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition md:w-full md:text-left ${
                tab === "orders"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {t("admin.ordersTab")}
            </button>
            <button
              onClick={() => setTab("technicians")}
              className={`flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition md:w-full md:text-left ${
                tab === "technicians"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {t("admin.techTab")}
            </button>
            <button
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
              onClick={handleLogout}
              className="flex-1 rounded-lg border border-slate-400 bg-white px-4 py-2 text-xs font-semibold text-[color:var(--ui-text)] shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950/40 dark:text-[color:var(--ui-text)] dark:hover:bg-slate-900/60 md:w-full md:text-left"
            >
              {t("common.logout")}
            </button>
          </nav>
        </aside>

        <main className="flex min-h-screen flex-1 flex-col px-6 py-8 text-[color:var(--ui-text)]">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-[color:var(--ui-text)]">
              {tab === "orders"
                ? t("admin.ordersTab")
                : tab === "technicians"
                  ? t("admin.techTab")
                  : t("settings.title")}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {tab === "settings" ? t("settings.subtitle") : t("admin.subtitle")}
            </p>
          </div>

        {tab === "settings" && (
          <div className="card-surface rounded-2xl p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {t("common.language")}
                </label>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {t("settings.languageHelp")}
                </p>
                <div className="mt-4 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setLang("sw")}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      settings.lang === "sw"
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
                      settings.lang === "en"
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

        {tab === "orders" && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="card-surface rounded-2xl p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {t("admin.totalOrders")}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {totals.jobs}
              </p>
            </div>
            <div className="card-surface rounded-2xl p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {t("admin.totalItems")}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {totals.items}
              </p>
            </div>
            <div className="card-surface rounded-2xl p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {t("admin.latestUpdate")}
              </p>
              <p className="mt-2 text-sm font-medium text-slate-700">
                {jobs[0]?.created_at
                  ? new Date(jobs[0].created_at).toLocaleString()
                  : t("admin.noSubmissions")}
              </p>
            </div>
          </div>
        )}

        {tab !== "settings" && tab === "orders" && (
          <div className="card-surface mb-4 rounded-2xl p-5">
            <div className="grid gap-4 lg:grid-cols-6">
              <div className="lg:col-span-2">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {t("admin.filterCustomer")}
                </label>
                <input
                  className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                  placeholder={t("admin.filterCustomerPh")}
                  value={filters.customer}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, customer: e.target.value }))
                  }
                />
              </div>
              <div className="lg:col-span-2">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {t("admin.filterTechnician")}
                </label>
                <select
                  className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                  value={filters.technicianId}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      technicianId: e.target.value,
                    }))
                  }
                >
                  <option value="">{t("admin.allTechnicians")}</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {t("admin.filterZone")}
                </label>
                <select
                  className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                  value={filters.zone}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, zone: e.target.value }))
                  }
                >
                  <option value="">{t("admin.allZones")}</option>
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
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {t("admin.dateRange")}
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="date"
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-xs text-slate-800"
                    value={filters.startDate}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                  />
                  <input
                    type="date"
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-xs text-slate-800"
                    value={filters.endDate}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={applyFilters}
                disabled={filterLoading}
                className="rounded-md bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800"
              >
                <span className="inline-flex items-center gap-2">
                  {filterLoading && <Spinner size={12} />}
                  {t("admin.applyFilters")}
                </span>
              </button>
              <button
                onClick={clearFilters}
                disabled={filterLoading}
                className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                {t("common.reset")}
              </button>
              <div className="text-xs text-slate-500">
                {t("admin.ordersShown", { count: jobs.length })}
              </div>
            </div>
          </div>
        )}

        {tab !== "settings" && (
        <div className="card-surface overflow-hidden rounded-2xl">
          <div className="border-b border-slate-200 px-6 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold text-slate-700">
                {tab === "orders"
                  ? t("admin.submittedOrders")
                  : t("admin.registeredTechnicians")}
              </h2>
              {tab === "orders" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      exportAllOrdersToExcel({
                        filename: `quotation-orders-${exportSuffix || "all"}-${new Date()
                          .toISOString()
                          .slice(0, 10)}`,
                        orders: jobs,
                      })
                    }
                    className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    {t("admin.downloadExcel")}
                  </button>
                  <button
                    onClick={() =>
                      exportAllOrdersToPdf({
                        filename: `quotation-orders-${exportSuffix || "all"}-${new Date()
                          .toISOString()
                          .slice(0, 10)}`,
                        orders: jobs,
                      })
                    }
                    className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    {t("admin.downloadPdf")}
                  </button>
                  {hasFilters && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                      {t("admin.filtered")}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          {tab === "orders" && (
            <div className="divide-y divide-slate-100">
              {!loading && jobs.length === 0 && (
                <div className="px-6 py-12 text-center text-sm text-slate-500">
                  <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="h-5 w-5">
                      <path
                        fill="currentColor"
                        d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v12h10V6H7zm2 3h6v2H9V9zm0 4h6v2H9v-2z"
                      />
                    </svg>
                  </div>
                  {t("admin.noOrders")}
                </div>
              )}
              {loading && (
                <div className="px-6 py-10 text-center text-sm text-slate-500">
                  {t("admin.loadingOrders")}
                </div>
              )}
              {jobs.map((job) => (
                <div key={job.id} className="px-6 py-6">
                <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-[color:var(--ui-text)]">
                      {job.customer_name || t("common.customer")}
                    </h3>
                    <p className="text-xs text-[color:var(--ui-muted)]">
                      {job.created_at
                        ? new Date(job.created_at).toLocaleString()
                        : ""}
                    </p>
                  </div>
                  <div className="text-xs text-[color:var(--ui-muted)]">
                    {t("common.zone")}: {job.zone || "—"} • {t("common.distance")}:{" "}
                    {job.distance || "—"} • {t("common.pipe")}:{" "}
                    {job.pipe_size || "—"}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        exportOrderToExcel({
                          filename: `quotation-${job.id || "order"}-${job.created_at ? new Date(job.created_at).toISOString().slice(0, 10) : "date"}`,
                          order: job,
                        })
                      }
                      className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      {t("admin.excel")}
                    </button>
                    <button
                      onClick={() =>
                        exportOrderToPdf({
                          filename: `quotation-${job.id || "order"}`,
                          title: t("admin.orderFor", { name: job.customer_name || t("common.customer") }),
                          order: job,
                        })
                      }
                      className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      {t("admin.pdf")}
                    </button>
                    <button
                      onClick={() => openEdit(job)}
                      className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      {t("admin.edit")}
                    </button>
                    <button
                      onClick={() => deleteOrder(job)}
                      disabled={deletingId === job.id}
                      className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <span className="inline-flex items-center gap-2">
                        {deletingId === job.id && <Spinner size={12} />}
                        {t("admin.delete")}
                      </span>
                    </button>
                  </div>
                </div>

                  <div className="rounded-xl border border-slate-200/60 bg-white/70 overflow-x-auto">
                    <table className="min-w-[720px] w-full table-auto text-sm md:table-fixed">
                      <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-3 w-2/5">{t("admin.tableItem")}</th>
                          <th className="px-4 py-3 w-1/6">{t("admin.tableUnit")}</th>
                          <th className="px-4 py-3 w-1/6 text-right">{t("admin.tableQty")}</th>
                          <th className="px-4 py-3 w-1/6 text-right">{t("admin.tableRate")}</th>
                          <th className="px-4 py-3 w-1/6 text-right">{t("admin.tableAmount")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {job.items.map((item, index) => (
                          <tr key={`${job.id}-${index}`}>
                            <td className="px-4 py-2 break-words">
                              {item.name || "—"}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              {item.unit || "—"}
                            </td>
                            <td className="px-4 py-2 text-right whitespace-nowrap">
                              {item.qty || 0}
                            </td>
                            <td className="px-4 py-2 text-right whitespace-nowrap">
                              {formatMoney(item.rate)}
                            </td>
                            <td className="px-4 py-2 text-right whitespace-nowrap">
                              {formatMoney(item.amount)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 font-semibold">
                          <td className="px-4 py-2" colSpan={4}>
                            {t("admin.materialCost")}
                          </td>
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            {formatMoney(job.totals?.materialCost)}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2">
                            {t("admin.excavation")}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">M</td>
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            {job.totals?.distanceQty || 0}
                          </td>
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            {formatMoney(job.totals?.excavationRate)}
                          </td>
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            {formatMoney(job.totals?.excavationAmount)}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2">{t("admin.labour")}</td>
                          <td className="px-4 py-2 whitespace-nowrap">%</td>
                          <td className="px-4 py-2 text-right whitespace-nowrap">10</td>
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            {formatMoney(job.totals?.labourAmount)}
                          </td>
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            {formatMoney(job.totals?.labourAmount)}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2">{t("admin.supervision")}</td>
                          <td className="px-4 py-2 whitespace-nowrap">%</td>
                          <td className="px-4 py-2 text-right whitespace-nowrap">15</td>
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            {formatMoney(job.totals?.supervisionAmount)}
                          </td>
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            {formatMoney(job.totals?.supervisionAmount)}
                          </td>
                        </tr>
                        <tr className="bg-slate-50 font-semibold">
                          <td className="px-4 py-2" colSpan={4}>
                            {t("admin.otherCharges")}
                          </td>
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            {formatMoney(job.totals?.otherChargesCost)}
                          </td>
                        </tr>
                        <tr className="bg-slate-900 text-white font-semibold">
                          <td className="px-4 py-2" colSpan={4}>
                            {t("admin.grandTotal")}
                          </td>
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            {formatMoney(job.totals?.grandTotal)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "technicians" && (
            <div className="divide-y divide-slate-100">
              {technicianProfile && (
                <div className="px-6 py-6">
                  <div className="card-surface rounded-2xl p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {technicianProfile.technician?.name || "Technician"}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {technicianProfile.technician?.email || "—"}
                        </p>
                      </div>
                      <div className="text-xs text-slate-600">
                        Phone: {technicianProfile.technician?.phone || "—"} •
                        Zone: {technicianProfile.technician?.zone || "—"}
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500">
                          Assignments
                        </p>
                        <p className="mt-1 text-lg font-semibold text-slate-900">
                          {technicianProfile.orders?.length || 0}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 sm:col-span-2">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500">
                          Recent Orders
                        </p>
                        <div className="mt-2 max-h-28 overflow-auto text-xs text-slate-600">
                          {(technicianProfile.orders || []).slice(0, 5).map((order) => (
                            <div key={order.id} className="flex items-center justify-between border-b border-slate-100 py-1 last:border-b-0">
                              <span className="truncate">
                                {order.customer_name || "Customer"}
                              </span>
                              <span className="ml-2 text-[10px] text-slate-400">
                                {order.created_at
                                  ? new Date(order.created_at).toLocaleDateString()
                                  : ""}
                              </span>
                            </div>
                          ))}
                          {!technicianProfile.orders?.length && (
                            <div className="text-slate-400">No orders yet.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {technicianLoading && (
                <div className="px-6 py-10 text-center text-sm text-slate-500">
                  {t("admin.loadingTechs")}
                </div>
              )}
              {!technicianLoading && technicians.length === 0 && (
                <div className="px-6 py-12 text-center text-sm text-slate-500">
                  <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="h-5 w-5">
                      <path
                        fill="currentColor"
                        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-7 8a7 7 0 0 1 14 0H5z"
                      />
                    </svg>
                  </div>
                  {t("admin.noTechs")}
                </div>
              )}
              {!technicianLoading && technicians.length > 0 && (
                <div className="rounded-xl overflow-x-auto">
                  <table className="min-w-[920px] w-full table-auto text-sm md:table-fixed">
                    <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-6 py-3 w-1/4">{t("auth.fullName")}</th>
                        <th className="px-6 py-3 w-1/4">{t("auth.email")}</th>
                        <th className="px-6 py-3 w-1/6">{t("auth.phone")}</th>
                        <th className="px-6 py-3 w-1/6">{t("common.zone")}</th>
                        <th className="px-6 py-3 w-1/6 text-right">{t("admin.ordersCount")}</th>
                        <th className="px-6 py-3 w-1/6 text-right">{t("admin.actions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {technicians.map((tech) => (
                        <tr key={tech.id}>
                          <td className="px-6 py-3 whitespace-nowrap">
                            {tech.name || "—"}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            {formatTechnicianEmail(tech.email)}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            {tech.phone || "—"}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            {tech.zone || "—"}
                          </td>
                          <td className="px-6 py-3 text-right whitespace-nowrap">
                            {tech.order_count || 0}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                onClick={() => loadTechnicianProfile(tech)}
                                className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                              >
                                {t("admin.profile")}
                              </button>
                              <button
                                onClick={() => exportTechnicianOrders(tech, "excel")}
                                className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                              >
                                {t("admin.excel")}
                              </button>
                              <button
                                onClick={() => exportTechnicianOrders(tech, "pdf")}
                                className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                              >
                                {t("admin.pdf")}
                              </button>
                              <button
                                onClick={() => {
                                  setTab("orders");
                                  loadOrdersForTechnician(tech);
                                }}
                                className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                              >
                                {t("admin.viewOrders")}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
        )}

        <div className="mt-6 text-xs text-slate-500">
          {activeTechnician && (
            <span>
              {t("admin.showingFor", { name: activeTechnician.name || "—" })}
            </span>
          )}
        </div>

        {editOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
            <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  {t("admin.edit")} #{editOrder.id}
                </h3>
                <button
                  onClick={() => setEditOrder(null)}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  {t("common.close")}
                </button>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Customer
                  </label>
                  <input
                    className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                    value={editForm.customerName}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        customerName: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Zone
                  </label>
                  <select
                    className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                    value={editForm.zone}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, zone: e.target.value }))
                    }
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
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Distance
                  </label>
                  <input
                    className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                    value={editForm.distance}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        distance: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Pipe size
                  </label>
                  <input
                    className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                    value={editForm.pipeSize}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        pipeSize: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-slate-700">
                  Items
                </h4>
                <div className="mt-3 space-y-2">
                  {editForm.items.map((item, idx) => (
                    <div
                      key={`edit-item-${idx}`}
                      className="grid gap-2 sm:grid-cols-5"
                    >
                      <input
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 sm:col-span-2"
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) =>
                          updateEditItem(idx, "name", e.target.value)
                        }
                      />
                      <input
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                        placeholder="Unit"
                        value={item.unit}
                        onChange={(e) =>
                          updateEditItem(idx, "unit", e.target.value)
                        }
                      />
                      <input
                        type="number"
                        min="0"
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                        placeholder="Qty"
                        value={item.qty}
                        onChange={(e) =>
                          updateEditItem(idx, "qty", Number(e.target.value))
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setEditForm((prev) => ({
                            ...prev,
                            items: prev.items.filter((_, i) => i !== idx),
                          }))
                        }
                        className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setEditForm((prev) => ({
                        ...prev,
                        items: [
                          ...prev.items,
                          { name: "", unit: "", qty: 0 },
                        ],
                      }))
                    }
                  className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  {t("tech.addItem")}
                </button>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  onClick={() => setEditOrder(null)}
                  className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={saveEdit}
                  disabled={editSaving}
                  className="rounded-md bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800"
                >
                  <span className="inline-flex items-center gap-2">
                    {editSaving && <Spinner size={12} />}
                    {t("common.save")}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

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
