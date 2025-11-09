// components/auth/LoginButton.jsx
"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { LogIn } from "lucide-react";

export default function LoginButton({ className = "" }) {
  const router = useRouter();

  return (
    <Button
      onClick={() => router.push("/auth/login")}
      variant='outline'
      size='sm'
      className={className}
    >
      <LogIn size={18} />
      <span className='font-medium'>Login</span>
    </Button>
  );
}
