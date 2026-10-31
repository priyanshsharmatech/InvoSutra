import { useEffect, useState, useRef } from "react";
import { Loader2, X, Download } from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import moment from "moment";
import Button from "../ui/Button";
import { statusBadgeClass, effectiveStatus } from "../../utils/helper";
import { downloadCsv } from "../../utils/csv";
import useFocusTrap from "../../hooks/useFocusTrap";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

// Per-client statement: ledger of invoices with billed/paid/balance.
const ClientStatementModal = ({ client, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, Boolean(client), onClose);

  useEffect(() => {
    if (!client) return;
    setLoading(true);
    axiosInstance
      .get(API_PATHS.ANALYTICS.STATEMENT, { params: { client: client.clientName } })
      .then((r) => setData(r.data))
      .catch(() => toast.error("Failed to load statement."))
      .finally(() => setLoading(false));
  }, [client]);

  const exportCsv = () => {
    if (!data?.rows?.length) return;
    downloadCsv(
      `statement-${client.clientName}.csv`,
      [
        { label: "Invoice #", get: (r) => r.invoiceNumber },
        { label: "Date", get: (r) => new Date(r.date).toLocaleDateString("en-IN") },
        { label: "Status", get: (r) => r.status },
        { label: "Billed", get: (r) => r.billed.toFixed(2) },
        { label: "Paid", get: (r) => r.paid.toFixed(2) },
        { label: "Balance", get: (r) => r.balance.toFixed(2) },
      ],
      data.rows
    );
    toast.success("Statement exported.");
  };

  if (!client) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Statement for ${client.clientName}`}
        className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl ring-1 ring-slate-200/60 dark:ring-slate-700 w-full max-w-3xl max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/70 dark:border-slate-700">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Statement — {client.clientName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All invoices and payment status
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="small" icon={Download} onClick={exportCsv} disabled={!data?.rows?.length}>
              Export
            </Button>
            <button onClick={onClose} aria-label="Close" className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/40 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="overflow-auto no-scrollbar">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 p-6 border-b border-slate-100 dark:border-slate-700">
              {[
                ["Total Billed", data?.summary?.totalBilled],
                ["Total Paid", data?.summary?.totalPaid],
                ["Balance Due", data?.summary?.balance],
              ].map(([label, val], i) => (
                <div key={label} className="rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                  <p className={`font-semibold tabular-nums mt-0.5 ${i === 2 ? "text-amber-700 dark:text-amber-400" : "text-slate-900 dark:text-slate-100"}`}>
                    {fmt(val)}
                  </p>
                </div>
              ))}
            </div>

            {!data?.rows?.length ? (
              <div className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">
                No invoices for this client.
              </div>
            ) : (
              <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60">
                  <tr>
                    {["Invoice #", "Date", "Status", "Billed", "Paid", "Balance"].map((h, i) => (
                      <th key={h} className={`px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider ${i >= 3 ? "text-right" : "text-left"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {data.rows.map((r) => (
                    <tr key={r._id}>
                      <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-100">{r.invoiceNumber}</td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{moment(r.date).format("MMM D, YYYY")}</td>
                      <td className="px-4 py-2.5">
                        {(() => {
                          const s = effectiveStatus({
                            status: r.status,
                            total: r.billed,
                            amountPaid: r.paid,
                            dueDate: r.dueDate,
                          });
                          return (
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(s)}`}>
                              {s}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-700 dark:text-slate-300">{fmt(r.billed)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-emerald-700 dark:text-emerald-400">{fmt(r.paid)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-medium text-slate-900 dark:text-slate-100">{fmt(r.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientStatementModal;
