// Sürüm notlarındaki (GitHub Markdown) basit yapıyı bloklara ayırır: başlık, madde, paragraf.
// Metin hiçbir zaman HTML olarak sayfaya basılmaz; React bileşenleri düz metin olarak çizer.

export type Inline = { text: string; bold?: boolean; code?: boolean };
export type Block =
  | { kind: 'heading'; parts: Inline[] }
  | { kind: 'item'; parts: Inline[] }
  | { kind: 'text'; parts: Inline[] };

/** **kalın** ve `kod` işaretlerini parçalara ayırır */
export function parseInline(line: string): Inline[] {
  const parts: Inline[] = [];
  const re = /\*\*(.+?)\*\*|`([^`]+)`/g;
  let last = 0;
  for (const m of line.matchAll(re)) {
    if (m.index > last) parts.push({ text: line.slice(last, m.index) });
    if (m[1] !== undefined) parts.push({ text: m[1], bold: true });
    else parts.push({ text: m[2] ?? '', code: true });
    last = m.index + m[0].length;
  }
  if (last < line.length) parts.push({ text: line.slice(last) });
  return parts;
}

export function parseNotes(md: string): Block[] {
  const blocks: { kind: Block['kind']; text: string }[] = [];
  let current: { kind: Block['kind']; text: string } | null = null;
  for (const raw of md.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      current = null;
      continue;
    }
    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    const item = /^\s*[-*]\s+(.*)$/.exec(line);
    if (heading) {
      current = null;
      blocks.push({ kind: 'heading', text: heading[1] ?? '' });
    } else if (item) {
      current = { kind: 'item', text: item[1] ?? '' };
      blocks.push(current);
    } else if (current) {
      // Alt satıra taşan madde ya da paragraf devamı
      current.text += ` ${line.trim()}`;
    } else {
      current = { kind: 'text', text: line.trim() };
      blocks.push(current);
    }
  }
  return blocks.map((b) => ({ kind: b.kind, parts: parseInline(b.text) }));
}
