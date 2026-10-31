import { useEffect, useState, useCallback } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { Loader2, Plus, Search, Pencil, Trash2, Contact, FileText } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button";
import InputField from "../../components/ui/InputField";
import TextareaField from "../../components/ui/TextareaField";
import Dropdown from "../../components/ui/Dropdown";
import ClientTrashModal from "../../components/clients/ClientTrashModal";
import ClientStatementModal from "../../components/clients/ClientStatementModal";

const emptyForm = {
  clientName: "",
  email: "",
  address: "",
  phone: "",
  gstin: "",
  state: "",
  defaultPaymentTerms: "",
  defaultNotes: "",
};

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // client being edited, or null for new
  const [form, setForm] = useState(emptyForm);
  const [emailError, setEmailError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [trashOpen, setTrashOpen] = useState(false);
  const [statementClient, setStatementClient] = useState(null);

  // Email is optional, but if provided it must be a valid address.
  const checkEmail = (v) =>
    v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
      ? "Please enter a valid email address"
      : "";

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(API_PATHS.CLIENTS.LIST, {
        params: { page, limit: 15, search: debounced || undefined },
      });
      setClients(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error("Failed to load clients.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, debounced]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setDebounced(search);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setEmailError("");
    setModalOpen(true);
  };
  const openEdit = (c) => {
    setEditing(c);
    setForm({
      clientName: c.clientName || "",
      email: c.email || "",
      address: c.address || "",
      phone: c.phone || "",
      gstin: c.gstin || "",
      state: c.state || "",
      defaultPaymentTerms: c.defaultPaymentTerms || "",
      defaultNotes: c.defaultNotes || "",
    });
    setEmailError("");
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.clientName.trim()) {
      toast.error("Client name is required.");
      return;
    }
    const emailErr = checkEmail(form.email.trim());
    if (emailErr) {
      setEmailError(emailErr);
      toast.error(emailErr);
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await axiosInstance.put(API_PATHS.CLIENTS.UPDATE(editing._id), form);
        toast.success("Client updated");
      } else {
        await axiosInstance.post(API_PATHS.CLIENTS.CREATE, form);
        toast.success("Client added");
      }
      setModalOpen(false);
      fetchClients();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save client.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    try {
      await axiosInstance.delete(API_PATHS.CLIENTS.DELETE(confirmDelete._id));
      toast.success("Client deleted");
      setConfirmDelete(null);
      fetchClients();
    } catch {
      toast.error("Failed to delete client.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Clients</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Manage your clients and reuse them when creating invoices.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button variant="secondary" onClick={() => setTrashOpen(true)} icon={Trash2}>
            Trash
          </Button>
          <Button onClick={openNew} icon={Plus}>
            Add Client
          </Button>
        </div>
      </div>

      <ClientTrashModal
        isOpen={trashOpen}
        onClose={() => setTrashOpen(false)}
        onChanged={fetchClients}
      />
      <ClientStatementModal
        client={statementClient}
        onClose={() => setStatementClient(null)}
      />

      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200/60 dark:border-slate-700">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email"
              aria-label="Search name or email"
              className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
          </div>
        ) : clients.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800/60 rounded-full flex items-center justify-center mx-auto mb-3">
              <Contact className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              {debounced ? "No clients match your search." : "No clients yet."}
            </p>
            {!debounced && (
              <Button onClick={openNew} icon={Plus}>
                Add your first client
              </Button>
            )}
          </div>
        ) : (
          <>
          {/* Mobile cards */}
          <ul className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
            {clients.map((c) => (
              <li key={c._id} className="p-4 flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                    {c.clientName}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 truncate">
                    {c.email || "—"}
                  </p>
                  {c.phone && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {c.phone}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button onClick={() => setStatementClient(c)} title="Statement" aria-label="View statement" className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/40 text-slate-500 dark:text-slate-400 cursor-pointer">
                    <FileText className="w-4 h-4" />
                  </button>
                  <button onClick={() => openEdit(c)} title="Edit" aria-label="Edit client" className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/40 text-slate-500 dark:text-slate-400 cursor-pointer">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setConfirmDelete(c)} title="Delete" aria-label="Delete client" className="p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-500/15 text-red-500 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[600px] divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  {["Name", "Email", "Phone", "Address", ""].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-transparent divide-y divide-slate-100 dark:divide-slate-700">
                {clients.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                    <td className="px-6 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">{c.clientName}</td>
                    <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-300">{c.email || "—"}</td>
                    <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-300">{c.phone || "—"}</td>
                    <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate">{c.address || "—"}</td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setStatementClient(c)} title="Statement" aria-label="View statement" className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/40 text-slate-500 dark:text-slate-400 cursor-pointer">
                          <FileText className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(c)} title="Edit" aria-label="Edit client" className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/40 text-slate-500 dark:text-slate-400 cursor-pointer">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setConfirmDelete(c)} title="Delete" aria-label="Delete client" className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/15 text-red-500 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}

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

      {/* Add/Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setModalOpen(false)} aria-hidden="true" />
          <form
            onSubmit={save}
            role="dialog"
            aria-modal="true"
            aria-label={editing ? "Edit client" : "Add client"}
            className="bg-white/95 dark:bg-slate-800 backdrop-blur-xl ring-1 ring-slate-200/60 dark:ring-slate-700 rounded-2xl shadow-xl max-w-md w-full p-6 relative space-y-4"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {editing ? "Edit Client" : "Add Client"}
            </h3>
            <InputField
              label="Client Name *"
              name="clientName"
              value={form.clientName}
              onChange={(e) =>
                setForm({
                  ...form,
                  clientName: e.target.value.replace(/[^a-zA-Z\s.'&-]/g, ""),
                })
              }
            />
            <InputField
              label="Email"
              type="email"
              name="email"
              value={form.email}
              error={emailError}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value });
                if (emailError) setEmailError(""); // clear once they fix it
              }}
              onBlur={(e) => setEmailError(checkEmail(e.target.value.trim()))}
            />
            <InputField
              label="Phone"
              name="phone"
              type="tel"
              inputMode="tel"
              maxLength={20}
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value.replace(/[^0-9+\-()\s]/g, "") })
              }
            />
            <TextareaField label="Address" name="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="GSTIN"
                name="gstin"
                maxLength={15}
                value={form.gstin}
                onChange={(e) =>
                  setForm({
                    ...form,
                    gstin: e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, ""),
                  })
                }
              />
              <InputField label="State" name="state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                Defaults for new invoices
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Default Payment Terms
                </label>
                <Dropdown
                  value={form.defaultPaymentTerms || "__none__"}
                  onChange={(v) =>
                    setForm({ ...form, defaultPaymentTerms: v === "__none__" ? "" : v })
                  }
                  options={[
                    { value: "__none__", label: "— Use my default —" },
                    { value: "Net 15", label: "Net 15" },
                    { value: "Net 30", label: "Net 30" },
                    { value: "Net 60", label: "Net 60" },
                    { value: "Due on receipt", label: "Due on receipt" },
                  ]}
                />
              </div>
              <div className="mt-3">
                <TextareaField
                  label="Default Notes"
                  name="defaultNotes"
                  value={form.defaultNotes}
                  onChange={(e) => setForm({ ...form, defaultNotes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={saving}>
                {editing ? "Save" : "Add Client"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Delete confirmation"
            className="bg-white/95 dark:bg-slate-800 backdrop-blur-xl ring-1 ring-slate-200/60 dark:ring-slate-700 rounded-2xl shadow-xl max-w-sm w-full p-6 relative"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Delete client?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              Move <span className="font-medium">{confirmDelete.clientName}</span> to Trash? You can restore it later. Existing invoices are not affected.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button onClick={remove} className="!bg-red-600 hover:!bg-red-700">
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
