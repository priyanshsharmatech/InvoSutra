import { useState, useRef } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import Button from "../ui/Button";
import Dropdown from "../ui/Dropdown";
import DatePicker from "../ui/DatePicker";
import Checkbox from "../ui/Checkbox";
import useFocusTrap from "../../hooks/useFocusTrap";

const today = () => new Date().toISOString().split("T")[0];

// Set up a recurring schedule from an existing invoice. Opens when `invoice`
// is provided; posts a recurring template and calls onClose on success.
const RecurringModal = ({ invoice, onClose }) => {
  const [form, setForm] = useState({
    frequency: "monthly",
    startDate: today(),
    endDate: "",
    maxOccurrences: "",
    autoEmail: false,
  });
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, Boolean(invoice), onClose);

  const submit = async () => {
    setSaving(true);
    try {
      await axiosInstance.post(API_PATHS.RECURRING.CREATE, {
        billFrom: invoice.billFrom,
        billTo: invoice.billTo,
        items: (invoice.items || []).map((it) => ({
          name: it.name,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          taxPercent: it.taxPercent || 0,
        })),
        notes: invoice.notes,
        paymentTerms: invoice.paymentTerms,
        theme: invoice.theme,
        discount: invoice.discount,
        frequency: form.frequency,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        maxOccurrences: form.maxOccurrences ? Number(form.maxOccurrences) : undefined,
        autoEmail: form.autoEmail,
      });
      toast.success("Recurring schedule set up!");
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to set up recurring.");
    } finally {
      setSaving(false);
    }
  };

  if (!invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Make recurring"
        className="relative bg-white dark:bg-slate-800 ring-1 ring-slate-200/60 dark:ring-slate-700 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4"
      >
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Make recurring
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Auto-generate a new document from {invoice.invoiceNumber} on a schedule.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Frequency
          </label>
          <Dropdown
            value={form.frequency}
            onChange={(v) => setForm((p) => ({ ...p, frequency: v }))}
            options={[
              { value: "weekly", label: "Weekly" },
              { value: "monthly", label: "Monthly" },
              { value: "quarterly", label: "Quarterly" },
              { value: "yearly", label: "Yearly" },
            ]}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              First run date
            </label>
            <DatePicker
              value={form.startDate}
              onChange={(v) => setForm((p) => ({ ...p, startDate: v }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              End date <span className="text-slate-400">(optional)</span>
            </label>
            <DatePicker
              value={form.endDate}
              min={form.startDate}
              onChange={(v) => setForm((p) => ({ ...p, endDate: v }))}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Max occurrences <span className="text-slate-400">(optional)</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Unlimited"
            value={form.maxOccurrences}
            onChange={(e) =>
              setForm((p) => ({ ...p, maxOccurrences: e.target.value.replace(/[^0-9]/g, "") }))
            }
            className="w-full h-10 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <Checkbox
            checked={form.autoEmail}
            onChange={(e) => setForm((p) => ({ ...p, autoEmail: e.target.checked }))}
            ariaLabel="Email each generated invoice to the client"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">
            Email each generated invoice to the client
          </span>
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} isLoading={saving}>
            Set up
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RecurringModal;
