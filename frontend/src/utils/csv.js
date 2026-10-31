// Build a CSV string from rows and trigger a browser download.
const escapeCell = (val) => {
  const s = val === null || val === undefined ? "" : String(val);
  // Quote if the value contains a comma, quote, or newline.
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

export const downloadCsv = (filename, columns, rows) => {
  const header = columns.map((c) => escapeCell(c.label)).join(",");
  const body = rows
    .map((row) => columns.map((c) => escapeCell(c.get(row))).join(","))
    .join("\n");
  const csv = `${header}\n${body}`;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Column definitions for an invoice CSV export.
export const INVOICE_CSV_COLUMNS = [
  { label: "Invoice #", get: (i) => i.invoiceNumber },
  { label: "Client", get: (i) => i.billTo?.clientName || "" },
  { label: "Client Email", get: (i) => i.billTo?.email || "" },
  { label: "Invoice Date", get: (i) => (i.invoiceDate ? i.invoiceDate.slice(0, 10) : "") },
  { label: "Due Date", get: (i) => (i.dueDate ? i.dueDate.slice(0, 10) : "") },
  { label: "Status", get: (i) => i.status },
  { label: "Subtotal", get: (i) => (i.subTotal ?? 0).toFixed(2) },
  { label: "Discount", get: (i) => (i.discountTotal ?? 0).toFixed(2) },
  { label: "Tax", get: (i) => (i.taxTotal ?? 0).toFixed(2) },
  { label: "Total", get: (i) => (i.total ?? 0).toFixed(2) },
];
