import { useRef, useState } from "react";
import { Upload, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

// Upload / replace / remove a single brand asset (logo, signature, or stamp).
const BrandAssetUploader = ({ type, label, hint, currentUrl }) => {
  const inputRef = useRef(null);
  const { updateUser } = useAuth();
  const [busy, setBusy] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setBusy(true);
    try {
      const res = await axiosInstance.post(
        API_PATHS.AUTH.BRAND_ASSET(type),
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      updateUser(res.data);
      toast.success(`${label} updated`);
    } catch (err) {
      toast.error(
        err.response?.data?.message || `Failed to upload ${label.toLowerCase()}.`
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    try {
      const res = await axiosInstance.delete(API_PATHS.AUTH.BRAND_ASSET(type));
      updateUser(res.data);
      toast.success(`${label} removed`);
    } catch {
      toast.error(`Failed to remove ${label.toLowerCase()}.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</p>
          {hint && <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
        </div>
        {busy && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
      </div>

      <div className="flex-1 flex items-center justify-center h-28 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 mb-3 overflow-hidden">
        {currentUrl ? (
          <img
            src={currentUrl}
            alt={label}
            className="max-h-24 max-w-full object-contain"
          />
        ) : (
          <span className="text-xs text-slate-400 dark:text-slate-500 flex flex-col items-center gap-1">
            <ImageIcon className="w-5 h-5" />
            No {label.toLowerCase()}
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex-1 inline-flex items-center justify-center gap-1 text-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg py-2 hover:bg-slate-50 dark:hover:bg-slate-700/40 disabled:opacity-60 cursor-pointer"
        >
          <Upload className="w-4 h-4" /> {currentUrl ? "Replace" : "Upload"}
        </button>
        {currentUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            title="Remove"
            aria-label={`Remove ${label.toLowerCase()}`}
            className="inline-flex items-center justify-center px-3 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/15 text-red-600 dark:text-red-400 disabled:opacity-60 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default BrandAssetUploader;
