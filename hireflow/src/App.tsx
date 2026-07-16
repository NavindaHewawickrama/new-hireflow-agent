import { PipelineProvider, usePipeline } from "./context/PipelineContext";
import { ModalProvider, useModal } from "./context/ModalContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Sidebar } from "./components/Sidebar";
import { Modal } from "./components/ui/Modal";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
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

// Simple client-side routing based on pathname
function getCurrentPage(): "login" | "register" | "app" {
  const path = window.location.pathname;
  if (path === "/register") return "register";
  if (path === "/login") return "login";
  return "app";
}

function PageRouter() {
  const { state } = usePipeline();
  const CurrentPage = PAGES[state.currentPage] ?? JobSetupPage;
  return <CurrentPage />;
}

function AuthGate() {
  const { isAuthenticated, logout } = useAuth();
  const page = getCurrentPage();

  // Show login/register pages
  if (!isAuthenticated) {
    if (page === "register") {
      return <RegisterPage />;
    }
    return <LoginPage />;
  }

  // Authenticated - show main app
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 xl:mx-auto xl:w-full xl:max-w-6xl">
        <PageRouter />
      </main>
      <GlobalModal />
      
      {/* Logout button in top right */}
      <div className="fixed bottom-5 right-2">
        <button
          onClick={logout}
          className="rounded border border-border2 bg-surface2 px-3 py-1.5 text-xs text-muted hover:text-text hover:bg-surface3 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
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
    <AuthProvider>
      <PipelineProvider>
        <ModalProvider>
          <AuthGate />
        </ModalProvider>
      </PipelineProvider>
    </AuthProvider>
  );
}
