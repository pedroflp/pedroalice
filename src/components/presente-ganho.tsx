import { motion } from "motion/react";
import { Gift } from "lucide-react";
import { useRef, useCallback } from "react";

const PRESENTES = [
  { emoji: "📸", titulo: "Uma foto exclusiva dos noivos", descricao: "Peça aos noivos uma foto fazendo a pose que você escolher!" },
  { emoji: "🎤", titulo: "Um elogio em público", descricao: "Os noivos vão te elogiar no microfone na frente de todo mundo!" },
  { emoji: "💃", titulo: "Uma dança exclusiva", descricao: "Os noivos vão dançar a música que você escolher... sem ensaio!" },
  { emoji: "🎵", titulo: "Escolha a próxima música", descricao: "Você manda na playlist! Escolha a próxima música da festa." },
  { emoji: "🤳", titulo: "Uma selfie com os noivos", descricao: "Selfie oficial com os noivos no melhor ângulo que você quiser!" },
  { emoji: "🥂", titulo: "Um brinde personalizado", descricao: "Os noivos vão fazer um brinde especial em sua homenagem!" },
  { emoji: "👑", titulo: "Rei/Rainha da pista por 1 música", descricao: "A pista é toda sua por uma música inteira. Brilhe!" },
  { emoji: "🫂", titulo: "Um abraço de 10 segundos", descricao: "Abraço coletivo dos noivos em você por 10 longos segundos!" },
  { emoji: "🍷", titulo: "Drink especial dos noivos", descricao: "Os noivos vão preparar (ou pedir) um drink exclusivo pra você!" },
  { emoji: "📝", titulo: "Uma mensagem secreta", descricao: "Os noivos vão te contar um segredo que ninguém mais sabe!" },
  { emoji: "🧁", titulo: "Doce à sua escolha", descricao: "Escolha qualquer doce da mesa antes de todo mundo!" },
  { emoji: "🎬", titulo: "Cena de filme com os noivos", descricao: "Recrie uma cena de filme icônica com os noivos. Você escolhe qual!" },
  { emoji: "🌹", titulo: "Uma flor do buquê", descricao: "Você ganha uma flor diretamente do arranjo dos noivos!" },
  { emoji: "🎶", titulo: "Karaokê com os noivos", descricao: "Cante uma música com os noivos no melhor estilo karaokê!" },
  { emoji: "✨", titulo: "Um desejo atendido", descricao: "Faça um pedido razoável aos noivos e eles vão realizar na festa!" },
];

const STORAGE_KEY = "pedroalice_presente_ganho";

export function getOrDrawPresente(): (typeof PRESENTES)[number] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const index = parseInt(saved, 10);
    if (!isNaN(index) && PRESENTES[index]) return PRESENTES[index];
  }
  const index = Math.floor(Math.random() * PRESENTES.length);
  localStorage.setItem(STORAGE_KEY, String(index));
  return PRESENTES[index];
}

export function clearPresente() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getSavedPresente(): (typeof PRESENTES)[number] | null {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const index = parseInt(saved, 10);
    if (!isNaN(index) && PRESENTES[index]) return PRESENTES[index];
  }
  return null;
}

export default function PresenteGanho({ presente, onClear }: { presente: { emoji: string; titulo: string; descricao: string }; onClear?: () => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startPress = useCallback(() => {
    if (!onClear) return;
    timerRef.current = setTimeout(() => {
      onClear();
    }, 5000);
  }, [onClear]);

  const cancelPress = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col items-center gap-6 text-center text-primary max-w-sm"
    >
      <span
        className="text-7xl select-none cursor-default"
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onContextMenu={(e) => e.preventDefault()}
      >
        {presente.emoji}
      </span>

      <div className="flex items-center gap-2 text-foreground/50">
        <Gift className="h-4 w-4" />
        <span className="text-sm uppercase tracking-widest font-bold">Seu presente</span>
      </div>

      <h2 className="text-3xl font-black leading-tight">{presente.titulo}</h2>
      <p className="text-lg text-primary/70">{presente.descricao}</p>
    </motion.div>
  );
}
