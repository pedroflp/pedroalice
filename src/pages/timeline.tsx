import { useEffect, useRef, useState, useCallback, useTransition } from "react";
import { useLocation } from "wouter";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchImages, subscribeImages, resolveImageUrls, getSignedUrl, type ImageRow } from "@/services/images";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "motion/react";

type ImageRowWithUrl = ImageRow & { url: string };

function formatTime(d: Date) {
  const hh = `${d.getHours()}`.padStart(2, "0");
  const mm = `${d.getMinutes()}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  const mo = `${d.getMonth() + 1}`.padStart(2, "0");
  return `${hh}:${mm} ${dd}/${mo}`;
}

function parseMoment(moment: string): Date {
  return new Date(moment);
}

// --- Lazy image: skeleton until loaded, no layout shift ---
function LazyImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative w-full">
      {!loaded && <Skeleton className={`${className} absolute inset-0`} />}
      <img
        src={src}
        alt={alt}
        className={`${className} transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        loading="lazy"
        draggable={false}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

function SkeletonCard({ index }: { index: number }) {
  const isOdd = index % 2 !== 0;
  return (
    <article
      className="relative flex w-[75vw] md:w-[400px] shrink-0 snap-center flex-col items-center"
      style={{ transform: `translateY(${isOdd ? "80px" : "-80px"})` }}
    >
      <div className={`absolute left-1/2 -translate-x-1/2 w-px bg-primary/20 h-20 z-10 ${!isOdd ? "top-full" : "bottom-full"}`} />
      <div className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-primary/20 z-20 ${!isOdd ? "top-[calc(100%+80px)]" : "bottom-[calc(100%+80px)]"} -translate-y-1/2`} />

      {isOdd && (
        <div className="mb-4 flex flex-col items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      )}

      <Skeleton className="h-[240px] md:h-[300px] w-full" />

      {!isOdd && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      )}
    </article>
  );
}

export default function Timeline() {
  const [, setLocation] = useLocation();
  const [items, setItems] = useState<ImageRowWithUrl[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<string | undefined>(undefined);

  // Load a page of images
  const loadPage = useCallback(async (cursor?: string) => {
    const { rows, hasMore: more } = await fetchImages(cursor);
    const resolved = await resolveImageUrls(rows);
    return { resolved, hasMore: more };
  }, []);

  // Initial load
  useEffect(() => {
    loadPage()
      .then(({ resolved, hasMore: more }) => {
        startTransition(() => {
          setItems(resolved);
          setHasMore(more);
          setInitialLoaded(true);
          if (resolved.length > 0) {
            cursorRef.current = resolved[resolved.length - 1].created_at;
          }
        });
      })
      .catch((err) => {
        console.error(err);
        setInitialLoaded(true);
      });

    const unsubscribe = subscribeImages(async (newRow) => {
      try {
        const url = await getSignedUrl(newRow.storage_path);
        startTransition(() => {
          setItems((prev) => {
            if (prev.some((r) => r.id === newRow.id)) return prev;
            return [{ ...newRow, url }, ...prev];
          });
        });
      } catch (err) {
        console.error("Failed to get signed URL for new image", err);
      }
    });

    return unsubscribe;
  }, [loadPage]);

  // Infinite scroll: observe sentinel at the end of the list
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const scroller = scrollerRef.current;
    if (!sentinel || !scroller) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && hasMore && !loadingMore && initialLoaded) {
          setLoadingMore(true);
          loadPage(cursorRef.current)
            .then(({ resolved, hasMore: more }) => {
              startTransition(() => {
                setItems((prev) => {
                  // Deduplicate
                  const existingIds = new Set(prev.map((r) => r.id));
                  const newItems = resolved.filter((r) => !existingIds.has(r.id));
                  return [...prev, ...newItems];
                });
                setHasMore(more);
                if (resolved.length > 0) {
                  cursorRef.current = resolved[resolved.length - 1].created_at;
                }
              });
            })
            .catch(console.error)
            .finally(() => setLoadingMore(false));
        }
      },
      { root: scroller, rootMargin: "0px 400px 0px 0px", threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, initialLoaded, loadPage]);

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

  function goToUpload() {
    setLocation("/upload");
  }

  function goHome() {
    setLocation("/");
  }

  const selectedItem = selectedIndex !== null ? items[selectedIndex] : null;
  const showSkeleton = !initialLoaded || isPending;

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden">
      <header
        className="sticky top-0 z-40 border-b border-primary/20 bg-background/95 px-6 py-5 backdrop-blur-sm md:px-12"
        data-testid="header-timeline"
      >
        <div className="mx-auto flex max-w-6xl items-center gap-8">
          <button
            type="button"
            className="hidden border border-primary bg-transparent px-5 py-4 text-[11px] uppercase tracking-[0.18em] text-primary transition-[filter] duration-300 ease-out hover:brightness-95 active:brightness-90 md:inline-flex"
            onClick={goHome}
            data-testid="button-timeline-home"
          >
            Início
          </button>
          <h1 className="text-base font-light tracking-widest uppercase" data-testid="text-timeline-title">
            Linha do tempo
          </h1>
          <button
            type="button"
            className="border ml-auto cursor-pointer w-max border-transparent bg-primary px-6 py-4 text-[11px] uppercase tracking-[0.18em] text-primary-foreground transition-[filter] duration-300 ease-out hover:brightness-95 active:brightness-90"
            onClick={goToUpload}
            data-testid="button-timeline-register"
          >
            Quero registrar os momentos
          </button>
        </div>
      </header>

      <section className="h-[calc(100vh-88px)] w-full overflow-hidden" data-testid="section-timeline">

        {/* Linha central com gradiente nas laterais */}
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "100%" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute top-1/2 left-0 right-0 h-px z-1"
            style={{
              transform: "translateY(-50%)",
              background:
                "linear-gradient(to right, transparent 0%, hsl(85 19% 35% / 0.3) 15%, hsl(85 19% 35% / 0.3) 85%, transparent 100%)",
            }}
          />
        )}

        <div
          ref={scrollerRef}
          className="no-scrollbar relative z-9 h-full w-full overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing snap-x snap-mandatory md:snap-none"
          data-testid="scroller-timeline"
        >
          <div className="relative flex min-h-full w-max items-center gap-6 md:gap-16 px-[calc(50vw-120px)] md:px-[30vw]">
            {showSkeleton ? (
              <>
                <SkeletonCard index={0} />
                <SkeletonCard index={1} />
                <SkeletonCard index={2} />
              </>
            ) : items.length === 0 ? (
              <div className="relative flex gap-24 left-3/7 -translate-x-1/2">
                {items.length === 0 && (
                  <div className="absolute -translate-x-1/2 left-1/2 top-2/10 text-4xl -translate-y-1/2 text-center text-foreground/60" data-testid="empty-timeline">
                    Faça o primeiro registro
                  </div>
                )}
                <SkeletonCard index={0} />
                <SkeletonCard index={1} />
                <SkeletonCard index={2} />
              </div>
            ) : (
              <>

                {items.map((it, index) => {
                  const isOdd = index % 2 !== 0;
                  const date = parseMoment(it.moment);
                  return (
                    <motion.article
                      key={it.id}
                      className="relative flex w-[75vw] md:w-[400px] shrink-0 snap-center flex-col items-center"
                      data-testid={`card-timeline-${it.id}`}
                      initial={{
                        opacity: 0,
                        y: isOdd ? 40 : -140,
                      }}
                      animate={{
                        opacity: 1,
                        y: isOdd ? 10 : -100,
                      }}
                      transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.1 }}
                    >

                      {isOdd && (
                        <div className="mb-4 text-center" data-testid={`card-meta-${it.id}`}>
                          <div className="mt-1 text-sm text-foreground/60" data-testid={`text-time-${it.id}`}>
                            {formatTime(date)}
                          </div>
                          <div className="text-xl font-bold uppercase tracking-wider text-primary" data-testid={`text-author-${it.id}`}>
                            {it.author}
                          </div>
                        </div>
                      )}

                      <div
                        className="cursor-pointer w-full bg-accent transition-transform duration-500 hover:scale-105"
                        onClick={() => setSelectedIndex(index)}
                        data-testid={`card-photo-${it.id}`}
                      >
                        <div
                          className="relative w-full overflow-hidden border-4 shadow-md"
                        >
                          <LazyImage
                            src={it.url}
                            alt="Registro do casamento"
                            className="h-[240px] md:h-[300px] w-full object-cover"
                          />
                        </div>
                      </div>

                      {!isOdd && (
                        <div className="mt-4 text-center" data-testid={`card-meta-${it.id}`}>
                          <div className="mt-1 text-sm text-foreground/60" data-testid={`text-time-${it.id}`}>
                            {formatTime(date)}
                          </div>
                          <div className="text-xl font-bold uppercase tracking-wider text-primary" data-testid={`text-author-${it.id}`}>
                            {it.author}
                          </div>
                        </div>
                      )}

                      <div
                        className={`absolute left-1/2 -translate-x-1/2 w-px bg-primary h-20 z-10 ${!isOdd ? "top-full" : "bottom-full"}`}
                      />
                      <div
                        className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-primary z-20 ${!isOdd ? "top-[calc(100%+88px)]" : "bottom-[calc(100%+80px)]"} -translate-y-1/2`}
                      />
                    </motion.article>
                  );
                })}

                {/* Sentinel for infinite scroll + loading skeletons */}
                <div ref={sentinelRef} className="flex shrink-0 items-center gap-6 md:gap-16">
                  {loadingMore && (
                    <>
                      <SkeletonCard index={items.length} />
                      <SkeletonCard index={items.length + 1} />
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Modal com prev/next e nome do autor */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-background/95 backdrop-blur-md p-4 md:p-12 animate-in fade-in duration-300"
          onClick={() => setSelectedIndex(null)}
        >
          <button
            className="absolute top-6 right-6 text-primary p-2 border border-primary hover:bg-primary hover:text-primary-foreground transition-colors z-10"
            onClick={() => setSelectedIndex(null)}
          >
            <X size={24} />
          </button>

          {selectedIndex! > 0 && (
            <button
              className="absolute left-4 md:left-8 top-1/2 bg-background -translate-y-1/2 text-primary p-2 border border-primary hover:bg-primary hover:text-primary-foreground transition-colors z-10"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {selectedIndex! < items.length - 1 && (
            <button
              className="absolute right-4 md:right-8 bg-background top-1/2 -translate-y-1/2 text-primary p-2 border border-primary hover:bg-primary hover:text-primary-foreground transition-colors z-10"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
            >
              <ChevronRight size={28} />
            </button>
          )}

          <img
            src={selectedItem.url}
            alt="Foto em alta resolução"
            className="max-h-[70vh] max-w-full object-contain border border-primary/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

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
