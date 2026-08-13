import { useMsal } from "@azure/msal-react";
import { createContext, type ReactNode, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import envLoader from "../../utils/envLoader";

type AuthContextType = {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  clear: () => void;
};

const TOKEN = envLoader.TOKEN_KEY;
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { instance } = useMsal();
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN));

  const login = (newToken: string) => {
    localStorage.setItem(TOKEN, newToken);
    setToken(newToken);
  };
  const clear = () => {
    localStorage.removeItem(TOKEN);
    setToken(null);
    localStorage.clear();
    sessionStorage.clear();
  };
  const logout = () => {
    clear();
    instance.setActiveAccount(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        login,
        logout,
        clear,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
