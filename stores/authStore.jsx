// stores/authStore.js
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setToken: (token) => set({ token }),

      login: async (credentials) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Login failed");
          }

          const data = await response.json();

          // Sync token to cookie for middleware
          document.cookie = `auth-token=${data.token}; path=/; max-age=${
            60 * 60 * 24 * 7
          }; SameSite=Lax`;

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // ✅ FIX: Load user context after login
          try {
            const { useUserContextStore } = await import("./userContextStore");
            await useUserContextStore.getState().loadUserContext(data.user.id);
          } catch (error) {
            console.error("Failed to load user context:", error);
            // Don't fail login if context fails
          }

          return data;
        } catch (error) {
          set({
            error: error.message,
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });

        try {
          const { token } = get();
          if (token) {
            await fetch("/api/auth/logout", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          }
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          // Clear cookie
          document.cookie = "auth-token=; path=/; max-age=0";

          // Clear user context store
          try {
            const { useUserContextStore } = await import("./userContextStore");
            useUserContextStore.getState().clearContext();
          } catch (error) {
            console.error("Failed to clear user context:", error);
          }

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      refreshToken: async () => {
        const { token } = get();

        if (!token) return;

        try {
          const response = await fetch("/api/auth/refresh", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error("Token refresh failed");
          }

          const data = await response.json();

          // Update cookie
          document.cookie = `auth-token=${data.token}; path=/; max-age=${
            60 * 60 * 24 * 7
          }; SameSite=Lax`;

          set({
            token: data.token,
            user: data.user,
          });

          return data;
        } catch (error) {
          get().logout();
          throw error;
        }
      },

      updateUser: (updates) =>
        set((state) => ({
          user: { ...state.user, ...updates },
        })),

      clearError: () => set({ error: null }),

      // Helper to check if user is system admin
      isSystemAdmin: () => {
        const { user } = get();
        return user?.systemRole === "system_admin";
      },

      // Hydration helper
      _hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);

        // Sync token to cookie on hydration
        if (state?.token) {
          document.cookie = `auth-token=${state.token}; path=/; max-age=${
            60 * 60 * 24 * 7
          }; SameSite=Lax`;
        }

        // ✅ FIX: Reload context on hydration
        if (state?.user?.id) {
          import("./userContextStore").then(({ useUserContextStore }) => {
            useUserContextStore.getState().loadUserContext(state.user.id);
          });
        }
      },
    }
  )
);

export default useAuthStore;
