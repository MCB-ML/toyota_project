import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import mcloud_img from "@/assets/image/mcloud.png";
import ms_img from "@/assets/image/microsoft.png";
import Button from "@/components/reusable/Button";
import type { LoginFormData } from "@/types/login.types";
import { useAuthContext } from "../../../../auth/context/authContext";
import { useAuth } from "../../../../auth/hooks/useAuth";
import { loginRequest, msalInstance } from "../../../../auth/msalConfig";
import { useCreateLoginCredential } from "../../../../services/api/auth/credential";
import LoginPageForm from "../molecules/LoginPageForm";

const LoginPageComponent = () => {
  const { login, clear } = useAuthContext();

  const navigate = useNavigate();

  const { mutate: loginCreden, isPending } = useCreateLoginCredential();

  const { isLoading, token, user, isAuthenticated } = useAuth();

  const isAuth = useIsAuthenticated();

  const { instance, accounts } = useMsal();

  const [loginFormData, setLoginFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const isLoginFormValid: boolean =
    (loginFormData.email?.trim() || "") !== "" && (loginFormData.password?.trim() || "") !== "";

  const handleLoginAzure = async () => {
    await instance.loginRedirect(loginRequest);
  };

  const handleLoginSubmit = async () => {
    if (!isLoginFormValid) {
      toast.error("Please fill in all required fields.");
      return;
    }

    loginCreden(
      {
        email: loginFormData.email,
        password: loginFormData.password,
      },
      {
        onSuccess: (res) => {
          if (res?.success && res.result.token) {
            login(res.result.token);
            // navigate("/CompanyInfo", { replace: true });

            //window.location.href = "/CompanyInfo";
          }
        },
        onError: (err: any) => {
          const message =
            err?.response?.data?.message || err?.message || "Unexpected error occurred";

          toast.error(`Failed  - ${message}`);
        },
      },
    );
  };

  useEffect(() => {
    if (isLoading) return;

    if (token) {
      if (isAuthenticated) navigate("/CompanyInfo");
      else {
        toast.error("You dont have access");
        clear();
      }
    } else {
      if (accounts.length > 0 && isAuth) {
        const account = accounts[0];
        msalInstance.setActiveAccount(account);
        if (account.idToken) {
          login(account.idToken);
          //navigate("/CompanyInfo")
        }
      }
    }
  }, [token, accounts, isAuth, isLoading, user]);

  return (
    <div className="w-screen h-screen flex justify-center items-center bg-[#f2f5fa]">
      <div className="w-full flex flex-col justify-center items-center bg-white px-8 py-10 rounded-lg shadow-2xl gap-y-8 lg:w-[33%]">
        <div className="flex justify-center items-center gap-y-1 gap-5 ">
          <img src={mcloud_img} alt="icon" className="h-16" />
          <div>
            <h1 className=" font-bold text-1xl">Ai365 Agent</h1>
            <h1 className="text-[#666] text-2xl">Admin Center</h1>
          </div>
        </div>

        <LoginPageForm loginFormData={loginFormData} setLoginFormData={setLoginFormData} />

        <Button
          type="button"
          variant="primary"
          size="md"
          fullWidth
          onClick={handleLoginSubmit}
          disabled={!isLoginFormValid || isPending || isLoading}
          className="bg-black hover:bg-black"
        >
          Sign In
        </Button>

        {/*
          가운데 글자는 폭이 좁아 "WITH" 가 다음 줄로 넘어간다.
          그대로 두면 왼쪽 정렬이라 두 줄이 어긋나 보이므로 text-center 로 맞춘다.

          바깥 div 의 w-full 은 빼면 안 된다.
          부모가 items-center 라 자식이 늘어나지 않아서, 폭이 없으면
          flex-grow 가 나눌 공간 자체가 0 이 되어 양옆 선이 사라진다.
        */}
        <div className="flex w-full items-center">
          <div className="flex-grow border-t border-gray-300" />
          <span className="mx-3 w-28 shrink-0 text-center text-xs leading-snug text-gray-500">
            OR CONTINUE WITH
          </span>
          <div className="flex-grow border-t border-gray-300" />
        </div>

        <button
          disabled={isPending || isLoading}
          onClick={handleLoginAzure}
          className="w-full py-2 rounded-lg bg-white text-black border border-gray-300 flex items-center justify-center gap-3 hover:bg-gray-900 hover:text-white transition"
        >
          <img src={ms_img} className="h-4" alt="msimg" />

          <span>Sign in with Microsoft</span>
        </button>
      </div>
    </div>
  );
};

export default LoginPageComponent;
