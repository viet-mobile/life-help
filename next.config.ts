// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export' 항목이 있다면 반드시 삭제하거나 주석 처리하세요.
  async rewrites() {
    return [
      {
        source: "/manifest.json",
        destination: "/manifest.webmanifest",
      },
    ];
  },
};

export default nextConfig;