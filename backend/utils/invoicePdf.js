const puppeteer = require("puppeteer");

const DOC_HEADING = {
  invoice: "Tax Invoice",
  estimate: "Quotation",
  creditnote: "Credit Note",
  proforma: "Proforma Invoice",
  debitnote: "Debit Note",
  receipt: "Receipt",
  purchaseorder: "Purchase Order",
};

const inr = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const esc = (s) =>
  String(s == null ? "" : s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const partyBlock = (p = {}) => `
  ${p.businessName ? `<div class="pname">${esc(p.businessName)}</div>` : ""}
  ${p.clientName ? `<div class="pname">${esc(p.clientName)}</div>` : ""}
  ${p.address ? `<div>${esc(p.address)}</div>` : ""}
  ${p.email ? `<div>${esc(p.email)}</div>` : ""}
  ${p.phone ? `<div>${esc(p.phone)}</div>` : ""}
  ${p.gstin ? `<div>GSTIN: ${esc(p.gstin)}</div>` : ""}
  ${p.state ? `<div>${esc(p.state)}</div>` : ""}
`;

// Per-theme styling for the PDF (accent color, font, header treatment, density).
const THEME_STYLE = {
  classic: { accent: "#1e3a8a", header: "split" },
  modern: { accent: "#0f172a", header: "band" },
  minimal: { accent: "#0f172a", header: "minimal" },
  corporate: { accent: "#1e3a8a", header: "split" },
  elegant: {
    accent: "#334155",
    header: "centered",
    font: "Georgia, 'Times New Roman', serif",
  },
  bold: { accent: "#4f46e5", header: "bar" },
  compact: { accent: "#1e3a8a", header: "split", dense: true },
};

// Build a clean, self-contained HTML invoice for PDF rendering.
const buildHtml = (invoice, brand = {}) => {
  const heading = DOC_HEADING[invoice.type] || "Invoice";
  const logo = brand?.brandLogo?.url;
  const hasTax = (invoice.taxTotal || 0) > 0;
  const interState = invoice.isInterState;

  const st = THEME_STYLE[invoice.theme] || THEME_STYLE.classic;
  const accent = st.accent;
  const bodyFont = st.font || "'Segoe UI', Arial, sans-serif";
  const pagePad = st.dense ? "28px 32px" : "40px 44px";
  const bodySize = st.dense ? "12px" : "13px";

  const brandInfo = `
    ${logo ? `<img src="${esc(logo)}"/>` : ""}
    <div>
      <div class="biz">${esc(invoice.billFrom?.businessName || "Your Business")}</div>
      <div class="muted">${partyBlock(invoice.billFrom)}</div>
    </div>`;

  // Header markup varies by theme.
  let header;
  if (st.header === "band") {
    header = `<div class="band">
      <div class="brand" style="color:#fff">${brandInfo}</div>
      <div style="text-align:right">
        <div class="heading" style="color:#fff">${esc(heading).toUpperCase()}</div>
        <div style="color:rgba(255,255,255,.75);margin-top:4px">No. ${esc(invoice.invoiceNumber)}</div>
      </div>
    </div>`;
  } else if (st.header === "bar") {
    header = `<div class="accentbar"></div>
      <div class="top" style="border:0">
        <div class="brand">${brandInfo}</div>
        <div><div class="heading">${esc(heading).toUpperCase()}</div>
          <div class="no">No. ${esc(invoice.invoiceNumber)}</div></div>
      </div>`;
  } else if (st.header === "centered") {
    header = `<div class="centered">
      ${logo ? `<img src="${esc(logo)}" style="height:44px;margin:0 auto 8px"/>` : ""}
      <div class="biz" style="font-size:19px">${esc(invoice.billFrom?.businessName || "Your Business")}</div>
      <div class="muted" style="margin-top:2px">${partyBlock(invoice.billFrom)}</div>
      <div class="ctitle">— ${esc(heading).toUpperCase()} —</div>
      <div class="muted">${esc(invoice.invoiceNumber)} · ${fmtDate(invoice.invoiceDate)}</div>
    </div>`;
  } else if (st.header === "minimal") {
    header = `<div style="padding-bottom:16px">
      <div class="brand">${brandInfo}</div>
      <div class="heading" style="text-align:left;font-weight:300;font-size:34px;letter-spacing:-.01em;margin-top:14px;text-transform:none">${esc(heading)}</div>
      <div class="muted">No. ${esc(invoice.invoiceNumber)}</div>
    </div>`;
  } else {
    header = `<div class="top">
      <div class="brand">${brandInfo}</div>
      <div><div class="heading">${esc(heading).toUpperCase()}</div>
        <div class="no">No. ${esc(invoice.invoiceNumber)}</div></div>
    </div>`;
  }

  const rows = (invoice.items || [])
    .map(
      (it) => `
      <tr>
        <td>${esc(it.name)}</td>
        <td class="c">${esc(it.hsn || "")}</td>
        <td class="c">${it.quantity ?? 0}</td>
        <td class="r">${inr(it.unitPrice)}</td>
        <td class="r">${
          it.discount?.value
            ? it.discount.type === "percent"
              ? `${it.discount.value}%`
              : `- ${inr(it.discount.value)}`
            : "—"
        }</td>
        <td class="c">${it.taxPercent ? `${it.taxPercent}%` : "—"}</td>
        <td class="r">${inr(it.total)}</td>
      </tr>`
    )
    .join("");

  const taxRows = hasTax
    ? interState
      ? `<div class="trow"><span>IGST</span><span>${inr(invoice.taxTotal)}</span></div>`
      : `<div class="trow"><span>CGST</span><span>${inr(
          (invoice.taxTotal || 0) / 2
        )}</span></div><div class="trow"><span>SGST</span><span>${inr(
          (invoice.taxTotal || 0) / 2
        )}</span></div>`
    : "";

  return `<!doctype html><html><head><meta charset="utf-8"/><style>
    * { box-sizing: border-box; }
    body { font-family: ${bodyFont}; color: #1e293b; margin: 0; font-size: ${bodySize}; }
    .page { padding: ${pagePad}; position: relative; }
    .dupe { position: absolute; top: 20px; right: 24px; border: 2px solid #cbd5e1; color: #94a3b8; font-size: 11px; font-weight: 800; letter-spacing: .25em; text-transform: uppercase; padding: 3px 9px; border-radius: 4px; transform: rotate(6deg); }
    .top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; }
    .brand { display: flex; gap: 12px; align-items: flex-start; }
    .brand img { height: 46px; width: auto; }
    .biz { font-size: 17px; font-weight: 700; color: #0f172a; }
    .muted { color: #64748b; }
    .heading { font-size: 22px; font-weight: 800; letter-spacing: .04em; color: ${accent}; text-transform: uppercase; text-align: right; }
    .no { color: #64748b; margin-top: 4px; text-align: right; }
    .band { background: ${accent}; color: #fff; padding: 24px 28px; margin: -${pagePad.split(" ")[0]} -${pagePad.split(" ")[1]} 0; display: flex; justify-content: space-between; align-items: flex-start; }
    .band .biz { color: #fff; }
    .band .muted { color: rgba(255,255,255,.75); }
    .accentbar { height: 8px; background: ${accent}; margin: -${pagePad.split(" ")[0]} -${pagePad.split(" ")[1]} 20px; }
    .centered { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0; }
    .centered .muted { text-align: center; }
    .ctitle { font-size: 20px; letter-spacing: .2em; text-transform: uppercase; color: ${accent}; margin: 16px 0 4px; }
    .parties { display: flex; justify-content: space-between; gap: 32px; margin: 24px 0; }
    .label { font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; }
    .pname { font-weight: 600; color: #0f172a; }
    .meta { text-align: right; line-height: 1.7; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #f1f5f9; text-align: left; font-size: 10px; letter-spacing: .06em; text-transform: uppercase; color: #475569; padding: ${st.dense ? "6px 8px" : "9px 10px"}; }
    td { padding: ${st.dense ? "6px 8px" : "9px 10px"}; border-bottom: 1px solid #eef2f7; }
    th.c, td.c { text-align: center; } th.r, td.r { text-align: right; }
    .totals { display: flex; justify-content: flex-end; margin-top: 18px; }
    .totals .box { width: 260px; }
    .trow { display: flex; justify-content: space-between; padding: 5px 0; color: #475569; }
    .grand { display: flex; justify-content: space-between; padding: 10px 12px; margin-top: 6px; background: ${accent}; color: #fff; border-radius: 6px; font-weight: 700; font-size: 15px; }
    .notes { margin-top: 28px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
    .sign { margin-top: 40px; display: flex; justify-content: flex-end; text-align: center; }
    .sign img { height: 56px; }
    .sigline { margin-top: 4px; border-top: 1px solid #cbd5e1; padding-top: 4px; font-size: 11px; color: #64748b; }
    .foot { margin-top: 30px; text-align: center; color: #94a3b8; font-size: 11px; }
  </style></head><body><div class="page">
    ${invoice.isDuplicate ? `<div class="dupe">Duplicate</div>` : ""}
    ${header}

    <div class="parties">
      <div>
        <div class="label">Bill To</div>
        ${partyBlock(invoice.billTo)}
      </div>
      <div class="meta">
        <div><span class="muted">Date:</span> ${fmtDate(invoice.invoiceDate)}</div>
        <div><span class="muted">Due:</span> ${fmtDate(invoice.dueDate)}</div>
        <div><span class="muted">Terms:</span> ${esc(invoice.paymentTerms || "—")}</div>
        <div><span class="muted">Status:</span> ${esc(invoice.status || "")}</div>
      </div>
    </div>

    <table>
      <thead><tr>
        <th>Item</th><th class="c">HSN/SAC</th><th class="c">Qty</th>
        <th class="r">Rate</th><th class="r">Disc.</th><th class="c">Tax</th><th class="r">Amount</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="totals"><div class="box">
      <div class="trow"><span>Subtotal</span><span>${inr(invoice.subTotal)}</span></div>
      ${invoice.discountTotal ? `<div class="trow"><span>Discount</span><span>- ${inr(invoice.discountTotal)}</span></div>` : ""}
      ${taxRows}
      ${invoice.additionalCharges ? `<div class="trow"><span>Shipping / charges</span><span>${inr(invoice.additionalCharges)}</span></div>` : ""}
      <div class="grand"><span>Total</span><span>${inr(invoice.total)}</span></div>
      ${
        invoice.amountPaid
          ? `<div class="trow"><span>Paid</span><span>${inr(invoice.amountPaid)}</span></div>
             <div class="trow"><span>Balance Due</span><span>${inr(
               Math.max((invoice.total || 0) - (invoice.amountPaid || 0), 0)
             )}</span></div>`
          : ""
      }
    </div></div>

    ${
      invoice.notes
        ? `<div class="notes"><div class="label">Notes</div><div class="muted">${esc(
            invoice.notes
          )}</div></div>`
        : ""
    }

    ${
      brand?.signature?.url || brand?.stamp?.url
        ? `<div class="sign"><div>
            ${brand?.stamp?.url ? `<img src="${esc(brand.stamp.url)}"/>` : ""}
            ${brand?.signature?.url ? `<img src="${esc(brand.signature.url)}"/>` : ""}
            <div class="sigline">Authorized Signatory</div>
          </div></div>`
        : ""
    }

    <div class="foot">Generated by InvoSutra</div>
  </div></body></html>`;
};

// Render an invoice document to a PDF Buffer.
const renderInvoicePdf = async (invoice, brand) => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(buildHtml(invoice, brand), {
      waitUntil: "networkidle0",
    });
    return await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });
  } finally {
    await browser.close();
  }
};

module.exports = { renderInvoicePdf, buildHtml };
