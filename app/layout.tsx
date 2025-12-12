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
  userScalable: false,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "랑아트 미술학원 😊",
  description: "랑아트 미술학원만을 위한 올인원 관리 플랫폼",
  icons: {
    icon: "https://cshoon95-rang-art.vercel.app/icon.png",
    apple: "https://cshoon95-rang-art.vercel.app/icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RANG ART",
  },
  openGraph: {
    title: "랑아트 미술학원 😊",
    description: "랑아트 미술학원만을 위한 올인원 관리 플랫폼",
    url: "https://cshoon95-rang-art.vercel.app",
    siteName: "RANG ART",
    // 🗑️ images 속성을 삭제했습니다!
    // images: [...],
    locale: "ko_KR",
    type: "website",
  },
};

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
