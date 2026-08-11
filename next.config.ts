import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Allows the phone (on the same hotspot/LAN) to load dev-mode JS
  // (hot-reload bundle, etc.) when testing via the printed Network URL
  // (e.g. http://172.23.42.131:3000). Without this, Next.js blocks
  // cross-origin requests to dev resources by default, and pages load
  // but client-side interactivity (like the mobile menu's onClick) may
  // not hydrate correctly on other devices. Dev-only setting — has no
  // effect on the production Vercel build.
  allowedDevOrigins: ["172.23.42.131"],
};

export default nextConfig;
