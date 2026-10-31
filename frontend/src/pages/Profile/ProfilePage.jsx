import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Loader2,
  User,
  Mail,
  Building,
  Phone,
  MapPin,
  Edit3,
  Save,
  Lock,
  Download,
} from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import InputField from "../../components/ui/InputField";
import Button from "../../components/ui/Button";
import { sanitizePhone, sanitizeGstin } from "../../utils/sanitize";
import Checkbox from "../../components/ui/Checkbox";
import TextareaField from "../../components/ui/TextareaField";
import SelectField from "../../components/ui/SelectField";
import BrandAssetUploader from "../../components/profile/BrandAssetUploader";

const ProfilePage = () => {
  const { user, loading, updateUser } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    businessName: "",
    address: "",
    phone: "",
    gstin: "",
    state: "",
    invoicePrefix: "INV",
    docPrefixes: {},
    defaultNotes: "",
    defaultPaymentTerms: "Net 15",
    autoReminders: false,
  });

  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPw, setIsChangingPw] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        businessName: user.businessName || "",
        address: user.address || "",
        phone: user.phone || "",
        gstin: user.gstin || "",
        state: user.state || "",
        invoicePrefix: user.invoicePrefix || "INV",
        docPrefixes: user.docPrefixes || {},
        defaultNotes: user.defaultNotes || "",
        defaultPaymentTerms: user.defaultPaymentTerms || "Net 15",
        autoReminders: Boolean(user.autoReminders),
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const clean =
      name === "phone"
        ? sanitizePhone(value)
        : name === "gstin"
        ? sanitizeGstin(value)
        : value;
    setFormData((prev) => ({ ...prev, [name]: clean }));
  };

  const handlePwChange = (e) => {
    const { name, value } = e.target;
    setPwForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    setIsChangingPw(true);
    try {
      const response = await axiosInstance.put(API_PATHS.AUTH.CHANGE_PASSWORD, {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success(response.data.message || "Password updated");
      setPwForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to change password."
      );
    } finally {
      setIsChangingPw(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const response = await axiosInstance.put(
        API_PATHS.AUTH.UPDATE_PROFILE,
        formData
      );
      updateUser(response.data);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile.");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await axiosInstance.get(API_PATHS.AUTH.EXPORT);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invosutra-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Data exported.");
    } catch {
      toast.error("Failed to export data.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">My Profile</h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 border border-blue-700 rounded-lg hover:bg-blue-700 hover:text-white transition-colors cursor-pointer"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit Profile
          </button>
        )}
      </div>

      {/* VIEW MODE */}
      {!isEditing && (
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                Email
              </p>
              <p className="font-medium text-slate-900 dark:text-slate-100">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                Full Name
              </p>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {user?.name || "—"}
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
            <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
              Business Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-400" />
                  Business Name
                </p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {user?.businessName || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  Phone
                </p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {user?.phone || "—"}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                Address
              </p>
              <p className="font-medium text-slate-900 dark:text-slate-100 whitespace-pre-line">
                {user?.address || "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODE */}
      {isEditing && (
        <form onSubmit={handleUpdateProfile}>
          <div className="p-6 space-y-6">
            <InputField
              label="Email Address"
              name="email"
              icon={Mail}
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="you@example.com"
            />

            <InputField
              label="Full Name"
              name="name"
              icon={User}
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
            />

            <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
              <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                Business Information
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
                This will be used to pre-fill the "Bill From" section of your
                invoices.
              </p>
              <div className="space-y-4">
                <InputField
                  label="Business Name"
                  name="businessName"
                  icon={Building}
                  type="text"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  placeholder="Your Company LLC"
                />
                <TextareaField
                  label="Address"
                  name="address"
                  icon={MapPin}
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="123 Main St, Anytown, UP"
                />
                <InputField
                  label="Phone"
                  name="phone"
                  icon={Phone}
                  type="text"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91&nbsp;&nbsp;123-456-7890"
                />
                <InputField
                  label="GSTIN"
                  name="gstin"
                  icon={Building}
                  type="text"
                  value={formData.gstin}
                  onChange={handleInputChange}
                  placeholder="22AAAAA0000A1Z5"
                />
                <InputField
                  label="State"
                  name="state"
                  icon={MapPin}
                  type="text"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="e.g. Uttar Pradesh"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
              <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                Invoice Defaults
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
                Pre-filled into every new invoice you create.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Document number prefixes
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { key: "invoice", label: "Invoice", fallback: "INV" },
                      { key: "estimate", label: "Quotation", fallback: "QTN" },
                      { key: "proforma", label: "Proforma", fallback: "PRO" },
                      { key: "creditnote", label: "Credit Note", fallback: "CRN" },
                      { key: "debitnote", label: "Debit Note", fallback: "DBN" },
                      { key: "receipt", label: "Receipt", fallback: "RCP" },
                      { key: "purchaseorder", label: "Purchase Order", fallback: "PO" },
                    ].map((p) => (
                      <div key={p.key}>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                          {p.label}
                        </label>
                        <input
                          type="text"
                          maxLength={10}
                          placeholder={p.fallback}
                          value={
                            p.key === "invoice"
                              ? formData.invoicePrefix
                              : formData.docPrefixes?.[p.key] || ""
                          }
                          onChange={(e) => {
                            const v = e.target.value;
                            if (p.key === "invoice") {
                              setFormData((prev) => ({ ...prev, invoicePrefix: v }));
                            } else {
                              setFormData((prev) => ({
                                ...prev,
                                docPrefixes: { ...prev.docPrefixes, [p.key]: v },
                              }));
                            }
                          }}
                          className="w-full h-10 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                    Leave blank to use the default. Numbers run separately per type.
                  </p>
                </div>
                <SelectField
                  label="Default Payment Terms"
                  name="defaultPaymentTerms"
                  value={formData.defaultPaymentTerms}
                  onChange={handleInputChange}
                  options={["Net 15", "Net 30", "Net 60", "Due on receipt"]}
                />
                <TextareaField
                  label="Default Notes"
                  name="defaultNotes"
                  value={formData.defaultNotes}
                  onChange={handleInputChange}
                  placeholder="e.g. Payment due within the stated terms. Thank you!"
                />
                <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                  <Checkbox
                    checked={formData.autoReminders}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        autoReminders: e.target.checked,
                      }))
                    }
                    ariaLabel="Automatically email overdue reminders"
                    className="mt-0.5"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Automatically email overdue-payment reminders to clients
                    <span className="block text-xs text-slate-400 dark:text-slate-500">
                      Sent at most once every 3 days per invoice, up to 4 times.
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50/70 dark:bg-slate-800/60 border-t border-slate-200/60 dark:border-slate-700 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/40 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isUpdating}
              className="inline-flex items-center justify-center px-4 py-2 h-10 bg-blue-900 hover:bg-blue-800 text-white font-medium text-sm rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isUpdating ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              {isUpdating ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}
    </div>

    {/* Branding */}
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Branding</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Upload your logo, signature, and stamp — they'll appear on your
          invoices. Transparent PNGs work best.
        </p>
      </div>
      <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BrandAssetUploader
          type="logo"
          label="Brand Logo"
          hint="Shown in the invoice header"
          currentUrl={user?.brandLogo?.url}
        />
        <BrandAssetUploader
          type="signature"
          label="Signature"
          hint="Shown above the signature line"
          currentUrl={user?.signature?.url}
        />
        <BrandAssetUploader
          type="stamp"
          label="Stamp / Seal"
          hint="Shown near the signature"
          currentUrl={user?.stamp?.url}
        />
      </div>
    </div>

    {/* Data export */}
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Your data
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Download a full JSON backup of your invoices, clients and settings.
        </p>
      </div>
      <Button
        variant="secondary"
        onClick={handleExport}
        isLoading={exporting}
        icon={exporting ? undefined : Download}
      >
        Export my data
      </Button>
    </div>

    {/* Change Password */}
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 flex items-center gap-2">
        <Lock className="w-5 h-5 text-slate-500" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Change Password
        </h3>
      </div>
      <form onSubmit={handleChangePassword} className="p-6 space-y-4">
        <InputField
          label="Current Password"
          name="currentPassword"
          icon={Lock}
          type="password"
          value={pwForm.currentPassword}
          onChange={handlePwChange}
          placeholder="Enter current password"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="New Password"
            name="newPassword"
            icon={Lock}
            type="password"
            value={pwForm.newPassword}
            onChange={handlePwChange}
            placeholder="At least 6 characters"
          />
          <InputField
            label="Confirm New Password"
            name="confirmPassword"
            icon={Lock}
            type="password"
            value={pwForm.confirmPassword}
            onChange={handlePwChange}
            placeholder="Re-enter new password"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={
              isChangingPw ||
              !pwForm.currentPassword ||
              !pwForm.newPassword
            }
            className="inline-flex items-center justify-center px-4 py-2 h-10 bg-blue-900 hover:bg-blue-800 text-white font-medium text-sm rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isChangingPw ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            {isChangingPw ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </div>
    </div>
  );
};

export default ProfilePage;
