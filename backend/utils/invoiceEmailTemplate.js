// Build a simple, email-client-friendly HTML summary of an invoice.
const formatCurrency = (n) => `₹${Number(n || 0).toFixed(2)}`;
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN") : "N/A";

const buildInvoiceEmailHtml = (invoice) => {
  const rows = (invoice.items || [])
    .map(
      (item) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${item.name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(item.unitPrice)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(item.total)}</td>
        </tr>`
    )
    .join("");

  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b;">
    <h2 style="margin:0 0 4px;">Invoice ${invoice.invoiceNumber}</h2>
    <p style="color:#64748b;margin:0 0 16px;">Status: ${invoice.status}</p>

    <table style="width:100%;margin-bottom:16px;">
      <tr>
        <td style="vertical-align:top;">
          <strong>From</strong><br/>
          ${invoice.billFrom?.businessName || ""}<br/>
          ${invoice.billFrom?.email || ""}
        </td>
        <td style="vertical-align:top;text-align:right;">
          <strong>To</strong><br/>
          ${invoice.billTo?.clientName || ""}<br/>
          ${invoice.billTo?.email || ""}
        </td>
      </tr>
    </table>

    <p style="color:#64748b;margin:0 0 16px;">
      Invoice Date: ${formatDate(invoice.invoiceDate)} &nbsp;|&nbsp;
      Due Date: ${formatDate(invoice.dueDate)}
    </p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:8px;text-align:left;">Item</th>
          <th style="padding:8px;text-align:center;">Qty</th>
          <th style="padding:8px;text-align:right;">Price</th>
          <th style="padding:8px;text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div style="text-align:right;">
      <p style="margin:4px 0;">Subtotal: ${formatCurrency(invoice.subTotal)}</p>
      <p style="margin:4px 0;">Tax: ${formatCurrency(invoice.taxTotal)}</p>
      <p style="margin:4px 0;font-size:18px;font-weight:bold;">Total: ${formatCurrency(invoice.total)}</p>
    </div>

    ${invoice.notes ? `<p style="margin-top:16px;color:#64748b;"><strong>Notes:</strong> ${invoice.notes}</p>` : ""}
  </div>`;
};

module.exports = { buildInvoiceEmailHtml };
