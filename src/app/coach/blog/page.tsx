'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { Gate } from '@/components/Gate';
import { TopNav } from '@/components/TopNav';
import { useAuth } from '@/components/AuthProvider';
import { useDialogs } from '@/components/Dialogs';
import { Markdown } from '@/components/blog/Markdown';
import { db } from '@/lib/firebase';
import { listAllPosts } from '@/lib/blogData';
import { SUGGESTED_POSTS } from '@/content/posts';
import { POST_LIMITS, postErrors, slugify, type Audience, type Post, type PostContent } from '@/lib/blog';
import '../../site.css';
import '../../blog/blog.css';

// Blog del club desde el panel del coach (solo español): escribir, publicar y enviar el enlace por correo.

const EMPTY: PostContent = { title: '', summary: '', body: '' };
const AUDIENCE: Record<Audience, string> = { atletas: 'los atletas', boletin: 'el boletín' };

const updatedTime = (p: Post) => (p.updatedAt as { toDate?(): Date } | undefined)?.toDate?.().getTime() ?? 0;

export default function CoachBlogPage() {
  return (
    <Gate role="admin">
      {() => (
        <>
          <TopNav />
          <BlogAdmin />
        </>
      )}
    </Gate>
  );
}

function BlogAdmin() {
  const { toast } = useDialogs();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [editing, setEditing] = useState<Post | 'new' | null>(null);

  const load = useCallback(async () => {
    const all = await listAllPosts();
    setPosts(all.sort((a, b) => updatedTime(b) - updatedTime(a)));
    return all;
  }, []);
  useEffect(() => { load().catch(() => setPosts([])); }, [load]);

  async function reopen(slug: string | null) {
    const all = await load();
    setEditing(slug ? all.find((p) => p.slug === slug) ?? null : null);
  }

  async function loadSuggested(slug: string) {
    const sp = SUGGESTED_POSTS.find((p) => p.slug === slug)!;
    try {
      await setDoc(doc(db(), 'posts', sp.slug), {
        slug: sp.slug, es: sp.es, en: sp.en, private: sp.private, status: 'draft', likes: 0,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(), publishedAt: null,
      });
      toast('Borrador cargado: revísalo y publícalo cuando quieras');
      await reopen(sp.slug);
    } catch {
      toast('No se pudo cargar. Revisa que las reglas de Firestore estén publicadas.', 'error');
    }
  }

  const suggested = posts ? SUGGESTED_POSTS.filter((sp) => !posts.some((p) => p.slug === sp.slug)) : [];

  return (
    <main>
      <header className="banner"><h2>Blog</h2><p>Escribe, publica y envía por correo</p></header>
      <div className="wrap">
        {editing ? (
          <Editor key={editing === 'new' ? 'new' : editing.slug} initial={editing === 'new' ? null : editing} onDone={reopen} />
        ) : (
          <>
            <div className="actions" style={{ justifyContent: 'space-between' }}>
              <h3 className="section-title" style={{ margin: 0 }}>Posts</h3>
              <button type="button" className="btn small" onClick={() => setEditing('new')}>Nuevo post</button>
            </div>
            <p className="section-sub">
              Los públicos los lee cualquiera en <Link href="/blog">/blog</Link>; los «Solo atletas», quien entra con su cuenta.
              Los me gusta llegan de atletas y de visitantes (con tope por conexión). No hay comentarios.
            </p>
            {posts === null ? <p className="loading">Cargando…</p> : posts.length === 0 ? (
              <p className="section-sub">Aún no hay posts. Crea el primero.</p>
            ) : (
              <ul className="pending-list">
                {posts.map((p) => (
                  <li key={p.slug}>
                    <span>
                      <b>{p.es.title}</b>
                      <br />
                      <small>
                        {p.status === 'published' ? 'Publicado' : 'Borrador'}
                        {p.private && ' · Solo atletas'}
                        {p.en?.title && ' · ES/EN'}
                        {' · '}♥ {p.likes ?? 0}
                        {p.sends?.length ? ` · enviado ${p.sends.length} ${p.sends.length === 1 ? 'vez' : 'veces'}` : ''}
                      </small>
                    </span>
                    <span className="actions">
                      <button type="button" className="btn small secondary" onClick={() => setEditing(p)}>Editar</button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {suggested.length > 0 && (
              <>
                <h3 className="section-title">Borradores sugeridos</h3>
                <ul className="pending-list">
                  {suggested.map((sp) => (
                    <li key={sp.slug}>
                      <span><b>{sp.es.title}</b><br /><small>{sp.es.summary}</small></span>
                      <span className="actions">
                        <button type="button" className="btn small" onClick={() => loadSuggested(sp.slug)}>Cargar borrador</button>
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function ContentFields({ value, onChange, lang }: { value: PostContent; onChange: (c: PostContent) => void; lang: 'es' | 'en' }) {
  const en = lang === 'en';
  return (
    <div className="form">
      <label className="field">
        <span>Título{en && ' en inglés'}</span>
        <input value={value.title} maxLength={POST_LIMITS.title} onChange={(e) => onChange({ ...value, title: e.target.value })} lang={lang} />
      </label>
      <label className="field">
        <span>Resumen{en && ' en inglés'}</span>
        <textarea value={value.summary} maxLength={POST_LIMITS.summary} onChange={(e) => onChange({ ...value, summary: e.target.value })} lang={lang} />
        <small>Una o dos frases. Va en la lista del blog, al compartir el enlace y en el correo.</small>
      </label>
      <label className="field">
        <span>Texto{en && ' en inglés'}</span>
        <textarea
          value={value.body}
          maxLength={POST_LIMITS.body}
          onChange={(e) => onChange({ ...value, body: e.target.value })}
          lang={lang}
          style={{ minHeight: '18rem', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '.92rem' }}
        />
        <small>
          Formato: línea en blanco entre párrafos · <code>## Título</code> · <code>### Subtítulo</code> · <code>- lista</code> ·{' '}
          <code>1. lista</code> · <code>&gt; cita</code> · <code>**negrita**</code> · <code>*cursiva*</code> ·{' '}
          <code>[texto](https://…)</code> · tablas con <code>| a | b |</code> y una fila <code>|---|---|</code>.
          <br />En su propia línea: <code>![descripción](https://…/imagen.png)</code> para una imagen,{' '}
          <code>[[escala-rpe]]</code> para la escala interactiva y <code>[[carga]]</code> para la calculadora de carga.
        </small>
      </label>
    </div>
  );
}

function Editor({ initial, onDone }: { initial: Post | null; onDone: (slug: string | null) => void }) {
  const { authHeaders } = useAuth();
  const { confirm, toast } = useDialogs();
  const isNew = !initial;
  const [es, setEs] = useState<PostContent>(initial?.es ?? EMPTY);
  const [en, setEn] = useState<PostContent>(initial?.en ?? EMPTY);
  const [priv, setPriv] = useState(initial?.private ?? false);
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(false);
  const [preview, setPreview] = useState<'es' | 'en' | null>(null);
  const [busy, setBusy] = useState('');
  const published = initial?.status === 'published';
  const hasEn = !!(en.title.trim() || en.summary.trim() || en.body.trim());
  const effectiveSlug = isNew && !slugTouched ? slugify(es.title) : slug;
  // Si el post vino de un borrador sugerido y ese texto cambió en la app, se puede traer la versión nueva.
  const suggestion = SUGGESTED_POSTS.find((sp) => sp.slug === initial?.slug);
  const suggestionChanged = !!suggestion && (suggestion.es.body !== es.body || suggestion.en.body !== en.body);

  function data() {
    return { slug: effectiveSlug, es, en: hasEn ? en : null };
  }

  /** Guarda lo escrito. `extra` cambia el estado (publicar o pasar a borrador). */
  async function save(extra: Record<string, unknown> = {}): Promise<string | null> {
    const d = data();
    const errs = postErrors(d);
    if (errs.length) { toast(errs[0], 'error'); return null; }
    const ref = doc(db(), 'posts', d.slug);
    try {
      if (isNew) {
        if ((await getDoc(ref)).exists()) { toast('Ya hay un post con esa dirección. Cámbiala.', 'error'); return null; }
        await setDoc(ref, {
          ...d, private: priv, status: 'draft', likes: 0,
          createdAt: serverTimestamp(), updatedAt: serverTimestamp(), publishedAt: null,
        });
        if (Object.keys(extra).length) await updateDoc(ref, { ...extra, updatedAt: serverTimestamp() });
      } else {
        await updateDoc(ref, { es: d.es, en: d.en, private: priv, ...extra, updatedAt: serverTimestamp() });
      }
      return d.slug;
    } catch {
      toast('No se pudo guardar. Revisa que las reglas de Firestore estén publicadas.', 'error');
      return null;
    }
  }

  async function onSave() {
    setBusy('save');
    const s = await save();
    setBusy('');
    if (s) { toast('Guardado'); onDone(s); }
  }

  async function onPublish() {
    if (!await confirm({
      title: 'Publicar post',
      message: priv
        ? 'Quedará visible en el blog solo para quienes entran con su cuenta. Luego puedes enviarlo por correo.'
        : 'Quedará visible para cualquiera en trainingplease.app/blog. Luego puedes enviarlo por correo.',
      confirmLabel: 'Publicar',
    })) return;
    setBusy('publish');
    const s = await save({ status: 'published', publishedAt: initial?.publishedAt ?? serverTimestamp() });
    setBusy('');
    if (s) { toast('Publicado'); onDone(s); }
  }

  async function onUnpublish() {
    if (!await confirm({
      title: 'Pasar a borrador',
      message: 'El post deja de verse en el blog. Los enlaces que ya enviaste mostrarán «no encontramos este post».',
      confirmLabel: 'Pasar a borrador',
      danger: true,
    })) return;
    setBusy('publish');
    const s = await save({ status: 'draft' });
    setBusy('');
    if (s) { toast('Pasó a borrador'); onDone(s); }
  }

  async function onDelete() {
    if (!initial) return;
    if (!await confirm({
      title: 'Eliminar post',
      message: `¿Eliminar «${initial.es.title}»? No se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
    })) return;
    try {
      await deleteDoc(doc(db(), 'posts', initial.slug));
      toast('Post eliminado');
      onDone(null);
    } catch {
      toast('No se pudo eliminar.', 'error');
    }
  }

  async function onSend(audience: Audience) {
    if (!initial) return;
    const before = (initial.sends ?? []).filter((s) => s.audience === audience);
    const last = before.at(-1);
    const message = [
      audience === 'atletas'
        ? 'Cada atleta con consentimiento recibe un correo, en su idioma, con el resumen y el enlace al post.'
        : 'Se envía un broadcast de Resend, en español, a todo el segmento del boletín, con el resumen y el enlace.',
      last ? `Ya lo enviaste a ${AUDIENCE[audience]} el ${new Date(last.at).toLocaleString('es-PE')}: lo recibirían otra vez.` : '',
      'Un correo enviado no se puede retirar.',
    ].filter(Boolean).join(' ');
    if (!await confirm({ title: `Enviar a ${AUDIENCE[audience]}`, message, confirmLabel: 'Enviar' })) return;
    setBusy(audience);
    try {
      const saved = await save();
      if (!saved) return;
      const res = await fetch('/api/admin/blog/send', {
        method: 'POST', headers: await authHeaders(), body: JSON.stringify({ slug: initial.slug, audience }),
      });
      const r = await res.json().catch(() => ({}));
      if (!res.ok) { toast(r.error ?? 'No se pudo enviar.', 'error'); return; }
      toast(audience === 'atletas' ? `Enviado a ${r.count} ${r.count === 1 ? 'atleta' : 'atletas'}` : 'Boletín enviado');
      onDone(initial.slug);
    } catch {
      toast('No se pudo enviar. Revisa tu conexión.', 'error');
    } finally {
      setBusy('');
    }
  }

  return (
    <>
      <p style={{ margin: '0 0 1rem' }}>
        <button type="button" className="btn small secondary" onClick={() => onDone(initial?.slug ?? null)}>← Volver a los posts</button>
      </p>
      <section className="panel form">
        <h3>{isNew ? 'Nuevo post' : 'Editar post'}</h3>
        {suggestion && suggestionChanged && !published && (
          <p className="note">
            Hay una versión sugerida más nueva de este post.{' '}
            <button type="button" className="btn small secondary" onClick={() => { setEs(suggestion.es); setEn(suggestion.en); }}>
              Usar la versión sugerida
            </button>{' '}
            Reemplaza el texto en español e inglés; luego guarda.
          </p>
        )}
        <ContentFields value={es} onChange={setEs} lang="es" />

        <details style={{ marginTop: '1rem' }} open={!!initial?.en}>
          <summary><b>Versión en inglés (opcional)</b></summary>
          <p className="note">Si la dejas vacía, quien lee en inglés ve el post en español con un aviso.</p>
          <ContentFields value={en} onChange={setEn} lang="en" />
        </details>

        <div className="form-row" style={{ marginTop: '1rem' }}>
          <label className="field">
            <span>Dirección</span>
            <input
              value={effectiveSlug}
              disabled={!isNew}
              maxLength={POST_LIMITS.slug}
              onChange={(e) => { setSlugTouched(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); }}
            />
            <small>trainingplease.app/blog/{effectiveSlug || '…'}{!isNew && ' · no cambia una vez creado, para no romper enlaces.'}</small>
          </label>
          <label className="check">
            <input type="checkbox" checked={priv} onChange={(e) => setPriv(e.target.checked)} />
            <span>Solo atletas: lo ven solo quienes entran con su cuenta y no se puede enviar al boletín.</span>
          </label>
        </div>

        <div className="actions" style={{ marginTop: '1.2rem' }}>
          <button type="button" className="btn" disabled={!!busy} onClick={onSave}>{busy === 'save' ? 'Guardando…' : 'Guardar'}</button>
          {published
            ? <button type="button" className="btn secondary" disabled={!!busy} onClick={onUnpublish}>Pasar a borrador</button>
            : <button type="button" className="btn secondary" disabled={!!busy} onClick={onPublish}>{busy === 'publish' ? 'Publicando…' : 'Publicar'}</button>}
          <button type="button" className="btn small secondary" onClick={() => setPreview(preview === 'es' ? null : 'es')}>
            {preview === 'es' ? 'Cerrar vista previa' : 'Vista previa'}
          </button>
          {hasEn && (
            <button type="button" className="btn small secondary" onClick={() => setPreview(preview === 'en' ? null : 'en')}>
              {preview === 'en' ? 'Cerrar EN' : 'Vista previa EN'}
            </button>
          )}
          {!isNew && <Link href={`/blog/${initial.slug}`} target="_blank" className="btn small secondary">Ver en el blog</Link>}
          {!isNew && <button type="button" className="btn small danger" onClick={onDelete}>Eliminar</button>}
        </div>
      </section>

      {preview && (
        <section className="site b-preview" lang={preview}>
          <div className="b-article b-narrow">
            <h1>{(preview === 'en' ? en : es).title || 'Sin título'}</h1>
            {(preview === 'en' ? en : es).summary && <p className="b-lead">{(preview === 'en' ? en : es).summary}</p>}
            <Markdown source={(preview === 'en' ? en : es).body} className="b-body" lang={preview} />
          </div>
        </section>
      )}

      {!isNew && (
        <section className="panel" style={{ marginTop: '1.6rem' }}>
          <h3>Enviar por correo</h3>
          {!published ? (
            <p className="note">Publica el post para poder enviarlo.</p>
          ) : (
            <>
              <p className="note">El correo lleva el título, el resumen y un botón al post. Se guarda lo escrito antes de enviar.</p>
              <div className="actions">
                <button type="button" className="btn" disabled={!!busy} onClick={() => onSend('atletas')}>
                  {busy === 'atletas' ? 'Enviando…' : 'Enviar a los atletas'}
                </button>
                <button type="button" className="btn secondary" disabled={!!busy || priv} onClick={() => onSend('boletin')}
                  title={priv ? 'Un post solo para atletas no va al boletín' : undefined}>
                  {busy === 'boletin' ? 'Enviando…' : 'Enviar al boletín'}
                </button>
              </div>
            </>
          )}
          {!!initial.sends?.length && (
            <ul className="note" style={{ marginTop: '.8rem' }}>
              {initial.sends.map((s) => (
                <li key={s.at}>
                  {new Date(s.at).toLocaleString('es-PE')} · {AUDIENCE[s.audience]}{s.audience === 'atletas' ? ` (${s.count})` : ''}
                </li>
              ))}
            </ul>
          )}
          <p className="note">♥ {initial.likes ?? 0} me gusta</p>
        </section>
      )}
    </>
  );
}
