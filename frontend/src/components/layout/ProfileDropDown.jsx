import { useEffect, useRef } from "react";
import { ChevronDown, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProfileDropDown = ({
  isOpen,
  onToggle,
  avatar,
  companyName = "Your Company",
  email = "example@email.com",
  onLogout,
}) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (isOpen) onToggle(event);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onToggle]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={onToggle}
        className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-800 cursor-pointer"
      >
        {avatar ? (
          <img
            src={avatar}
            alt="Avatar"
            className="h-9 w-9 object-cover rounded-xl border border-gray-200 shadow-sm cursor-pointer"
          />
        ) : (
          <div className="h-9 w-9 bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl flex items-center justify-center text-white font-semibold text-sm cursor-pointer">
            {companyName.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="hidden sm:block text-left cursor-pointer">
          <p className="text-sm font-medium text-gray-900">{companyName}</p>
          <p className="text-xs text-gray-500 truncate">{email}</p>
        </div>

        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 cursor-pointer ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 animate-slide-down origin-top"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 cursor-default">
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              {companyName}
            </p>
            <p className="text-xs text-gray-500 truncate">{email}</p>
          </div>

          {/* Menu Items */}
          <button
            onClick={() => {
              navigate("/profile");
              onToggle();
            }}
            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200 gap-2 cursor-pointer"
          >
            <User className="w-4 h-4 text-gray-500" />
            View Profile
          </button>

          <div className="border-t border-gray-100 my-1" />

          <button
            onClick={onLogout}
            className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-all duration-200 gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-red-600" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropDown;
