import { Fragment } from "react";

/** 太字 (**text**) のみ対応するインラインパーサ */
function inline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={`${keyPrefix}-${i}`} className="font-semibold text-ink">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={`${keyPrefix}-${i}`}>{p}</Fragment>
    ),
  );
}

type Block =
  | { kind: "h1" | "h2" | "h3" | "p"; text: string }
  | { kind: "ul" | "ol"; items: string[] };

function parse(source: string): Block[] {
  const blocks: Block[] = [];
  let list: { kind: "ul" | "ol"; items: string[] } | null = null;
  const flush = () => {
    if (list) {
      blocks.push(list);
      list = null;
    }
  };

  for (const raw of source.split("\n")) {
    const line = raw.trimEnd();
    if (line.startsWith("### ")) {
      flush();
      blocks.push({ kind: "h3", text: line.slice(4) });
    } else if (line.startsWith("## ")) {
      flush();
      blocks.push({ kind: "h2", text: line.slice(3) });
    } else if (line.startsWith("# ")) {
      flush();
      blocks.push({ kind: "h1", text: line.slice(2) });
    } else if (/^\d+\.\s/.test(line)) {
      if (!list || list.kind !== "ol") {
        flush();
        list = { kind: "ol", items: [] };
      }
      list.items.push(line.replace(/^\d+\.\s/, ""));
    } else if (line.startsWith("- ") || line.startsWith("・")) {
      if (!list || list.kind !== "ul") {
        flush();
        list = { kind: "ul", items: [] };
      }
      list.items.push(line.replace(/^(-\s|・)/, ""));
    } else if (line === "") {
      flush();
    } else {
      flush();
      blocks.push({ kind: "p", text: line });
    }
  }
  flush();
  return blocks;
}

/**
 * 軽量 Markdown レンダラ (docs/04 §5: 簡易表示)。
 * 見出し / 箇条書き / 番号付き / 段落 / 太字 に対応。
 */
export function Markdown({ source }: { source: string }) {
  const blocks = parse(source);
  return (
    <div>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "h1":
            return (
              <h1 key={i} className="text-xl font-bold text-ink mt-2 mb-3">
                {inline(b.text, `h1-${i}`)}
              </h1>
            );
          case "h2":
            return (
              <h2 key={i} className="text-base font-bold text-ink mt-5 mb-2">
                {inline(b.text, `h2-${i}`)}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="text-sm font-semibold text-ink mt-4 mb-1">
                {inline(b.text, `h3-${i}`)}
              </h3>
            );
          case "ol":
            return (
              <ol key={i} className="list-decimal pl-5 space-y-1 my-2 text-sm text-ink-soft">
                {b.items.map((it, j) => (
                  <li key={j}>{inline(it, `ol-${i}-${j}`)}</li>
                ))}
              </ol>
            );
          case "ul":
            return (
              <ul key={i} className="list-disc pl-5 space-y-1 my-2 text-sm text-ink-soft">
                {b.items.map((it, j) => (
                  <li key={j}>{inline(it, `ul-${i}-${j}`)}</li>
                ))}
              </ul>
            );
          default:
            return (
              <p key={i} className="text-sm text-ink-soft leading-relaxed my-1.5">
                {inline(b.text, `p-${i}`)}
              </p>
            );
        }
      })}
    </div>
  );
}
