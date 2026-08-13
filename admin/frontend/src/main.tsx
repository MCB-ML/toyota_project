if (window.location.hash.includes("code=")) {
  const hash = window.location.hash.substring(1); // remove '#'
  window.location.replace(`${window.location.origin}/?${hash}`);
}

//import "./lib/frontendLogger";
//import { createRouter, RouterProvider } from "@tanstack/react-router";
import { createRoot } from "react-dom/client";
//import { routeTree } from "./routeTree.gen";
//import type { RouterContext } from "./types/router.types";
import "./styles/index.css";
import "./lang/i18n";

//import { NotFoundRedirect } from "./utils/NotFoundRedirect";

import { MsalProvider } from "@azure/msal-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { msalInstance } from "./auth/msalConfig";
import AppRouter from "./routes/AppRoutes";
import { setupAxios } from "./services/api/axiosSetup";

//const router = createRouter({
//  routeTree,
//  context: {
//    auth: {
//      isAuthenticated: false,
//    },
//  } satisfies RouterContext,
//  defaultNotFoundComponent: NotFoundRedirect,
//});

//declare module "@tanstack/react-router" {
//  interface Register {
//    router: typeof router;
//  }
//}

//createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
const queryClient = new QueryClient();

// 요청 인터셉터. 렌더 전에 걸어야 첫 호출부터 토큰이 붙는다.
setupAxios();

const bootstrap = async () => {
  //await msalInstance.initialize();
  await msalInstance.initialize();

  try {
    await msalInstance.handleRedirectPromise().then((response) => {
      if (response) {
        msalInstance.setActiveAccount(response.account);
      }
    });
  } catch (e) {
    console.log("MSAL redirect error:", e);
  }

  const root = createRoot(document.getElementById("root")!);

  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <MsalProvider instance={msalInstance}>
          <AppRouter />
        </MsalProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
};

bootstrap();
