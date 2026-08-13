import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "../auth/context/authContext";
import CompanyInfoMainComponent from "../components/layout/CompanyInfo/pages/CompanyInfoMainComponent";
import LoginPageComponent from "../components/layout/LoginPage/organism/LoginPageComponent";
import ModelDeploymentMainComponent from "../components/layout/ModelDeployment/ModelDeploymentMainComponent";
import PromptSettingsMainComponent from "../components/layout/PromptSettings/PromptSettingsMainComponent";
import UsageMainComponent from "../components/layout/Usage/UsageMainComponent";
import UsersMainComponent from "../components/layout/Users/organism/UsersMainComponent";
import ProtectedRoute from "./components/ProtectedRoute";
import RouteNotFound from "./components/RouteNotFound";

const AppRouter = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            duration: 2500,
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPageComponent />} />
          {/*
            어드민이 쓰는 화면은 5개뿐이다.
            사이드바에서 감춘 메뉴(Branch / Workspace / DataAgent / Copilot /
            AiAgent / OrgChart)는 라우트도 내렸다. 남겨두면 주소를 직접 쳐서
            들어갈 수 있고, 그 화면이 끌고 오는 코드가 번들에 그대로 실린다.
          */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<CompanyInfoMainComponent />} />
            <Route path="/users" element={<UsersMainComponent />} />
            <Route path="/modelDeployment" element={<ModelDeploymentMainComponent />} />
            <Route path="/promptSettings" element={<PromptSettingsMainComponent />} />
            <Route path="/usage" element={<UsageMainComponent />} />
            <Route path="/companyInfo" element={<CompanyInfoMainComponent />} />
          </Route>
          <Route path="*" element={<RouteNotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRouter;
