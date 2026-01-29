import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { X, Upload, ArrowLeft } from "lucide-react";
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
        </div>
      </header>

      <section className="w-full px-6 py-12 md:px-10 md:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="max-w-2xl text-sm leading-relaxed text-foreground/70 md:text-base">
            Obrigado, {guestName}. Você pode enviar múltiplas fotos — tudo fica alinhado na nossa linha do tempo.
          </p>

          <div className="mt-12">
            <label
              className="group relative block w-full cursor-pointer border border-dashed border-primary px-8 py-16 text-center md:px-16"
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
              <div className="mx-auto flex max-w-md flex-col items-center">
                <Upload className="h-6 w-6 text-primary" strokeWidth={1.5} aria-hidden="true" />
                <p className="mt-5 text-sm text-foreground/80">
                  Arraste suas fotos ou clique para selecionar
                </p>
              </div>
            </label>

            {items.length > 0 && (
              <div className="mt-10">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((it) => (
                    <div key={it.id} className="border border-primary/30">
                      <div className="relative aspect-square w-full overflow-hidden">
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
                          aria-label="Remover"
                        >
                          <X className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                        </button>
                      </div>
                      <div className="px-4 py-4">
                        <div className="h-1 w-full bg-foreground/10">
                          <div
                            className="h-1 bg-primary transition-[width] duration-300 ease-out"
                            style={{ width: `${it.progress}%` }}
                          />
                        </div>
                        <div className="mt-2 text-xs text-primary">{it.progress}%</div>
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
                  >
                    Limpar
                  </button>

                  <button
                    type="button"
                    className="border border-transparent bg-primary px-7 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-foreground transition-[filter,opacity] duration-300 ease-out hover:brightness-95 active:brightness-90 disabled:opacity-50"
                    onClick={handleUpload}
                    disabled={items.length === 0 || isUploading}
                  >
                    {isUploading ? "Enviando..." : "Enviar registros"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
