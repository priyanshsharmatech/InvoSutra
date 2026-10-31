import { useCallback, useEffect, useMemo, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import {
  BarChart3,
  Download,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button";
import DatePicker from "../../components/ui/DatePicker";
import { Skeleton, TableSkeleton } from "../../components/ui/Skeleton";
import { downloadCsv } from "../../utils/csv";

// yyyy-mm-dd for native date inputs.
const toInputDate = (d) => d.toISOString().slice(0, 10);

const defaultFrom = () => {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return toInputDate(d);
};
const defaultTo = () => toInputDate(new Date());

const formatCurrency = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN")}`;

const STATUS_ORDER = ["Paid", "Sent", "Unpaid", "Draft", "Cancelled"];

const Reports = () => {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [report, setReport] = useState(null);
  const [gst, setGst] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const [rep, gstRes] = await Promise.all([
        axiosInstance.get(API_PATHS.ANALYTICS.REPORT, { params: { from, to } }),
        axiosInstance.get(API_PATHS.ANALYTICS.GST, { params: { from, to } }),
      ]);
      setReport(rep.data);
      setGst(gstRes.data);
    } catch (err) {
      toast.error("Failed to load report.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  const handleExportGst = () => {
    if (!gst?.rows?.length) {
      toast.error("No GST data in this range.");
      return;
    }
    const columns = [
      { label: "Invoice #", get: (r) => r.invoiceNumber },
      { label: "Date", get: (r) => new Date(r.date).toLocaleDateString("en-IN") },
      { label: "Client", get: (r) => r.clientName },
      { label: "GSTIN", get: (r) => r.gstin },
      { label: "Taxable", get: (r) => r.taxable.toFixed(2) },
      { label: "CGST", get: (r) => r.cgst.toFixed(2) },
      { label: "SGST", get: (r) => r.sgst.toFixed(2) },
      { label: "IGST", get: (r) => r.igst.toFixed(2) },
      { label: "Total", get: (r) => r.total.toFixed(2) },
    ];
    downloadCsv("gst-report.csv", columns, gst.rows);
    toast.success("GST report exported.");
  };

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const stats = useMemo(
    () => [
      {
        label: "Total Invoiced",
        value: formatCurrency(report?.totalInvoiced),
        icon: IndianRupee,
        iconClass: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/15",
      },
      {
        label: "Paid",
        value: formatCurrency(report?.paid),
        icon: CheckCircle2,
        iconClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15",
      },
      {
        label: "Outstanding",
        value: formatCurrency(report?.outstanding),
        icon: AlertCircle,
        iconClass: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/15",
      },
      {
        label: "Invoice Count",
        value: Number(report?.count || 0).toLocaleString("en-IN"),
        icon: FileText,
        iconClass: "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700",
      },
    ],
    [report]
  );

  const byStatusRows = useMemo(() => {
    const byStatus = report?.byStatus || {};
    return STATUS_ORDER.filter((s) => byStatus[s]).map((s) => ({
      status: s,
      count: byStatus[s].count,
      amount: byStatus[s].amount,
    }));
  }, [report]);

  const handleExportCsv = () => {
    if (!report) return;
    const columns = [
      { label: "Metric", get: (r) => r.metric },
      { label: "Value", get: (r) => r.value },
    ];
    const rows = [
      { metric: "From", value: report.from || from },
      { metric: "To", value: report.to || to },
      { metric: "Total Invoiced", value: report.totalInvoiced ?? 0 },
      { metric: "Paid", value: report.paid ?? 0 },
      { metric: "Outstanding", value: report.outstanding ?? 0 },
      { metric: "Invoice Count", value: report.count ?? 0 },
      ...byStatusRows.flatMap((r) => [
        { metric: `${r.status} Count`, value: r.count },
        { metric: `${r.status} Amount`, value: r.amount },
      ]),
    ];
    downloadCsv("report.csv", columns, rows);
    toast.success("Report exported.");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Reports</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Summarise invoicing activity over a date range.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={handleExportCsv}
          icon={Download}
          disabled={!report || loading}
        >
          Download CSV
        </Button>
      </div>

      {/* Date range controls */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <label
              htmlFor="from"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              From
            </label>
            <DatePicker id="from" value={from} max={to} onChange={setFrom} />
          </div>
          <div className="flex-1">
            <label
              htmlFor="to"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              To
            </label>
            <DatePicker id="to" value={to} min={from} onChange={setTo} />
          </div>
          <Button onClick={fetchReport} isLoading={loading} icon={BarChart3}>
            Run
          </Button>
        </div>
      </div>

      {loading && !report ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm p-5"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-9 w-9 rounded-lg" />
                </div>
                <Skeleton className="h-7 w-28 mt-3" />
              </div>
            ))}
          </div>
          <div className="mt-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm p-6">
            <Skeleton className="h-5 w-32 mb-4" />
            <TableSkeleton rows={3} />
          </div>
        </>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {s.label}
                  </p>
                  <span
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.iconClass}`}
                  >
                    <s.icon className="w-5 h-5" />
                  </span>
                </div>
                <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* By-status breakdown */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200/60 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                By Status
              </h2>
            </div>
            {byStatusRows.length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                No invoices in this date range.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                {byStatusRows.map((r) => (
                  <li
                    key={r.status}
                    className="px-4 sm:px-6 py-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {r.status}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {Number(r.count || 0).toLocaleString("en-IN")} invoice
                        {r.count === 1 ? "" : "s"}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(r.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* GST summary */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200/60 dark:border-slate-700 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  GST Summary
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tax collected on issued invoices in this range
                </p>
              </div>
              <Button
                variant="secondary"
                size="small"
                icon={Download}
                onClick={handleExportGst}
                disabled={!gst?.rows?.length}
              >
                Export GSTR CSV
              </Button>
            </div>
            {!gst?.summary?.count ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                No GST invoices in this date range.
              </div>
            ) : (
              <div className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  ["Taxable Value", gst.summary.taxable],
                  ["CGST", gst.summary.cgst],
                  ["SGST", gst.summary.sgst],
                  ["IGST", gst.summary.igst],
                  ["Total Tax", gst.summary.totalTax],
                  ["Invoice Total", gst.summary.total],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
                      {formatCurrency(val)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
