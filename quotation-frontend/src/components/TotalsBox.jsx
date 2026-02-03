export default function TotalsBox({ items }) {
  const materialTotal = items.reduce(
    (sum, i) => sum + i.qty * i.price,
    0
  );

  const mobilization = 200000;
  const labour = materialTotal * 0.1;
  const supervision = (materialTotal + labour) * 0.15;

  const grandTotal =
    materialTotal + mobilization + labour + supervision;

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:max-w-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">
          Totals Summary
        </h3>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          Estimated
        </span>
      </div>

      <div className="space-y-3 text-sm text-slate-600">
        <div className="flex items-center justify-between">
          <span>Material Cost</span>
          <span className="font-medium text-slate-900">
            {materialTotal.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Mobilization</span>
          <span className="font-medium text-slate-900">
            {mobilization.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Labour (10%)</span>
          <span className="font-medium text-slate-900">
            {labour.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Supervision (15%)</span>
          <span className="font-medium text-slate-900">
            {supervision.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="my-4 h-px bg-slate-100" />

      <div className="flex items-center justify-between text-base font-semibold text-slate-900">
        <span>Grand Total</span>
        <span>{grandTotal.toLocaleString()}</span>
      </div>
    </div>
  );
}
