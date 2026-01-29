import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/auth";
import NotFound from "@/pages/not-found";
import Home from "./pages/home";
import Timeline from "./pages/timeline";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/timeline" component={Timeline} />
      <Route component={NotFound} />
    </Switch>
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
          Este conteúdo é exclusivo para convidados. Utilize o QR Code do convite para acessar.
        </p>
      </div>
    );
  }

  return <Router />;
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
