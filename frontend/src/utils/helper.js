export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return "Email is required";
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  return "";
};

export const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  return "";
};

// Statuses a user can set manually from the UI. "Partially Paid" and
// "Overdue" are never set here — they are derived by effectiveStatus().
export const MANUAL_STATUSES = ["Draft", "Sent", "Unpaid", "Paid", "Cancelled"];

// The displayed status. Beyond the stored value, this auto-derives:
//  - "Partially Paid" when some (but not all) of the total has been paid
//  - "Overdue" for a past-due invoice that is still awaiting payment
export const effectiveStatus = (invoice) => {
  if (!invoice) return undefined;
  const { status, total = 0, amountPaid = 0, dueDate } = invoice;

  // Settled or deliberate states win as-is.
  if (status === "Paid" || status === "Draft" || status === "Cancelled") {
    return status;
  }

  const pastDue = dueDate && new Date(dueDate) < new Date();
  if (amountPaid > 0 && amountPaid < total) {
    return pastDue ? "Overdue" : "Partially Paid";
  }
  if ((status === "Unpaid" || status === "Sent") && pastDue) {
    return "Overdue";
  }
  return status;
};

// Tailwind classes for an invoice status badge (light + dark variants).
export const statusBadgeClass = (status) => {
  switch (status) {
    case "Paid":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300";
    case "Draft":
      return "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
    case "Sent":
      return "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300";
    case "Partially Paid":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300";
    case "Overdue":
      return "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300";
    case "Cancelled":
      return "bg-slate-100 text-slate-500 line-through dark:bg-slate-800 dark:text-slate-500";
    default: // Unpaid
      return "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300";
  }
};

// Extract a human-readable message (or list) from an axios error, using the
// backend's structured validation details when present.
export const getApiErrorMessages = (error, fallback = "Something went wrong") => {
  const data = error?.response?.data;
  if (Array.isArray(data?.details) && data.details.length) {
    return data.details.map((d) => d.message || String(d));
  }
  if (data?.message) return [data.message];
  return [fallback];
};
