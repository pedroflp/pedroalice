import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export default function Timeline() {
  const [, setLocation] = useLocation();

  const [guestName, setGuestName] = useState<string | null>(null);
  const [items] = useState<TimelineItem[]>(() => makeSeed());

  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("wedding_guest_name");
    if (saved) setGuestName(saved);
  }, []);

  const isMobile = useMemo(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(max-width: 767px)").matches;
  }, []);

  function goHomeAndRegister() {
    if (guestName) setLocation("/?focus=upload");
    else setLocation("/?open=name");
  }

  function goHome() {
    setLocation("/");
  }

  function nudge(dir: "left" | "right") {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir === "left" ? -340 : 340,
      behavior: "smooth",
    });
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header
        className="sticky top-0 z-40 border-b border-primary/20 bg-background/95 px-6 py-5 backdrop-blur-sm md:px-12"
        data-testid="header-timeline"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="border border-transparent bg-primary px-6 py-4 text-[11px] font-medium uppercase tracking-[0.18em] text-primary-foreground transition-[filter] duration-300 ease-out hover:brightness-95 active:brightness-90"
              onClick={goHomeAndRegister}
              data-testid="button-timeline-register"
            >
              Quero registrar os momentos
            </button>

            <button
              type="button"
              className="hidden border border-primary bg-transparent px-5 py-4 text-[11px] font-medium uppercase tracking-[0.18em] text-primary transition-[filter] duration-300 ease-out hover:brightness-95 active:brightness-90 md:inline-flex"
              onClick={goHome}
              data-testid="button-timeline-home"
            >
              Início
            </button>
          </div>

          <h1 className="hidden text-base font-light md:block" data-testid="text-timeline-title">
            Nossa linha do tempo
          </h1>

          <div className="hidden items-center gap-2 md:flex" data-testid="container-timeline-controls">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center border border-primary bg-transparent text-primary transition-[filter] duration-300 ease-out hover:brightness-95 active:brightness-90"
              onClick={() => nudge("left")}
              data-testid="button-scroll-left"
              aria-label="Rolar para a esquerda"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="grid h-10 w-10 place-items-center border border-primary bg-transparent text-primary transition-[filter] duration-300 ease-out hover:brightness-95 active:brightness-90"
              onClick={() => nudge("right")}
              data-testid="button-scroll-right"
              aria-label="Rolar para a direita"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {isMobile ? (
        <section className="px-6 py-12" data-testid="section-timeline-mobile">
          <div className="mx-auto max-w-xl">
            <h2 className="text-2xl font-light" data-testid="text-timeline-mobile-title">
              Nossa linha do tempo
            </h2>

            {items.length === 0 ? (
              <div className="mt-10 text-center text-sm text-foreground/60" data-testid="empty-timeline">
                Ainda não há registros. Seja o primeiro a compartilhar um momento.
              </div>
            ) : (
              <div className="mt-10 space-y-12" data-testid="list-timeline-mobile">
                {items.map((it, index) => (
                  <article key={it.id} className="relative" data-testid={`card-timeline-${it.id}`}>
                    <div className="absolute left-0 top-0 h-full w-px bg-primary/25" aria-hidden="true" />
                    <div className="absolute left-[-3px] top-3 h-2 w-2 bg-primary" aria-hidden="true" />

                    <div className="pl-8">
                      <div className="border border-primary/30" data-testid={`card-photo-${it.id}`}>
                        <img
                          src={it.photoUrl}
                          alt="Registro do casamento"
                          className="h-[420px] w-full object-cover"
                          loading={index < 2 ? "eager" : "lazy"}
                          draggable={false}
                          data-testid={`img-timeline-${it.id}`}
                        />
                      </div>

                      <div className="mt-5" data-testid={`card-meta-${it.id}`}>
                        <div className="text-sm font-medium" data-testid={`text-author-${it.id}`}>
                          {it.author}
                        </div>
                        <div className="mt-1 text-xs text-foreground/60" data-testid={`text-time-${it.id}`}>
                          {formatTime(it.createdAt)}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="relative" data-testid="section-timeline-desktop">
          <div className="fade-edges">
            <div
              ref={(el) => {
                scrollerRef.current = el;
              }}
              className="h-[calc(100vh-88px)] w-full overflow-x-auto overflow-y-hidden scroll-smooth"
              data-testid="scroller-timeline"
            >
              <div className="relative mx-auto flex min-h-full w-max items-center gap-12 px-16 py-16">
                <div
                  className="pointer-events-none absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-primary/25"
                  aria-hidden="true"
                />

                {items.length === 0 ? (
                  <div className="w-[calc(100vw-8rem)] text-center text-sm text-foreground/60" data-testid="empty-timeline">
                    Ainda não há registros. Seja o primeiro a compartilhar um momento.
                  </div>
                ) : null}

                {items.map((it, index) => (
                  <article
                    key={it.id}
                    className="relative flex w-[280px] flex-col"
                    data-testid={`card-timeline-${it.id}`}
                    style={{ transform: index % 2 === 0 ? "translateY(-24px)" : "translateY(24px)" }}
                  >
                    <div className="mx-auto h-10 w-px bg-primary" aria-hidden="true" />
                    <div className="mx-auto h-2 w-2 bg-primary" aria-hidden="true" />

                    <div className="mt-6 border border-primary/30" data-testid={`card-photo-${it.id}`}>
                      <img
                        src={it.photoUrl}
                        alt="Registro do casamento"
                        className="h-[360px] w-[280px] object-cover"
                        loading={index < 2 ? "eager" : "lazy"}
                        draggable={false}
                        data-testid={`img-timeline-${it.id}`}
                      />
                    </div>

                    <div className="mt-5" data-testid={`card-meta-${it.id}`}>
                      <div className="text-sm font-medium" data-testid={`text-author-${it.id}`}>
                        {it.author}
                      </div>
                      <div className="mt-1 text-xs text-foreground/60" data-testid={`text-time-${it.id}`}>
                        {formatTime(it.createdAt)}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
