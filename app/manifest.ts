import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "랑아트 미술학원 😊", // layout.tsx의 title
    short_name: "랑아트 미술학원 😊", // layout.tsx의 appleWebApp.title (앱 아이콘 아래 표시될 짧은 이름)
    description: "랑아트 미술학원만을 위한 올인원 관리 플랫폼", // layout.tsx의 description
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff", // layout.tsx의 themeColor
    orientation: "portrait", // 세로 모드 고정 (선택 사항)
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any", // ✨ 'maskable' 대신 'any' 사용 (또는 'any maskable'로 둘 다 지원)
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any", // ✨ 여기도 변경
      },
    ],
  };
}
