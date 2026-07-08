import { PipelineProvider, usePipeline } from "./context/PipelineContext";
import { ModalProvider, useModal } from "./context/ModalContext";
import { Sidebar } from "./components/Sidebar";
import { Modal } from "./components/ui/Modal";
import { JobSetupPage } from "./pages/JobSetupPage";
import { CvScreeningPage } from "./pages/CvScreeningPage";
import { InterviewRound1Page } from "./pages/InterviewRound1Page";
import { InterviewRound2Page } from "./pages/InterviewRound2Page";
import { OfferLettersPage } from "./pages/OfferLettersPage";

/**
 * Maps the current page number to its component. A lookup object (rather
 * than a switch or a router library) is enough here — navigation is just
 * "which of 5 fixed pages is showing", not URL-driven routing with
 * params/nesting, so pulling in react-router would be unnecessary weight
 * for what this app actually needs.
 */
const PAGES: Record<number, () => React.JSX.Element> = {
  1: JobSetupPage,
  2: CvScreeningPage,
  3: InterviewRound1Page,
  4: InterviewRound2Page,
  5: OfferLettersPage,
};

function PageRouter() {
  const { state } = usePipeline();
  const CurrentPage = PAGES[state.currentPage] ?? JobSetupPage;
  return <CurrentPage />;
}

function GlobalModal() {
  const { isOpen, content, closeModal } = useModal();
  return (
    <Modal open={isOpen} onClose={closeModal}>
      {content}
    </Modal>
  );
}

function Shell() {
  return (
    <div className="min-h-screen bg-bg md:grid md:grid-cols-[200px_1fr] lg:grid-cols-[220px_1fr]">
      <Sidebar />
      <main className="overflow-y-auto p-4 sm:p-6 lg:p-8 xl:mx-auto xl:w-full xl:max-w-6xl">
        <PageRouter />
      </main>
      <GlobalModal />
    </div>
  );
}

export default function App() {
  return (
    <PipelineProvider>
      <ModalProvider>
        <Shell />
      </ModalProvider>
    </PipelineProvider>
  );
}
