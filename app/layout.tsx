import "./globals.css";

import { Providers } from "./providers";
import GlobalModal from "@/components/GlobalModal";
import StyledComponentsRegistry from "@/lib/registry";
import ClientLayout from "./ClientLayout";

import localFont from "next/font/local";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import ToastSystem from "@/components/ToastSystem";
import AuthCheck from "@/components/auth/AuthCheck";
import { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // 앱처럼 느끼게 하기 위해 확대 방지
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "랑아트 미술학원 😊", // 사이트 제목
  description: "랑아트 미술학원만을 위한 올인원 관리 플랫폼", // 사이트 설명
  icons: {
    icon: "https://cshoon95-rang-art.vercel.app/icon.png", // 파비콘 설정
    apple: "https://cshoon95-rang-art.vercel.app/icon.png", // 애플 터치 아이콘 설정 (선택 사항)
  },
  appleWebApp: {
    capable: true, // PWA 모드 활성화
    statusBarStyle: "default", // 상단 상태바 색상 (default, black, black-translucent)
    title: "RANG ART", // 홈 화면 아이콘 아래 이름
  },
  openGraph: {
    title: "랑아트 미술학원 😊", // 카톡 등 SNS 공유 시 제목
    description: "랑아트 미술학원만을 위한 올인원 관리 플랫폼", // SNS 공유 시 설명
    url: "https://cshoon95-rang-art.vercel.app", // 실제 서비스 URL로 변경해주세요
    siteName: "RANG ART",
    images: [
      {
        url: "https://cshoon95-rang-art.vercel.app/icon.png", // 카톡 공유 시 보여질 이미지 경로 (public 폴더 기준)
        width: 800, // 권장 크기 (카톡 기준 800x400 또는 1:1 비율)
        height: 800,
        alt: "RANG ART Logo",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
};

// ❗ 폰트는 반드시 여기(컴포넌트 밖)에 선언해야 한다!!
const sugarGothic = localFont({
  src: [
    {
      path: "./fonts/SugarGothic.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-custom",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={sugarGothic.variable}>
      <body>
        <AppRouterCacheProvider>
          <Providers>
            <StyledComponentsRegistry>
              <AuthCheck>
                <ClientLayout>{children}</ClientLayout>
                <GlobalModal />
                <ToastSystem />
              </AuthCheck>
            </StyledComponentsRegistry>
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
