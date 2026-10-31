import { useState, useRef } from "react";
import useFocusTrap from "../../hooks/useFocusTrap";
import { Sparkles, Upload, Loader2 } from "lucide-react";
import Button from "../ui/Button";
import TextareaField from "../ui/TextareaField";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const CreateWithAIModal = ({ isOpen, onClose }) => {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const dialogRef = useRef(null);
  const navigate = useNavigate();
  useFocusTrap(dialogRef, isOpen, onClose);

  const goToCreate = (invoiceData) => {
    toast.success("Invoice data extracted successfully!");
    onClose();
    navigate("/invoices/new", { state: { aiData: invoiceData } });
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error("Please paste some text to generate an invoice.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.post(
        API_PATHS.AI.PARSE_INVOICE_TEXT,
        { text }
      );
      goToCreate(response.data);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to generate invoice from text."
      );
      console.error("AI parsing error: ", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("receipt", file);

    setIsUploading(true);
    try {
      const response = await axiosInstance.post(
        API_PATHS.AI.PARSE_RECEIPT,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      goToCreate(response.data);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to read the receipt image."
      );
      console.error("AI receipt error: ", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 text-center">
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        ></div>

        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Create invoice with AI"
          className="bg-white/95 dark:bg-slate-800 backdrop-blur-xl rounded-2xl shadow-xl ring-1 ring-slate-200/60 dark:ring-slate-700 max-w-lg w-full p-6 relative text-left transform transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
              Create Invoice with AI
            </h3>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              &times;
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Paste any text that contains invoice details (like client name,
              items, quantities, and prices) and the AI will attempt to create
              an invoice from it.
            </p>
            <TextareaField
              name="invoiceText"
              label="Paste Invoice Text Here"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g., 'Invoice for ClientCorp: 2 hours of design work at ₹150/hr and 1 logo for  ₹800"
              rows={8}
            />

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
              <span className="mx-3 text-xs text-slate-400">OR</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleReceiptUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isLoading}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg py-3 text-sm text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-60"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isUploading ? "Reading receipt..." : "Upload a receipt image"}
            </button>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              isLoading={isLoading}
              disabled={isUploading}
            >
              {isLoading ? "Generating..." : "Generate Invoice"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateWithAIModal;
