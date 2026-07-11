"use client";

import { createContext, useContext } from "react";
import type { IssueTreeNode } from "@/lib/issue-tree/domain";

/**
 * キャンバス上のノードカードから呼ぶ操作。
 * React Flow のノード data を純粋 (メモ化可能) に保つため、
 * コールバックは data ではなくコンテキスト経由で渡す。
 */
export interface IssueFlowActions {
  onAddChild: (parentId: string) => void;
  onDelete: (node: IssueTreeNode) => void;
  onRename: (id: string, title: string) => void;
}

const noop = () => {};

export const IssueFlowActionsContext = createContext<IssueFlowActions>({
  onAddChild: noop,
  onDelete: noop,
  onRename: noop,
});

export function useIssueFlowActions(): IssueFlowActions {
  return useContext(IssueFlowActionsContext);
}
