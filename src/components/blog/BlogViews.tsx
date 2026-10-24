'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useDialogs } from '@/components/Dialogs';
import { useI18n } from '@/components/I18nProvider';
import { SiteFooter, SiteHeader } from '@/components/site/SiteChrome';
import { Markdown } from '@/components/blog/Markdown';
import { postContent, readingMinutes, type Post } from '@/lib/blog';
import {
  anonId, anonLiked, fetchPost, formatPostDate, listPosts, myLike, setAnonLiked, type PostResult,
} from '@/lib/blogData';

// Blog público: lista y post. Los textos de la interfaz siguen el idioma del visitante; el del post,
// su versión en inglés si existe.

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="site">
      <SiteHeader />
      <main className="b-main">{children}</main>
      <SiteFooter />
    </div>
  );
}

/** La sesión ya se resolvió (con cuenta o sin ella) y sabemos si es atleta o coach del club. */
function useMember() {
  const { state } = useAuth();
  return { settled: state.status !== 'loading', member: state.status === 'ready', state };
}

export function BlogIndex() {
  const { t, lang } = useI18n();
  const { settled, member } = useMember();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!settled) return;
    let alive = true;
    listPosts(member).then((p) => alive && setPosts(p)).catch(() => alive && setError(true));
    return () => { alive = false; };
  }, [settled, member]);

  return (
    <Shell>
      <section className="b-head">
        <div className="s-container b-narrow">
          <p className="s-kicker">Training Please</p>
          <h1>{t.blog.title}</h1>
          <p className="b-lead">{t.blog.intro}</p>
        </div>
      </section>
      <section className="s-container b-narrow b-list" aria-busy={!posts && !error}>
        {error ? <p className="b-note">{t.blog.loadError}</p>
          : !posts ? <p className="b-note">{t.common.loading}</p>
          : !posts.length ? <p className="b-note">{t.blog.empty}</p>
          : (
            <>
              {posts.some((p) => p.private) && <p className="b-note">{t.blog.privateHint}</p>}
              <ul>
                {posts.map((p) => {
                  const { content } = postContent(p, lang);
                  return (
                    <li key={p.slug}>
                      <Link href={`/blog/${p.slug}`} className="b-card">
                        <p className="b-meta">
                          {formatPostDate(p, lang)} · {t.blog.minutes(readingMinutes(content.body))}
                          {p.private && <span className="b-badge">{t.blog.privateBadge}</span>}
                        </p>
                        <h2>{content.title}</h2>
                        {content.summary && <p>{content.summary}</p>}
                        <p className="b-meta">♥ {t.blog.likes(p.likes ?? 0)}</p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
      </section>
    </Shell>
  );
}

export function BlogPost({ slug }: { slug: string }) {
  const { t, lang, setLang } = useI18n();
  const { settled, member } = useMember();
  const [res, setRes] = useState<PostResult | null>(null);
  const [error, setError] = useState(false);

  // El correo del boletín enlaza la versión en inglés con ?lang=en.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('lang') === 'en') setLang('en');
  }, [setLang]);

  useEffect(() => {
    if (!settled) return;
    let alive = true;
    fetchPost(slug).then((r) => alive && setRes(r)).catch(() => alive && setError(true));
    return () => { alive = false; };
  }, [slug, settled, member]);

  const back = <p className="b-back"><Link href="/blog">← {t.blog.back}</Link></p>;

  if (error || !res || 'missing' in res || 'locked' in res) {
    const locked = res && 'locked' in res && !member;
    return (
      <Shell>
        <section className="s-container b-narrow b-article">
          {back}
          {error ? <p className="b-note">{t.blog.loadError}</p>
            : !res ? <p className="b-note">{t.common.loading}</p>
            : locked ? (
              <div className="b-locked">
                <h1>{t.blog.lockedTitle}</h1>
                <p>{t.blog.lockedText}</p>
                <Link className="s-btn primary" href={`/entrar?next=/blog/${slug}`}>{t.blog.lockedCta}</Link>
              </div>
            ) : <p className="b-note">{t.blog.notFound}</p>}
        </section>
      </Shell>
    );
  }

  const p = res.post;
  const { content, lang: used } = postContent(p, lang);
  return (
    <Shell>
      <article className="s-container b-narrow b-article" lang={used}>
        {back}
        <p className="b-meta">
          {formatPostDate(p, lang)} · {t.blog.minutes(readingMinutes(content.body))}
          {p.private && <span className="b-badge">{t.blog.privateBadge}</span>}
          {p.status !== 'published' && <span className="b-badge draft">Borrador</span>}
        </p>
        <h1>{content.title}</h1>
        {content.summary && <p className="b-lead">{content.summary}</p>}
        {lang === 'en' && used === 'es' && <p className="b-note" lang="en">{t.blog.onlySpanish}</p>}
        <Markdown source={content.body} className="b-body" lang={used} />
        <PostActions post={p} />
        {back}
      </article>
    </Shell>
  );
}

function PostActions({ post }: { post: Post }) {
  const { t } = useI18n();
  const { toast } = useDialogs();
  const { state, authHeaders } = useAuth();
  const uid = state.status === 'ready' ? state.user.uid : null;
  const [likes, setLikes] = useState(post.likes ?? 0);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);
  const canLike = post.status === 'published';

  useEffect(() => {
    if (uid) myLike(post.slug, uid).then(setLiked).catch(() => {});
    else setLiked(anonLiked(post.slug));
  }, [uid, post.slug]);

  async function toggle() {
    const next = !liked;
    setBusy(true);
    setLiked(next);
    setLikes((n) => Math.max(0, n + (next ? 1 : -1)));
    if (!uid) setAnonLiked(post.slug, next);
    try {
      const res = await fetch('/api/blog/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(uid ? await authHeaders() : {}) },
        body: JSON.stringify({ slug: post.slug, like: next, ...(uid ? {} : { anonId: anonId() }) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) toast(t.blog.likeLimit, 'error');
      else if (!res.ok) toast(t.blog.likeError, 'error');
      if (typeof data.likes === 'number') setLikes(data.likes);
      const final = typeof data.liked === 'boolean' ? data.liked : liked;
      setLiked(final);
      if (!uid) setAnonLiked(post.slug, final);
    } catch {
      setLiked(!next);
      setLikes((n) => Math.max(0, n + (next ? -1 : 1)));
      if (!uid) setAnonLiked(post.slug, !next);
      toast(t.blog.likeError, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    const url = `${window.location.origin}/blog/${post.slug}`;
    try {
      if (navigator.share) { await navigator.share({ url, title: document.title }); return; }
      await navigator.clipboard.writeText(url);
      toast(t.blog.copied);
    } catch { /* el usuario cerró la ventana de compartir */ }
  }

  return (
    <div className="b-actions">
      <button
        type="button"
        className={`b-like${liked ? ' on' : ''}`}
        aria-pressed={liked}
        aria-label={liked ? t.blog.unlike : t.blog.like}
        disabled={busy || !canLike}
        onClick={toggle}
      >
        <span aria-hidden="true">{liked ? '♥' : '♡'}</span> {t.blog.likes(likes)}
      </button>
      <button type="button" className="b-share" onClick={share}>{t.blog.share}</button>
    </div>
  );
}
