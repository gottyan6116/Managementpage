import {
  BarChart3,
  Briefcase,
  CircleDollarSign,
  FileText,
  LayoutGrid,
  ListTodo,
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

/** サイドバーメニュー: タスク3ビュー、案件、ナレッジを分離 */
export const NAV_SECTIONS: NavSection[] = [
  {
    label: "ワークスペース",
    items: [
      { label: "サマリー", href: "/todo", icon: ListTodo },
      { label: "ガントチャート", href: "/gantt", icon: BarChart3 },
      { label: "Todo", href: "/board", icon: LayoutGrid },
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
