"use client";

import { ReactNode, useEffect, useState } from "react";
import { X } from "lucide-react";

export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px] p-0 transition-opacity duration-200 sm:items-center sm:p-4 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-h-[90vh] overflow-y-auto rounded-t-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl shadow-black/50 transition-all duration-200 sm:max-w-lg sm:rounded-2xl ${
          visible ? "translate-y-0 opacity-100 sm:scale-100" : "translate-y-4 opacity-0 sm:scale-95"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-50">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
