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

/** Resolve a signed URL from a storage path */
export async function getSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}

/** Resolve signed URLs for multiple rows at once */
export async function resolveImageUrls(
  rows: ImageRow[],
): Promise<(ImageRow & { url: string })[]> {
  if (rows.length === 0) return [];
  const paths = rows.map((r) => r.storage_path);
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, 3600);
  if (error) throw error;
  return rows.map((row, i) => ({
    ...row,
    url: data[i]?.signedUrl ?? "",
  }));
}

/** Upload file to storage, then insert a row referencing it */
export async function insertImage(data: {
  file: File;
  author: string;
  moment: string;
}) {
  const ext = data.file.name.split(".").pop() ?? "jpg";
  const now = new Date();
  const ts = `${now.getHours()}${now.getMinutes()}`;
  const authorSlug = data.author.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  const path = `${ts}-${authorSlug}-${Math.random().toString(36).substring(2, 10)}.${ext}`;

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

const PAGE_SIZE = 10;

export async function fetchImages(cursor?: string): Promise<{
  rows: ImageRow[];
  hasMore: boolean;
}> {
  let query = supabase
    .from("images")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  const hasMore = rows.length > PAGE_SIZE;
  return {
    rows: hasMore ? rows.slice(0, PAGE_SIZE) : rows,
    hasMore,
  };
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
