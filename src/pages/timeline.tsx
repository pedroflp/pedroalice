import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchImages, subscribeImages, getImageUrl, type ImageRow } from "@/services/images";

function formatTime(d: Date) {
  const hh = `${d.getHours()}`.padStart(2, "0");
  const mm = `${d.getMinutes()}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  const mo = `${d.getMonth() + 1}`.padStart(2, "0");
  return `${hh}:${mm} — ${dd}/${mo}`;
}

function parseMoment(moment: string): Date {
  return new Date(moment);
}

export default function Timeline() {
  const [, setLocation] = useLocation();
  const [guestName, setGuestName] = useState<string | null>(null);
  const [items, setItems] = useState<ImageRow[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("wedding_guest_name");
    if (saved) setGuestName(saved);
  }, []);

  // Fetch initial data + subscribe to realtime
  useEffect(() => {
    fetchImages().then(setItems).catch(console.error);

    const unsubscribe = subscribeImages((newRow) => {
      setItems((prev) => {
        // Avoid duplicates
        if (prev.some((r) => r.id === newRow.id)) return prev;
        return [newRow, ...prev];
      });
    });

    return unsubscribe;
  }, []);

  // Keyboard navigation for modal
  useEffect(() => {
    if (selectedIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") setSelectedIndex(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const goNext = useCallback(() => {
    setSelectedIndex((i) => (i !== null && i < items.length - 1 ? i + 1 : i));
  }, [items.length]);

  const goPrev = useCallback(() => {
    setSelectedIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  }, []);

  function goHomeAndRegister() {
    if (guestName) setLocation("/?focus=upload");
    else setLocation("/?open=name");
  }

  function goHome() {
    setLocation("/");
  }

  const selectedItem = selectedIndex !== null ? items[selectedIndex] : null;

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden">
      <header
        className="sticky top-0 z-40 border-b border-primary/20 bg-background/95 px-6 py-5 backdrop-blur-sm md:px-12"
        data-testid="header-timeline"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="border border-transparent bg-primary px-6 py-4 text-[11px] uppercase tracking-[0.18em] text-primary-foreground transition-[filter] duration-300 ease-out hover:brightness-95 active:brightness-90"
              onClick={goHomeAndRegister}
              data-testid="button-timeline-register"
            >
              Quero registrar os momentos
            </button>
            <button
              type="button"
              className="hidden border border-primary bg-transparent px-5 py-4 text-[11px] uppercase tracking-[0.18em] text-primary transition-[filter] duration-300 ease-out hover:brightness-95 active:brightness-90 md:inline-flex"
              onClick={goHome}
              data-testid="button-timeline-home"
            >
              Início
            </button>
          </div>
          <h1 className="text-base font-light tracking-[0.1em] uppercase" data-testid="text-timeline-title">
            Nossa linha do tempo
          </h1>
          <div className="w-10 md:w-40" />
        </div>
      </header>

      <section className="relative h-[calc(100vh-88px)] w-full overflow-hidden" data-testid="section-timeline">
        {/* Linha central com gradiente nas laterais */}
        <div
          className="absolute top-1/2 left-0 right-0 h-px z-0"
          style={{
            transform: "translateY(-50%)",
            background:
              "linear-gradient(to right, transparent 0%, hsl(85 19% 35% / 0.3) 15%, hsl(85 19% 35% / 0.3) 85%, transparent 100%)",
          }}
        />

        <div
          ref={scrollerRef}
          className="no-scrollbar h-full w-full overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing snap-x snap-mandatory md:snap-none"
          data-testid="scroller-timeline"
        >
          <div className="relative flex min-h-full w-max items-center gap-6 md:gap-16 px-[calc(50vw-120px)] md:px-[30vw]">
            {items.length === 0 ? (
              <div className="w-[calc(100vw-8rem)] text-center text-sm text-foreground/60" data-testid="empty-timeline">
                Ainda não há registros. Seja o primeiro a compartilhar um momento.
              </div>
            ) : null}

            {items.map((it, index) => {
              const isOdd = index % 2 !== 0;
              const date = parseMoment(it.moment);
              return (
                <article
                  key={it.id}
                  className="relative flex w-[75vw] md:w-[220px] shrink-0 snap-center flex-col items-center"
                  data-testid={`card-timeline-${it.id}`}
                  style={{
                    transform: `translateY(${isOdd ? "80px" : "-80px"})`,
                  }}
                >
                  {/* Conexão com a linha: Linha vertical + Dot quadrado */}
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 w-px bg-primary/40 h-20 z-10 ${!isOdd ? "top-full" : "bottom-full"}`}
                  />
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-primary z-20 ${!isOdd ? "top-[calc(100%+80px)]" : "bottom-[calc(100%+80px)]"} -translate-y-1/2`}
                  />

                  {/* Nome e data ACIMA para cards ímpares */}
                  {isOdd && (
                    <div className="mb-4 text-center" data-testid={`card-meta-${it.id}`}>
                      <div className="text-base font-bold uppercase tracking-wider" data-testid={`text-author-${it.id}`}>
                        {it.author}
                      </div>
                      <div className="mt-1 text-[10px] text-foreground/60" data-testid={`text-time-${it.id}`}>
                        {formatTime(date)}
                      </div>
                    </div>
                  )}

                  {/* Foto com gradiente nas bordas */}
                  <div
                    className="cursor-pointer w-full transition-transform duration-500 hover:scale-105"
                    onClick={() => setSelectedIndex(index)}
                    data-testid={`card-photo-${it.id}`}
                  >
                    <div
                      className="relative w-full overflow-hidden"
                      style={{
                        maskImage:
                          "radial-gradient(ellipse 90% 90% at center, black 60%, transparent 100%)",
                        WebkitMaskImage:
                          "radial-gradient(ellipse 90% 90% at center, black 60%, transparent 100%)",
                      }}
                    >
                      <img
                        src={getImageUrl(it.storage_path)}
                        alt="Registro do casamento"
                        className="h-[240px] md:h-[300px] w-full object-contain"
                        loading="lazy"
                        draggable={false}
                        data-testid={`img-timeline-${it.id}`}
                      />
                    </div>
                  </div>

                  {/* Nome e data ABAIXO para cards pares */}
                  {!isOdd && (
                    <div className="mt-4 text-center" data-testid={`card-meta-${it.id}`}>
                      <div className="text-base font-bold uppercase tracking-wider" data-testid={`text-author-${it.id}`}>
                        {it.author}
                      </div>
                      <div className="mt-1 text-[10px] text-foreground/60" data-testid={`text-time-${it.id}`}>
                        {formatTime(date)}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Modal com prev/next e nome do autor */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-md p-4 md:p-12 animate-in fade-in duration-300"
          onClick={() => setSelectedIndex(null)}
        >
          {/* Close */}
          <button
            className="absolute top-6 right-6 text-primary p-2 border border-primary hover:bg-primary hover:text-primary-foreground transition-colors z-10"
            onClick={() => setSelectedIndex(null)}
          >
            <X size={24} />
          </button>

          {/* Prev */}
          {selectedIndex! > 0 && (
            <button
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-primary p-2 border border-primary hover:bg-primary hover:text-primary-foreground transition-colors z-10"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {/* Next */}
          {selectedIndex! < items.length - 1 && (
            <button
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-primary p-2 border border-primary hover:bg-primary hover:text-primary-foreground transition-colors z-10"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
            >
              <ChevronRight size={28} />
            </button>
          )}

          {/* Photo */}
          <img
            src={getImageUrl(selectedItem.storage_path)}
            alt="Foto em alta resolução"
            className="max-h-[70vh] max-w-full object-contain border border-primary/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Author name */}
          <div className="mt-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-xl font-bold uppercase tracking-wider">
              {selectedItem.author}
            </div>
            <div className="mt-1 text-xs text-foreground/60">
              {formatTime(parseMoment(selectedItem.moment))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
