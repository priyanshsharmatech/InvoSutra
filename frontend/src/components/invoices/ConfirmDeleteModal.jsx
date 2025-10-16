import React from "react";
import { AlertTriangle } from "lucide-react";
import Button from "../ui/Button";

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, invoiceNumber }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <h3 className="text-lg font-semibold text-slate-900">
            Delete Invoice?
          </h3>
        </div>
        <p className="text-slate-600 text-sm mb-6">
          Are you sure you want to delete{" "}
          <span className="font-medium text-slate-900">
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
