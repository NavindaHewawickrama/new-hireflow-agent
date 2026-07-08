import { createContext, useContext, useState, type ReactNode } from "react";

/*
 * The modal's content is arbitrary (an email preview, an offer letter, ...)
 * and can be triggered from deeply nested components (an InterviewCard's
 * email button, an offer card's "view" button). Rather than threading an
 * `openModal` callback down through every page as a prop, this is a second,
 * *separate* context from PipelineContext — it holds pure UI state (what's
 * currently shown in the overlay), not domain data. Keeping it separate
 * means components that only care about opening a modal don't need to
 * subscribe to (and re-render on) every pipeline state change.
 */

interface ModalContextValue {
  isOpen: boolean;
  content: ReactNode;
  openModal: (content: ReactNode) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<ReactNode>(null);

  function openModal(node: ReactNode) {
    setContent(node);
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
  }

  return (
    <ModalContext.Provider value={{ isOpen, content, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within a ModalProvider");
  return ctx;
}
