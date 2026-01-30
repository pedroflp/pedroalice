import { useState, useMemo } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/auth";
import NotFound from "@/pages/not-found";
import Home from "./pages/home";
import Timeline from "./pages/timeline";
import UploadPage from "./pages/upload";

const GUEST_NAME_KEY = "pedroalice_guest_name";

function clampName(name: string) {
  return name.trim().replace(/\s+/g, " ").slice(0, 48);
}

function hasFirstAndLastName(name: string) {
  return name.split(" ").filter(Boolean).length >= 2;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/timeline" component={Timeline} />
      <Route path="/upload" component={UploadPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function NameGate({ children }: { children: React.ReactNode }) {
  const [guestName, setGuestName] = useState<string | null>(
    () => window.localStorage.getItem(GUEST_NAME_KEY),
  );
  const [nameInput, setNameInput] = useState("");

  const canSubmit = useMemo(() => {
    const cleaned = clampName(nameInput);
    return cleaned.length >= 2 && hasFirstAndLastName(cleaned);
  }, [nameInput]);

  function confirmName() {
    const next = clampName(nameInput);
    if (!hasFirstAndLastName(next)) return;
    window.localStorage.setItem(GUEST_NAME_KEY, next);
    setGuestName(next);
  }

  if (guestName) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background px-6" role="dialog" aria-modal="true">
      <div className="w-full max-w-[26rem] border border-primary/20 bg-background p-8 md:p-12">
        <h3 className="text-xl font-light">Como devemos te chamar?</h3>
        <p className="mt-2 text-xs text-foreground/60 leading-relaxed">
          Informe seu nome e sobrenome para melhor identificação nas fotos.
        </p>

        <div className="mt-8">
          <label className="block">
            <span className="sr-only">Seu nome completo</span>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && canSubmit) confirmName(); }}
              placeholder="Nome e Sobrenome"
              className="w-full border-b border-primary bg-transparent px-0 py-3 text-base text-foreground outline-none placeholder:text-foreground/50 focus:border-primary"
              autoFocus
            />
          </label>

          <button
            type="button"
            className="mt-8 w-full border border-transparent bg-primary px-8 py-5 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground transition-[filter,opacity] duration-300 ease-out hover:brightness-95 active:brightness-90 disabled:opacity-50"
            onClick={confirmName}
            disabled={!canSubmit}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthGate() {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm uppercase tracking-[0.2em] text-foreground/60">Carregando...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground px-6 text-center">
        <h1 className="text-3xl font-light tracking-[0.1em]">Acesso restrito</h1>
        <p className="mt-4 max-w-md text-sm text-foreground/60 leading-relaxed">
          Este conteúdo é exclusivo para convidados. <br />
          <b>Utilize o QR Code do convite para acessar.</b>
        </p>
      </div>
    );
  }

  return (
    <NameGate>
      <Router />
    </NameGate>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
