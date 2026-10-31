import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import {
  Loader2,
  FileText,
  IndianRupeeIcon,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import Button from "../../components/ui/Button";
import AIInsightsCard from "../../components/AIInsightsCard";
import RevenueBarChart from "../../components/dashboard/RevenueBarChart";
import StatusDonut from "../../components/dashboard/StatusDonut";
import { statusBadgeClass, effectiveStatus } from "../../utils/helper";
import { DashboardSkeleton } from "../../components/ui/Skeleton";

const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [analyticsRes, invoicesRes] = await Promise.all([
          axiosInstance.get(API_PATHS.ANALYTICS.DASHBOARD),
          axiosInstance.get(API_PATHS.INVOICE.GET_ALL_INVOICES, {
            params: { limit: 5 },
          }),
        ]);
        setAnalytics(analyticsRes.data);
        setRecentInvoices(invoicesRes.data.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const summary = analytics?.summary;

  const statsData = [
    {
      icon: FileText,
      label: "Total Invoices",
      value: summary?.totalInvoices ?? 0,
      color: "blue",
    },
    {
      icon: IndianRupeeIcon,
      label: "Total Revenue",
      value: `₹${(summary?.totalRevenue ?? 0).toFixed(2)}`,
      color: "emerald",
    },
    {
      icon: IndianRupeeIcon,
      label: "Outstanding",
      value: `₹${(summary?.totalOutstanding ?? 0).toFixed(2)}`,
      color: "amber",
    },
    {
      icon: AlertTriangle,
      label: "Overdue",
      value: `${summary?.overdueCount ?? 0} · ₹${(
        summary?.overdueAmount ?? 0
      ).toFixed(2)}`,
      color: "red",
    },
  ];

  const colorClasses = {
    blue: { bg: "bg-blue-100", text: "text-blue-600" },
    emerald: { bg: "bg-emerald-100", text: "text-emerald-600" },
    amber: { bg: "bg-amber-100", text: "text-amber-600" },
    red: { bg: "bg-red-100", text: "text-red-600" },
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Dashboard</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          A quick overview of your business finances.
        </p>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 auto-rows-auto gap-4">
        {/* Stat tiles */}
        {statsData.map((stat, index) => (
          <div
            key={index}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-5 rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm"
          >
            <div
              className={`w-11 h-11 ${
                colorClasses[stat.color].bg
              } rounded-xl flex items-center justify-center mb-3`}
            >
              <stat.icon className={`w-5 h-5 ${colorClasses[stat.color].text}`} />
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
              {stat.label}
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 break-words mt-0.5">
              {stat.value}
            </div>
          </div>
        ))}

        {/* AI insights — full width band */}
        <div className="col-span-2 lg:col-span-4">
          <AIInsightsCard />
        </div>

        {/* Revenue chart — wide */}
        <div className="col-span-2 lg:col-span-3 lg:row-span-2">
          <RevenueBarChart data={analytics?.monthlyRevenue || []} />
        </div>

        {/* Status donut — tall right */}
        <div className="col-span-2 lg:col-span-1 lg:row-span-2">
          <StatusDonut data={analytics?.statusBreakdown || []} />
        </div>

        {/* Top clients */}
        <div className="col-span-2 lg:col-span-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-5 rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Top Clients
          </h3>
          {analytics?.topClients?.length ? (
            <ul className="space-y-2.5">
              {analytics.topClients.map((c, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="truncate text-slate-700 dark:text-slate-300">{c.name}</span>
                  </span>
                  <span className="font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                    ₹{(c.total || 0).toLocaleString("en-IN")}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500 py-6 text-center">
              No client data yet.
            </p>
          )}
        </div>

        {/* Receivables aging */}
        <div className="col-span-2 lg:col-span-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-5 rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Receivables Aging
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Outstanding by days overdue</p>
          <ul className="space-y-2.5">
            {[
              ["Current", analytics?.aging?.current, "text-emerald-600"],
              ["1–30 days", analytics?.aging?.d1_30, "text-amber-600"],
              ["31–60 days", analytics?.aging?.d31_60, "text-orange-600"],
              ["60+ days", analytics?.aging?.d60plus, "text-red-600"],
            ].map(([label, bucket, color]) => (
              <li key={label} className="flex items-center justify-between text-sm">
                <span className={`font-medium ${color}`}>{label}</span>
                <span className="text-slate-500 dark:text-slate-400">
                  {bucket?.count ?? 0} ·{" "}
                  <span className="font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                    ₹{(bucket?.amount ?? 0).toLocaleString("en-IN")}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Recent Invoices */}
      <div className="w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200/70 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Recent Invoices
          </h3>
          <Button variant="ghost" onClick={() => navigate("/invoices")}>
            View All
          </Button>
        </div>

        {recentInvoices.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[600px] divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Due Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-transparent divide-y divide-slate-200 dark:divide-slate-700">
                {recentInvoices.map((invoice) => (
                  <tr
                    key={invoice._id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer"
                    onClick={() => navigate(`/invoices/${invoice._id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {invoice.billTo.clientName}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        #{invoice.invoiceNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 dark:text-slate-200">
                      ₹{invoice.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(
                          effectiveStatus(invoice)
                        )}`}
                      >
                        {effectiveStatus(invoice)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {invoice.dueDate
                        ? moment(invoice.dueDate).format("MMM D, YYYY")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/60 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              No invoices yet
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
              You haven't created any invoices yet. Get started by creating your
              first one.
            </p>
            <Button onClick={() => navigate("/invoices/new")} icon={Plus}>
              Create Invoice
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
