import React from "react";
import { AlertTriangle } from "lucide-react";
import Button from "../ui/Button";

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, invoiceNumber }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Delete confirmation"
        className="bg-white/95 dark:bg-slate-800 backdrop-blur-xl ring-1 ring-slate-200/60 dark:ring-slate-700 rounded-2xl shadow-xl w-full max-w-sm p-6"
      >
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Delete Invoice?
          </h3>
        </div>
        <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
          Are you sure you want to delete{" "}
          <span className="font-medium text-slate-900 dark:text-slate-100">
            Invoice #{invoiceNumber}
          </span>
          ? This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
