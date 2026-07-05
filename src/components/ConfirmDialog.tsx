"use client";

import { AlertTriangle } from "lucide-react";
import Modal from "@/components/Modal";

export default function ConfirmDialog({
  title,
  description,
  confirmLabel = "Eliminar",
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-lg bg-red-500/10 p-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-400" />
          <p className="text-sm text-red-300">{description}</p>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="btn-secondary">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
