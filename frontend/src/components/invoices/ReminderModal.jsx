import React, { useState, useEffect, useRef } from "react";
import { Loader2, Mail, Copy, Check, Send } from "lucide-react";
import useFocusTrap from "../../hooks/useFocusTrap";
import Button from "../ui/Button";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";

const ReminderModal = ({ isOpen, onClose, invoiceId, clientEmail }) => {
  const [reminderText, setReminderText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, isOpen, onClose);

  useEffect(() => {
    if (isOpen && invoiceId) {
      const generateReminder = async () => {
        setIsLoading(true);
        setReminderText("");

        try {
          const response = await axiosInstance.post(
            API_PATHS.AI.GENERATE_REMINDER,
            { invoiceId }
          );
          setReminderText(response.data.reminderText);
        } catch (error) {
          toast.error("Failed to generate reminder.");
          console.error("AI reminder error: ", error);
          onClose();
        } finally {
          setIsLoading(false);
        }
      };
      generateReminder();
    }
  }, [isOpen, invoiceId, onClose]);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(reminderText);
    setHasCopied(true);
    toast.success("Reminder copied to clipboard");
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleSendEmail = async () => {
    if (!reminderText.trim()) return;
    setIsSending(true);
    try {
      const response = await axiosInstance.post(
        API_PATHS.INVOICE.SEND_REMINDER(invoiceId),
        { message: reminderText }
      );
      toast.success(response.data.message || "Reminder sent");
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to send reminder email."
      );
      console.error("Send reminder error: ", error);
    } finally {
      setIsSending(false);
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
          aria-label="AI-generated reminder"
          className="bg-white/95 dark:bg-slate-800 backdrop-blur-xl rounded-2xl shadow-xl ring-1 ring-slate-200/60 dark:ring-slate-700 max-w-lg w-full p-6 relative text-left transform transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center">
              <Mail className="w-5 h-5 mr-2 text-blue-900" />
              AI-Generated Reminder
            </h3>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              &times;
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You can edit the message before sending.
              </p>
              <textarea
                name="reminderText"
                value={reminderText}
                onChange={(e) => setReminderText(e.target.value)}
                rows={10}
                className="w-full h-64 resize-none no-scrollbar px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {clientEmail ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Will be sent to{" "}
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {clientEmail}
                  </span>
                </p>
              ) : (
                <p className="text-xs text-red-500">
                  This invoice has no client email — sending is disabled.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="secondary"
              onClick={handleCopyToClipboard}
              icon={hasCopied ? Check : Copy}
              disabled={isLoading}
            >
              {hasCopied ? "Copied" : "Copy Text"}
            </Button>
            <Button
              onClick={handleSendEmail}
              icon={isSending ? Loader2 : Send}
              disabled={isLoading || isSending || !clientEmail}
            >
              {isSending ? "Sending..." : "Send Email"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReminderModal;
