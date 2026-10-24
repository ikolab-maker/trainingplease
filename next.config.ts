import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // firebase-admin solo se usa en rutas API (servidor).
  serverExternalPackages: ['firebase-admin'],
  agentRules: false,
  // La sección "Arquitectura" pasó a llamarse "Docs".
  async redirects() {
    return [{ source: '/coach/arquitectura', destination: '/coach/docs', permanent: true }];
  },
};

export default nextConfig;
