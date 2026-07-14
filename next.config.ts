import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // yahoo-finance2는 Node.js 네이티브 모듈 사용 → 번들링 제외 필수
  serverExternalPackages: [
    'yahoo-finance2',
    'tough-cookie',
    'tough-cookie-file-store',
  ],
};

export default nextConfig;
