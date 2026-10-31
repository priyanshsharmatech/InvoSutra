// Market-standard invoice templates. Each theme is a genuinely different
// LAYOUT (not just recolored): Classic, Modern, Minimal, Corporate.
import { amountToWords } from "../../utils/numberToWords";

const formatINR = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export const THEME_OPTIONS = [
  { value: "classic", label: "Classic" },
  { value: "modern", label: "Modern" },
  { value: "minimal", label: "Minimal" },
  { value: "corporate", label: "Corporate" },
  { value: "elegant", label: "Elegant" },
  { value: "bold", label: "Bold" },
  { value: "compact", label: "Compact" },
];

// Printed document heading per type. Title-case form; callers uppercase as
// needed. The Corporate layout keeps "Tax Invoice" for a GST invoice.
const DOC_HEADING = {
  invoice: "Invoice",
  estimate: "Quotation",
  creditnote: "Credit Note",
  proforma: "Proforma Invoice",
  debitnote: "Debit Note",
  receipt: "Receipt",
  purchaseorder: "Purchase Order",
};
const docHeading = (invoice) => DOC_HEADING[invoice?.type] || "Invoice";

const StatusBadge = ({ status, light }) => {
  const tone = light
    ? "bg-white/15 text-white border-white/30"
    : status === "Paid"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : status === "Draft"
    ? "bg-slate-100 text-slate-600 border-slate-300"
    : "bg-amber-50 text-amber-700 border-amber-200";
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wide border ${tone}`}
    >
      {status}
    </span>
  );
};

const Address = ({ party }) => (
  <div className="text-sm text-slate-600 mt-1 space-y-0.5">
    {party?.address && <p>{party.address}</p>}
    {party?.email && <p>{party.email}</p>}
    {party?.phone && <p>{party.phone}</p>}
    {party?.gstin && <p>GSTIN: {party.gstin}</p>}
  </div>
);

// --- Shared line-item table with layout variants ------------------------------
const ItemsTable = ({ items, variant }) => {
  const head =
    {
      shaded: "bg-slate-100 text-slate-600 border-y border-slate-300",
      dark: "bg-slate-800 text-white",
      plain: "text-slate-400 border-b-2 border-slate-900",
      grid: "bg-slate-900 text-white",
    }[variant] || "";
  const gridCell = variant === "grid" ? "border border-slate-300" : "";
  const rowBorder = variant === "grid" ? "" : "border-b border-slate-100";

  return (
    <table className="w-full min-w-[540px] border-collapse">
      <thead>
        <tr className={head}>
          <th className={`px-4 sm:px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider ${gridCell}`}>
            Description
          </th>
          <th className={`px-4 sm:px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider ${gridCell}`}>
            HSN/SAC
          </th>
          <th className={`px-4 sm:px-5 py-2.5 text-center text-xs font-semibold uppercase tracking-wider ${gridCell}`}>
            Qty
          </th>
          <th className={`px-4 sm:px-5 py-2.5 text-right text-xs font-semibold uppercase tracking-wider ${gridCell}`}>
            Rate
          </th>
          <th className={`px-4 sm:px-5 py-2.5 text-right text-xs font-semibold uppercase tracking-wider ${gridCell}`}>
            Disc.
          </th>
          <th className={`px-4 sm:px-5 py-2.5 text-right text-xs font-semibold uppercase tracking-wider ${gridCell}`}>
            Tax
          </th>
          <th className={`px-4 sm:px-5 py-2.5 text-right text-xs font-semibold uppercase tracking-wider ${gridCell}`}>
            Amount
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr
            key={i}
            className={variant === "shaded" && i % 2 ? "bg-slate-50/70" : ""}
          >
            <td className={`px-4 sm:px-5 py-3 text-sm text-slate-800 ${gridCell || rowBorder}`}>
              {item.name}
            </td>
            <td className={`px-4 sm:px-5 py-3 text-left text-sm text-slate-600 ${gridCell || rowBorder}`}>
              {item.hsn || "—"}
            </td>
            <td className={`px-4 sm:px-5 py-3 text-center text-sm text-slate-600 ${gridCell || rowBorder}`}>
              {item.quantity}
            </td>
            <td className={`px-4 sm:px-5 py-3 text-right text-sm text-slate-600 tabular-nums ${gridCell || rowBorder}`}>
              {formatINR(item.unitPrice)}
            </td>
            <td className={`px-4 sm:px-5 py-3 text-right text-sm text-slate-600 tabular-nums ${gridCell || rowBorder}`}>
              {item.discount?.value
                ? item.discount.type === "percent"
                  ? `${item.discount.value}%`
                  : `−${formatINR(item.discount.value)}`
                : "—"}
            </td>
            <td className={`px-4 sm:px-5 py-3 text-right text-sm text-slate-600 tabular-nums ${gridCell || rowBorder}`}>
              {item.taxPercent ? `${item.taxPercent}%` : "—"}
            </td>
            <td className={`px-4 sm:px-5 py-3 text-right text-sm font-medium text-slate-900 tabular-nums ${gridCell || rowBorder}`}>
              {formatINR(item.total)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const Totals = ({ invoice, totalClass, boxed }) => {
  const discountAmount =
    invoice.discountTotal ??
    (invoice.discount?.type === "percent"
      ? ((invoice.subTotal || 0) * (invoice.discount?.value || 0)) / 100
      : invoice.discount?.value || 0);
  const discountLabel =
    invoice.discount?.type === "percent" && invoice.discount?.value
      ? `Discount (${invoice.discount.value}%)`
      : "Discount";

  return (
    <div className={`w-full sm:max-w-xs ${boxed ? "border border-slate-300 p-4" : ""}`}>
      <div className="flex justify-between text-sm text-slate-600 py-1.5">
        <span>Subtotal</span>
        <span className="tabular-nums">{formatINR(invoice.subTotal)}</span>
      </div>
      {discountAmount > 0 && (
        <div className="flex justify-between text-sm text-emerald-700 py-1.5">
          <span>{discountLabel}</span>
          <span className="tabular-nums">−{formatINR(discountAmount)}</span>
        </div>
      )}
      {invoice.taxTotal > 0 &&
        (invoice.isInterState ? (
          <div className="flex justify-between text-sm text-slate-600 py-1.5">
            <span>IGST</span>
            <span className="tabular-nums">{formatINR(invoice.taxTotal)}</span>
          </div>
        ) : (
          <>
            <div className="flex justify-between text-sm text-slate-600 py-1.5">
              <span>CGST</span>
              <span className="tabular-nums">{formatINR(invoice.taxTotal / 2)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600 py-1.5">
              <span>SGST</span>
              <span className="tabular-nums">{formatINR(invoice.taxTotal / 2)}</span>
            </div>
          </>
        ))}
      {invoice.additionalCharges > 0 && (
        <div className="flex justify-between text-sm text-slate-600 py-1.5">
          <span>Shipping / charges</span>
          <span className="tabular-nums">{formatINR(invoice.additionalCharges)}</span>
        </div>
      )}
      <div className={`flex justify-between items-center px-4 py-3 mt-1 font-semibold ${totalClass}`}>
        <span className="text-sm uppercase tracking-wide">Total</span>
        <span className="text-base font-bold tabular-nums">
          {formatINR(invoice.total)}
        </span>
      </div>
      <p className="text-xs text-slate-500 italic mt-2 text-right">
        {amountToWords(invoice.total)}
      </p>
    </div>
  );
};

const Signature = ({ signature, stamp, label = "Authorized Signatory" }) => {
  if (!signature && !stamp) return null;
  return (
    <div className="relative text-center">
      {stamp && (
        <img
          src={stamp}
          alt="Stamp"
          className="absolute -left-24 -top-6 h-24 w-24 object-contain opacity-80"
        />
      )}
      {signature && (
        <img
          src={signature}
          alt="Signature"
          className="h-14 w-auto max-w-[180px] object-contain mx-auto"
        />
      )}
      <div className="border-t border-slate-400 mt-1 pt-1 w-48">
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
};

const Logo = ({ url, onDark }) =>
  url ? (
    <img
      src={url}
      alt="Logo"
      className={`h-14 w-auto max-w-[150px] object-contain ${
        onDark ? "bg-white rounded p-1" : ""
      }`}
    />
  ) : null;

/* ============================== CLASSIC ============================== */
// Standard: from top-left / INVOICE top-right, parties side-by-side,
// shaded table, totals bottom-right.
const Classic = ({ invoice, logo, signature, stamp }) => (
  <div>
    <div className="px-6 sm:px-10 md:px-12 pt-10 pb-6 flex justify-between gap-6 border-b border-slate-200">
      <div className="flex items-start gap-3">
        <Logo url={logo} />
        <div>
          <p className="text-lg font-bold text-slate-900">
            {invoice.billFrom?.businessName || "Your Business"}
          </p>
          <Address party={invoice.billFrom} />
        </div>
      </div>
      <div className="text-right">
        <h2 className="text-2xl font-bold tracking-wide text-blue-900">{docHeading(invoice).toUpperCase()}</h2>
        <p className="text-sm text-slate-500 mt-1">No. {invoice.invoiceNumber}</p>
      </div>
    </div>

    <div className="px-6 sm:px-10 md:px-12 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Bill To
          </p>
          <p className="font-semibold text-slate-900">
            {invoice.billTo?.clientName || "—"}
          </p>
          <Address party={invoice.billTo} />
        </div>
        <div className="sm:text-right text-sm space-y-1">
          <p><span className="text-slate-500">Invoice Date: </span><span className="font-medium text-slate-800">{formatDate(invoice.invoiceDate)}</span></p>
          <p><span className="text-slate-500">Due Date: </span><span className="font-medium text-slate-800">{formatDate(invoice.dueDate)}</span></p>
          <p><span className="text-slate-500">Terms: </span><span className="font-medium text-slate-800">{invoice.paymentTerms || "—"}</span></p>
          <div className="pt-1 sm:flex sm:justify-end"><StatusBadge status={invoice.status} /></div>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto">
        <ItemsTable items={invoice.items} variant="shaded" />
      </div>

      <div className="flex justify-end mt-6">
        <Totals invoice={invoice} totalClass="bg-slate-100 text-slate-900 rounded-md" />
      </div>

      {invoice.notes && (
        <div className="mt-10 pt-5 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Notes</p>
          <p className="text-sm text-slate-600 whitespace-pre-line">{invoice.notes}</p>
        </div>
      )}

      {(signature || stamp) && (
        <div className="mt-12 flex justify-end">
          <Signature signature={signature} stamp={stamp} />
        </div>
      )}
    </div>
  </div>
);

/* ============================== MODERN ============================== */
// Full-width color band (business + logo white), amount-due prominent at top,
// card sections for parties, then items; totals bottom-right.
const Modern = ({ invoice, logo, signature, stamp }) => (
  <div>
    <div className="bg-slate-800 text-white px-6 sm:px-10 md:px-12 py-8">
      <div className="flex justify-between gap-6 items-start">
        <div className="flex items-start gap-3">
          <Logo url={logo} onDark />
          <div>
            <p className="text-lg font-bold">
              {invoice.billFrom?.businessName || "Your Business"}
            </p>
            <div className="text-sm text-white/80 mt-1 space-y-0.5">
              {invoice.billFrom?.address && <p>{invoice.billFrom.address}</p>}
              {invoice.billFrom?.email && <p>{invoice.billFrom.email}</p>}
              {invoice.billFrom?.phone && <p>{invoice.billFrom.phone}</p>}
            </div>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold tracking-wide">{docHeading(invoice).toUpperCase()}</h2>
          <p className="text-sm text-white/70 mt-1">No. {invoice.invoiceNumber}</p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-white/15 pt-5">
        <StatusBadge status={invoice.status} light />
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-white/60">Amount Due</p>
          <p className="text-3xl font-extrabold tabular-nums">{formatINR(invoice.total)}</p>
          <p className="text-xs text-white/70 mt-0.5">Due {formatDate(invoice.dueDate)}</p>
        </div>
      </div>
    </div>

    <div className="px-6 sm:px-10 md:px-12 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Bill To</p>
          <p className="font-semibold text-slate-900">{invoice.billTo?.clientName || "—"}</p>
          <Address party={invoice.billTo} />
        </div>
        <div className="rounded-lg border border-slate-200 p-4 text-sm">
          <div className="flex justify-between py-1"><span className="text-slate-500">Invoice Date</span><span className="font-medium text-slate-800">{formatDate(invoice.invoiceDate)}</span></div>
          <div className="flex justify-between py-1"><span className="text-slate-500">Due Date</span><span className="font-medium text-slate-800">{formatDate(invoice.dueDate)}</span></div>
          <div className="flex justify-between py-1"><span className="text-slate-500">Payment Terms</span><span className="font-medium text-slate-800">{invoice.paymentTerms || "—"}</span></div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 overflow-hidden overflow-x-auto">
        <ItemsTable items={invoice.items} variant="dark" />
      </div>

      <div className="flex justify-end mt-6">
        <Totals invoice={invoice} totalClass="bg-slate-800 text-white rounded-md" />
      </div>

      {invoice.notes && (
        <div className="mt-10 pt-5 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Notes</p>
          <p className="text-sm text-slate-600 whitespace-pre-line">{invoice.notes}</p>
        </div>
      )}

      {(signature || stamp) && (
        <div className="mt-12 flex justify-end">
          <Signature signature={signature} stamp={stamp} />
        </div>
      )}
    </div>
  </div>
);

/* ============================== MINIMAL ============================== */
// Single-column, borderless, airy. Wordmark small, big "Invoice", inline meta.
const Minimal = ({ invoice, logo, signature, stamp }) => (
  <div className="px-6 sm:px-12 md:px-16 py-12">
    <div className="flex items-center gap-3">
      <Logo url={logo} />
      <p className="text-sm font-semibold tracking-widest uppercase text-slate-500">
        {invoice.billFrom?.businessName || "Your Business"}
      </p>
    </div>

    <h1 className="text-5xl font-light tracking-tight text-slate-900 mt-8">
      {docHeading(invoice)}
    </h1>
    <p className="text-sm text-slate-400 mt-2">
      {invoice.invoiceNumber} &nbsp;·&nbsp; {formatDate(invoice.invoiceDate)}
      &nbsp;·&nbsp; Due {formatDate(invoice.dueDate)} &nbsp;·&nbsp;{" "}
      {invoice.status}
    </p>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-10 text-sm">
      <div>
        <p className="text-slate-400 mb-1">From</p>
        <p className="font-medium text-slate-800">
          {invoice.billFrom?.businessName || "Your Business"}
        </p>
        <Address party={invoice.billFrom} />
      </div>
      <div>
        <p className="text-slate-400 mb-1">Billed to</p>
        <p className="font-medium text-slate-800">
          {invoice.billTo?.clientName || "—"}
        </p>
        <Address party={invoice.billTo} />
      </div>
    </div>

    <div className="mt-10 overflow-x-auto">
      <ItemsTable items={invoice.items} variant="plain" />
    </div>

    <div className="flex justify-end mt-8">
      <Totals invoice={invoice} totalClass="border-t-2 border-slate-900 text-slate-900" />
    </div>

    {invoice.notes && (
      <p className="text-sm text-slate-500 mt-10 whitespace-pre-line">
        {invoice.notes}
      </p>
    )}

    <p className="text-center text-sm text-slate-400 mt-12">
      Thank you.
    </p>

    {(signature || stamp) && (
      <div className="mt-10 flex justify-end">
        <Signature signature={signature} stamp={stamp} />
      </div>
    )}
  </div>
);

/* ============================== CORPORATE ============================== */
// Formal: navy serif band, boxed info grid, full-gridline table, totals box,
// dual signatures (Prepared By / Authorized Signatory).
const Corporate = ({ invoice, logo, signature, stamp }) => (
  <div className="font-serif">
    <div className="bg-slate-900 text-white px-6 sm:px-10 md:px-12 py-7 flex justify-between items-center gap-6">
      <div className="flex items-center gap-3">
        <Logo url={logo} onDark />
        <p className="text-xl font-bold">
          {invoice.billFrom?.businessName || "Your Business"}
        </p>
      </div>
      <div className="text-right">
        <h2 className="text-2xl font-bold tracking-wide">{invoice.type === "invoice" || !invoice.type ? "TAX INVOICE" : docHeading(invoice).toUpperCase()}</h2>
        <p className="text-sm text-white/70 mt-1">No. {invoice.invoiceNumber}</p>
      </div>
    </div>

    <div className="px-6 sm:px-10 md:px-12 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 border border-slate-300">
        <div className="p-4 border-b sm:border-b-0 sm:border-r border-slate-300">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Billed To</p>
          <p className="font-semibold text-slate-900">{invoice.billTo?.clientName || "—"}</p>
          <Address party={invoice.billTo} />
        </div>
        <div className="p-4 text-sm">
          <div className="flex justify-between py-1"><span className="text-slate-500">Invoice Date</span><span className="font-medium text-slate-800">{formatDate(invoice.invoiceDate)}</span></div>
          <div className="flex justify-between py-1"><span className="text-slate-500">Due Date</span><span className="font-medium text-slate-800">{formatDate(invoice.dueDate)}</span></div>
          <div className="flex justify-between py-1"><span className="text-slate-500">Payment Terms</span><span className="font-medium text-slate-800">{invoice.paymentTerms || "—"}</span></div>
          <div className="flex justify-between py-1 items-center"><span className="text-slate-500">Status</span><StatusBadge status={invoice.status} /></div>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <ItemsTable items={invoice.items} variant="grid" />
      </div>

      <div className="flex justify-end mt-6">
        <Totals invoice={invoice} totalClass="bg-slate-900 text-white" boxed />
      </div>

      {invoice.notes && (
        <div className="mt-8 border border-slate-300 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Terms &amp; Notes</p>
          <p className="text-sm text-slate-600 whitespace-pre-line">{invoice.notes}</p>
        </div>
      )}

      <div className="mt-12 flex justify-between items-end gap-8">
        <div className="border-t border-slate-400 pt-1 w-44">
          <p className="text-xs text-slate-500">Prepared By</p>
        </div>
        <Signature signature={signature} stamp={stamp} />
      </div>
    </div>
  </div>
);

/* ============================== ELEGANT ============================== */
// Centered serif header with rule-flanked title, plain underlined table.
const Elegant = ({ invoice, logo, signature, stamp }) => (
  <div className="font-serif">
    <div className="px-6 sm:px-12 md:px-16 pt-12 text-center">
      <div className="flex justify-center mb-3">
        <Logo url={logo} />
      </div>
      <p className="text-xl font-semibold text-slate-900">
        {invoice.billFrom?.businessName || "Your Business"}
      </p>
      <div className="text-xs text-slate-500 mt-1 space-y-0.5">
        {invoice.billFrom?.address && <p>{invoice.billFrom.address}</p>}
        {invoice.billFrom?.email && <p>{invoice.billFrom.email}</p>}
        {invoice.billFrom?.gstin && <p>GSTIN: {invoice.billFrom.gstin}</p>}
      </div>
      <div className="mt-8 flex items-center justify-center gap-3">
        <span className="h-px w-10 bg-slate-300" />
        <h2 className="text-2xl tracking-[0.2em] uppercase text-slate-800">
          {docHeading(invoice)}
        </h2>
        <span className="h-px w-10 bg-slate-300" />
      </div>
      <p className="text-sm text-slate-500 mt-2">
        {invoice.invoiceNumber} &nbsp;·&nbsp; {formatDate(invoice.invoiceDate)}
      </p>
    </div>
    <div className="px-6 sm:px-12 md:px-16 py-10 font-sans">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Billed To</p>
          <p className="font-semibold text-slate-900">{invoice.billTo?.clientName || "—"}</p>
          <Address party={invoice.billTo} />
        </div>
        <div className="sm:text-right text-sm space-y-1">
          <p><span className="text-slate-500">Due Date: </span><span className="font-medium text-slate-800">{formatDate(invoice.dueDate)}</span></p>
          <p><span className="text-slate-500">Terms: </span><span className="font-medium text-slate-800">{invoice.paymentTerms || "—"}</span></p>
          <div className="pt-1 sm:flex sm:justify-end"><StatusBadge status={invoice.status} /></div>
        </div>
      </div>
      <div className="mt-8 overflow-x-auto"><ItemsTable items={invoice.items} variant="plain" /></div>
      <div className="flex justify-end mt-6"><Totals invoice={invoice} totalClass="border-t-2 border-slate-900 text-slate-900" /></div>
      {invoice.notes && (
        <div className="mt-10 pt-5 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Notes</p>
          <p className="text-sm text-slate-600 whitespace-pre-line">{invoice.notes}</p>
        </div>
      )}
      {(signature || stamp) && (
        <div className="mt-12 flex justify-end"><Signature signature={signature} stamp={stamp} /></div>
      )}
    </div>
  </div>
);

/* ============================== BOLD ============================== */
// Accent bar, big colored title, parties + prominent amount-due card, grid table.
const Bold = ({ invoice, logo, signature, stamp }) => (
  <div>
    <div className="h-2 bg-gradient-to-r from-blue-700 to-indigo-600" />
    <div className="px-6 sm:px-10 md:px-12 pt-8 pb-6 flex flex-col sm:flex-row sm:justify-between gap-6">
      <div className="flex items-start gap-3">
        <Logo url={logo} />
        <div>
          <p className="text-xl font-extrabold text-slate-900">
            {invoice.billFrom?.businessName || "Your Business"}
          </p>
          <Address party={invoice.billFrom} />
        </div>
      </div>
      <div className="sm:text-right">
        <h2 className="text-3xl font-extrabold tracking-tight text-indigo-700">
          {docHeading(invoice).toUpperCase()}
        </h2>
        <p className="text-sm text-slate-500 mt-1">No. {invoice.invoiceNumber}</p>
      </div>
    </div>
    <div className="px-6 sm:px-10 md:px-12 pb-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 sm:col-span-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Bill To</p>
          <p className="font-semibold text-slate-900">{invoice.billTo?.clientName || "—"}</p>
          <Address party={invoice.billTo} />
        </div>
        <div className="rounded-xl bg-indigo-600 text-white p-4 flex flex-col justify-center">
          <p className="text-xs uppercase tracking-wider text-white/70">Amount Due</p>
          <p className="text-2xl font-extrabold tabular-nums">{formatINR(invoice.total)}</p>
          <p className="text-xs text-white/70 mt-0.5">Due {formatDate(invoice.dueDate)}</p>
        </div>
      </div>
      <div className="overflow-x-auto"><ItemsTable items={invoice.items} variant="grid" /></div>
      <div className="flex justify-end mt-6"><Totals invoice={invoice} totalClass="bg-indigo-600 text-white rounded-lg" /></div>
      {invoice.notes && (
        <div className="mt-10 pt-5 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Notes</p>
          <p className="text-sm text-slate-600 whitespace-pre-line">{invoice.notes}</p>
        </div>
      )}
      {(signature || stamp) && (
        <div className="mt-12 flex justify-end"><Signature signature={signature} stamp={stamp} /></div>
      )}
    </div>
  </div>
);

/* ============================== COMPACT ============================== */
// Dense, smaller type — fits many line items on one page.
const Compact = ({ invoice, logo, signature, stamp }) => (
  <div className="text-[13px]">
    <div className="px-6 sm:px-8 pt-6 pb-4 flex justify-between items-start gap-4 border-b border-slate-200">
      <div className="flex items-center gap-2">
        <Logo url={logo} />
        <div>
          <p className="font-bold text-slate-900">{invoice.billFrom?.businessName || "Your Business"}</p>
          <p className="text-xs text-slate-500">
            {invoice.billFrom?.email}
            {invoice.billFrom?.gstin ? ` · GSTIN ${invoice.billFrom.gstin}` : ""}
          </p>
        </div>
      </div>
      <div className="text-right">
        <h2 className="text-lg font-bold text-slate-900">{docHeading(invoice)}</h2>
        <p className="text-xs text-slate-500">
          {invoice.invoiceNumber} · {formatDate(invoice.invoiceDate)}
        </p>
      </div>
    </div>
    <div className="px-6 sm:px-8 py-5">
      <div className="flex flex-wrap justify-between gap-4 mb-4">
        <div>
          <span className="text-[11px] text-slate-400 uppercase tracking-wider">Bill To</span>
          <p className="font-semibold text-slate-900 text-sm">{invoice.billTo?.clientName || "—"}</p>
          {invoice.billTo?.address && <p className="text-xs text-slate-500">{invoice.billTo.address}</p>}
          {invoice.billTo?.gstin && <p className="text-xs text-slate-500">GSTIN: {invoice.billTo.gstin}</p>}
        </div>
        <div className="text-right text-xs space-y-0.5">
          <p><span className="text-slate-500">Due: </span><span className="font-medium">{formatDate(invoice.dueDate)}</span></p>
          <p><span className="text-slate-500">Terms: </span><span className="font-medium">{invoice.paymentTerms || "—"}</span></p>
          <div className="pt-1 flex sm:justify-end"><StatusBadge status={invoice.status} /></div>
        </div>
      </div>
      <div className="overflow-x-auto"><ItemsTable items={invoice.items} variant="shaded" /></div>
      <div className="flex justify-end mt-4"><Totals invoice={invoice} totalClass="bg-slate-100 text-slate-900 rounded" /></div>
      {invoice.notes && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Notes</p>
          <p className="text-xs text-slate-600 whitespace-pre-line">{invoice.notes}</p>
        </div>
      )}
      {(signature || stamp) && (
        <div className="mt-8 flex justify-end"><Signature signature={signature} stamp={stamp} /></div>
      )}
    </div>
  </div>
);

const LAYOUTS = {
  classic: Classic,
  modern: Modern,
  minimal: Minimal,
  corporate: Corporate,
  elegant: Elegant,
  bold: Bold,
  compact: Compact,
};

const InvoiceTemplate = ({ invoice, brand = {} }) => {
  const Layout = LAYOUTS[invoice.theme] || Classic;
  return (
    <div className="relative">
      {invoice.isDuplicate && (
        <span className="absolute top-4 right-4 z-10 px-3 py-1 rounded border-2 border-slate-300 text-slate-400 text-xs font-extrabold uppercase tracking-[0.25em] rotate-6 pointer-events-none select-none">
          Duplicate
        </span>
      )}
      <Layout
        invoice={invoice}
        brand={brand}
        logo={brand?.brandLogo?.url}
        signature={brand?.signature?.url}
        stamp={brand?.stamp?.url}
      />
    </div>
  );
};

export default InvoiceTemplate;
