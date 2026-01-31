import { motion } from "motion/react";
import { ArrowLeft, Gift, Link } from "lucide-react";
import pix from "@/assets/pix.jpeg";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function PresentePage() {
  const [_, setLocation] = useLocation();
  return (
    <main className="bg-background text-foreground flex flex-col items-center px-4 py-4 text-center">
      <Button variant="ghost" className="mr-auto mb-4" onClick={() => setLocation("/")}>
        <ArrowLeft className="h-4 w-4" />
        Voltar para o início
      </Button>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md flex flex-col items-center gap-6"
      >
        <h1 className="text-2xl font-black tracking-normal leading-tighter text-primary">
          Parece que esse presente tá muito disputado...
        </h1>

        <p className="text-3xl text-primary max-w-xs">
          Mas eu posso tentar agilizar ele pra você! <br />
          💵💰🤑👇👇
        </p>

        <div className="rounded-2xl overflow-hidden">
          <img
            src={pix}
            alt="Presente"
            className="w-52 max-w-xs"
          />
        </div>

        <a href={"https://nubank.com.br/cobrar/2kv0s/697cd975-d220-4581-af06-4718cf0112ec"} target="_blank" className="flex items-center gap-2 p-2 bg-transparent border-primary border-2 text-primary">
          <Link />
          Abrir link ao invés de ler QR Code
        </a>

        <div className="h-1 w-full bg-primary/10" />

        <div className="max-w-xs">
          <b>Qualquer valor faz o presente ser aberto, não se preocupe! 😉</b> <br />
          <span className="text-xs">Chame nos noivos para resgatar o seu presente 🎁</span>
        </div>
      </motion.div>
    </main>
  );
}
