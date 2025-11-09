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
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <Button
      onClick={handleLogout}
      disabled={isLoading}
      variant='danger'
      size='sm'
      className={className}
    >
      {isLoading ? (
        "Logging out..."
      ) : (
        <>
          <LogOut size={18} />
          <span className='font-medium'>Logout</span>
        </>
      )}
    </Button>
  );
}
