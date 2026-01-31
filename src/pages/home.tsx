import { useCallback, useEffect, useRef, useState, type ComponentProps } from "react";
import { useLocation } from "wouter";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DotLottie, DotLottieReact } from "@lottiefiles/dotlottie-react";
import arrumados from "@/assets/arrumados.jpeg";
import arvore from "@/assets/arvore.jpeg";
import lampiao from "@/assets/lampiao.jpeg";
import praia from "@/assets/praia.jpeg";
import { cn } from "@/lib/utils";
import PresenteGanho, { clearPresente, getSavedPresente } from "@/components/presente-ganho";

const HERO_IMAGES = [
  arrumados,
  arvore,
  lampiao,
  praia,
];

export default function Home() {
  const [, setLocation] = useLocation();
  const storyRef = { current: null as HTMLElement | null };

  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  const [savedPresente, setSavedPresente] = useState(() => getSavedPresente());
  const [giftIsOpened, setGiftIsOpened] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback(() => {
    if (!giftIsOpened) {
      setLocation("/presente");
    }
  }, [giftIsOpened, setLocation]);

  const startLongPress = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setGiftIsOpened(true);
    }, 3000);
  }, []);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleAnimationComplete = useCallback(() => {
    if (giftIsOpened) {
      setLocation("/presente/aberto");
    }
  }, [giftIsOpened, setLocation]);

  const guestName = localStorage.getItem("pedroalice_guest_name");

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const dotLottieRef = useRef<DotLottie | null>(null);

  useEffect(() => {
    if (!dotLottieRef.current) return

    const player = dotLottieRef.current
    player.addEventListener('complete', handleAnimationComplete)

    return () => {
      player.removeEventListener('complete', handleAnimationComplete)
    }
  }, [handleAnimationComplete])

  const dotLottieCallback = useCallback((dotLottie: DotLottie) => {
    dotLottieRef.current = dotLottie;
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Top Hero with Carousel */}
      <section className="relative h-screen w-full overflow-hidden" data-testid="section-top-hero">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentHeroIndex}
            initial={{ opacity: 0, scale: 1.3 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ ease: "easeOut" }}
            className="absolute inset-0 grayscale -translate-y-24 scale-120"
          >
            <img
              src={HERO_IMAGES[currentHeroIndex]}
              alt="Casamento"
              className="h-full w-full object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* Smudge/Gradient Bottom Overlay */}
        <div className="absolute h-80 bottom-0 left-0 right-0 bg-gradient-to-b from-transparent via-background to-background pointer-events-none" />

        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-6xl absolute bottom-32 font-bold text-primary text-shadow-lg text-shadow-white md:text-8xl"
            data-testid="text-names"
          >
            Pedro & Alice
          </motion.h1>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
            onClick={() => storyRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="absolute bottom-8 flex flex-col items-center gap-2 text-black hover:text-white transition-colors animate-bounce"
          >
            <span className="text-md max-w-xs mx-auto font-bold uppercase">Arraste e participe do nosso dia!</span>
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </motion.button>
        </div>
      </section>

      {/* Story Section */}
      <section
        ref={(el) => { storyRef.current = el; }}
        className="w-full px-6 py-16 md:px-10 md:py-24"
        data-testid="section-hero"
      >
        <div className="mx-auto flex relative flex-col items-center justify-center text-center">
          <h1 className="text-xl font-light leading-[1.05] tracking-[0.08em]">Boas vindas, {guestName}.</h1>
          <h2
            className="text-4xl font-bold leading-[1.05] mt-4 md:text-6xl"
            data-testid="text-hero-title"
          >
            Você tem uma missão!
          </h2>

          <p
            className="mt-8 text-xl leading-relaxed text-foreground/80 md:mt-8 md:text-lg"
            data-testid="text-hero-subtitle"
          >
            Registre momentos importantes com o seu celular e compartilhe na linha do tempo!
          </p>

          <div
            className="mt-10 grid w-full max-w-xl grid-cols-1 gap-4 md:mt-12 md:grid-cols-2 md:gap-6"
            data-testid="container-hero-actions"
          >
            <button
              type="button"
              className="w-full border cursor-pointer border-transparent bg-primary px-8 py-5 text-md font-bold uppercase tracking-[0.10em] text-primary-foreground transition-[filter] duration-300 ease-out hover:brightness-95 active:brightness-90"
              onClick={() => setLocation("/upload")}
              data-testid="button-register-moments"
            >
              Quero registrar os momentos
            </button>

            <button
              type="button"
              className="w-full border cursor-pointer border-primary bg-transparent px-8 py-5 text-sm font-bold uppercase tracking-[0.10em] text-primary transition-[filter] duration-300 ease-out hover:brightness-95 active:brightness-90"
              onClick={() => setLocation("/timeline")}
              data-testid="button-view-timeline"
            >
              Ver linha do tempo
            </button>
          </div>
        </div>
      </section>
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        onClick={() => storyRef.current?.scrollIntoView({ behavior: "smooth" })}
        className="flex flex-col items-center gap-2 m-auto mt-16 text-black hover:text-white transition-colors animate-bounce"
      >
        <span className="text-md max-w-xs mx-auto font-bold uppercase">Ainda tem coisa aqui em baixo!</span>
        <ChevronDown className="h-4 w-4 animate-bounce" />
      </motion.button>

      <section className="w-full px-6 mt-16 py-16 md:px-10 md:py-24 h-[60vh]">
        <div className="mx-auto flex flex-col items-center justify-center text-center text-primary max-w-md gap-6">
          {savedPresente ? (
            <PresenteGanho presente={savedPresente} onClear={() => { clearPresente(); setSavedPresente(null); }} />
          ) : (
            <>
              <h2 className="text-3xl font-bold">Temos um presente para você!</h2>

              <div
                onClick={handleClick}
                onPointerDown={startLongPress}
                onPointerUp={cancelLongPress}
                onPointerLeave={cancelLongPress}
                className="select-none cursor-pointer relative"
              >
                {giftIsOpened && (
                  <DotLottieReact
                    dotLottieRefCallback={dotLottieCallback}
                    src={"/gift-opening.lottie"}
                    autoplay
                    className="w-140 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  />
                )}
                <div className={cn("flex flex-col items-center gap-4", giftIsOpened && "opacity-0")}>
                  <DotLottieReact
                    src={"/gift.lottie"}
                    autoplay
                    loop
                    className={cn("w-40 h-40")}
                  />
                  <span className="text-xl">
                    Toque no presente para abrir
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
