// app/(admin)/layout.js
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import AdminLayoutClient from "./AdminLayoutClient";

export default async function AdminLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  // 1. No token - redirect to login
  if (!token) {
    redirect("/auth/login?redirect=/admin");
  }

  // 2. Verify token
  let user;
  try {
    user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    // Invalid/expired token - redirect to login
    redirect("/auth/login?redirect=/admin");
  }

  // 3. Check for system_admin role (matches your serverAuth pattern)
  if (!user.systemAdmin) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center p-8 bg-white rounded-lg shadow-lg max-w-md'>
          <div className='text-6xl mb-4'>🔒</div>
          <h1 className='text-2xl font-bold mb-2'>Access Denied</h1>
          <p className='text-gray-600 mb-6'>
            System administrator access is required to view this page.
          </p>
          <div className='space-y-3'>
            <a
              href='/dashboard'
              className='block w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition'
            >
              Go to Dashboard
            </a>
            <p className='text-sm text-gray-500'>
              If you believe you should have access, please contact your
              administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 4. User is system_admin - render admin layout
  return <AdminLayoutClient user={user}>{children}</AdminLayoutClient>;
}
