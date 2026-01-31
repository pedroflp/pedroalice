import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { X, Upload, ArrowLeft, Camera, Image, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { insertImage } from "@/services/images";

type UploadItem = {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
};

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function UploadPage() {
  const [, setLocation] = useLocation();
  const [guestName] = useState<string | null>(
    () => window.localStorage.getItem("pedroalice_guest_name"),
  );
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const carouselSectionRef = useRef<HTMLDivElement>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    return () => {
      setItems((prev) => {
        prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
        return prev;
      });
    };
  }, []);

  function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;

    setItems((prev) => {
      const next = [...prev];
      for (const file of files) {
        const id = uid();
        const previewUrl = URL.createObjectURL(file);
        next.push({ id, file, previewUrl, progress: 0 });
      }
      requestAnimationFrame(() => {
        emblaApi?.reInit();
        emblaApi?.scrollTo(next.length - 1);
        carouselSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return next;
    });
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found) URL.revokeObjectURL(found.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  async function handleUpload() {
    if (items.length === 0 || isUploading || !guestName) return;
    setIsUploading(true);

    const total = items.length;
    let done = 0;

    for (const item of items) {
      try {
        await insertImage({
          file: item.file,
          author: guestName,
          moment: new Date().toISOString(),
        });
        done++;
        const pct = Math.round((done / total) * 100);
        setItems((prev) => prev.map((p) => ({ ...p, progress: pct })));
      } catch (err) {
        console.error("Upload failed for", item.id, err);
      }
    }

    // Clean up and navigate to timeline
    setItems((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      return [];
    });
    setIsUploading(false);
    setLocation("/timeline");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-primary/20 bg-background/95 px-6 py-5 backdrop-blur-sm md:px-12">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center border border-primary bg-transparent text-primary transition-[filter] duration-300 ease-out hover:brightness-95 active:brightness-90"
            onClick={() => setLocation("/")}
            aria-label="Voltar"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <h1 className="text-base font-light tracking-[0.1em] uppercase">
            Compartilhar registros
          </h1>
          <button
            type="button"
            className="border ml-auto z-9 cursor-pointer w-max px-6 py-4 uppercase tracking-[0.18em] text-xs bg-accent text-foreground transition-[filter] duration-300 ease-out hover:brightness-95 active:brightness-90"
            onClick={() => setLocation("/timeline")}
            data-testid="button-upload-timeline"
          >
            Ver linha do tempo
          </button>
        </div>
      </header>

      <section className="w-full px-6 py-12 md:px-10 md:py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="max-w-2xl text-sm leading-relaxed text-foreground/70 md:text-base">
            Olá, {guestName}. Você pode capturar fotos pela câmera ou enviar fotos da sua galeria! <br />
            <b>Todas as fotos vão ficar na linha do tempo.</b>
          </p>


          {items.length > 0 && (
            <div className="mt-10" ref={carouselSectionRef}>
              <div className="relative">
                <span className="text-xs text-foreground/70">Você pode capturar ou anexar mais fotos!</span>
                <div className="overflow-hidden" ref={emblaRef}>
                  <div className="flex gap-4">
                    {items.map((it) => (
                      <div key={it.id} className="min-w-0 flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%] border border-primary/30">
                        <div className="relative aspect-square w-full overflow-hidden">
                          <img
                            src={it.previewUrl}
                            alt="Prévia do upload"
                            className="h-full w-full object-cover"
                            draggable={false}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-3 gap-2 flex place-items-center border border-primary bg-accent p-2 text-primary transition-[filter] duration-300 ease-out hover:brightness-95 active:brightness-90"
                            onClick={() => removeItem(it.id)}
                            aria-label="Remover"
                          >
                            <X className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
                            Remover essa foto
                          </button>
                        </div>
                        {isUploading && <div className="px-4 py-4">
                          <div className="h-1 w-full bg-foreground/10">
                            <div
                              className="h-1 bg-primary transition-[width] duration-300 ease-out"
                              style={{ width: `${it.progress}%` }}
                            />
                          </div>
                          <div className="mt-2 text-xs text-primary">{it.progress}%</div>
                        </div>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prev / Next arrows */}
                <button
                  type="button"
                  className="absolute left-2 top-1/2 grid h-10 w-10 place-items-center border border-primary bg-background/90 text-primary transition-[filter,opacity] duration-300 ease-out hover:brightness-95 active:brightness-90 disabled:opacity-30"
                  onClick={scrollPrev}
                  disabled={!canScrollPrev}
                  aria-label="Anterior"
                >
                  <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  className="absolute right-2 top-1/2 grid h-10 w-10 place-items-center border border-primary bg-background/90 text-primary transition-[filter,opacity] duration-300 ease-out hover:brightness-95 active:brightness-90 disabled:opacity-30"
                  onClick={scrollNext}
                  disabled={!canScrollNext}
                  aria-label="Próximo"
                >
                  <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>

              {/* Dot indicators */}
              <div className="mt-4 flex items-center justify-center gap-2">
                {items.map((it, idx) => (
                  <button
                    key={it.id}
                    type="button"
                    className={`h-2.5 w-2.5 rounded-full transition-colors duration-200 ${idx === selectedIndex ? "bg-primary" : "bg-primary/30"}`}
                    onClick={() => emblaApi?.scrollTo(idx)}
                    aria-label={`Ir para item ${idx + 1}`}
                  />
                ))}
              </div>

              <div className="mt-8 flex w-full gap-4">
                <button
                  type="button"
                  className="border border-primary bg-transparent px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-primary opacity-90 transition-[filter,opacity] duration-300 ease-out hover:brightness-95 active:brightness-90 disabled:opacity-50"
                  onClick={() => {
                    setItems((prev) => {
                      prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
                      return [];
                    });
                  }}
                  disabled={isUploading}
                >
                  Limpar
                </button>

                <button
                  type="button"
                  className="border w-full border-transparent bg-primary px-7 py-4 text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground transition-[filter,opacity] duration-300 ease-out hover:brightness-95 active:brightness-90 disabled:opacity-50"
                  onClick={handleUpload}
                  disabled={items.length === 0 || isUploading}
                >
                  {isUploading ? "Enviando..." : "Enviar registros"}
                </button>
              </div>
            </div>
          )}

          <div className="gap-8 mt-16">
            <button className="p-16 border text-primary w-full cursor-pointer flex flex-col place-items-center border-primary" onClick={() => inputRef.current?.click()}>
              <Camera className="h-8 w-8  mb-4" strokeWidth={2} aria-hidden="true" />
              <span className="text-lg font-bold uppercase tracking-[0.08em]">Pressione para capturar foto com a câmera</span>
            </button>

            <div className="mt-4">
              <label
                className="group relative block w-full cursor-pointer bg-accent border border-dashed border-primary px-8 py-16 text-center md:px-16"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    if (e.target.files) addFiles(e.target.files);
                    e.currentTarget.value = "";
                  }}
                />
                <div className="mx-auto flex text-primary max-w-md flex-col items-center">
                  <Image className="h-8 w-8 " strokeWidth={1.5} aria-hidden="true" />
                  <p className="mt-5 text-md font-bold uppercase tracking-[0.08em]">
                    Pressione para enviar foto pela galeria
                  </p>
                </div>
              </label>

              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.currentTarget.value = "";
                }}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
