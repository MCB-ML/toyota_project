import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState } from "@/types/auth.types";
import type { LoginAPIUserResponse } from "@/types/login.types";
import envLoader from "@/utils/envLoader";

const INACTIVITY_TIMEOUT = envLoader.INACTIVITY_TIMEOUT * 60 * 60 * 1000; // 2 hours in ms
const TOKEN_REFRESH_THRESHOLD = envLoader.TOKEN_EXPIRY_LIMIT * 60 * 1000; // 5 minutes in ms

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      refreshToken: null,
      accessToken: null,
      user: null,
      tokenExpiry: null,
      accessTokenExpiry: null,
      lastActivity: Date.now(),

      setAuth: (accessToken, refreshToken, user, accessExpiry) => {
        set({
          accessToken,
          refreshToken,
          user,
          accessTokenExpiry: accessExpiry,
          lastActivity: Date.now(),
        });
      },

      setAccessToken: (accessToken, expiry) => {
        set({
          accessToken,
          accessTokenExpiry: expiry,
          lastActivity: Date.now(),
        });
      },

      updateActivity: () => {
        set({ lastActivity: Date.now() });
      },

      clearAuth: () => {
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          accessTokenExpiry: null,
          lastActivity: Date.now(),
        });
      },

      isAccessTokenExpired: () => {
        const { accessTokenExpiry } = get();
        if (!accessTokenExpiry) return true;

        const now = Date.now();
        const expiryTime = accessTokenExpiry * 1000;

        return now >= expiryTime;
      },

      shouldRefreshToken: () => {
        const { accessTokenExpiry, lastActivity } = get();
        if (!accessTokenExpiry) return false;

        const now = Date.now();
        const expiryTime = accessTokenExpiry * 1000;
        const timeSinceActivity = now - lastActivity;
        const refreshThresholdTime = expiryTime - TOKEN_REFRESH_THRESHOLD;

        return now >= refreshThresholdTime && timeSinceActivity < INACTIVITY_TIMEOUT;
      },

      isInactive: () => {
        const { lastActivity } = get();
        const now = Date.now();
        const timeSinceActivity = now - lastActivity;

        return timeSinceActivity >= INACTIVITY_TIMEOUT;
      },

      isAuthenticated: () => {
        const { refreshToken } = get();
        return refreshToken !== null && !get().isInactive();
      },

      updateUser: (user: LoginAPIUserResponse) => {
        set({ user });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        refreshToken: state.refreshToken,
        user: state.user,
        lastActivity: state.lastActivity,
      }),
    },
  ),
);
