import React, { useState, useEffect, useRef } from "react";
import moment from "moment";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import {
  Loader2,
  Edit,
  Printer,
  AlertCircle,
  Mail,
  Send,
  Download,
  Repeat,
  Copy,
  FileMinus,
  FilePlus,
  Receipt,
  ArrowRightLeft,
  MoreVertical,
  Check,
  Link2,
} from "lucide-react";
import html2pdf from "html2pdf.js";
import toast from "react-hot-toast";
import CreateInvoice from "./CreateInvoice";
import Button from "../../components/ui/Button";
import ReminderModal from "../../components/invoices/ReminderModal";
import InvoiceTemplate, {
  THEME_OPTIONS,
} from "../../components/invoices/InvoiceTemplate";
import Dropdown from "../../components/ui/Dropdown";
import DatePicker from "../../components/ui/DatePicker";
import Checkbox from "../../components/ui/Checkbox";
import {
  MANUAL_STATUSES,
  statusBadgeClass,
  effectiveStatus,
} from "../../utils/helper";
import { docTypeMeta } from "../../utils/docTypes";
import PaymentsPanel from "../../components/invoices/PaymentsPanel";
import AttachmentsPanel from "../../components/invoices/AttachmentsPanel";

// A single row inside the "More actions" menu.
const MenuItem = ({ icon: Icon, onClick, children, selected }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer"
  >
    {Icon && <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />}
    <span className="flex-1">{children}</span>
    {selected && <Check className="w-4 h-4 text-blue-600" />}
  </button>
);

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const menuRef = useRef(null);
  // Derived-document (credit/debit note, receipt) creation modal.
  const [derived, setDerived] = useState(null); // { label, path }
  const [derivedAmount, setDerivedAmount] = useState("");
  const [derivedReason, setDerivedReason] = useState("");
  const [recurringForm, setRecurringForm] = useState({
    frequency: "monthly",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    maxOccurrences: "",
    autoEmail: false,
  });
  const [savingRecurring, setSavingRecurring] = useState(false);
  const invoiceRef = useRef();

  // Close the "More actions" menu on outside click or Escape.
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await axiosInstance.get(
          API_PATHS.INVOICE.GET_INVOICE_BY_ID(id)
        );
        setInvoice(response.data);
      } catch (error) {
        toast.error("Failed to fetch invoice.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const handleUpdate = async (formData) => {
    // Let errors propagate so CreateInvoice can surface the specific reason.
    const response = await axiosInstance.put(
      API_PATHS.INVOICE.UPDATE_INVOICE(id),
      formData
    );
    toast.success("Invoice updated successfully!");
    setIsEditing(false);
    setInvoice(response.data);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleMakeRecurring = async () => {
    setSavingRecurring(true);
    try {
      await axiosInstance.post(API_PATHS.RECURRING.CREATE, {
        billFrom: invoice.billFrom,
        billTo: invoice.billTo,
        items: invoice.items.map((it) => ({
          name: it.name,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          taxPercent: it.taxPercent || 0,
        })),
        notes: invoice.notes,
        paymentTerms: invoice.paymentTerms,
        theme: invoice.theme,
        discount: invoice.discount,
        frequency: recurringForm.frequency,
        startDate: recurringForm.startDate,
        endDate: recurringForm.endDate || undefined,
        maxOccurrences: recurringForm.maxOccurrences
          ? Number(recurringForm.maxOccurrences)
          : undefined,
        autoEmail: recurringForm.autoEmail,
      });
      toast.success("Recurring invoice set up!");
      setRecurringOpen(false);
      navigate("/recurring");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to set up recurring.");
    } finally {
      setSavingRecurring(false);
    }
  };

  // Server-side PDF (Puppeteer) — consistent output, no client rendering quirks.
  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      const res = await axiosInstance.get(API_PATHS.INVOICE.PDF(id), {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice.invoiceNumber || "invoice"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to generate PDF.");
      console.error(error);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleThemeChange = async (theme) => {
    // Optimistic update; preserve the populated user (brand assets) since the
    // update endpoint returns the invoice with user as an id only.
    const prevUser = invoice.user;
    setInvoice((prev) => ({ ...prev, theme }));
    try {
      const response = await axiosInstance.put(
        API_PATHS.INVOICE.UPDATE_INVOICE(id),
        { theme }
      );
      setInvoice({ ...response.data, user: prevUser });
    } catch (error) {
      toast.error("Failed to change theme.");
      setInvoice((prev) => ({ ...prev, theme: invoice.theme }));
      console.error(error);
    }
  };

  const handleStatusChange = async (status) => {
    const prevUser = invoice.user;
    const prevStatus = invoice.status;
    setInvoice((prev) => ({ ...prev, status }));
    try {
      const response = await axiosInstance.put(
        API_PATHS.INVOICE.UPDATE_INVOICE(id),
        { status }
      );
      setInvoice({ ...response.data, user: prevUser });
      toast.success(`Marked as ${status}`);
    } catch (error) {
      toast.error("Failed to change status.");
      setInvoice((prev) => ({ ...prev, status: prevStatus }));
      console.error(error);
    }
  };

  const handleSendInvoice = async () => {
    setIsSending(true);
    try {
      // Attach a generated PDF when possible.
      const fd = new FormData();
      try {
        if (invoiceRef.current) {
          const blob = await html2pdf()
            .set({
              margin: 0,
              image: { type: "jpeg", quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
              jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
            })
            .from(invoiceRef.current)
            .outputPdf("blob");
          fd.append("pdf", blob, `${invoice.invoiceNumber}.pdf`);
        }
      } catch (pdfErr) {
        console.warn("PDF attach skipped:", pdfErr);
      }

      const response = await axiosInstance.post(
        API_PATHS.INVOICE.SEND_INVOICE(id),
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      toast.success(response.data.message || "Invoice sent");
      // Reflect the server's status change (e.g. → "Sent") and delivery time.
      setInvoice((prev) => ({
        ...prev,
        status: response.data.status || prev.status,
        lastSentAt: response.data.lastSentAt || prev.lastSentAt,
      }));
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to send invoice email."
      );
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const handleAction = async (apiCall, successMsg) => {
    try {
      const res = await apiCall();
      toast.success(successMsg);
      navigate(`/invoices/${res.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed.");
      console.error(error);
    }
  };

  const handleDuplicate = () =>
    handleAction(
      () => axiosInstance.post(API_PATHS.INVOICE.DUPLICATE(id)),
      "Invoice duplicated (draft created)"
    );
  const handleConvert = () =>
    handleAction(
      () => axiosInstance.post(API_PATHS.INVOICE.CONVERT(id)),
      "Converted to invoice"
    );
  const openDerived = (label, path) => {
    setDerivedAmount("");
    setDerivedReason("");
    setDerived({ label, path });
  };
  const submitDerived = () => {
    if (!derived) return;
    const amt = Number(derivedAmount);
    const body = {};
    if (amt > 0) body.amount = amt;
    if (derivedReason.trim()) body.reason = derivedReason.trim();
    const path = derived.path;
    setDerived(null);
    handleAction(
      () => axiosInstance.post(path, body),
      "Created successfully"
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 ring-1 ring-slate-200/60 shadow-sm">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">
          Invoice Not Found
        </h3>
        <p className="text-slate-500 mb-6 max-w-md">
          The invoice you are looking for does not exist or could not be loaded.
        </p>
        <Button onClick={() => navigate("/invoices")}>
          Back to All Invoices
        </Button>
      </div>
    );
  }

  if (isEditing) {
    return <CreateInvoice existingInvoice={invoice} onSave={handleUpdate} />;
  }

  return (
    <>
      <ReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        invoiceId={id}
        clientEmail={invoice.billTo?.email}
      />

      {derived && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 print:hidden">
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm"
            onClick={() => setDerived(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Create ${derived.label}`}
            className="relative bg-white dark:bg-slate-800 ring-1 ring-slate-200/60 dark:ring-slate-700 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Create {derived.label}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Leave the amount blank to copy the full invoice, or enter a partial
              amount for a single adjustment line.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Amount <span className="text-slate-400">(optional)</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder={`Full · ₹${Math.max(
                  (invoice.total || 0) - (invoice.amountPaid || 0),
                  0
                ).toFixed(2)}`}
                value={derivedAmount}
                onChange={(e) =>
                  setDerivedAmount(e.target.value.replace(/[^0-9.]/g, ""))
                }
                className="w-full h-10 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Reason <span className="text-slate-400">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Partial refund"
                value={derivedReason}
                onChange={(e) => setDerivedReason(e.target.value)}
                className="w-full h-10 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setDerived(null)}>
                Cancel
              </Button>
              <Button onClick={submitDerived}>Create {derived.label}</Button>
            </div>
          </div>
        </div>
      )}

      {recurringOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 print:hidden">
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm"
            onClick={() => setRecurringOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Make invoice recurring"
            className="bg-white/95 backdrop-blur-xl ring-1 ring-slate-200/60 rounded-2xl shadow-xl max-w-md w-full p-6 relative space-y-4"
          >
            <h3 className="text-lg font-semibold text-slate-900">
              Make this invoice recurring
            </h3>
            <p className="text-sm text-slate-600">
              Auto-generate a new invoice from these details on a schedule.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Frequency
              </label>
              <Dropdown
                value={recurringForm.frequency}
                onChange={(v) =>
                  setRecurringForm((p) => ({ ...p, frequency: v }))
                }
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
                  value={recurringForm.startDate}
                  onChange={(v) =>
                    setRecurringForm((p) => ({ ...p, startDate: v }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  End date <span className="text-slate-400">(optional)</span>
                </label>
                <DatePicker
                  value={recurringForm.endDate}
                  min={recurringForm.startDate}
                  onChange={(v) =>
                    setRecurringForm((p) => ({ ...p, endDate: v }))
                  }
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
                value={recurringForm.maxOccurrences}
                onChange={(e) =>
                  setRecurringForm((p) => ({
                    ...p,
                    maxOccurrences: e.target.value.replace(/[^0-9]/g, ""),
                  }))
                }
                className="w-full h-10 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Checkbox
                checked={recurringForm.autoEmail}
                onChange={(e) =>
                  setRecurringForm((p) => ({ ...p, autoEmail: e.target.checked }))
                }
                ariaLabel="Email each generated invoice to the client"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Email each generated invoice to the client
              </span>
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setRecurringOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleMakeRecurring} isLoading={savingRecurring}>
                Set up
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 print:hidden">
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {docTypeMeta(invoice.type).name}{" "}
            <span className="font-mono text-slate-500">
              {invoice.invoiceNumber}
            </span>
          </h1>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(
              effectiveStatus(invoice)
            )}`}
          >
            {effectiveStatus(invoice)}
          </span>
          {invoice.isDuplicate && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
              Duplicate
            </span>
          )}
          {invoice.lastSentAt && (
            <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">
              Sent {moment(invoice.lastSentAt).fromNow()}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick status control */}
          <Dropdown
            className="w-36"
            value={invoice.status}
            onChange={handleStatusChange}
            options={MANUAL_STATUSES.map((s) => ({ value: s, label: s }))}
          />

          {/* Primary actions */}
          <Button
            variant="secondary"
            onClick={() => setIsEditing(true)}
            icon={Edit}
          >
            Edit
          </Button>
          <Button
            variant="secondary"
            onClick={handleSendInvoice}
            icon={isSending ? Loader2 : Send}
            disabled={isSending || !invoice.billTo?.email}
          >
            {isSending ? "Sending..." : "Send"}
          </Button>
          <Button
            variant="primary"
            onClick={handleDownloadPdf}
            icon={pdfLoading ? Loader2 : Download}
            disabled={pdfLoading}
          >
            {pdfLoading ? "Generating…" : "Download PDF"}
          </Button>

          {/* Everything else, tucked into a menu */}
          <div className="relative" ref={menuRef}>
            <Button
              variant="secondary"
              onClick={() => setMenuOpen((o) => !o)}
              icon={MoreVertical}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              More
            </Button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-56 max-h-[70vh] overflow-auto bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 py-1 z-50"
              >
                {invoice.status !== "Paid" && (
                  <MenuItem
                    icon={Mail}
                    onClick={() => {
                      setMenuOpen(false);
                      setIsReminderModalOpen(true);
                    }}
                  >
                    Generate Reminder
                  </MenuItem>
                )}
                <MenuItem
                  icon={Repeat}
                  onClick={() => {
                    setMenuOpen(false);
                    setRecurringOpen(true);
                  }}
                >
                  Make Recurring
                </MenuItem>
                <MenuItem
                  icon={Copy}
                  onClick={() => {
                    setMenuOpen(false);
                    handleDuplicate();
                  }}
                >
                  Duplicate
                </MenuItem>
                {["estimate", "proforma"].includes(invoice.type) && (
                  <MenuItem
                    icon={ArrowRightLeft}
                    onClick={() => {
                      setMenuOpen(false);
                      handleConvert();
                    }}
                  >
                    Convert to Invoice
                  </MenuItem>
                )}
                {(invoice.type || "invoice") === "invoice" && (
                  <>
                    <MenuItem
                      icon={FileMinus}
                      onClick={() => {
                        setMenuOpen(false);
                        openDerived("Credit Note", API_PATHS.INVOICE.CREDIT_NOTE(id));
                      }}
                    >
                      Credit Note
                    </MenuItem>
                    <MenuItem
                      icon={FilePlus}
                      onClick={() => {
                        setMenuOpen(false);
                        openDerived("Debit Note", API_PATHS.INVOICE.DEBIT_NOTE(id));
                      }}
                    >
                      Debit Note
                    </MenuItem>
                    <MenuItem
                      icon={Receipt}
                      onClick={() => {
                        setMenuOpen(false);
                        openDerived("Receipt", API_PATHS.INVOICE.RECEIPT(id));
                      }}
                    >
                      Receipt
                    </MenuItem>
                  </>
                )}
                <MenuItem
                  icon={Printer}
                  onClick={() => {
                    setMenuOpen(false);
                    handlePrint();
                  }}
                >
                  Print
                </MenuItem>

                {/* Theme picker */}
                <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                <p className="px-3 pt-1 pb-0.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Theme
                </p>
                {THEME_OPTIONS.map((opt) => (
                  <MenuItem
                    key={opt.value}
                    selected={(invoice.theme || "classic") === opt.value}
                    onClick={() => {
                      setMenuOpen(false);
                      handleThemeChange(opt.value);
                    }}
                  >
                    {opt.label}
                  </MenuItem>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {(() => {
        const related = [
          ...(invoice.relatedInvoice ? [invoice.relatedInvoice] : []),
          ...(invoice.relatedDocs || []),
        ].filter((r) => r && r._id);
        if (!related.length) return null;
        return (
          <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
            <span className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
              <Link2 className="w-4 h-4" />
              Related:
            </span>
            {related.map((r) => (
              <button
                key={r._id}
                onClick={() => navigate(`/invoices/${r._id}`)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/25 transition-colors cursor-pointer"
              >
                {docTypeMeta(r.type).name}
                <span className="font-mono">{r.invoiceNumber}</span>
              </button>
            ))}
          </div>
        );
      })()}

      <div id="invoice-content-wrapper" className="overflow-x-auto no-scrollbar">
        <div
          ref={invoiceRef}
          id="invoice-preview"
          className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden min-w-[480px]"
        >
          <InvoiceTemplate invoice={invoice} brand={invoice.user} />
        </div>
      </div>

      <div className="mt-6 print:hidden">
        <PaymentsPanel
          invoice={invoice}
          onUpdated={(updated) =>
            setInvoice((prev) => ({ ...updated, user: prev.user }))
          }
        />
      </div>

      <div className="mt-6 print:hidden">
        <AttachmentsPanel
          invoice={invoice}
          onUpdated={(updated) =>
            setInvoice((prev) => ({ ...updated, user: prev.user }))
          }
        />
      </div>

      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #invoice-content-wrapper,
            #invoice-content-wrapper * {
              visibility: visible;
            }
            /* Keep the designed colors (table header, total bar, accent) in print */
            #invoice-content-wrapper,
            #invoice-content-wrapper * {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            #invoice-content-wrapper {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 0;
            }
            #invoice-preview {
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
            }
          }
        `}
      </style>
    </>
  );
};

export default InvoiceDetail;
