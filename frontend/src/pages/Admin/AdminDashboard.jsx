import { useEffect, useState, useCallback } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import {
  Loader2,
  Users,
  ShieldCheck,
  ShieldOff,
  Ban,
  FileText,
  IndianRupeeIcon,
  Search,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import moment from "moment";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";

const AdminDashboard = () => {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, logsRes] = await Promise.all([
        axiosInstance.get(API_PATHS.ADMIN.STATS),
        axiosInstance.get(API_PATHS.ADMIN.AUDIT_LOGS),
      ]);
      setStats(statsRes.data);
      setAuditLogs(logsRes.data.data);
    } catch (error) {
      console.error("Failed to fetch admin stats", error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.ADMIN.USERS, {
        params: { page, search: search || undefined, limit: 20 },
      });
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error("Failed to fetch users", error);
      toast.error("Failed to load users.");
    }
  }, [page, search]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchUsers()]);
      setLoading(false);
    })();
  }, [fetchStats, fetchUsers]);

  const handleSuspend = async (user) => {
    setActionId(user._id);
    try {
      const res = await axiosInstance.patch(
        API_PATHS.ADMIN.SUSPEND_USER(user._id)
      );
      toast.success(res.data.message);
      fetchUsers();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed.");
    } finally {
      setActionId(null);
    }
  };

  const handleSetRole = async (user) => {
    setActionId(user._id);
    try {
      const res = await axiosInstance.patch(API_PATHS.ADMIN.SET_ROLE(user._id));
      toast.success(res.data.message);
      fetchUsers();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed.");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setActionId(confirmDelete._id);
    try {
      const res = await axiosInstance.delete(
        API_PATHS.ADMIN.DELETE_USER(confirmDelete._id)
      );
      toast.success(res.data.message);
      setConfirmDelete(null);
      fetchUsers();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed.");
    } finally {
      setActionId(null);
    }
  };

  const statTiles = stats
    ? [
        {
          icon: Users,
          label: "Total Users",
          value: stats.users.total,
          color: "blue",
        },
        {
          icon: ShieldCheck,
          label: "Admins",
          value: stats.users.admins,
          color: "emerald",
        },
        {
          icon: Ban,
          label: "Suspended",
          value: stats.users.suspended,
          color: "red",
        },
        {
          icon: FileText,
          label: "Total Invoices",
          value: stats.invoices.total,
          color: "blue",
        },
        {
          icon: IndianRupeeIcon,
          label: "Platform Revenue",
          value: `₹${(stats.invoices.totalRevenue || 0).toFixed(2)}`,
          color: "emerald",
        },
      ]
    : [];

  const colorClasses = {
    blue: { bg: "bg-blue-100", text: "text-blue-600" },
    emerald: { bg: "bg-emerald-100", text: "text-emerald-600" },
    red: { bg: "bg-red-100", text: "text-red-600" },
  };

  // Per-user action controls, shared by the desktop table and mobile cards.
  const renderUserActions = (user) =>
    currentUser?._id === user._id ? (
      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
        You
      </span>
    ) : (
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleSetRole(user)}
          disabled={actionId === user._id}
          title={user.role === "admin" ? "Demote to user" : "Make admin"}
          aria-label={user.role === "admin" ? "Demote to user" : "Make admin"}
          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/40 text-blue-600 dark:text-blue-400 disabled:opacity-50 cursor-pointer"
        >
          {user.role === "admin" ? (
            <ShieldOff className="w-4 h-4" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
        </button>
        {user.role !== "admin" && (
          <>
            <button
              onClick={() => handleSuspend(user)}
              disabled={actionId === user._id}
              title={user.isSuspended ? "Reactivate" : "Suspend"}
              aria-label={user.isSuspended ? "Reactivate user" : "Suspend user"}
              className={`p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/40 disabled:opacity-50 cursor-pointer ${
                user.isSuspended ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {user.isSuspended ? (
                <UserCheck className="w-4 h-4" />
              ) : (
                <UserX className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setConfirmDelete(user)}
              disabled={actionId === user._id}
              title="Delete user"
              aria-label="Delete user"
              className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/15 text-red-600 dark:text-red-400 disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Admin Panel</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Platform-wide overview and user management.
        </p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statTiles.map((stat, i) => (
          <div
            key={i}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm"
          >
            <div
              className={`w-10 h-10 ${
                colorClasses[stat.color].bg
              } rounded-lg flex items-center justify-center mb-3`}
            >
              <stat.icon className={`w-5 h-5 ${colorClasses[stat.color].text}`} />
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {stat.label}
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 break-words">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200/70 dark:border-slate-700 flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Users</h3>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Search name or email"
              aria-label="Search name or email"
              className="pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 w-full sm:w-64"
            />
          </div>
        </div>

        {/* Mobile cards */}
        <ul className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
          {users.map((user) => (
            <li key={user._id} className="p-4 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                  {user.name}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.role === "admin"
                        ? "bg-blue-100 dark:bg-blue-500/15 text-blue-800 dark:text-blue-300"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {user.role}
                  </span>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.isSuspended
                        ? "bg-red-100 dark:bg-red-500/15 text-red-800 dark:text-red-300"
                        : "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                    }`}
                  >
                    {user.isSuspended ? "Suspended" : "Active"}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {user.invoiceCount} invoices
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0">{renderUserActions(user)}</div>
            </li>
          ))}
        </ul>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[720px] divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                {["User", "Role", "Invoices", "Status", "Joined", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-transparent divide-y divide-slate-200 dark:divide-slate-700">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {user.name}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-blue-100 dark:bg-blue-500/15 text-blue-800 dark:text-blue-300"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                    {user.invoiceCount}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isSuspended
                          ? "bg-red-100 dark:bg-red-500/15 text-red-800 dark:text-red-300"
                          : "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                      }`}
                    >
                      {user.isSuspended ? "Suspended" : "Active"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                    {moment(user.createdAt).format("MMM D, YYYY")}
                  </td>
                  <td className="px-6 py-4">{renderUserActions(user)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            No users found.
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={page >= pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Recent admin activity */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200/70 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Recent Activity
          </h3>
        </div>
        {auditLogs.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No admin activity yet.
          </div>
        ) : (
          <ul className="divide-y divide-slate-200/70 dark:divide-slate-700">
            {auditLogs.map((log) => (
              <li
                key={log._id}
                className="px-4 sm:px-6 py-3 flex items-center justify-between text-sm"
              >
                <span className="text-slate-700 dark:text-slate-300">
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {log.actorEmail || "admin"}
                  </span>{" "}
                  {{
                    "user.suspend": "suspended",
                    "user.reactivate": "reactivated",
                    "user.delete": "deleted",
                    "user.promote": "promoted to admin",
                    "user.demote": "demoted to user",
                  }[log.action] || log.action}{" "}
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {log.targetEmail || "a user"}
                  </span>
                </span>
                <span className="text-slate-400 dark:text-slate-500">
                  {moment(log.createdAt).fromNow()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm"
            onClick={() => setConfirmDelete(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Delete confirmation"
            className="bg-white/95 dark:bg-slate-800 backdrop-blur-xl ring-1 ring-slate-200/60 dark:ring-slate-700 rounded-2xl shadow-xl max-w-md w-full p-6 relative"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Delete user?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              This will permanently delete{" "}
              <span className="font-medium">{confirmDelete.email}</span> and all{" "}
              {confirmDelete.invoiceCount} of their invoices. This cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                isLoading={actionId === confirmDelete._id}
                className="!bg-red-600 hover:!bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
