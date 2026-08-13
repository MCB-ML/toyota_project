import { Lock, User } from "lucide-react";
import type React from "react";
import type { LoginFormData } from "@/types/login.types";

type LoginPageFormProps = {
  loginFormData: LoginFormData;
  setLoginFormData: React.Dispatch<React.SetStateAction<LoginFormData>>;
};

const LoginPageForm = ({ loginFormData, setLoginFormData }: LoginPageFormProps) => {
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setLoginFormData({
      ...loginFormData,
      email: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setLoginFormData({
      ...loginFormData,
      password: e.target.value,
    });
  };

  return (
    <div className="w-full">
      <h1 className="py-1">Email</h1>
      <div className="relative mb-3 bg-[#f4f4f4] rounded-md">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Enter your email"
          value={loginFormData.email || ""}
          onChange={handleUsernameChange}
          className="w-full pl-10 pr-3 py-2 rounded-lg focus:outline-none text-sm"
        />
      </div>

      <h1 className="py-1">Password</h1>
      <div className="relative mb-3 bg-[#f4f4f4] rounded-md">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="password"
          placeholder="Enter your password"
          className="w-full pl-10 pr-3 py-2 rounded-lg focus:outline-none text-sm"
          value={loginFormData.password || ""}
          onChange={handlePasswordChange}
        />
      </div>

    </div>
  );
};

export default LoginPageForm;
