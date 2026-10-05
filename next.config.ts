import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // firebase-admin solo se usa en rutas API (servidor).
  serverExternalPackages: ['firebase-admin'],
  agentRules: false,
};

export default nextConfig;
