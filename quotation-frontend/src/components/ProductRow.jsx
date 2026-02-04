import { useEffect, useState } from "react";

export default function ProductRow({
  item,
  index,
  items,
  setItems,
  products,
  isAdmin,
  fetchSuggestions,
  recentItems = [],
  onSelectRecent,
}) {
  const [remoteMatches, setRemoteMatches] = useState([]);
  const [openSuggestions, setOpenSuggestions] = useState(false);

  useEffect(() => {
    if (isAdmin) return;
    const value = String(item.name || "").trim();
    if (!fetchSuggestions || value.length < 2) {
      setRemoteMatches([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const data = await fetchSuggestions(value);
        setRemoteMatches(data || []);
      } catch {
        setRemoteMatches([]);
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [fetchSuggestions, isAdmin, item.name]);
  const update = (field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const nameValue = item.name || "";
  const normalized = nameValue.trim().toLowerCase();
  const matches =
    isAdmin && normalized
      ? products
          .filter((p) => p.name.toLowerCase().includes(normalized))
          .slice(0, 6)
      : [];

  const applyMatch = (product) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      name: product.name,
      unit: product.unit,
      price: product.price,
    };
    setItems(updated);
  };

  const applyRemoteMatch = (product) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      name: product.name,
      unit: updated[index].unit || product.unit || "",
    };
    setItems(updated);
    setRemoteMatches([]);
    if (onSelectRecent) {
      onSelectRecent({
        name: product.name,
        unit: updated[index].unit || product.unit || "",
      });
    }
  };

  const handleNameChange = (value) => {
    update("name", value);
    if (!isAdmin) return;
    const exact = products.find(
      (p) => p.name.toLowerCase() === value.trim().toLowerCase()
    );
    if (exact) {
      applyMatch(exact);
    }
  };

  const recentMatches =
    !isAdmin && openSuggestions && !nameValue.trim() ? recentItems : [];

  return (
    <tr className="bg-transparent">
      <td className="px-6 py-3">
        <div className="rounded-xl border border-slate-200/70 bg-white/80 px-3 py-3 dark:border-slate-800 dark:bg-slate-950/20">
          <label className="text-[11px] font-bold uppercase tracking-wide text-slate-800 dark:text-slate-300">
            Item
          </label>
          <input
            className="mt-2 w-full border-b border-slate-200 bg-transparent pb-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-200"
            placeholder="Your answer"
            value={nameValue}
            onChange={(e) => handleNameChange(e.target.value)}
            onFocus={() => setOpenSuggestions(true)}
            onBlur={() => {
              setTimeout(() => setOpenSuggestions(false), 150);
            }}
          />
          {isAdmin && openSuggestions && matches.length > 0 && (
            <div className="mt-2 rounded-md border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
              {matches.map((product) => (
                <button
                  type="button"
                  key={`${product.source}-${product.name}`}
                  onClick={() => applyMatch(product)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900/60"
                >
                  <span className="truncate">{product.name}</span>
                  <span className="ml-2 text-[10px] text-slate-400 dark:text-slate-500">
                    {product.source}
                  </span>
                </button>
              ))}
            </div>
          )}
          {!isAdmin && openSuggestions && remoteMatches.length > 0 && (
            <div className="mt-2 rounded-md border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
              {remoteMatches.map((product) => (
                <button
                  type="button"
                  key={`${product.name}-${product.unit || ""}`}
                  onMouseDown={() => applyRemoteMatch(product)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900/60"
                >
                  <span className="truncate">{product.name}</span>
                  <span className="ml-2 text-[10px] text-slate-400 dark:text-slate-500">
                    {product.unit || "—"}
                  </span>
                </button>
              ))}
            </div>
          )}
          {!isAdmin && openSuggestions && recentMatches.length > 0 && (
            <div className="mt-2 rounded-md border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
              {recentMatches.map((product) => (
                <button
                  type="button"
                  key={`${product.name}-${product.unit || ""}-recent`}
                  onMouseDown={() => applyRemoteMatch(product)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900/60"
                >
                  <span className="truncate">{product.name}</span>
                  <span className="ml-2 text-[10px] text-slate-400 dark:text-slate-500">
                    {product.unit || "—"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </td>

      {isAdmin && (
        <td className="px-6 py-3">
          <div className="rounded-xl border border-slate-200/70 bg-white/80 px-3 py-3 dark:border-slate-800 dark:bg-slate-950/20">
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-800 dark:text-slate-300">
              Unit
            </label>
            <div className="mt-2 border-b border-slate-200 pb-2 text-sm text-slate-800 dark:border-slate-700 dark:text-slate-100">
              {item.unit || "—"}
            </div>
          </div>
        </td>
      )}

      {!isAdmin && (
        <td className="px-6 py-3">
          <div className="rounded-xl border border-slate-200/70 bg-white/80 px-3 py-3 dark:border-slate-800 dark:bg-slate-950/20">
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-800 dark:text-slate-300">
              Unit
            </label>
            <input
              className="mt-2 w-full border-b border-slate-200 bg-transparent pb-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-200"
              placeholder="e.g. PC, M"
              value={item.unit || ""}
              onChange={(e) => update("unit", e.target.value)}
            />
          </div>
        </td>
      )}

      {isAdmin && (
        <td className="px-6 py-3">
          <div className="rounded-xl border border-slate-200/70 bg-white/80 px-3 py-3 dark:border-slate-800 dark:bg-slate-950/20">
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-800 dark:text-slate-300">
              Price (VAT)
            </label>
            <div className="mt-2 border-b border-slate-200 pb-2 text-right text-sm text-slate-800 dark:border-slate-700 dark:text-slate-100">
              {item.price ? item.price.toLocaleString() : "—"}
            </div>
          </div>
        </td>
      )}

      <td className="px-6 py-3">
        <div className="flex justify-end">
          <div className="w-full max-w-[140px] rounded-xl border border-slate-200/70 bg-white/80 px-3 py-3 dark:border-slate-800 dark:bg-slate-950/20">
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-800 dark:text-slate-300">
              Qty
            </label>
            <input
              type="number"
              min="0"
              className="mt-2 w-full border-b border-slate-200 bg-transparent pb-2 text-right text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-200"
              placeholder="0"
              value={item.qty ?? ""}
              onChange={(e) => update("qty", Number(e.target.value))}
            />
          </div>
        </div>
      </td>
    </tr>
  );
}
