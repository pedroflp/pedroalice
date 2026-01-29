import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1974&auto=format&fit=crop",
];

export default function Home() {
  const [, setLocation] = useLocation();
  const storyRef = { current: null as HTMLElement | null };

  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  const guestName = localStorage.getItem("pedroalice_guest_name");

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Top Hero with Carousel */}
      <section className="relative h-screen w-full overflow-hidden" data-testid="section-top-hero">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentHeroIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute inset-0 grayscale brightness-75"
          >
            <img
              src={HERO_IMAGES[currentHeroIndex]}
              alt="Casamento"
              className="h-full w-full object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* Smudge/Gradient Bottom Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" />

        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-5xl font-light tracking-[0.2em] text-white md:text-8xl"
            data-testid="text-names"
          >
            Pedro & Alice
          </motion.h1>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
            onClick={() => storyRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="absolute bottom-12 flex flex-col items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <span className="text-[10px] uppercase tracking-[0.3em]">Descubra</span>
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </motion.button>
        </div>
      </section>

      {/* Story Section */}
      <section
        ref={(el) => { storyRef.current = el; }}
        className="min-h-screen w-full px-6 py-16 md:px-10 md:py-24"
        data-testid="section-hero"
      >
        <div className="mx-auto flex min-h-[calc(100vh-8rem)]  flex-col items-center justify-center text-center">
          <h1 className="text-2xl font-light leading-[1.05] tracking-[0.08em]">Olá, {guestName}.</h1>
          <h2
            className="text-4xl font-light leading-[1.05] tracking-[0.08em] md:text-6xl"
            data-testid="text-hero-title"
          >
            Faça parte da nossa história!
          </h2>

          <p
            className="mt-6 max-w-[36rem] text-lg leading-relaxed text-foreground/80 md:mt-8 md:text-lg"
            data-testid="text-hero-subtitle"
          >
            Registre momentos importantes com o seu celular e compartilhe na linha do tempo
          </p>

          <div
            className="mt-10 grid w-full max-w-xl grid-cols-1 gap-4 md:mt-12 md:grid-cols-2 md:gap-6"
            data-testid="container-hero-actions"
          >
            <button
              type="button"
              className="w-full border cursor-pointer border-transparent bg-primary px-8 py-5 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground transition-[filter] duration-300 ease-out hover:brightness-95 active:brightness-90"
              onClick={() => setLocation("/upload")}
              data-testid="button-register-moments"
            >
              Quero registrar os momentos
            </button>

            <button
              type="button"
              className="w-full border cursor-pointer border-primary bg-transparent px-8 py-5 text-xs font-bold uppercase tracking-[0.18em] text-primary transition-[filter] duration-300 ease-out hover:brightness-95 active:brightness-90"
              onClick={() => setLocation("/timeline")}
              data-testid="button-view-timeline"
            >
              Ver linha do tempo
            </button>
          </div>
        </div>
      </section>

      <div className="h-16" aria-hidden="true" />
    </main>
  );
}
