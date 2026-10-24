import type { Metadata } from 'next';
import { SiteContent } from '@/components/site/SiteContent';
import './site.css';

export const metadata: Metadata = {
  title: 'Training Please · Entrena, por favor',
  description:
    'Planes de entrenamiento semanales hechos para ti, con una persona que los mira cada semana. Piloto abierto en Lima: postula gratis.',
  openGraph: {
    title: 'Training Please · Entrena, por favor',
    description: 'Un plan hecho para ti y alguien que lo mira cada semana. Piloto abierto en Lima.',
    locale: 'es_PE',
    type: 'website',
  },
};

export default function SitePage() {
  return <SiteContent />;
}
