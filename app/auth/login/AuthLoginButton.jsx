// app/components/AuthLoginButton.js (A Client Component)
"use client";

import Button from "@/components/ui/Button";
import { setAuthToken, deleteAuthToken } from "../../actions";
import { useRouter } from "next/navigation";

export default function AuthLoginButton() {
  const router = useRouter();

  const handleLogin = async () => {
    // 1. Authenticate the user (e.g., call a login API)
    const newToken = "this-is-your-secure-jwt-token"; // Replace with actual login response

    // 2. Call the Server Action to set the cookie
    await setAuthToken(newToken);

    // 3. Refresh or redirect the page
    router.refresh();
  };

  return <Button onClick={handleLogin}>Log In</Button>;
}
