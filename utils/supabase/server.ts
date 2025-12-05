import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  // 환경 변수 확인 (없을 경우 에러 방지용 빈 문자열 처리 또는 에러 throw)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component에서 쿠키를 설정하려고 할 때 발생하는 에러를 무시합니다.
          // (Server Action이나 Route Handler에서는 정상 작동하며,
          //  Server Component에서는 미들웨어가 세션을 갱신하므로 무시해도 됩니다.)
        }
      },
    },
  });
}
