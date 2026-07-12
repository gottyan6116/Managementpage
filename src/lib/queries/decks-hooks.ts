"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface DeckFile {
  name: string;
  path: string;
  sizeBytes: number;
  uploadedAt: string | null;
}

interface DecksListResponse {
  files?: DeckFile[];
  error?: string;
  notConfigured?: boolean;
}

const qk = { decks: ["decks"] as const };

export function useDecks() {
  return useQuery({
    queryKey: qk.decks,
    queryFn: async (): Promise<DecksListResponse> => {
      const res = await fetch("/api/decks");
      return res.json();
    },
  });
}

export function useDeleteDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (path: string) => {
      const res = await fetch(`/api/decks?path=${encodeURIComponent(path)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "削除に失敗しました。");
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.decks }),
  });
}

/** アップロード URL 発行 → ブラウザから Supabase Storage へ直接 PUT する */
export function useUploadDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const urlRes = await fetch("/api/decks/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });
      if (!urlRes.ok) {
        const data = await urlRes.json().catch(() => null);
        throw new Error(data?.error ?? "アップロードの準備に失敗しました。");
      }
      const { signedUrl } = (await urlRes.json()) as { signedUrl: string };

      const putRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("アップロードに失敗しました。");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.decks }),
  });
}
