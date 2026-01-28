import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { X } from "lucide-react";

type TimelineItem = {
  id: string;
  author: string;
  createdAt: Date;
  photoUrl: string;
};

function formatTime(d: Date) {
  const hh = `${d.getHours()}`.padStart(2, "0");
  const mm = `${d.getMinutes()}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  const mo = `${d.getMonth() + 1}`.padStart(2, "0");
  return `${hh}:${mm} — ${dd}/${mo}`;
}

function makeSeed(): TimelineItem[] {
  const now = new Date();
  const mk = (minsAgo: number, author: string) => {
    const d = new Date(now.getTime() - minsAgo * 60_000);
    const w = 720;
    const h = 960;
    const seed = encodeURIComponent(`${author}-${minsAgo}`);
    return {
      id: `${minsAgo}-${author}`,
      author,
      createdAt: d,
      photoUrl: `https://picsum.photos/seed/${seed}/${w}/${h}`,
    };
  };

  return [
    mk(12, "Marina"),
    mk(27, "Daniel"),
    mk(58, "Aline"),
    mk(96, "Pedro"),
    mk(132, "Beatriz"),
    mk(180, "Carlos"),
    mk(220, "Sofia"),
    mk(260, "Tiago"),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export default function Timeline() {
  const [, setLocation] = useLocation();
  const [guestName, setGuestName] = useState<string | null>(null);
  const [items] = useState<TimelineItem[]>(() => makeSeed());
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("wedding_guest_name");
    if (saved) setGuestName(saved);
  }, []);

  function goHomeAndRegister() {
    if (guestName) setLocation("/?focus=upload");
    else setLocation("/?open=name");
  }

  function goHome() {
    setLocation("/");
  }

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
        {/* Linha de posição absoluta (Infinita) */}
        <div 
          className="absolute top-1/2 left-0 right-0 h-px bg-primary/30 z-0" 
          style={{ transform: 'translateY(-50%)' }}
        />

        <div
          className="no-scrollbar h-full w-full overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing"
          data-testid="scroller-timeline"
        >
          <div className="relative flex min-h-full w-max items-center gap-16 px-24 md:px-[30vw]">
            {items.length === 0 ? (
              <div className="w-[calc(100vw-8rem)] text-center text-sm text-foreground/60" data-testid="empty-timeline">
                Ainda não há registros. Seja o primeiro a compartilhar um momento.
              </div>
            ) : null}

            {items.map((it, index) => (
              <article
                key={it.id}
                className="relative flex w-[180px] md:w-[220px] flex-col items-center"
                data-testid={`card-timeline-${it.id}`}
                style={{ transform: index % 2 === 0 ? "translateY(-80px)" : "translateY(80px)" }}
              >
                {/* Conexão com a linha: Linha vertical + Dot quadrado */}
                <div 
                  className={`absolute left-1/2 -translate-x-1/2 w-px bg-primary/40 h-20 z-10 ${index % 2 === 0 ? 'top-full' : 'bottom-full'}`}
                />
                <div 
                  className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-primary z-20 ${index % 2 === 0 ? 'top-[calc(100%+80px)]' : 'bottom-[calc(100%+80px)]'} -translate-y-1/2`}
                />

                <div 
                  className="cursor-pointer border border-primary/30 bg-background transition-transform duration-500 hover:scale-105" 
                  onClick={() => setSelectedPhoto(it.photoUrl)}
                  data-testid={`card-photo-${it.id}`}
                >
                  <img
                    src={it.photoUrl}
                    alt="Registro do casamento"
                    className="h-[240px] md:h-[300px] w-full object-cover"
                    loading="lazy"
                    draggable={false}
                    data-testid={`img-timeline-${it.id}`}
                  />
                </div>

                <div className="mt-4 text-center" data-testid={`card-meta-${it.id}`}>
                  <div className="text-xs font-bold uppercase tracking-wider" data-testid={`text-author-${it.id}`}>
                    {it.author}
                  </div>
                  <div className="mt-1 text-[10px] text-foreground/60" data-testid={`text-time-${it.id}`}>
                    {formatTime(it.createdAt)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Modal de Foto em Alta Escala */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md p-4 md:p-12 animate-in fade-in duration-300"
          onClick={() => setSelectedPhoto(null)}
        >
          <button 
            className="absolute top-6 right-6 text-primary p-2 border border-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => setSelectedPhoto(null)}
          >
            <X size={24} />
          </button>
          <img 
            src={selectedPhoto} 
            alt="Foto em alta resolução" 
            className="max-h-full max-w-full object-contain border border-primary/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}
