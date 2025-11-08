// components/LogoutButton.jsx
"use client";

import { useRouter } from "next/navigation";
import useAuthStore from "@/stores/authStore";
import Button from "@/components/ui/Button";
import { LogOut } from "lucide-react";

export default function LogoutButton({ className = "" }) {
  const { logout, isLoading } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/public/auth/login");
    router.refresh();
  };

  return (
    <Button
      onClick={handleLogout}
      disabled={isLoading}
      variant='danger'
      size='sm'
    >
      {isLoading ? (
        "Logging out..."
      ) : (
        <>
          <LogOut />
          <span className='font-medium'>Logout</span>
        </>
      )}
    </Button>
  );
}
