import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  compiler: {
    // 운영 환경(production)에서만 모든 console.* 로그를 제거합니다.
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
