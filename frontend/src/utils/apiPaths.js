export const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

export const API_PATHS = {
  AUTH: {
    REGISTER: "/api/auth/register", // Signup
    LOGIN: "/api/auth/login", // Authenticate user & return JWT token
    GOOGLE: "/api/auth/google", // Google OAuth (ID token) sign-in
    REFRESH: "/api/auth/refresh", // Exchange refresh cookie for a new access token
    LOGOUT: "/api/auth/logout", // Clear the refresh cookie
    GET_PROFILE: "/api/auth/me", // Get logged-in user details
    INTEGRATIONS: "/api/auth/integrations", // Which optional services are configured
    EXPORT: "/api/auth/export", // Full account data export (JSON)
    UPDATE_PROFILE: "/api/auth/me", // update profile details (PUT)
    CHANGE_PASSWORD: "/api/auth/change-password", // change password (PUT)
    FORGOT_PASSWORD: "/api/auth/forgot-password",
    RESET_PASSWORD: (token) => `/api/auth/reset-password/${token}`,
    BRAND_ASSET: (type) => `/api/auth/brand/${type}`, // type: logo | signature | stamp
  },
  INVOICE: {
    CREATE: "/api/invoices/",
    GET_ALL_INVOICES: "/api/invoices/",
    NEXT_NUMBER: "/api/invoices/next-number",
    CLIENTS: "/api/invoices/clients",
    GET_INVOICE_BY_ID: (id) => `/api/invoices/${id}`,
    UPDATE_INVOICE: (id) => `/api/invoices/${id}`,
    DELETE_INVOICE: (id) => `/api/invoices/${id}`,
    SEND_INVOICE: (id) => `/api/invoices/${id}/send`,
    SEND_REMINDER: (id) => `/api/invoices/${id}/send-reminder`,
    ADD_PAYMENT: (id) => `/api/invoices/${id}/payments`,
    DELETE_PAYMENT: (id, pid) => `/api/invoices/${id}/payments/${pid}`,
    ADD_ATTACHMENT: (id) => `/api/invoices/${id}/attachments`,
    DELETE_ATTACHMENT: (id, aid) => `/api/invoices/${id}/attachments/${aid}`,
    DUPLICATE: (id) => `/api/invoices/${id}/duplicate`,
    CONVERT: (id) => `/api/invoices/${id}/convert`,
    CREDIT_NOTE: (id) => `/api/invoices/${id}/credit-note`,
    DEBIT_NOTE: (id) => `/api/invoices/${id}/debit-note`,
    RECEIPT: (id) => `/api/invoices/${id}/receipt`,
    PDF: (id) => `/api/invoices/${id}/pdf`,
    TRASH: "/api/invoices/trash",
    RESTORE: (id) => `/api/invoices/${id}/restore`,
    PERMANENT_DELETE: (id) => `/api/invoices/${id}/permanent`,
    BULK: "/api/invoices/bulk",
  },
  AI: {
    PARSE_INVOICE_TEXT: "/api/ai/parse-text",
    PARSE_RECEIPT: "/api/ai/parse-receipt",
    GENERATE_REMINDER: "/api/ai/generate-reminder",
    GET_DASHBOARD_SUMMARY: "/api/ai/dashboard-summary",
  },
  CLIENTS: {
    LIST: "/api/clients",
    CREATE: "/api/clients",
    UPDATE: (id) => `/api/clients/${id}`,
    DELETE: (id) => `/api/clients/${id}`,
    TRASH: "/api/clients/trash",
    RESTORE: (id) => `/api/clients/${id}/restore`,
    PERMANENT_DELETE: (id) => `/api/clients/${id}/permanent`,
  },
  RECURRING: {
    LIST: "/api/recurring",
    CREATE: "/api/recurring",
    UPDATE: (id) => `/api/recurring/${id}`,
    DELETE: (id) => `/api/recurring/${id}`,
    RUN: (id) => `/api/recurring/${id}/run`,
  },
  ANALYTICS: {
    DASHBOARD: "/api/analytics/dashboard",
    REPORT: "/api/analytics/report",
    GST: "/api/analytics/gst",
    STATEMENT: "/api/analytics/statement",
  },
  SEARCH: "/api/search",
  CONTACT: "/api/contact",
  ADMIN: {
    STATS: "/api/admin/stats",
    USERS: "/api/admin/users",
    SUSPEND_USER: (id) => `/api/admin/users/${id}/suspend`,
    SET_ROLE: (id) => `/api/admin/users/${id}/role`,
    DELETE_USER: (id) => `/api/admin/users/${id}`,
    AUDIT_LOGS: "/api/admin/audit-logs",
  },
};
