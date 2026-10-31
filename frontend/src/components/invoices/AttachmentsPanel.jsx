import { useRef, useState } from "react";
import { Loader2, Paperclip, Upload, Trash2, FileText, ExternalLink } from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";

const fmtSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const AttachmentsPanel = ({ invoice, onUpdated }) => {
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const fileRef = useRef(null);
  const attachments = invoice.attachments || [];

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const res = await axiosInstance.post(
        API_PATHS.INVOICE.ADD_ATTACHMENT(invoice._id),
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      onUpdated(res.data);
      toast.success("Attachment added");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload file.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const remove = async (att) => {
    setBusyId(att._id);
    try {
      const res = await axiosInstance.delete(
        API_PATHS.INVOICE.DELETE_ATTACHMENT(invoice._id, att._id)
      );
      onUpdated(res.data);
      toast.success("Attachment removed");
    } catch {
      toast.error("Failed to remove attachment.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm p-6 print:hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Paperclip className="w-5 h-5 text-slate-400" />
          Attachments
        </h3>
        <input ref={fileRef} type="file" className="hidden" onChange={onFile} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-3 h-9 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </div>

      {attachments.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">
          No files attached. Add contracts, POs, or any supporting document
          (PDF, image, doc — up to 10 MB).
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg">
          {attachments.map((att) => (
            <li key={att._id} className="flex items-center gap-3 px-4 py-2.5">
              <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 truncate flex items-center gap-1"
                >
                  <span className="truncate">{att.name || "File"}</span>
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                </a>
                {att.size ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {fmtSize(att.size)}
                  </p>
                ) : null}
              </div>
              <button
                onClick={() => remove(att)}
                disabled={busyId === att._id}
                title="Remove"
                aria-label="Remove attachment"
                className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-500/15 text-red-500 cursor-pointer disabled:opacity-50 flex-shrink-0"
              >
                {busyId === att._id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AttachmentsPanel;
