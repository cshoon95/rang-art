import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 브라우저가 지원하면 avif를 먼저, 안 되면 webp를 보여줌
    formats: ["image/avif", "image/webp"],
  },
  /* config options here */
  compiler: {
    // 운영 환경(production)에서만 모든 console.* 로그를 제거합니다.
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
