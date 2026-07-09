import type { LucideIcon } from "lucide-react";
import { LayoutTemplate } from "lucide-react";

/**
 * 深い連携はせず、外部ツールへのリンク集として持つ (docs 化はしない軽量な設定)。
 * 追加するときはこの配列に1件足すだけでよい。
 */
export interface ExternalTool {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: LucideIcon;
  color: string;
}

export const EXTERNAL_TOOLS: ExternalTool[] = [
  {
    id: "lp-library",
    name: "LP Library",
    description: "マーケティング用LPのテンプレート・素材ライブラリ",
    url: "https://lp-library-vercel.vercel.app/",
    icon: LayoutTemplate,
    color: "#8B5CF6",
  },
];
