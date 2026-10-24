import { Fragment } from 'react';
import { parseMarkdown, type Inline } from '@/lib/markdown';

function Spans({ c }: { c: Inline[] }) {
  return (
    <>
      {c.map((x, i) => {
        if (x.t === 'text') return <Fragment key={i}>{x.v}</Fragment>;
        if (x.t === 'strong') return <strong key={i}><Spans c={x.c} /></strong>;
        if (x.t === 'em') return <em key={i}><Spans c={x.c} /></em>;
        const external = x.href.startsWith('https://');
        return (
          <a key={i} href={x.href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
            <Spans c={x.c} />
          </a>
        );
      })}
    </>
  );
}

/** Texto de un post con el formato simple de markdown.ts. */
export function Markdown({ source, className }: { source: string; className?: string }) {
  return (
    <div className={className}>
      {parseMarkdown(source).map((b, i) => {
        switch (b.t) {
          case 'h2': return <h2 key={i}><Spans c={b.c} /></h2>;
          case 'h3': return <h3 key={i}><Spans c={b.c} /></h3>;
          case 'quote': return <blockquote key={i}><Spans c={b.c} /></blockquote>;
          case 'ul': return <ul key={i}>{b.items.map((it, j) => <li key={j}><Spans c={it} /></li>)}</ul>;
          case 'ol': return <ol key={i}>{b.items.map((it, j) => <li key={j}><Spans c={it} /></li>)}</ol>;
          case 'table':
            return (
              <div key={i} className="md-table">
                <table>
                  <thead><tr>{b.head.map((h, j) => <th key={j} scope="col"><Spans c={h} /></th>)}</tr></thead>
                  <tbody>{b.rows.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}><Spans c={c} /></td>)}</tr>)}</tbody>
                </table>
              </div>
            );
          default: return <p key={i}><Spans c={b.c} /></p>;
        }
      })}
    </div>
  );
}
