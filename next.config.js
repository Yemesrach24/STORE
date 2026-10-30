const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the tracing root to this project. Without this, Next.js may walk up
  // and find a stray package-lock.json in a parent directory (e.g. the user
  // home folder) and try to trace that entire tree — which blows the build
  // heap (out-of-memory) and produces stale/missing .next artifacts.
  outputFileTracingRoot: path.join(__dirname),
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  experimental: {
    // Limit build workers — on machines with ~8GB RAM the default parallel
    // static-page workers run the system out of memory mid-build.
    cpus: 1,
  },
}

module.exports = nextConfig
