// ==========================================
// 1. SERVER-SIDE: layout.js or page.js (for route groups)
// ==========================================
// app/(user)/layout.js
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/roleutils";

export default async function UserLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  // Server-side auth check - instant, no flash
  if (!token) {
    redirect("/auth/login?returnUrl=/user");
  }

  // Verify token and check role
  let user;
  try {
    user = await verifyToken(token);
  } catch (error) {
    redirect("/auth/login");
  }
  // Check permissions
  if (hasRoleAccess(user.roles, "user") === false) {
    // Return 403 component
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold mb-2'>Access Denied</h1>
          <p className='text-gray-600 mb-4'>User access required</p>
          <a href='/dashboard' className='text-blue-600 hover:underline'>
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // User is authenticated and authorized - render children
  return <>{children}</>;
}
