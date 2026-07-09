import { ArrowUpRight } from "lucide-react";
import { EXTERNAL_TOOLS } from "@/lib/external-tools";

/** 外部ツールへのリンクカードをグリッド表示するだけの軽量な一覧。深い連携はしない。 */
export function ToolsGrid() {
  if (EXTERNAL_TOOLS.length === 0) {
    return (
      <div className="data-card rounded-2xl p-10 text-center">
        <p className="text-sm text-ink-soft">登録されている外部ツールはありません。</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {EXTERNAL_TOOLS.map((tool) => {
        const Icon = tool.icon;
        return (
          <a
            key={tool.id}
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group data-card flex flex-col rounded-2xl p-5 hover:shadow-pop transition-shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className="inline-flex items-center justify-center size-11 rounded-xl shrink-0"
                style={{ backgroundColor: `${tool.color}1A`, color: tool.color }}
              >
                <Icon className="size-5" />
              </span>
              <ArrowUpRight className="size-4 text-ink-muted group-hover:text-brand-600 transition-colors shrink-0" />
            </div>
            <h3 className="mt-3 text-base font-semibold text-ink">{tool.name}</h3>
            <p className="mt-1 text-sm text-ink-soft leading-relaxed line-clamp-2">
              {tool.description}
            </p>
            <p className="mt-3 text-xs text-brand-600 truncate">{tool.url}</p>
          </a>
        );
      })}
    </div>
  );
}
