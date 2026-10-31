// Formato simple para los posts del blog. Se convierte en elementos de React (nunca en HTML crudo),
// así un texto pegado no puede meter scripts.
//   ## Título · ### Subtítulo · - lista · 1. lista numerada · > cita
//   | tabla | con | barras | (la segunda fila |---| separa el encabezado)
//   **negrita** · *cursiva* · [texto](https://enlace) · párrafos separados por una línea en blanco
//   ![descripción](https://imagen.png) en su propia línea: imagen
//   [[escala-rpe]] o [[carga]] en su propia línea: infografía interactiva (ver WIDGETS)

export type Inline =
  | { t: 'text'; v: string }
  | { t: 'strong'; c: Inline[] }
  | { t: 'em'; c: Inline[] }
  | { t: 'link'; href: string; c: Inline[] };

export type Block =
  | { t: 'p'; c: Inline[] }
  | { t: 'h2' | 'h3'; c: Inline[] }
  | { t: 'ul' | 'ol'; items: Inline[][] }
  | { t: 'quote'; c: Inline[] }
  | { t: 'table'; head: Inline[][]; rows: Inline[][][] }
  | { t: 'img'; src: string; alt: string }
  | { t: 'widget'; name: Widget };

/** Infografías interactivas que el texto puede insertar con [[nombre]]. */
export const WIDGETS = ['escala-rpe', 'carga'] as const;
export type Widget = (typeof WIDGETS)[number];
const isWidget = (v: string): v is Widget => (WIDGETS as readonly string[]).includes(v);

const IMG = /^\s*!\[([^\]]*)\]\((https:\/\/[^\s)]+)\)\s*$/;
const WIDGET = /^\s*\[\[([a-z0-9-]+)\]\]\s*$/;

const INLINE_RE = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\((https:\/\/[^\s)]+|\/[^\s)]*)\)/g;

export function parseInline(s: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of s.matchAll(INLINE_RE)) {
    if (m.index > last) out.push({ t: 'text', v: s.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ t: 'strong', c: parseInline(m[1]) });
    else if (m[2] !== undefined) out.push({ t: 'em', c: parseInline(m[2]) });
    else out.push({ t: 'link', href: m[4], c: parseInline(m[3]) });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ t: 'text', v: s.slice(last) });
  return out;
}

const UL = /^\s*[-*]\s+(.*)$/;
const OL = /^\s*\d+[.)]\s+(.*)$/;
const ROW = /^\s*\|(.*)\|\s*$/;
const SEP = /^\s*\|(\s*:?-{2,}:?\s*\|)+\s*$/;

const cells = (line: string) => line.trim().replace(/^\||\|$/g, '').split('|').map((c) => parseInline(c.trim()));

export function parseMarkdown(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    const img = IMG.exec(line);
    if (img) { out.push({ t: 'img', alt: img[1].trim(), src: img[2] }); i++; continue; }

    const w = WIDGET.exec(line);
    if (w && isWidget(w[1])) { out.push({ t: 'widget', name: w[1] }); i++; continue; }

    const h = /^(#{2,3})\s+(.*)$/.exec(line);
    if (h) { out.push({ t: h[1].length === 2 ? 'h2' : 'h3', c: parseInline(h[2].trim()) }); i++; continue; }

    if (UL.test(line) || OL.test(line)) {
      const re = UL.test(line) ? UL : OL;
      const items: Inline[][] = [];
      while (i < lines.length && re.test(lines[i])) items.push(parseInline(re.exec(lines[i])![1].trim())), i++;
      out.push({ t: re === UL ? 'ul' : 'ol', items });
      continue;
    }

    if (/^\s*>/.test(line)) {
      const parts: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) parts.push(lines[i].replace(/^\s*>\s?/, '').trim()), i++;
      out.push({ t: 'quote', c: parseInline(parts.join(' ')) });
      continue;
    }

    if (ROW.test(line) && i + 1 < lines.length && SEP.test(lines[i + 1])) {
      const head = cells(line);
      i += 2;
      const rows: Inline[][][] = [];
      while (i < lines.length && ROW.test(lines[i])) rows.push(cells(lines[i])), i++;
      out.push({ t: 'table', head, rows });
      continue;
    }

    // Párrafo: la primera línea siempre entra (así un [[nombre]] desconocido queda como texto).
    const parts: string[] = [line.trim()];
    i++;
    while (
      i < lines.length && lines[i].trim()
      && !IMG.test(lines[i]) && !isWidget(WIDGET.exec(lines[i])?.[1] ?? '')
      && !/^#{2,3}\s/.test(lines[i]) && !UL.test(lines[i]) && !OL.test(lines[i]) && !/^\s*>/.test(lines[i])
      && !(ROW.test(lines[i]) && i + 1 < lines.length && SEP.test(lines[i + 1]))
    ) parts.push(lines[i].trim()), i++;
    out.push({ t: 'p', c: parseInline(parts.join(' ')) });
  }
  return out;
}

/** Texto plano (para contar palabras o armar descripciones). */
export function inlineText(c: Inline[]): string {
  return c.map((x) => (x.t === 'text' ? x.v : inlineText(x.c))).join('');
}
