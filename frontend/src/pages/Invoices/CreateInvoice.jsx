import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import {
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Pencil,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import moment from "moment";
import { useAuth } from "../../context/AuthContext";
import { getApiErrorMessages } from "../../utils/helper";
import { DOC_TYPES, docTypeMeta } from "../../utils/docTypes";
import { sanitizePhone, sanitizeGstin } from "../../utils/sanitize";

import InputField from "../../components/ui/InputField";
import TextareaField from "../../components/ui/TextareaField";
import Dropdown from "../../components/ui/Dropdown";
import DatePicker from "../../components/ui/DatePicker";
import Button from "../../components/ui/Button";
import InvoiceTemplate, {
  THEME_OPTIONS,
} from "../../components/invoices/InvoiceTemplate";

const TERM_DAYS = { "Net 15": 15, "Net 30": 30, "Net 60": 60, "Due on receipt": 0 };

const addDays = (dateStr, days) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const emptyItem = () => ({
  name: "",
  hsn: "",
  quantity: 1,
  unitPrice: 0,
  taxPercent: 0,
  discount: { type: "flat", value: 0 },
});

// Keep only digits and a single decimal point, and drop leading zeros so a
// starting "0" is replaced as soon as the user types a real value.
const toNumericString = (v) => {
  let s = String(v).replace(/[^0-9.]/g, "");
  const parts = s.split(".");
  if (parts.length > 2) s = `${parts[0]}.${parts.slice(1).join("")}`;
  s = s.replace(/^0+(?=\d)/, ""); // "05" -> "5", keeps "0" and "0.5"
  return s;
};

const CreateInvoice = ({ existingInvoice, onSave }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // New documents take their type from the ?type= query param (defaults to
  // invoice); when editing, the type comes from the existing document.
  const newDocType =
    new URLSearchParams(location.search).get("type") || "invoice";

  const [formData, setFormData] = useState(
    existingInvoice || {
      type: newDocType,
      invoiceNumber: "",
      invoiceDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      billFrom: {
        businessName: user?.businessName || "",
        email: user?.email || "",
        address: user?.address || "",
        phone: user?.phone || "",
        gstin: user?.gstin || "",
        state: user?.state || "",
      },
      billTo: { clientName: "", email: "", address: "", phone: "", gstin: "", state: "" },
      items: [emptyItem()],
      notes: user?.defaultNotes || "",
      paymentTerms: user?.defaultPaymentTerms || "Net 15",
      theme: user?.invoiceTheme || "classic",
      discount: { type: "flat", value: 0 },
      additionalCharges: 0,
      status: "Unpaid",
    }
  );

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ items: {} });
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(!existingInvoice);
  const [showPreview, setShowPreview] = useState(false);
  const [clients, setClients] = useState([]);
  const [dirty, setDirty] = useState(false);

  // Labels/number reflect the currently-selected document type.
  const docMeta = docTypeMeta(formData.type || "invoice");

  // Switch the document kind (new docs only) and refresh its suggested number,
  // since each type has its own prefix and running sequence.
  const handleDocTypeSelect = async (type) => {
    setDirty(true);
    setFormData((prev) => ({ ...prev, type }));
    try {
      setIsGeneratingNumber(true);
      const res = await axiosInstance.get(API_PATHS.INVOICE.NEXT_NUMBER, {
        params: { type },
      });
      setFormData((prev) => ({ ...prev, invoiceNumber: res.data.invoiceNumber }));
    } catch (error) {
      console.error("Failed to fetch number for type", error);
    } finally {
      setIsGeneratingNumber(false);
    }
  };

  useEffect(() => {
    const aiData = location.state?.aiData;
    if (aiData) {
      // AI returns only name/quantity/unitPrice — merge into the full item
      // shape so hsn/taxPercent exist (keeps the inputs controlled).
      const aiItems = aiData.items?.length
        ? aiData.items.map((it) => ({
            ...emptyItem(),
            name: it.name || "",
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
          }))
        : [emptyItem()];
      setFormData((prev) => ({
        ...prev,
        billTo: {
          clientName: aiData.clientName || "",
          email: aiData.email || "",
          address: aiData.address || "",
          phone: "",
          gstin: "",
          state: "",
        },
        items: aiItems,
      }));
    }

    if (existingInvoice) {
      setFormData({
        ...existingInvoice,
        discount: existingInvoice.discount || { type: "flat", value: 0 },
        invoiceDate: moment(existingInvoice.invoiceDate).format("YYYY-MM-DD"),
        dueDate: existingInvoice.dueDate
          ? moment(existingInvoice.dueDate).format("YYYY-MM-DD")
          : "",
      });
    } else {
      (async () => {
        setIsGeneratingNumber(true);
        try {
          const [numRes, clientRes] = await Promise.all([
            axiosInstance.get(API_PATHS.INVOICE.NEXT_NUMBER, {
              params: { type: newDocType },
            }),
            axiosInstance
              .get(API_PATHS.CLIENTS.LIST, { params: { limit: 200 } })
              .catch(() => null),
          ]);
          setFormData((prev) => ({
            ...prev,
            invoiceNumber: numRes.data.invoiceNumber,
            dueDate:
              prev.dueDate ||
              addDays(prev.invoiceDate, TERM_DAYS[prev.paymentTerms] ?? 15),
          }));
          if (clientRes?.data?.data) setClients(clientRes.data.data);
        } catch (error) {
          console.error("Failed to initialize invoice form", error);
        }
        setIsGeneratingNumber(false);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingInvoice]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const handler = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const handleInputChange = (e, section, index) => {
    const { name, value } = e.target;
    setDirty(true);

    if (section) {
      // Keep party phone/GSTIN fields clean (no letters in phone, etc.).
      const clean =
        name === "phone"
          ? sanitizePhone(value)
          : name === "gstin"
          ? sanitizeGstin(value)
          : value;
      setFormData((prev) => ({
        ...prev,
        [section]: { ...prev[section], [name]: clean },
      }));
    } else if (index !== undefined) {
      const newItems = [...formData.items];
      const v = ["quantity", "unitPrice", "taxPercent"].includes(name)
        ? toNumericString(value)
        : value;
      newItems[index] = { ...newItems[index], [name]: v };
      setFormData((prev) => ({ ...prev, items: newItems }));
    } else if (name === "paymentTerms") {
      // Auto-set the due date from the selected terms.
      const days = TERM_DAYS[value];
      setFormData((prev) => ({
        ...prev,
        paymentTerms: value,
        dueDate:
          days === undefined ? prev.dueDate : addDays(prev.invoiceDate, days),
      }));
    } else if (name === "invoiceDate") {
      // Recompute the due date from the current terms.
      const days = TERM_DAYS[formData.paymentTerms];
      setFormData((prev) => ({
        ...prev,
        invoiceDate: value,
        dueDate: days === undefined ? prev.dueDate : addDays(value, days),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const setDiscount = (patch) => {
    setDirty(true);
    setFormData((prev) => ({ ...prev, discount: { ...prev.discount, ...patch } }));
  };

  // Update a single item's per-line discount (type or value).
  const handleItemDiscount = (index, patch) => {
    setDirty(true);
    setFormData((prev) => {
      const items = [...prev.items];
      const cur = items[index].discount || { type: "flat", value: 0 };
      items[index] = { ...items[index], discount: { ...cur, ...patch } };
      return { ...prev, items };
    });
  };

  const handleAddItem = () => {
    setDirty(true);
    setFormData((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  };

  const handleRemoveItem = (index) => {
    setDirty(true);
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleDuplicateItem = (index) => {
    setDirty(true);
    setFormData((prev) => {
      const items = [...prev.items];
      items.splice(index + 1, 0, { ...items[index] });
      return { ...prev, items };
    });
  };

  const handleMoveItem = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= formData.items.length) return;
    setDirty(true);
    setFormData((prev) => {
      const items = [...prev.items];
      [items[index], items[target]] = [items[target], items[index]];
      return { ...prev, items };
    });
  };

  const selectClient = (value) => {
    if (value === "__new__") return;
    const c = clients[Number(value)];
    if (!c) return;
    setDirty(true);
    setFormData((prev) => {
      const paymentTerms = c.defaultPaymentTerms || prev.paymentTerms;
      const days = TERM_DAYS[paymentTerms];
      return {
        ...prev,
        billTo: {
          clientName: c.clientName || "",
          email: c.email || "",
          address: c.address || "",
          phone: c.phone || "",
          gstin: c.gstin || "",
          state: c.state || "",
        },
        paymentTerms,
        dueDate:
          days === undefined ? prev.dueDate : addDays(prev.invoiceDate, days),
        // Only override notes when the client has a default set.
        notes: c.defaultNotes || prev.notes,
      };
    });
  };

  // Live totals (shared by the summary card, the preview, and submit).
  // Per-line math: gross → minus line discount → net (taxable) → + tax.
  const lineCalc = (item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const taxPercent = Number(item.taxPercent) || 0;
    const gross = qty * price;
    const dType = item.discount?.type || "flat";
    const dVal = Number(item.discount?.value) || 0;
    const disc = Math.min(
      Math.max(dType === "percent" ? (gross * dVal) / 100 : dVal, 0),
      gross
    );
    const net = round2(gross - disc);
    return { qty, price, taxPercent, net, tax: round2(net * (taxPercent / 100)) };
  };
  const calc = formData.items.map(lineCalc);
  const itemsWithTotal = formData.items.map((item, i) => ({
    ...item,
    quantity: calc[i].qty,
    unitPrice: calc[i].price,
    taxPercent: calc[i].taxPercent,
    total: round2(calc[i].net + calc[i].tax),
  }));
  const subTotal = round2(calc.reduce((s, c) => s + c.net, 0));
  const taxTotal = round2(calc.reduce((s, c) => s + c.tax, 0));
  const discVal = Number(formData.discount?.value) || 0;
  const discountTotal = round2(
    Math.min(
      Math.max(
        formData.discount?.type === "percent" ? (subTotal * discVal) / 100 : discVal,
        0
      ),
      subTotal
    )
  );
  const additionalCharges = round2(Math.max(Number(formData.additionalCharges) || 0, 0));
  const total = round2(
    Math.max(subTotal + taxTotal - discountTotal + additionalCharges, 0)
  );

  const fmt = (n) =>
    `₹${Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const validateForm = () => {
    const e = { items: {} };
    if (!formData.billTo?.clientName?.trim())
      e.clientName = "Please enter the client's name so we know who to bill.";
    if (
      formData.invoiceDate &&
      formData.dueDate &&
      new Date(formData.dueDate) < new Date(formData.invoiceDate)
    )
      e.dueDate = "The due date must be on or after the invoice date.";
    if (!formData.items.length) e.itemsGeneral = "Please add at least one item before saving.";
    formData.items.forEach((item, i) => {
      const ie = {};
      if (!item.name?.trim()) ie.name = "Enter a name for this item.";
      if (!(Number(item.quantity) > 0))
        ie.quantity = "Enter a quantity greater than 0.";
      if (item.unitPrice === "" || Number(item.unitPrice) < 0)
        ie.unitPrice = "Enter a price of 0 or more.";
      if (Object.keys(ie).length) e.items[i] = ie;
    });
    return e;
  };

  const hasErrors = (e) =>
    Boolean(
      e.clientName || e.dueDate || e.itemsGeneral || Object.keys(e.items || {}).length
    );

  const mapServerErrors = (error) => {
    const e = { items: {} };
    const data = error?.response?.data;
    if (Array.isArray(data?.details) && data.details.length) {
      data.details.forEach((d) => {
        const m = String(d.field || "").match(/^items\.(\d+)\.(\w+)$/);
        if (m) e.items[Number(m[1])] = { ...(e.items[Number(m[1])] || {}), [m[2]]: d.message };
        else if (String(d.field || "").includes("clientName")) e.clientName = d.message;
        else if (d.field === "dueDate") e.dueDate = d.message;
        else e.itemsGeneral = d.message;
      });
    } else if (data?.message) {
      if (/due date/i.test(data.message)) e.dueDate = data.message;
      else e.itemsGeneral = data.message;
    }
    return e;
  };

  const submitInvoice = async (statusOverride) => {
    const found = validateForm();
    if (hasErrors(found)) {
      setErrors(found);
      setShowPreview(false);
      toast.error("Please fix the highlighted fields below before saving.");
      return;
    }
    setErrors({ items: {} });
    setLoading(true);

    const finalFormData = {
      ...formData,
      items: itemsWithTotal,
      subTotal,
      taxTotal,
      discountTotal,
      total,
      status: statusOverride || formData.status || "Unpaid",
    };

    try {
      if (onSave) {
        await onSave(finalFormData);
      } else {
        await axiosInstance.post(API_PATHS.INVOICE.CREATE, finalFormData);
        toast.success(
          statusOverride === "Draft"
            ? "Draft saved!"
            : `${docMeta.name} created successfully!`
        );
        setDirty(false);
        navigate("/invoices");
      }
      setDirty(false);
    } catch (error) {
      const messages = getApiErrorMessages(
        error,
        existingInvoice ? "Failed to update invoice" : "Failed to create invoice"
      );
      setErrors(mapServerErrors(error));
      toast.error(messages[0]);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitInvoice();
  };

  const handleCancel = () => {
    if (dirty && !window.confirm("Discard your changes?")) return;
    navigate(existingInvoice ? -1 : "/invoices");
  };

  const previewInvoice = {
    ...formData,
    items: itemsWithTotal,
    subTotal,
    taxTotal,
    discountTotal,
    total,
    discount: {
      type: formData.discount?.type,
      value: Number(formData.discount?.value) || 0,
    },
  };

  const req = <span className="text-red-500">*</span>;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-between sm:items-center gap-3">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {existingInvoice ? docMeta.edit : docMeta.create}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {/* Document type (new documents only) */}
          {!existingInvoice && (
            <Dropdown
              className="w-44"
              value={formData.type || "invoice"}
              onChange={handleDocTypeSelect}
              options={DOC_TYPES.map((d) => ({ value: d.value, label: d.name }))}
            />
          )}
          {/* Invoice theme */}
          <Dropdown
            className="w-40"
            value={formData.theme}
            onChange={(v) => setFormData((prev) => ({ ...prev, theme: v }))}
            options={THEME_OPTIONS.map((opt) => ({
              value: opt.value,
              label: `${opt.label} theme`,
            }))}
          />
          {/* Edit / Preview toggle */}
          <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className={`inline-flex items-center gap-1 px-3 h-10 text-sm ${
                !showPreview ? "bg-blue-900 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className={`inline-flex items-center gap-1 px-3 h-10 text-sm ${
                showPreview ? "bg-blue-900 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              <Eye className="w-4 h-4" /> Preview
            </button>
          </div>
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          {/* In edit mode the Save actions live in the sticky summary panel;
              in preview mode they move up here so saving is still possible. */}
          {showPreview && (
            <>
              {!existingInvoice && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => submitInvoice("Draft")}
                  isLoading={loading}
                >
                  Save as Draft
                </Button>
              )}
              <Button type="submit" isLoading={loading || isGeneratingNumber}>
                {existingInvoice ? "Save Changes" : `Save ${docMeta.name}`}
              </Button>
            </>
          )}
        </div>
      </div>

      {showPreview ? (
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
          <InvoiceTemplate invoice={previewInvoice} brand={user} />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 xl:items-start">
          {/* Left: the form */}
          <div className="space-y-8 min-w-0">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InputField
                label="Invoice Number"
                name="invoiceNumber"
                readOnly
                value={formData.invoiceNumber}
                placeholder={isGeneratingNumber ? "Generating..." : ""}
                disabled
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Invoice Date
                </label>
                <DatePicker
                  value={formData.invoiceDate}
                  onChange={(v) =>
                    handleInputChange({ target: { name: "invoiceDate", value: v } })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Due Date
                </label>
                <DatePicker
                  value={formData.dueDate}
                  min={formData.invoiceDate}
                  onChange={(v) =>
                    handleInputChange({ target: { name: "dueDate", value: v } })
                  }
                />
                {errors.dueDate && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.dueDate}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm p-6 space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Bill From</h3>
              <InputField label="Business Name" name="businessName" value={formData.billFrom.businessName} onChange={(e) => handleInputChange(e, "billFrom")} />
              <InputField label="Email" type="email" name="email" value={formData.billFrom.email} onChange={(e) => handleInputChange(e, "billFrom")} />
              <TextareaField label="Address" name="address" value={formData.billFrom.address} onChange={(e) => handleInputChange(e, "billFrom")} />
              <InputField label="Phone" name="phone" value={formData.billFrom.phone} onChange={(e) => handleInputChange(e, "billFrom")} />
              <InputField label="GSTIN" name="gstin" value={formData.billFrom.gstin} onChange={(e) => handleInputChange(e, "billFrom")} />
              <InputField label="State" name="state" value={formData.billFrom.state} onChange={(e) => handleInputChange(e, "billFrom")} />
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm p-6 space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Bill To</h3>
              {clients.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Pick a saved client
                  </label>
                  <Dropdown
                    value="__new__"
                    onChange={selectClient}
                    options={[
                      { value: "__new__", label: "— New client —" },
                      ...clients.map((c, i) => ({
                        value: String(i),
                        label: c.email ? `${c.clientName} (${c.email})` : c.clientName,
                      })),
                    ]}
                  />
                </div>
              )}
              <InputField
                label={<>Client Name {req}</>}
                name="clientName"
                value={formData.billTo.clientName}
                onChange={(e) => handleInputChange(e, "billTo")}
                error={errors.clientName}
              />
              <InputField label="Client Email" type="email" name="email" value={formData.billTo.email} onChange={(e) => handleInputChange(e, "billTo")} />
              <TextareaField label="Client Address" name="address" value={formData.billTo.address} onChange={(e) => handleInputChange(e, "billTo")} />
              <InputField label="Client Phone" name="phone" value={formData.billTo.phone} onChange={(e) => handleInputChange(e, "billTo")} />
              <InputField label="GSTIN" name="gstin" value={formData.billTo.gstin} onChange={(e) => handleInputChange(e, "billTo")} />
              <InputField label="State" name="state" value={formData.billTo.state} onChange={(e) => handleInputChange(e, "billTo")} />
            </div>
          </div>

          {/* Items */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200/60 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Items</h3>
              {errors.itemsGeneral && (
                <p className="mt-1 text-sm text-red-600">{errors.itemsGeneral}</p>
              )}
            </div>

            <div className="md:overflow-x-auto no-scrollbar">
            {/* Column headers (desktop) */}
            <div className="hidden md:grid md:grid-cols-[minmax(200px,1fr)_80px_56px_104px_116px_52px_104px_104px] gap-3 px-6 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/40 dark:bg-slate-800/40">
              <span>Item {req}</span>
              <span>HSN/SAC</span>
              <span>Qty {req}</span>
              <span>Rate {req}</span>
              <span>Discount</span>
              <span>Tax %</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Actions</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {formData.items.map((item, index) => {
                const ie = errors.items?.[index] || {};
                const rowTotal = (calc[index]?.net || 0) + (calc[index]?.tax || 0);
                const itemDisc = item.discount || { type: "flat", value: 0 };
                return (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-[minmax(200px,1fr)_80px_56px_104px_116px_52px_104px_104px] gap-3 px-4 sm:px-6 py-4 md:items-start"
                  >
                    {/* Name */}
                    <div>
                      <span className="md:hidden text-xs text-slate-500 dark:text-slate-400">Item</span>
                      <input
                        type="text"
                        name="name"
                        value={item.name}
                        onChange={(e) => handleInputChange(e, null, index)}
                        placeholder="Item name"
                        className={`w-full h-10 px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent ${
                          ie.name ? "border-red-300 focus:ring-red-500" : "border-slate-200 dark:border-slate-600 focus:ring-blue-500"
                        }`}
                      />
                      {ie.name && <p className="mt-1 text-xs text-red-600">{ie.name}</p>}
                    </div>
                    {/* HSN/SAC */}
                    <div>
                      <span className="md:hidden text-xs text-slate-500 dark:text-slate-400">HSN/SAC</span>
                      <input
                        type="text"
                        name="hsn"
                        value={item.hsn || ""}
                        onChange={(e) => handleInputChange(e, null, index)}
                        placeholder="HSN/SAC"
                        className="w-full h-10 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    {/* Qty */}
                    <div>
                      <span className="md:hidden text-xs text-slate-500 dark:text-slate-400">Qty</span>
                      <input
                        type="text"
                        name="quantity"
                        inputMode="decimal"
                        value={item.quantity}
                        onChange={(e) => handleInputChange(e, null, index)}
                        className={`w-full h-10 px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:border-transparent ${
                          ie.quantity ? "border-red-300 focus:ring-red-500" : "border-slate-200 dark:border-slate-600 focus:ring-blue-500"
                        }`}
                      />
                      {ie.quantity && <p className="mt-1 text-xs text-red-600">{ie.quantity}</p>}
                    </div>
                    {/* Rate */}
                    <div>
                      <span className="md:hidden text-xs text-slate-500 dark:text-slate-400">Rate</span>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                        <input
                          type="text"
                          name="unitPrice"
                          inputMode="decimal"
                          value={item.unitPrice}
                          onChange={(e) => handleInputChange(e, null, index)}
                          className={`w-full h-10 pl-7 pr-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:border-transparent ${
                            ie.unitPrice ? "border-red-300 focus:ring-red-500" : "border-slate-200 dark:border-slate-600 focus:ring-blue-500"
                          }`}
                        />
                      </div>
                      {ie.unitPrice && <p className="mt-1 text-xs text-red-600">{ie.unitPrice}</p>}
                    </div>
                    {/* Per-line discount */}
                    <div>
                      <span className="md:hidden text-xs text-slate-500 dark:text-slate-400">Discount</span>
                      <div className="flex items-stretch gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleItemDiscount(index, {
                              type: itemDisc.type === "percent" ? "flat" : "percent",
                            })
                          }
                          title={itemDisc.type === "percent" ? "Percent" : "Flat (₹)"}
                          aria-label="Toggle discount type"
                          className="h-10 w-9 flex-shrink-0 rounded-lg border border-slate-200 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer"
                        >
                          {itemDisc.type === "percent" ? "%" : "₹"}
                        </button>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={
                            !itemDisc.value || itemDisc.value === "0"
                              ? ""
                              : itemDisc.value
                          }
                          onChange={(e) =>
                            handleItemDiscount(index, {
                              value: toNumericString(e.target.value),
                            })
                          }
                          className="w-full h-10 px-2 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    {/* Tax */}
                    <div>
                      <span className="md:hidden text-xs text-slate-500 dark:text-slate-400">Tax %</span>
                      <input
                        type="text"
                        name="taxPercent"
                        inputMode="decimal"
                        value={item.taxPercent}
                        onChange={(e) => handleInputChange(e, null, index)}
                        className="w-full h-10 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    {/* Amount */}
                    <div className="md:text-right">
                      <span className="md:hidden text-xs text-slate-500 dark:text-slate-400">Amount</span>
                      <p className="h-10 flex md:justify-end items-center text-sm font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                        {fmt(rowTotal)}
                      </p>
                    </div>
                    {/* Actions */}
                    <div className="flex md:justify-end items-center gap-0.5">
                      <button type="button" onClick={() => handleMoveItem(index, -1)} disabled={index === 0} title="Move up" aria-label="Move item up" className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700/40 text-slate-500 dark:text-slate-400 disabled:opacity-30 cursor-pointer">
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => handleMoveItem(index, 1)} disabled={index === formData.items.length - 1} title="Move down" aria-label="Move item down" className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700/40 text-slate-500 dark:text-slate-400 disabled:opacity-30 cursor-pointer">
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => handleDuplicateItem(index)} title="Duplicate" aria-label="Duplicate item" className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700/40 text-slate-500 dark:text-slate-400 cursor-pointer">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => handleRemoveItem(index)} disabled={formData.items.length === 1} title="Remove" aria-label="Remove item" className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-500/15 text-red-500 disabled:opacity-30 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700">
              <Button type="button" variant="secondary" onClick={handleAddItem} icon={Plus}>
                Add Item
              </Button>
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Notes & Terms</h3>
            <TextareaField label="Notes" name="notes" value={formData.notes} onChange={handleInputChange} />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Payment Terms
              </label>
              <Dropdown
                direction="up"
                value={formData.paymentTerms}
                onChange={(v) =>
                  setFormData((prev) => ({ ...prev, paymentTerms: v }))
                }
                options={[
                  { value: "Net 15", label: "Net 15" },
                  { value: "Net 30", label: "Net 30" },
                  { value: "Net 60", label: "Net 60" },
                  { value: "Due on receipt", label: "Due on receipt" },
                ]}
              />
            </div>
          </div>
          </div>

          {/* Right: sticky live summary */}
          <div className="xl:sticky xl:top-6">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm p-6">
              <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
                Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{fmt(subTotal)}</span>
                </div>

                {/* Discount control */}
                <div className="flex justify-between items-center gap-3">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Discount</span>
                  <div className="flex items-center gap-2">
                    <Dropdown
                      className="w-20"
                      direction="up"
                      value={formData.discount?.type || "flat"}
                      onChange={(v) => setDiscount({ type: v })}
                      options={[
                        { value: "flat", label: "₹" },
                        { value: "percent", label: "%" },
                      ]}
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={
                        !formData.discount?.value ||
                        formData.discount.value === "0"
                          ? ""
                          : formData.discount.value
                      }
                      onChange={(e) =>
                        setDiscount({ value: toNumericString(e.target.value) })
                      }
                      className="w-24 h-10 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                {discountTotal > 0 && (
                  <div className="flex justify-between text-sm text-emerald-700 dark:text-emerald-400">
                    <span>Discount applied</span>
                    <span className="tabular-nums">−{fmt(discountTotal)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                  <span>Tax</span>
                  <span className="tabular-nums">{fmt(taxTotal)}</span>
                </div>

                {/* Additional charges (shipping/handling) */}
                <div className="flex justify-between items-center gap-3">
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    Shipping / charges
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={
                      !formData.additionalCharges ||
                      formData.additionalCharges === "0"
                        ? ""
                        : formData.additionalCharges
                    }
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        additionalCharges: toNumericString(e.target.value),
                      }))
                    }
                    className="w-24 h-10 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-between text-lg font-semibold text-slate-900 dark:text-slate-100 border-t border-slate-200 dark:border-slate-700 pt-4 mt-1">
                  <span>Total</span>
                  <span className="tabular-nums">{fmt(total)}</span>
                </div>
              </div>

              {/* Save actions */}
              <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
                <Button
                  type="submit"
                  isLoading={loading || isGeneratingNumber}
                  className="w-full"
                >
                  {existingInvoice ? "Save Changes" : `Save ${docMeta.name}`}
                </Button>
                {!existingInvoice && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => submitInvoice("Draft")}
                    isLoading={loading}
                    className="w-full"
                  >
                    Save as Draft
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default CreateInvoice;
