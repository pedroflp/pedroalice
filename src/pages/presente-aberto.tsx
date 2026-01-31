import { useMemo } from "react";
import PresenteGanho, { getOrDrawPresente } from "@/components/presente-ganho";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function PresenteAbertoPage() {
  const [, setLocation] = useLocation();
  const presente = useMemo(() => getOrDrawPresente(), []);

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6 py-16">
      <PresenteGanho presente={presente} />
      <button className="flex items-center gap-2 p-4 mt-16 bg-primary text-background" onClick={() => setLocation("/")}>
        <ArrowLeft className="h-4 w-4" />
        Voltar para a página inicial
      </button>
    </main>
  );
}
