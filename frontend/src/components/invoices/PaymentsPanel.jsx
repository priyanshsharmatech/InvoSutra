import { useState } from "react";
import { Loader2, Plus, Trash2, IndianRupee } from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import moment from "moment";
import Button from "../ui/Button";
import DatePicker from "../ui/DatePicker";

const fmt = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const numeric = (v) => String(v).replace(/[^0-9.]/g, "").replace(/^0+(?=\d)/, "");

const PaymentsPanel = ({ invoice, onUpdated }) => {
  const [form, setForm] = useState({
    amount: "",
    method: "",
    date: new Date().toISOString().split("T")[0],
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const paid = invoice.amountPaid || 0;
  const balance = Math.max((invoice.total || 0) - paid, 0);

  const addPayment = async (e) => {
    e.preventDefault();
    if (!(Number(form.amount) > 0)) {
      toast.error("Enter a payment amount greater than 0.");
      return;
    }
    setSaving(true);
    try {
      const res = await axiosInstance.post(
        API_PATHS.INVOICE.ADD_PAYMENT(invoice._id),
        { ...form, amount: Number(form.amount) }
      );
      onUpdated(res.data);
      setForm({
        amount: "",
        method: "",
        date: new Date().toISOString().split("T")[0],
        note: "",
      });
      toast.success("Payment recorded");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record payment.");
    } finally {
      setSaving(false);
    }
  };

  const removePayment = async (pid) => {
    setBusyId(pid);
    try {
      const res = await axiosInstance.delete(
        API_PATHS.INVOICE.DELETE_PAYMENT(invoice._id, pid)
      );
      onUpdated(res.data);
      toast.success("Payment removed");
    } catch {
      toast.error("Failed to remove payment.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm p-6 print:hidden">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Payments</h3>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
          <p className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{fmt(invoice.total)}</p>
        </div>
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 p-3">
          <p className="text-xs text-emerald-700 dark:text-emerald-300">Paid</p>
          <p className="font-semibold text-emerald-800 dark:text-emerald-300 tabular-nums">{fmt(paid)}</p>
        </div>
        <div className="rounded-lg bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 p-3">
          <p className="text-xs text-amber-700 dark:text-amber-300">Balance Due</p>
          <p className="font-semibold text-amber-800 dark:text-amber-300 tabular-nums">{fmt(balance)}</p>
        </div>
      </div>

      {/* History */}
      {invoice.payments?.length > 0 && (
        <ul className="mb-6 divide-y divide-slate-100 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg">
          {invoice.payments.map((p) => (
            <li key={p._id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <div>
                <span className="font-medium text-slate-900 dark:text-slate-100 tabular-nums">{fmt(p.amount)}</span>
                <span className="text-slate-400"> · {moment(p.date).format("MMM D, YYYY")}</span>
                {p.method && <span className="text-slate-500 dark:text-slate-400"> · {p.method}</span>}
                {p.note && <span className="text-slate-400"> · {p.note}</span>}
              </div>
              <button
                onClick={() => removePayment(p._id)}
                disabled={busyId === p._id}
                className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-500/15 text-red-500 cursor-pointer disabled:opacity-50"
                title="Remove payment"
                aria-label="Remove payment"
              >
                {busyId === p._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Record form */}
      {balance > 0 ? (
        <form onSubmit={addPayment} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Amount</label>
            <div className="relative">
              <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: numeric(e.target.value) })}
                placeholder={balance.toFixed(2)}
                className="w-full h-10 pl-7 pr-2 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Date</label>
            <DatePicker
              value={form.date}
              onChange={(v) => setForm({ ...form, date: v })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Method</label>
            <input
              type="text"
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value })}
              placeholder="UPI, Cash…"
              className="w-full h-10 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Note</label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Optional"
              className="w-full h-10 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button type="submit" icon={saving ? Loader2 : Plus} disabled={saving}>
            {saving ? "Saving..." : "Record"}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-emerald-700 font-medium">
          ✓ This invoice is fully paid.
        </p>
      )}
    </div>
  );
};

export default PaymentsPanel;
