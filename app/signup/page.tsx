import { getBranches } from "@/api/branch/actions";
import SignupClient from "./_components/SignupClient";

// app/signup/page.tsx (서버 컴포넌트)
export default async function SignupPage() {
  // DB에서 지점 목록 조회
  const branches = await getBranches();

  // 필요한 데이터만 props로 전달
  return <SignupClient initialBranches={branches} />;
}
