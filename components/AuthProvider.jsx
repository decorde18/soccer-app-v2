// components/AuthProvider.jsx
"use client";

import { useEffect } from "react";
import useAuthStore from "@/stores/authStore";

export default function AuthProvider({ children }) {
  const { token, _hasHydrated } = useAuthStore();

  useEffect(() => {
    // Ensure cookie stays in sync with Zustand
    if (_hasHydrated) {
      if (token) {
        document.cookie = `auth-token=${token}; path=/; max-age=${
          60 * 60 * 24 * 7
        }; SameSite=Lax`;
      } else {
        document.cookie = "auth-token=; path=/; max-age=0";
      }
    }
  }, [token, _hasHydrated]);

  return children;
}
