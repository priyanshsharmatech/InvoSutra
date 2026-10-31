// Central metadata for the document types InvoSutra supports. Used by the
// invoice list tabs, the create/edit form, and the detail page.
export const DOC_TYPES = [
  {
    value: "invoice",
    name: "Invoice",
    label: "Invoices",
    singular: "invoice",
    title: "All Invoices",
    create: "Create Invoice",
    edit: "Edit Invoice",
  },
  {
    value: "estimate",
    name: "Quotation",
    label: "Quotations",
    singular: "quotation",
    title: "All Quotations",
    create: "Create Quotation",
    edit: "Edit Quotation",
  },
  {
    value: "proforma",
    name: "Proforma Invoice",
    label: "Proforma",
    singular: "proforma invoice",
    title: "All Proforma Invoices",
    create: "Create Proforma",
    edit: "Edit Proforma",
  },
  {
    value: "creditnote",
    name: "Credit Note",
    label: "Credit Notes",
    singular: "credit note",
    title: "All Credit Notes",
    create: "Create Credit Note",
    edit: "Edit Credit Note",
  },
  {
    value: "debitnote",
    name: "Debit Note",
    label: "Debit Notes",
    singular: "debit note",
    title: "All Debit Notes",
    create: "Create Debit Note",
    edit: "Edit Debit Note",
  },
  {
    value: "receipt",
    name: "Receipt",
    label: "Receipts",
    singular: "receipt",
    title: "All Receipts",
    create: "Create Receipt",
    edit: "Edit Receipt",
  },
  {
    value: "purchaseorder",
    name: "Purchase Order",
    label: "Purchase Orders",
    singular: "purchase order",
    title: "All Purchase Orders",
    create: "Create Purchase Order",
    edit: "Edit Purchase Order",
  },
];

export const docTypeMeta = (value) =>
  DOC_TYPES.find((d) => d.value === value) || DOC_TYPES[0];
