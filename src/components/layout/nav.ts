import {
  BarChart3,
  Briefcase,
  CircleDollarSign,
  FileText,
  Home,
  LayoutGrid,
  Timer,
  StickyNote,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/**
 * サイドバーメニュー。命名は 1対1 を厳守する:
 * ホーム=/todo(サマリー) / ボード=/board。「Todo」という語は
 * 複数の場所を指して混乱を生んだため使わない。
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    label: "ワークスペース",
    items: [
      { label: "ホーム", href: "/todo", icon: Home },
      { label: "ガントチャート", href: "/gantt", icon: BarChart3 },
      { label: "ボード", href: "/board", icon: LayoutGrid },
      { label: "工数", href: "/time", icon: Timer },
    ],
  },
  {
    label: "案件",
    items: [
      { label: "担当案件", href: "/projects", icon: Briefcase },
      { label: "請求・売上", href: "/billing", icon: CircleDollarSign },
    ],
  },
  {
    label: "ナレッジ",
    items: [
      { label: "ドキュメント", href: "/documents", icon: FileText },
      { label: "メモ", href: "/notes", icon: StickyNote },
    ],
  },
];
