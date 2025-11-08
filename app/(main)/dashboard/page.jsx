"use client";

import useAuthStore from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function Page() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();
  useEffect(() => {
    // Wait for hydration, then check auth
    if (_hasHydrated && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, _hasHydrated, router]);

  // Show loading while hydrating
  if (!_hasHydrated) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      I WILL BE PUTTING CARDS HERE
      {
        //TODO
      }
    </div>
  );
}

export default Page;
