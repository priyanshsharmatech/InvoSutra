import { useEffect, useState, useCallback } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { Repeat, Play, Pause, Trash2, Plus } from "lucide-react";
import moment from "moment";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import { TableSkeleton } from "../../components/ui/Skeleton";

const FREQ_LABEL = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

const Recurring = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const navigate = useNavigate();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(API_PATHS.RECURRING.LIST);
      setItems(res.data.data);
    } catch (err) {
      toast.error("Failed to load recurring invoices.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const toggleActive = async (r) => {
    setBusyId(r._id);
    try {
      await axiosInstance.put(API_PATHS.RECURRING.UPDATE(r._id), {
        active: !r.active,
      });
      fetchItems();
    } catch {
      toast.error("Failed to update.");
    } finally {
      setBusyId(null);
    }
  };

  const runNow = async (r) => {
    setBusyId(r._id);
    try {
      await axiosInstance.post(API_PATHS.RECURRING.RUN(r._id));
      toast.success("Invoice generated");
      fetchItems();
    } catch {
      toast.error("Failed to generate invoice.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (r) => {
    if (!window.confirm(`Delete this recurring invoice for ${r.billTo?.clientName}?`))
      return;
    setBusyId(r._id);
    try {
      await axiosInstance.delete(API_PATHS.RECURRING.DELETE(r._id));
      toast.success("Deleted");
      fetchItems();
    } catch {
      toast.error("Failed to delete.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Recurring Invoices
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Templates that automatically generate invoices on a schedule.
        </p>
      </div>

      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={5} />
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800/60 rounded-full flex items-center justify-center mx-auto mb-3">
              <Repeat className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 mb-4 max-w-md mx-auto">
              No recurring invoices yet. Open any invoice and choose{" "}
              <span className="font-medium">“Make recurring”</span> to set one up.
            </p>
            <Button onClick={() => navigate("/invoices")} icon={Plus}>
              Go to Invoices
            </Button>
          </div>
        ) : (
          <>
          {/* Mobile cards */}
          <ul className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
            {items.map((r) => (
              <li key={r._id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {r.billTo?.clientName || "—"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {FREQ_LABEL[r.frequency]} · next{" "}
                      {moment(r.nextRun).format("MMM D, YYYY")} · {r.generatedCount} generated
                    </p>
                    <span
                      className={`inline-flex mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.active
                          ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {r.active ? "Active" : "Paused"}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button onClick={() => runNow(r)} disabled={busyId === r._id} title="Generate now" aria-label="Generate now" className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/40 text-blue-600 dark:text-blue-400 cursor-pointer disabled:opacity-50">
                      <Play className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleActive(r)} disabled={busyId === r._id} title={r.active ? "Pause" : "Resume"} aria-label={r.active ? "Pause" : "Resume"} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/40 text-slate-600 dark:text-slate-300 cursor-pointer disabled:opacity-50">
                      {r.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button onClick={() => remove(r)} disabled={busyId === r._id} title="Delete" aria-label="Delete" className="p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-500/15 text-red-500 cursor-pointer disabled:opacity-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[720px] divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  {["Client", "Frequency", "Next Run", "Generated", "Status", ""].map(
                    (h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-transparent divide-y divide-slate-100 dark:divide-slate-700">
                {items.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                    <td className="px-6 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {r.billTo?.clientName || "—"}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {FREQ_LABEL[r.frequency]}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {moment(r.nextRun).format("MMM D, YYYY")}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {r.generatedCount}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          r.active
                            ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {r.active ? "Active" : "Paused"}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => runNow(r)} disabled={busyId === r._id} title="Generate now" aria-label="Generate now" className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/40 text-blue-600 dark:text-blue-400 cursor-pointer disabled:opacity-50">
                          <Play className="w-4 h-4" />
                        </button>
                        <button onClick={() => toggleActive(r)} disabled={busyId === r._id} title={r.active ? "Pause" : "Resume"} aria-label={r.active ? "Pause recurring invoice" : "Resume recurring invoice"} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/40 text-slate-600 dark:text-slate-300 cursor-pointer disabled:opacity-50">
                          {r.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button onClick={() => remove(r)} disabled={busyId === r._id} title="Delete" aria-label="Delete recurring invoice" className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/15 text-red-500 cursor-pointer disabled:opacity-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Recurring;
