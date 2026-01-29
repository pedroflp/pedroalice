import { supabase } from "@/lib/supabase";
import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";

const BUCKET = "images";

export type ImageRow = {
  id: string;
  storage_path: string;
  author: string;
  moment: string;
  created_at: string;
};

/** Resolve a public URL from a storage path */
export function getImageUrl(storagePath: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

/** Upload file to storage, then insert a row referencing it */
export async function insertImage(data: {
  file: File;
  author: string;
  moment: string;
}) {
  const ext = data.file.name.split(".").pop() ?? "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .upload(path, data.file, { contentType: data.file.type });
  if (storageError) throw storageError;

  const { error: dbError } = await supabase.from("images").insert({
    storage_path: path,
    author: data.author,
    moment: data.moment,
  });
  if (dbError) throw dbError;
}

export async function fetchImages(): Promise<ImageRow[]> {
  const { data, error } = await supabase
    .from("images")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export function subscribeImages(
  onInsert: (row: ImageRow) => void,
) {
  const channel = supabase
    .channel("images-realtime")
    .on<ImageRow>(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "images" },
      (payload: RealtimePostgresInsertPayload<ImageRow>) => {
        onInsert(payload.new);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
