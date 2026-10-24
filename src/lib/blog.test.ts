import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAnonId, postContent, postErrors, readingMinutes, slugify } from './blog.ts';
import { inlineText, parseInline, parseMarkdown } from './markdown.ts';

const es = { title: 'Qué es el RPE', summary: 'Resumen', body: 'Texto' };

test('slugify quita tildes y signos', () => {
  assert.equal(slugify('¿Qué es el RPE y por qué importa?'), 'que-es-el-rpe-y-por-que-importa');
  assert.equal(slugify('  Ñandú  10K  '), 'nandu-10k');
  assert.equal(slugify('x'.repeat(100)).length, 80);
});

test('postContent usa el inglés solo si existe', () => {
  assert.equal(postContent({ es, en: null }, 'en').lang, 'es');
  assert.equal(postContent({ es, en: { ...es, title: 'What is RPE' } }, 'en').content.title, 'What is RPE');
  assert.equal(postContent({ es, en: { ...es, title: 'What is RPE' } }, 'es').lang, 'es');
});

test('postErrors valida dirección, título y topes', () => {
  assert.deepEqual(postErrors({ slug: 'que-es-el-rpe', es }), []);
  assert.equal(postErrors({ slug: 'Mal Slug', es }).length, 1);
  assert.equal(postErrors({ slug: 'ok', es: { ...es, title: ' ' } }).length, 1);
  assert.equal(postErrors({ slug: 'ok', es, en: { ...es, summary: 'x'.repeat(301) } }).length, 1);
});

test('readingMinutes', () => {
  assert.equal(readingMinutes(''), 1);
  assert.equal(readingMinutes('palabra '.repeat(600)), 3);
});

test('isAnonId', () => {
  assert.ok(isAnonId('0b6f3c1e-7a2d-4f55-9a43-2f1e4c7d9b10'));
  assert.ok(!isAnonId('corto'));
  assert.ok(!isAnonId('<script>alert(1)</script>-----'));
});

test('parseInline: negrita, cursiva y enlaces https o internos', () => {
  assert.deepEqual(parseInline('Hola **mundo** y *ya*'), [
    { t: 'text', v: 'Hola ' },
    { t: 'strong', c: [{ t: 'text', v: 'mundo' }] },
    { t: 'text', v: ' y ' },
    { t: 'em', c: [{ t: 'text', v: 'ya' }] },
  ]);
  assert.deepEqual(parseInline('[app](/plan)')[0], { t: 'link', href: '/plan', c: [{ t: 'text', v: 'app' }] });
  assert.equal(parseInline('[x](javascript:alert(1))')[0].t, 'text');
  assert.equal(parseInline('[x](http://inseguro.com)')[0].t, 'text');
});

test('parseMarkdown arma bloques', () => {
  const b = parseMarkdown([
    '## Título',
    'Una línea',
    'que sigue.',
    '',
    '- uno',
    '- dos',
    '',
    '1. primero',
    '2. segundo',
    '> cita',
    '',
    '| RPE | Sensación |',
    '|---|---|',
    '| 1 | Muy suave |',
    '| 10 | Máximo |',
  ].join('\n'));
  assert.deepEqual(b.map((x) => x.t), ['h2', 'p', 'ul', 'ol', 'quote', 'table']);
  assert.equal(inlineText((b[1] as { t: 'p'; c: Parameters<typeof inlineText>[0] }).c), 'Una línea que sigue.');
  const table = b[5] as { head: unknown[]; rows: unknown[][] };
  assert.equal(table.head.length, 2);
  assert.equal(table.rows.length, 2);
});

test('una línea con barras sin separador es un párrafo', () => {
  assert.equal(parseMarkdown('| solo esto |')[0].t, 'p');
});
