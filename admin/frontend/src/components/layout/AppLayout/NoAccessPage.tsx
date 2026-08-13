import { ShieldAlert } from "lucide-react";
import { useAuthContext } from "@/auth/context/authContext";
import { useAuth } from "@/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";

/**
 * 관리자 권한이 없는 계정으로 어드민 페이지에 들어온 경우.
 *
 * 로그인 화면으로 돌려보내지 않는다. 자격 증명은 멀쩡하므로 다시 로그인해도
 * 결과가 같고, 사용자는 무한히 로그인만 반복하게 된다.
 */
const NoAccessPage = () => {
  const { logout } = useAuthContext();

  // 거절 응답에 서버가 실어 보낸 계정. 로그인은 토큰만 저장하므로
  // 화면에는 다른 경로로 알 방법이 없다.
  const { forbiddenAccount } = useAuth();

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#f2f5fa] px-4">
      <div className="w-full max-w-[440px] rounded-xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-[#fef3f2]">
          <ShieldAlert size={26} className="text-[#d92d20]" />
        </div>

        <h1 className="text-lg font-semibold text-[#101828]">관리자 페이지 접속 권한이 없습니다</h1>

        <p className="mt-2 text-sm leading-relaxed text-[#5a6a7a]">
          이 페이지는 관리자 권한을 가진 계정만 사용할 수 있습니다. 권한이 필요하면 관리자에게
          문의하세요.
        </p>

        {forbiddenAccount?.email && (
          <p className="mt-4 rounded-lg bg-[#f8f9fb] px-3 py-2 text-xs text-[#8a94a0]">
            현재 로그인 계정{" "}
            <span className="font-medium text-[#5a6a7a]">{forbiddenAccount.email}</span>
            {forbiddenAccount.role && <span className="ml-1">({forbiddenAccount.role})</span>}
          </p>
        )}

        <Button onClick={logout} className="mt-6 w-full bg-[#1a73e8] text-white hover:bg-[#1557b0]">
          다른 계정으로 로그인
        </Button>
      </div>
    </div>
  );
};

export default NoAccessPage;
