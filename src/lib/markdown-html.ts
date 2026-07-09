/**
 * ドキュメントエディタ用の Markdown ⇄ HTML 変換。
 * 対応記法は Markdown レンダラ (components/shared/markdown.tsx) と同じ集合に限定する:
 * 見出し(h1-h3) / 箇条書き / 番号付きリスト / 太字 / 段落。
 * 左ペイン(見た目は普通の文章)を contentEditable で編集し、
 * 右ペインに常に同期した Markdown ソースを表示するための橋渡し。
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** **太字** をインライン HTML (<strong>) に変換 */
function inlineToHtml(text: string): string {
  const escaped = escapeHtml(text);
  return escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

type Block =
  | { kind: "h1" | "h2" | "h3" | "p"; text: string }
  | { kind: "ul" | "ol"; items: string[] };

function parseMarkdown(source: string): Block[] {
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

/** Markdown 文字列 → contentEditable に流し込む HTML */
export function markdownToHtml(source: string): string {
  const blocks = parseMarkdown(source);
  if (blocks.length === 0) return "";
  return blocks
    .map((b) => {
      switch (b.kind) {
        case "h1":
          return `<h1>${inlineToHtml(b.text)}</h1>`;
        case "h2":
          return `<h2>${inlineToHtml(b.text)}</h2>`;
        case "h3":
          return `<h3>${inlineToHtml(b.text)}</h3>`;
        case "ul":
          return `<ul>${b.items.map((it) => `<li>${inlineToHtml(it)}</li>`).join("")}</ul>`;
        case "ol":
          return `<ol>${b.items.map((it) => `<li>${inlineToHtml(it)}</li>`).join("")}</ol>`;
        default:
          return `<p>${b.text ? inlineToHtml(b.text) : "<br>"}</p>`;
      }
    })
    .join("");
}

function inlineToMarkdown(node: ChildNode): string {
  let out = "";
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      out += child.textContent ?? "";
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      const tag = el.tagName.toLowerCase();
      if (tag === "b" || tag === "strong") {
        out += `**${inlineToMarkdown(el)}**`;
      } else if (tag === "br") {
        out += "\n";
      } else {
        out += inlineToMarkdown(el);
      }
    }
  });
  return out;
}

/** contentEditable の HTML → 保存用 Markdown 文字列 */
export function htmlToMarkdown(html: string): string {
  if (typeof window === "undefined") return "";
  const container = document.createElement("div");
  container.innerHTML = html;
  const lines: string[] = [];

  container.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) lines.push(text);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    switch (tag) {
      case "h1":
        lines.push(`# ${inlineToMarkdown(el).trim()}`);
        break;
      case "h2":
        lines.push(`## ${inlineToMarkdown(el).trim()}`);
        break;
      case "h3":
        lines.push(`### ${inlineToMarkdown(el).trim()}`);
        break;
      case "ul":
        el.querySelectorAll(":scope > li").forEach((li) => {
          lines.push(`- ${inlineToMarkdown(li).trim()}`);
        });
        break;
      case "ol":
        el.querySelectorAll(":scope > li").forEach((li, i) => {
          lines.push(`${i + 1}. ${inlineToMarkdown(li).trim()}`);
        });
        break;
      case "div":
      case "p":
      default: {
        const text = inlineToMarkdown(el).trim();
        lines.push(text);
        break;
      }
    }
    lines.push(""); // ブロック間は空行区切り
  });

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
