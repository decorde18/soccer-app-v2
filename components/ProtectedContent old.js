// ==========================================
// 2. CLIENT-SIDE: For dynamic UI updates
// ==========================================
// components/ProtectedContent.js
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export function ProtectedContent({ children, requiredRole }) {
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // This is a backup/sync check - server already protected the route
    if (_hasHydrated && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, _hasHydrated, router]);

  // No loading spinner needed - server already checked
  // This just handles client-side navigation edge cases
  if (!_hasHydrated) {
    return null; // Or children - server already validated
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  // Optional: Check role on client too (for UI only, not security)
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className='p-4 bg-yellow-50 border border-yellow-200 rounded'>
        <p className='text-yellow-800'>
          You don&apos;t have permission to view this content.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
