import type { Metadata } from 'next';
import { BlogIndex } from '@/components/blog/BlogViews';
import '../site.css';
import './blog.css';

export const metadata: Metadata = {
  title: 'Blog · Training Please',
  description: 'Ideas prácticas para entrenar mejor, lo que aprendemos con nuestros atletas y novedades del club.',
  openGraph: { title: 'Blog · Training Please', locale: 'es_PE', type: 'website' },
};

export default function BlogPage() {
  return <BlogIndex />;
}
