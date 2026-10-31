import { useEffect, useState, useCallback, useRef } from "react";
import { Loader2, RotateCcw, Trash2, X } from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import moment from "moment";
import { docTypeMeta } from "../../utils/docTypes";
import useFocusTrap from "../../hooks/useFocusTrap";

// Lists soft-deleted documents with Restore / Delete-permanently actions.
const TrashModal = ({ isOpen, onClose, onChanged }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, isOpen, onClose);

  const fetchTrash = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(API_PATHS.INVOICE.TRASH);
      setItems(res.data.data);
    } catch {
      toast.error("Failed to load Trash.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchTrash();
  }, [isOpen, fetchTrash]);

  const restore = async (inv) => {
    setBusyId(inv._id);
    try {
      await axiosInstance.post(API_PATHS.INVOICE.RESTORE(inv._id));
      toast.success("Restored");
      setItems((p) => p.filter((i) => i._id !== inv._id));
      onChanged?.();
    } catch {
      toast.error("Failed to restore.");
    } finally {
      setBusyId(null);
    }
  };

  const purge = async (inv) => {
    if (!window.confirm(`Permanently delete ${inv.invoiceNumber}? This cannot be undone.`))
      return;
    setBusyId(inv._id);
    try {
      await axiosInstance.delete(API_PATHS.INVOICE.PERMANENT_DELETE(inv._id));
      toast.success("Permanently deleted");
      setItems((p) => p.filter((i) => i._id !== inv._id));
    } catch {
      toast.error("Failed to delete.");
    } finally {
      setBusyId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Trash"
        className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl ring-1 ring-slate-200/60 dark:ring-slate-700 w-full max-w-2xl max-h-[80vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/70 dark:border-slate-700">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Trash
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Deleted documents can be restored or removed permanently.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/40 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-auto no-scrollbar p-2">
          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400 dark:text-slate-500">
              Trash is empty.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              {items.map((inv) => (
                <li
                  key={inv._id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {inv.invoiceNumber}{" "}
                      <span className="text-xs font-normal text-slate-400">
                        · {docTypeMeta(inv.type).name}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {inv.billTo?.clientName || "—"} · deleted{" "}
                      {inv.deletedAt ? moment(inv.deletedAt).fromNow() : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => restore(inv)}
                    disabled={busyId === inv._id}
                    title="Restore"
                    aria-label="Restore"
                    className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/15 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => purge(inv)}
                    disabled={busyId === inv._id}
                    title="Delete permanently"
                    aria-label="Delete permanently"
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/15 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrashModal;
