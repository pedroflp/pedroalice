import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { X, Upload, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type UploadItem = {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
};

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1974&auto=format&fit=crop",
];

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clampName(name: string) {
  return name.trim().replace(/\s+/g, " ").slice(0, 48);
}

export default function Home() {
  const [, setLocation] = useLocation();
  const uploadRef = useRef<HTMLElement | null>(null);
  const storyRef = useRef<HTMLElement | null>(null);

  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [guestName, setGuestName] = useState<string | null>(null);

  const [items, setItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("wedding_guest_name");
    if (saved) setGuestName(saved);

    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      setItems((prev) => {
        prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
        return prev;
      });
    };
  }, []);

  const canShowUpload = Boolean(guestName);

  const canSubmitName = useMemo(() => {
    return clampName(nameInput).length >= 2;
  }, [nameInput]);

  function openNameModal() {
    setNameInput(guestName ?? "");
    setIsNameModalOpen(true);
  }

  function closeNameModal() {
    setIsNameModalOpen(false);
  }

  function confirmName() {
    const next = clampName(nameInput);
    if (next.length < 2) return;
    setGuestName(next);
    window.localStorage.setItem("wedding_guest_name", next);
    setIsNameModalOpen(false);
    requestAnimationFrame(() => {
      uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function toTimeline() {
    setLocation("/timeline");
  }

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

  async function simulateUpload() {
    if (items.length === 0 || isUploading) return;
    setIsUploading(true);

    const start = Date.now();
    const durationMs = 1400;

    await new Promise<void>((resolve) => {
      const tick = () => {
        const t = Math.min(1, (Date.now() - start) / durationMs);
        const eased = 1 - Math.pow(1 - t, 2);
        setItems((prev) => prev.map((p) => ({ ...p, progress: Math.round(eased * 100) })));
        if (t >= 1) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    setTimeout(() => {
      setIsUploading(false);
      setItems((prev) => prev.map((p) => ({ ...p, progress: 100 })));
    }, 150);
  }

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
            onClick={() => storyRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="absolute bottom-12 flex flex-col items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <span className="text-[10px] uppercase tracking-[0.3em]">Descubra</span>
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </motion.button>
        </div>
      </section>

      {/* Story Section */}
      <section
        ref={storyRef}
        className="min-h-screen w-full px-6 py-16 md:px-10 md:py-24"
        data-testid="section-hero"
      >
        <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-4xl flex-col items-center justify-center text-center">
          <h2
            className="text-4xl font-light leading-[1.05] tracking-[0.08em] md:text-6xl"
            data-testid="text-hero-title"
          >
            Faça parte da nossa história
          </h2>

          <p
            className="mt-6 max-w-[36rem] text-base leading-relaxed text-foreground/80 md:mt-8 md:text-lg"
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
              className="w-full border border-transparent bg-primary px-8 py-5 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground transition-[filter] duration-300 ease-out hover:brightness-95 active:brightness-90"
              onClick={openNameModal}
              data-testid="button-register-moments"
            >
              Quero registrar os momentos
            </button>

            <button
              type="button"
              className="w-full border border-primary bg-transparent px-8 py-5 text-xs font-bold uppercase tracking-[0.18em] text-primary transition-[filter] duration-300 ease-out hover:brightness-95 active:brightness-90"
              onClick={toTimeline}
              data-testid="button-view-timeline"
            >
              Ver linha do tempo
            </button>
          </div>
        </div>
      </section>

      <section
        ref={(el) => {
          uploadRef.current = el;
        }}
        className={`w-full px-6 py-20 md:px-10 ${canShowUpload ? "" : "hidden"}`}
        data-testid="section-upload"
      >
        <div className="mx-auto max-w-3xl">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="text-3xl font-light md:text-4xl" data-testid="text-upload-title">
                Compartilhe seus registros
              </h2>
              <p
                className="mt-4 max-w-2xl text-sm leading-relaxed text-foreground/70 md:text-base"
                data-testid="text-upload-hint"
              >
                Obrigado, {guestName}. Você pode enviar múltiplas fotos — tudo fica alinhado na nossa linha do tempo.
              </p>
            </div>

            <button
              type="button"
              className="hidden border border-primary bg-transparent px-5 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary transition-[filter] duration-300 ease-out hover:brightness-95 active:brightness-90 md:inline-flex"
              onClick={openNameModal}
              data-testid="button-edit-name"
            >
              Editar nome
            </button>
          </div>

          <div className="mt-12">
            <label
              className="group relative block w-full cursor-pointer border border-dashed border-primary px-8 py-16 text-center md:px-16"
              data-testid="dropzone-upload"
              onDragOver={(e) => {
                e.preventDefault();
              }}
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
                data-testid="input-upload-files"
              />

              <div className="mx-auto flex max-w-md flex-col items-center">
                <Upload className="h-6 w-6 text-primary" strokeWidth={1.5} aria-hidden="true" />
                <p
                  className="mt-5 text-sm text-foreground/80"
                  data-testid="text-upload-dropzone"
                >
                  Arraste suas fotos ou clique para selecionar
                </p>
              </div>
            </label>

            {items.length > 0 ? (
              <div className="mt-10" data-testid="container-previews">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((it) => (
                    <div
                      key={it.id}
                      className="border border-primary/30"
                      data-testid={`card-preview-${it.id}`}
                    >
                      <div className="relative aspect-square w-full overflow-hidden" data-testid={`img-preview-${it.id}`}>
                        <img
                          src={it.previewUrl}
                          alt="Prévia do upload"
                          className="h-full w-full object-cover"
                          draggable={false}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-3 grid h-9 w-9 place-items-center border border-primary bg-background/90 text-primary transition-[filter] duration-300 ease-out hover:brightness-95 active:brightness-90"
                          onClick={() => removeItem(it.id)}
                          data-testid={`button-remove-${it.id}`}
                          aria-label="Remover"
                        >
                          <X className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                        </button>
                      </div>

                      <div className="px-4 py-4">
                        <div className="h-1 w-full bg-foreground/10" data-testid={`progress-track-${it.id}`}>
                          <div
                            className="h-1 bg-primary transition-[width] duration-300 ease-out"
                            style={{ width: `${it.progress}%` }}
                            data-testid={`progress-bar-${it.id}`}
                          />
                        </div>
                        <div className="mt-2 text-xs text-primary" data-testid={`text-progress-${it.id}`}>
                          {it.progress}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex items-center justify-end gap-4">
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
                    data-testid="button-clear-files"
                  >
                    Limpar
                  </button>

                  <button
                    type="button"
                    className="border border-transparent bg-primary px-7 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-foreground transition-[filter,opacity] duration-300 ease-out hover:brightness-95 active:brightness-90 disabled:opacity-50"
                    onClick={simulateUpload}
                    disabled={items.length === 0 || isUploading}
                    data-testid="button-send-records"
                  >
                    Enviar registros
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {isNameModalOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 px-6"
          role="dialog"
          aria-modal="true"
          data-testid="modal-name"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeNameModal();
          }}
        >
          <div className="w-full max-w-[26rem] border border-primary/20 bg-background p-8 md:p-12" data-testid="modal-name-content">
            <div className="flex items-start justify-between gap-6">
              <h3 className="text-xl font-light" data-testid="text-modal-title">
                Como devemos te chamar?
              </h3>

              <button
                type="button"
                className="grid h-10 w-10 place-items-center border border-primary bg-transparent text-primary transition-[filter] duration-300 ease-out hover:brightness-95 active:brightness-90"
                onClick={closeNameModal}
                aria-label="Fechar"
                data-testid="button-close-modal"
              >
                <X className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-8" data-testid="container-modal-form">
              <label className="block" data-testid="label-name">
                <span className="sr-only">Seu nome</span>
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full border-b border-primary bg-transparent px-0 py-3 text-base text-foreground outline-none placeholder:text-foreground/50 focus:border-primary"
                  autoFocus
                  data-testid="input-name"
                />
              </label>

              <button
                type="button"
                className="mt-8 w-full border border-transparent bg-primary px-8 py-5 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground transition-[filter,opacity] duration-300 ease-out hover:brightness-95 active:brightness-90 disabled:opacity-50"
                onClick={confirmName}
                disabled={!canSubmitName}
                data-testid="button-confirm-name"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="h-16" aria-hidden="true" />
    </main>
  );
}
