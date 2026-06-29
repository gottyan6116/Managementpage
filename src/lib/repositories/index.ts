/**
 * リポジトリのエントリポイント。
 * フェーズ1 はモック実装。フェーズ2 で同インターフェイスの Supabase 実装へ切替える。
 *
 *   const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";
 *   export const repo = USE_MOCK ? mockRepo : supabaseRepo;
 */
export * from "./mock";
