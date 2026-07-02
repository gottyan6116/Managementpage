import { useToastStore } from "@/stores/toast-store";

const UNDO_MS = 4000;

/**
 * 即座に削除せず、一定時間の猶予 (トーストの「元に戻す」) を挟んでから onCommit を実行する。
 * 対象は先に非表示にする前提 (呼び出し側で pendingDeleteIds を参照してフィルタする)。
 */
export function scheduleUndoableDelete({
  ids,
  message,
  onCommit,
}: {
  ids: string[];
  message: string;
  onCommit: () => void;
}) {
  const { push, dismiss, addPending, removePending } = useToastStore.getState();
  addPending(ids);
  let toastId = "";
  const timer = setTimeout(() => {
    removePending(ids);
    dismiss(toastId);
    onCommit();
  }, UNDO_MS);
  toastId = push({
    message,
    actionLabel: "元に戻す",
    durationMs: UNDO_MS,
    onAction: () => {
      clearTimeout(timer);
      removePending(ids);
      dismiss(toastId);
    },
  });
}
