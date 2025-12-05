import "./globals.css";

import { Providers } from "./providers";
import GlobalModal from "@/components/GlobalModal";
import StyledComponentsRegistry from "@/lib/registry";
import ClientLayout from "./ClientLayout";

import localFont from "next/font/local";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import ToastSystem from "@/components/ToastSystem";
import AuthCheck from "@/components/auth/AuthCheck";

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
