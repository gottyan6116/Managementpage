import {
  BarChart3,
  Briefcase,
  FileText,
  Folder,
  LayoutGrid,
  ListTodo,
  StickyNote,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** サイドバーメニュー (順番厳守: docs/04 §Sidebar) */
export const NAV_ITEMS: NavItem[] = [
  { label: "Todo", href: "/todo", icon: ListTodo },
  { label: "ガントチャート", href: "/gantt", icon: BarChart3 },
  { label: "担当案件", href: "/projects", icon: Briefcase },
  { label: "ボード", href: "/board", icon: LayoutGrid },
  { label: "ドキュメント", href: "/documents", icon: FileText },
  { label: "ファイル", href: "/files", icon: Folder },
  { label: "メモ", href: "/notes", icon: StickyNote },
];
