// Dependency-free SVG bar chart for monthly paid revenue (single series).
// One axis, recessive gridlines, thin bars with rounded tops, direct labels.
const formatShort = (n) => {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${Math.round(n)}`;
};

const RevenueBarChart = ({ data = [] }) => {
  const W = 600;
  const H = 260;
  const padX = 32;
  const padTop = 24;
  const padBottom = 32;
  const chartW = W - padX * 2;
  const chartH = H - padTop - padBottom;

  const max = Math.max(...data.map((d) => d.total), 0);
  const barSlot = data.length ? chartW / data.length : chartW;
  const barW = Math.min(44, barSlot * 0.55);

  const hasData = max > 0;

  return (
    <div className="h-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-5 rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
        Revenue (last 6 months)
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        Paid invoices, by invoice date
      </p>

      {!hasData ? (
        <div className="h-48 flex items-center justify-center text-sm text-slate-400 dark:text-slate-500">
          No paid revenue yet.
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto"
          role="img"
          aria-label="Monthly revenue bar chart"
        >
          {/* baseline */}
          <line
            x1={padX}
            y1={padTop + chartH}
            x2={W - padX}
            y2={padTop + chartH}
            stroke="#e2e8f0"
            strokeWidth="1"
          />
          {data.map((d, i) => {
            const h = max ? (d.total / max) * chartH : 0;
            const x = padX + i * barSlot + (barSlot - barW) / 2;
            const y = padTop + chartH - h;
            return (
              <g key={d.label}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  rx="4"
                  fill="#2563eb"
                >
                  <title>{`${d.label}: ₹${d.total.toFixed(2)}`}</title>
                </rect>
                {d.total > 0 && (
                  <text
                    x={x + barW / 2}
                    y={y - 6}
                    textAnchor="middle"
                    className="fill-slate-600 dark:fill-slate-300"
                    fontSize="11"
                  >
                    {formatShort(d.total)}
                  </text>
                )}
                <text
                  x={x + barW / 2}
                  y={padTop + chartH + 18}
                  textAnchor="middle"
                  className="fill-slate-500 dark:fill-slate-400"
                  fontSize="11"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
};

export default RevenueBarChart;
