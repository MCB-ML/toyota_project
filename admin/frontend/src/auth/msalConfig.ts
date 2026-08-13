import { type Configuration, PublicClientApplication } from "@azure/msal-browser";
import envLoader from "../utils/envLoader";

export const msalConfig: Configuration = {
  auth: {
    clientId: envLoader.AZURE_AD_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${envLoader.AZURE_AD_TENANT_ID}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const loginRequest = {
  scopes: ["User.Read"],
};
