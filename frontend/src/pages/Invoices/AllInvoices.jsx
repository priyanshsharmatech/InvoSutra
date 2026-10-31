import React, { useEffect, useState, useCallback } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import {
  Loader2,
  Search,
  FileText,
  Plus,
  AlertCircle,
  Sparkles,
  AlertTriangle,
  Download,
  X,
  Trash2,
  Send,
} from "lucide-react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button";
import Dropdown from "../../components/ui/Dropdown";
import Checkbox from "../../components/ui/Checkbox";
import InvoiceRowActions from "../../components/invoices/InvoiceRowActions";
import { statusBadgeClass, effectiveStatus } from "../../utils/helper";
import { DOC_TYPES } from "../../utils/docTypes";
import { downloadCsv, INVOICE_CSV_COLUMNS } from "../../utils/csv";
import CreateWithAIModal from "../../components/invoices/CreateWithAIModal";
import ReminderModal from "../../components/invoices/ReminderModal";
import TrashModal from "../../components/invoices/TrashModal";
import RecurringModal from "../../components/invoices/RecurringModal";

const AllInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true); // only true until first fetch resolves
  const [error, setError] = useState(null);
  const [statusChangeLoading, setStatusChangeLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // Default to 'All'
  const [docType, setDocType] = useState("invoice"); // invoice | estimate | creditnote
  const [selected, setSelected] = useState(new Set()); // selected invoice ids for bulk actions
  const [bulkLoading, setBulkLoading] = useState(null); // current bulk action in progress
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const [recurringInvoice, setRecurringInvoice] = useState(null);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [selectedInvoiceEmail, setSelectedInvoiceEmail] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const navigate = useNavigate();

  // Server-side list fetch: pagination + search + status filter.
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        API_PATHS.INVOICE.GET_ALL_INVOICES,
        {
          params: {
            page,
            limit: 10,
            type: docType,
            search: debouncedSearch || undefined,
            status: statusFilter === "All" ? undefined : statusFilter,
          },
        }
      );
      setInvoices(response.data.data);
      setPagination(response.data.pagination);
      setSelected(new Set()); // clear stale selection on any refetch
      setError(null);
    } catch (err) {
      setError("Failed to fetch invoices.");
      console.error(err);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [page, debouncedSearch, statusFilter, docType]);

  // Debounce the search box, and reset to page 1 on a new search.
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(searchTerm);
    }, 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleDelete = async () => {
    if (!invoiceToDelete) return;
    try {
      await axiosInstance.delete(
        API_PATHS.INVOICE.DELETE_INVOICE(invoiceToDelete._id)
      );
      fetchInvoices();
    } catch (err) {
      setError("Failed to delete invoice.");
      console.error(err);
    } finally {
      setInvoiceToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const openDeleteModal = (invoice) => {
    setInvoiceToDelete(invoice);
    setIsDeleteModalOpen(true);
  };

  const handleStatusChange = async (invoice) => {
    setStatusChangeLoading(invoice._id);
    try {
      // Toggle between 'Paid' and 'Unpaid'
      const newStatus = invoice.status === "Paid" ? "Unpaid" : "Paid";
      await axiosInstance.put(API_PATHS.INVOICE.UPDATE_INVOICE(invoice._id), {
        status: newStatus,
      });
      fetchInvoices();
    } catch (err) {
      setError("Failed to update invoice status.");
      console.error(err);
    } finally {
      setStatusChangeLoading(null);
    }
  };

  // POST a create/convert action from a row, then open the new document.
  const handleRowCreate = async (path, successMsg) => {
    try {
      const res = await axiosInstance.post(path);
      toast.success(successMsg);
      navigate(`/invoices/${res.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed.");
      console.error(err);
    }
  };

  // Email the document (server generates the PDF attachment).
  const handleSend = async (invoice) => {
    if (!invoice.billTo?.email) {
      toast.error("This document has no client email.");
      return;
    }
    try {
      const res = await axiosInstance.post(API_PATHS.INVOICE.SEND_INVOICE(invoice._id));
      toast.success(res.data?.message || "Sent");
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send.");
    }
  };

  const handleDownloadPdf = async (invoice) => {
    try {
      const res = await axiosInstance.get(API_PATHS.INVOICE.PDF(invoice._id), {
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
    } catch {
      toast.error("Failed to generate PDF.");
    }
  };

  const handlePrintDoc = async (invoice) => {
    try {
      const res = await axiosInstance.get(API_PATHS.INVOICE.PDF(invoice._id), {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const w = window.open(url, "_blank");
      if (w) w.addEventListener("load", () => w.print());
    } catch {
      toast.error("Failed to open PDF for printing.");
    }
  };

  const handleThemeChangeRow = async (invoice, theme) => {
    try {
      await axiosInstance.put(API_PATHS.INVOICE.UPDATE_INVOICE(invoice._id), { theme });
      toast.success(`Theme set to ${theme}`);
      fetchInvoices();
    } catch {
      toast.error("Failed to change theme.");
    }
  };

  const handleOpenReminderModal = (invoice) => {
    setSelectedInvoiceId(invoice._id);
    setSelectedInvoiceEmail(invoice.billTo?.email || "");
    setIsReminderModalOpen(true);
  };

  const handleExportCsv = async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.INVOICE.GET_ALL_INVOICES, {
        params: {
          limit: 1000,
          type: docType,
          search: debouncedSearch || undefined,
          status: statusFilter === "All" ? undefined : statusFilter,
        },
      });
      const rows = res.data.data;
      if (!rows.length) {
        toast.error("No invoices to export.");
        return;
      }
      downloadCsv("invoices.csv", INVOICE_CSV_COLUMNS, rows);
      toast.success(`Exported ${rows.length} invoice(s).`);
    } catch (err) {
      toast.error("Failed to export invoices.");
      console.error(err);
    }
  };

  // Document-type tabs config + labels for the active type (shared metadata).
  const activeDoc =
    DOC_TYPES.find((d) => d.value === docType) || DOC_TYPES[0];

  const handleDocTypeChange = (value) => {
    if (value === docType) return;
    setPage(1);
    setDocType(value);
  };

  // Selection helpers for bulk actions.
  const toggleSelectOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const allSelected =
        invoices.length > 0 && invoices.every((inv) => prev.has(inv._id));
      if (allSelected) return new Set();
      return new Set(invoices.map((inv) => inv._id));
    });
  };

  const clearSelection = () => setSelected(new Set());

  const handleBulkAction = async (action) => {
    if (selected.size === 0) return;
    if (
      action === "delete" &&
      !window.confirm(
        `Delete ${selected.size} selected ${
          selected.size === 1 ? activeDoc.singular : activeDoc.singular + "s"
        }? This action cannot be undone.`
      )
    ) {
      return;
    }
    setBulkLoading(action);
    try {
      const res = await axiosInstance.post(API_PATHS.INVOICE.BULK, {
        ids: [...selected],
        action,
      });
      toast.success(res.data?.message || `Updated ${res.data?.count ?? ""}`.trim());
      setSelected(new Set());
      fetchInvoices();
    } catch (err) {
      toast.error("Bulk action failed.");
      console.error(err);
    } finally {
      setBulkLoading(null);
    }
  };

  // Export the currently-selected rows to CSV.
  const handleBulkExport = () => {
    const rows = invoices.filter((i) => selected.has(i._id));
    if (!rows.length) return;
    downloadCsv("invoices-selected.csv", INVOICE_CSV_COLUMNS, rows);
    toast.success(`Exported ${rows.length}`);
  };

  // Email each selected document (skips those without a client email).
  const handleBulkSend = async () => {
    const rows = invoices.filter((i) => selected.has(i._id));
    const sendable = rows.filter((i) => i.billTo?.email);
    if (!sendable.length) {
      toast.error("None of the selected items have a client email.");
      return;
    }
    setBulkLoading("send");
    let ok = 0;
    for (const inv of sendable) {
      try {
        await axiosInstance.post(API_PATHS.INVOICE.SEND_INVOICE(inv._id));
        ok += 1;
      } catch {
        /* keep going */
      }
    }
    setBulkLoading(null);
    const skipped = rows.length - sendable.length;
    toast.success(
      `Sent ${ok}/${sendable.length}${skipped ? ` · ${skipped} skipped (no email)` : ""}`
    );
    setSelected(new Set());
    fetchInvoices();
  };

  // Server already filters/paginates; render the current page directly.
  const filteredInvoices = invoices;
  const allOnPageSelected =
    invoices.length > 0 && invoices.every((inv) => selected.has(inv._id));

  if (initialLoad) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modals */}
      <CreateWithAIModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
      <ReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        invoiceId={selectedInvoiceId}
        clientEmail={selectedInvoiceEmail}
      />
      <TrashModal
        isOpen={trashOpen}
        onClose={() => setTrashOpen(false)}
        onChanged={fetchInvoices}
      />
      <RecurringModal
        invoice={recurringInvoice}
        onClose={() => setRecurringInvoice(null)}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Delete confirmation"
            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg w-full max-w-sm p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Delete Invoice?
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
              Are you sure you want to delete{" "}
              <span className="font-medium text-slate-900 dark:text-slate-100">
                Invoice #{invoiceToDelete?.invoiceNumber}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {activeDoc.title}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Manage all your {activeDoc.label.toLowerCase()} in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant="secondary"
            onClick={() => setTrashOpen(true)}
            icon={Trash2}
          >
            Trash
          </Button>
          <Button
            variant="secondary"
            onClick={handleExportCsv}
            icon={Download}
          >
            Export CSV
          </Button>
          <Button
            variant="secondary"
            onClick={() => setIsAiModalOpen(true)}
            icon={Sparkles}
          >
            Create with AI
          </Button>
          <Button
            onClick={() => navigate(`/invoices/new?type=${docType}`)}
            icon={Plus}
          >
            {activeDoc.create}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 mb-1">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm">
        <div className="p-4 sm:p-6 border-b border-slate-200/60 dark:border-slate-700 space-y-4">
          {/* Document-type segmented tabs */}
          <div className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-lg">
            {DOC_TYPES.map((dt) => (
              <button
                key={dt.value}
                type="button"
                onClick={() => handleDocTypeChange(dt.value)}
                aria-pressed={docType === dt.value}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                  docType === dt.value
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                {dt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search by invoice # or client..."
                aria-label="Search by invoice number or client"
                className="w-full h-10 pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dropdown
              className="w-full sm:w-44 flex-shrink-0"
              value={statusFilter}
              onChange={(v) => {
                setPage(1);
                setStatusFilter(v);
              }}
              options={[
                { value: "All", label: "All Statuses" },
                { value: "Draft", label: "Draft" },
                { value: "Sent", label: "Sent" },
                { value: "Unpaid", label: "Unpaid" },
                { value: "Partially Paid", label: "Partially Paid" },
                { value: "Overdue", label: "Overdue" },
                { value: "Paid", label: "Paid" },
                { value: "Cancelled", label: "Cancelled" },
              ]}
            />
          </div>
        </div>

        <div
          className={`min-h-[320px] transition-opacity duration-200 ${
            loading ? "opacity-50" : "opacity-100"
          }`}
        >
        {filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/60 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              No {activeDoc.label.toLowerCase()} found
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
              {debouncedSearch || statusFilter !== "All"
                ? `Your search or filter criteria did not match any ${activeDoc.label.toLowerCase()}. Try adjusting your search.`
                : `You haven't created any ${activeDoc.label.toLowerCase()} yet. Get started by creating your first one.`}
            </p>
            {pagination.total === 0 &&
              !debouncedSearch &&
              statusFilter === "All" && (
                <Button
                  onClick={() => navigate(`/invoices/new?type=${docType}`)}
                  icon={Plus}
                >
                  {activeDoc.create}
                </Button>
              )}
          </div>
        ) : (
          <>
          {/* Mobile card list */}
          <ul className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
            {filteredInvoices.map((invoice) => (
              <li
                key={invoice._id}
                className={`p-4 ${
                  selected.has(invoice._id) ? "bg-blue-50/60 dark:bg-blue-500/10" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    ariaLabel={`Select invoice ${invoice.invoiceNumber}`}
                    checked={selected.has(invoice._id)}
                    onChange={() => toggleSelectOne(invoice._id)}
                    className="mt-0.5"
                  />
                  <div
                    className="min-w-0 flex-1 cursor-pointer"
                    onClick={() => navigate(`/invoices/${invoice._id}`)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                        {invoice.invoiceNumber}
                        {invoice.isDuplicate && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex-shrink-0">
                            Dup
                          </span>
                        )}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums flex-shrink-0">
                        ₹{invoice.total.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 truncate mt-0.5">
                      {invoice.billTo.clientName}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(
                          effectiveStatus(invoice)
                        )}`}
                      >
                        {effectiveStatus(invoice)}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        Due {moment(invoice.dueDate).format("MMM D, YYYY")}
                      </span>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <InvoiceRowActions
                      invoice={invoice}
                      statusLoading={statusChangeLoading === invoice._id}
                      onToggleStatus={() => handleStatusChange(invoice)}
                      onReminder={() => handleOpenReminderModal(invoice)}
                      onOpen={() => navigate(`/invoices/${invoice._id}`)}
                      onDelete={() => openDeleteModal(invoice)}
                      onDuplicate={() =>
                        handleRowCreate(
                          API_PATHS.INVOICE.DUPLICATE(invoice._id),
                          "Duplicated"
                        )
                      }
                      onConvert={() =>
                        handleRowCreate(
                          API_PATHS.INVOICE.CONVERT(invoice._id),
                          "Converted to invoice"
                        )
                      }
                      onCreditNote={() =>
                        handleRowCreate(
                          API_PATHS.INVOICE.CREDIT_NOTE(invoice._id),
                          "Credit note created"
                        )
                      }
                      onDebitNote={() =>
                        handleRowCreate(
                          API_PATHS.INVOICE.DEBIT_NOTE(invoice._id),
                          "Debit note created"
                        )
                      }
                      onReceipt={() =>
                        handleRowCreate(
                          API_PATHS.INVOICE.RECEIPT(invoice._id),
                          "Receipt created"
                        )
                      }
                      onSend={() => handleSend(invoice)}
                      onDownloadPdf={() => handleDownloadPdf(invoice)}
                      onPrint={() => handlePrintDoc(invoice)}
                      onMakeRecurring={() => setRecurringInvoice(invoice)}
                      onThemeChange={(theme) => handleThemeChangeRow(invoice, theme)}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="hidden md:block w-full overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="group/head bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  <th className="w-px pl-6 pr-3 py-3 text-left">
                    <Checkbox
                      ariaLabel="Select all on this page"
                      checked={allOnPageSelected}
                      indeterminate={selected.size > 0 && !allOnPageSelected}
                      onChange={toggleSelectAll}
                      className={`transition-opacity ${
                        selected.size > 0
                          ? "opacity-100"
                          : "opacity-0 group-hover/head:opacity-100"
                      }`}
                    />
                  </th>
                  <th className="pl-3 pr-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="pl-4 pr-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-transparent divide-y divide-slate-200 dark:divide-slate-700">
                {filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice._id}
                    className={`group transition-colors ${
                      selected.has(invoice._id)
                        ? "bg-blue-50/60 dark:bg-blue-500/10"
                        : "hover:bg-slate-50 dark:hover:bg-slate-700/40"
                    }`}
                  >
                    <td
                      className="w-px pl-6 pr-3 py-4 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        ariaLabel={`Select invoice ${invoice.invoiceNumber}`}
                        checked={selected.has(invoice._id)}
                        onChange={() => toggleSelectOne(invoice._id)}
                        className={`transition-opacity ${
                          selected.has(invoice._id)
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        }`}
                      />
                    </td>
                    <td
                      onClick={() => navigate(`/invoices/${invoice._id}`)}
                      className="pl-3 pr-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100 cursor-pointer"
                    >
                      {invoice.invoiceNumber}
                      {invoice.isDuplicate && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                          Duplicate
                        </span>
                      )}
                    </td>
                    <td
                      onClick={() => navigate(`/invoices/${invoice._id}`)}
                      className="px-4 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      {invoice.billTo.clientName}
                    </td>
                    <td
                      onClick={() => navigate(`/invoices/${invoice._id}`)}
                      className="px-4 py-4 whitespace-nowrap text-sm text-slate-800 dark:text-slate-200 text-right tabular-nums cursor-pointer"
                    >
                      ₹{invoice.total.toFixed(2)}
                    </td>
                    <td
                      onClick={() => navigate(`/invoices/${invoice._id}`)}
                      className="px-4 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      {moment(invoice.dueDate).format("MMM D, YYYY")}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(
                          effectiveStatus(invoice)
                        )}`}
                      >
                        {effectiveStatus(invoice)}
                      </span>
                    </td>
                    <td className="pl-4 pr-6 py-4 whitespace-nowrap text-right">
                      <div
                        className="flex items-center justify-end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <InvoiceRowActions
                          invoice={invoice}
                          statusLoading={statusChangeLoading === invoice._id}
                          onToggleStatus={() => handleStatusChange(invoice)}
                          onReminder={() => handleOpenReminderModal(invoice)}
                          onOpen={() => navigate(`/invoices/${invoice._id}`)}
                          onDelete={() => openDeleteModal(invoice)}
                        />
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

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 border-t border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Page {pagination.page} of {pagination.totalPages} ·{" "}
              {pagination.total} total
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="small"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={page >= pagination.totalPages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Floating bulk-action bar — appears only when rows are selected */}
      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-3 print:hidden pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-3 rounded-full bg-slate-900/95 dark:bg-slate-800 text-white backdrop-blur-md shadow-xl ring-1 ring-black/10 pl-4 pr-2 py-2 animate-slide-down max-w-[calc(100vw-1.5rem)] overflow-x-auto no-scrollbar [&>*]:flex-shrink-0">
            <span className="text-sm font-medium whitespace-nowrap">
              {selected.size} selected
            </span>
            <span className="w-px h-5 bg-white/20" />
            <button
              onClick={handleBulkSend}
              disabled={bulkLoading === "send"}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {bulkLoading === "send" ? "Sending…" : "Send"}
            </button>
            <button
              onClick={handleBulkExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            <button
              onClick={() => handleBulkAction("markPaid")}
              disabled={bulkLoading === "markPaid"}
              className="px-3 py-1.5 text-sm font-medium rounded-full hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              {bulkLoading === "markPaid" ? "…" : "Mark Paid"}
            </button>
            <button
              onClick={() => handleBulkAction("markUnpaid")}
              disabled={bulkLoading === "markUnpaid"}
              className="px-3 py-1.5 text-sm font-medium rounded-full hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              {bulkLoading === "markUnpaid" ? "…" : "Mark Unpaid"}
            </button>
            <button
              onClick={() => handleBulkAction("delete")}
              disabled={bulkLoading === "delete"}
              className="px-3 py-1.5 text-sm font-medium rounded-full text-red-300 hover:bg-red-500/20 transition-colors cursor-pointer disabled:opacity-50"
            >
              {bulkLoading === "delete" ? "…" : "Delete"}
            </button>
            <button
              onClick={clearSelection}
              aria-label="Clear selection"
              className="ml-1 p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllInvoices;
