import type { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Centered overlay modal. Controlled from the parent (open/onClose) rather
 * than managing its own visibility — this keeps "what triggered the modal
 * and with what content" living in one place (the page that opened it)
 * instead of the modal needing to know about every possible caller.
 */
export function Modal({ open, onClose, children }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-[600px] max-h-[80vh] overflow-y-auto scrollbar-thin rounded border border-border2 bg-surface p-5 px-6">
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-4 top-4 text-muted hover:text-text"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}

export function ModalTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted">
      {children}
    </div>
  );
}
