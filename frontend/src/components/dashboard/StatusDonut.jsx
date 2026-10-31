// Dependency-free SVG donut of invoice status, across all statuses.
// Status colors are reserved and always paired with a labelled legend,
// so identity never relies on color alone.
const STATUS_COLOR = {
  Paid: "#059669", // emerald-600
  Unpaid: "#f59e0b", // amber-500
  Sent: "#3b82f6", // blue-500
  Overdue: "#ef4444", // red-500
  "Partially Paid": "#6366f1", // indigo-500
  Draft: "#94a3b8", // slate-400
  Cancelled: "#64748b", // slate-500
};
// Stable display order.
const ORDER = [
  "Paid",
  "Partially Paid",
  "Sent",
  "Unpaid",
  "Overdue",
  "Draft",
  "Cancelled",
];
const colorFor = (s) => STATUS_COLOR[s] || "#94a3b8";

const StatusDonut = ({ data = [] }) => {
  // Normalise + sort into display order, dropping zero/empty entries.
  const segments = [...data]
    .filter((d) => d.status && d.count > 0)
    .sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status));
  const total = segments.reduce((s, seg) => s + seg.count, 0);

  const radius = 60;
  const stroke = 22;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="h-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-5 rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
        Invoice Status
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        Breakdown by count
      </p>

      {total === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm text-slate-400 dark:text-slate-500">
          No invoices yet.
        </div>
      ) : (
        <div className="flex items-center gap-6">
          <svg
            viewBox="0 0 160 160"
            className="w-36 h-36 flex-shrink-0"
            role="img"
            aria-label="Invoice status donut chart"
          >
            <g transform="rotate(-90 80 80)">
              {segments.map((seg) => {
                const fraction = seg.count / total;
                const dash = fraction * circumference;
                const circle = (
                  <circle
                    key={seg.status}
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke={colorFor(seg.status)}
                    strokeWidth={stroke}
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={-offset}
                  >
                    <title>{`${seg.status}: ${seg.count} (${Math.round(
                      fraction * 100
                    )}%)`}</title>
                  </circle>
                );
                offset += dash;
                return circle;
              })}
            </g>
            <text
              x="80"
              y="74"
              textAnchor="middle"
              className="fill-slate-900 dark:fill-slate-100"
              fontSize="26"
              fontWeight="700"
            >
              {total}
            </text>
            <text
              x="80"
              y="94"
              textAnchor="middle"
              className="fill-slate-500 dark:fill-slate-400"
              fontSize="12"
            >
              invoices
            </text>
          </svg>

          <ul className="space-y-2">
            {segments.map((seg) => (
              <li key={seg.status} className="flex items-center text-sm">
                <span
                  className="w-3 h-3 rounded-sm mr-2 flex-shrink-0"
                  style={{ backgroundColor: colorFor(seg.status) }}
                />
                <span className="text-slate-600 dark:text-slate-300">
                  {seg.status}
                </span>
                <span className="ml-2 font-semibold text-slate-900 dark:text-slate-100">
                  {seg.count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default StatusDonut;
