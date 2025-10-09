"use client";

import { useRouter } from "next/navigation";
import { deleteAuthToken } from "../../actions";
import Button from "@/components/ui/Button";

export default function AuthLogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    // 1. Call the Server Action to delete the cookie
    await deleteAuthToken();

    // 2. Redirect to the home page or login screen
    router.push("/");
  };
  return <Button onClick={handleLogout}>Logout</Button>;
}
