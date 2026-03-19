/** Shared formatting utilities used by metrics, report, and AI modules. */

export function fmtWan(value: number) {
  return value.toFixed(1);
}

export function fmtPct(value: number | null) {
  return (value ?? 0).toFixed(1);
}

export function fmtYuan(value: number) {
  return Math.round(value).toString();
}

export function pctOrDash(value: number | null) {
  return value === null ? "—" : `${fmtPct(value)}%`;
}

export function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function htmlToText(html: string) {
  return html
    .replace(/<\/(h2|h3|p|li|tr|section|div|article|table|thead|tbody|ul)>/g, "\n")
    .replace(/<br\s*\/?/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}
