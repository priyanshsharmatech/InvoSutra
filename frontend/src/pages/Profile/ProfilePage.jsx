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
} from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import InputField from "../../components/ui/InputField";
import TextareaField from "../../components/ui/TextareaField";

const ProfilePage = () => {
  const { user, loading, updateUser } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    address: "",
    phone: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        businessName: user.businessName || "",
        address: user.address || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden max-w-4xl mx-auto">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">My Profile</h3>
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
              <p className="text-sm text-slate-500 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                Email
              </p>
              <p className="font-medium text-slate-900">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                Full Name
              </p>
              <p className="font-medium text-slate-900">
                {user?.name || "—"}
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200">
            <h4 className="text-lg font-medium text-slate-900 mb-4">
              Business Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-400" />
                  Business Name
                </p>
                <p className="font-medium text-slate-900">
                  {user?.businessName || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  Phone
                </p>
                <p className="font-medium text-slate-900">
                  {user?.phone || "—"}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-slate-500 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                Address
              </p>
              <p className="font-medium text-slate-900 whitespace-pre-line">
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  readOnly
                  value={user?.email || ""}
                  className="w-full h-10 pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 disabled:cursor-not-allowed"
                  disabled
                />
              </div>
            </div>

            <InputField
              label="Full Name"
              name="name"
              icon={User}
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
            />

            <div className="pt-6 border-t border-slate-200">
              <h4 className="text-lg font-medium text-slate-900">
                Business Information
              </h4>
              <p className="text-sm text-slate-500 mt-1 mb-4">
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
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
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
  );
};

export default ProfilePage;
