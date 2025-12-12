import "./globals.css";

import { Providers } from "./providers";
import GlobalModal from "@/components/GlobalModal";
import StyledComponentsRegistry from "@/lib/registry";
import ClientLayout from "./ClientLayout";

import localFont from "next/font/local";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import ToastSystem from "@/components/ToastSystem";
import AuthCheck from "@/components/auth/AuthCheck";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "RANG ART - 아이들의 행복한 창작놀이터", // 사이트 제목
  description: "선생님과 원장님을 위한 올인원 미술학원 관리 플랫폼", // 사이트 설명
  icons: {
    icon: "/icon.png", // 파비콘 설정
    apple: "/icon.png", // 애플 터치 아이콘 설정 (선택 사항)
  },
  openGraph: {
    title: "RANG ART - 아이들의 행복한 창작놀이터", // 카톡 등 SNS 공유 시 제목
    description: "선생님과 원장님을 위한 올인원 미술학원 관리 플랫폼", // SNS 공유 시 설명
    url: "https://cshoon95-rang-art.vercel.app/", // 실제 서비스 URL로 변경해주세요
    siteName: "RANG ART",
    images: [
      {
        url: "/icon.png", // 카톡 공유 시 보여질 이미지 경로 (public 폴더 기준)
        width: 800, // 권장 크기 (카톡 기준 800x400 또는 1:1 비율)
        height: 800,
        alt: "RANG ART Logo",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  // 트위터 카드 설정 (선택 사항)
  twitter: {
    card: "summary_large_image",
    title: "RANG ART - 아이들의 행복한 창작놀이터",
    description: "선생님과 원장님을 위한 올인원 미술학원 관리 플랫폼",
    images: ["/icon.png"], // 트위터 공유 시 이미지
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
