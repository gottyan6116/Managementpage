"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CircleDollarSign, Save } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ProgressBar } from "@/components/shared/progress-bar";
import { useBillingRecords, useProjects, useUpdateBillingRecord } from "@/lib/queries/hooks";
import { formatDue } from "@/lib/date";

function yen(n: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(n);
}

export function BillingView({ projectId }: { projectId?: string }) {
  const { data: records } = useBillingRecords(projectId);
  const { data: projects } = useProjects("all");
  const update = useUpdateBillingRecord(projectId);
  const projectMap = useMemo(() => new Map(projects?.map((p) => [p.id, p])), [projects]);

  const total = (records ?? []).reduce((sum, r) => sum + r.contractAmount, 0);
  const invoiced = (records ?? []).reduce((sum, r) => sum + r.invoicedAmount, 0);
  const grossProfit = (records ?? []).reduce(
    (sum, r) => sum + (r.contractAmount - r.directCost),
    0,
  );
  const unbilled = total - invoiced;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Summary label="契約金額" value={yen(total)} />
        <Summary label="請求済" value={yen(invoiced)} />
        <Summary label="未請求" value={yen(unbilled)} />
        <Summary label="粗利見込" value={yen(grossProfit)} />
      </div>

      <div className="rounded-2xl border border-line bg-surface shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div>
            <h2 className="text-base font-semibold text-ink">請求・売上管理</h2>
            <p className="text-xs text-ink-muted mt-1">決済処理は行わず、請求予定と粗利の管理に限定しています。</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
            <AlertCircle className="size-3.5" />
            月末締め {records?.filter((r) => r.dueDate <= "2025-05-31").length ?? 0}件
          </span>
        </div>

        {(records?.length ?? 0) > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-muted">
                  <th className="py-2.5 pl-5 font-medium">案件</th>
                  <th className="py-2.5 font-medium">契約</th>
                  <th className="py-2.5 font-medium">請求済</th>
                  <th className="py-2.5 font-medium">未請求</th>
                  <th className="py-2.5 font-medium">粗利</th>
                  <th className="py-2.5 font-medium">締め</th>
                  <th className="py-2.5 pr-5 font-medium">リマインダー</th>
                </tr>
              </thead>
              <tbody>
                {records?.map((record) => (
                  <BillingRow
                    key={record.id}
                    record={record}
                    project={projectMap.get(record.projectId)}
                    onSave={(patch) => update.mutate({ id: record.id, patch })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={CircleDollarSign} title="請求データがありません" description="案件に契約金額を設定すると、未請求額と粗利が自動で見えます。" />
        )}
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink tabular-nums">{value}</p>
    </div>
  );
}

function BillingRow({
  record,
  project,
  onSave,
}: {
  record: {
    contractAmount: number;
    invoicedAmount: number;
    directCost: number;
    dueDate: string;
    closingReminder: string;
  };
  project?: { name: string; client: string | null; color: string };
  onSave: (patch: { invoicedAmount: number; closingReminder: string }) => void;
}) {
  const [invoiced, setInvoiced] = useState(record.invoicedAmount);
  const [memo, setMemo] = useState(record.closingReminder);
  const unbilled = record.contractAmount - invoiced;
  const gross = record.contractAmount - record.directCost;
  const ratio = Math.round((invoiced / record.contractAmount) * 100);

  return (
    <tr className="border-t border-line align-top">
      <td className="py-4 pl-5 pr-4 min-w-64">
        <span className="inline-flex items-center gap-2.5">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: project?.color ?? "#2563EB" }} />
          <span>
            <span className="block font-medium text-ink">{project?.name}</span>
            <span className="block text-xs text-ink-muted">{project?.client}</span>
          </span>
        </span>
      </td>
      <td className="py-4 pr-4 font-semibold tabular-nums text-ink">{yen(record.contractAmount)}</td>
      <td className="py-4 pr-4 min-w-40">
        <input
          type="number"
          value={invoiced}
          onChange={(e) => setInvoiced(Number(e.target.value))}
          className="h-9 w-32 rounded-lg border border-line bg-surface px-2 text-sm tabular-nums"
        />
        <div className="mt-2 w-32"><ProgressBar value={ratio} color={project?.color ?? "#2563EB"} /></div>
      </td>
      <td className="py-4 pr-4 tabular-nums text-ink-soft">{yen(unbilled)}</td>
      <td className="py-4 pr-4">
        <span className="font-semibold tabular-nums text-ink">{yen(gross)}</span>
        <span className="ml-2 text-xs text-ink-muted">{Math.round((gross / record.contractAmount) * 100)}%</span>
      </td>
      <td className="py-4 pr-4 whitespace-nowrap text-ink-soft">{formatDue(record.dueDate)}</td>
      <td className="py-4 pr-5 min-w-80">
        <div className="flex items-center gap-2">
          <input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 text-sm"
          />
          <button
            type="button"
            onClick={() => onSave({ invoicedAmount: invoiced, closingReminder: memo })}
            className="inline-flex items-center justify-center size-9 rounded-lg bg-brand-600 text-white hover:bg-brand-700"
            aria-label="請求情報を保存"
          >
            <Save className="size-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
