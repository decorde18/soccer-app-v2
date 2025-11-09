// app/(coach)/page.js
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import Link from "next/link";

async function verifyAndGetUser(token) {
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Optional: Fetch full user data from database if needed
    // const user = await db.query('SELECT * FROM users WHERE id = ?', [decoded.userId]);

    return decoded; // Should contain: { userId, email, role, name, etc. }
  } catch (error) {
    return null;
  }
}

export default async function CoachIndex() {
  // 1. Get token from cookies (set by your Zustand store)
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  // 2. Middleware already checked if token exists, but verify it's valid
  if (!token) {
    redirect("/auth/login?returnUrl=/coach");
  }

  // 3. Verify token and get user data
  const user = await verifyAndGetUser(token);

  if (!user) {
    // Token is invalid/expired
    redirect("/auth/login?returnUrl=/coach");
  }

  // 4. Check if user has correct role
  if (!user.roles.includes("admin") && !user.roles.includes("coach")) {
    // Show 403 - Don't redirect to login (they ARE logged in, just wrong role)
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50 px-4'>
        <div className='max-w-md w-full text-center space-y-6'>
          {/* Icon */}
          <div className='mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center'>
            <svg
              className='w-8 h-8 text-red-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
              />
            </svg>
          </div>

          {/* Content */}
          <div>
            <h1 className='text-2xl font-bold text-gray-900 mb-2'>
              Access Denied
            </h1>
            <p className='text-gray-600'>
              You need coach permissions to access this area.
            </p>
            <p className='text-sm text-gray-500 mt-2'>
              Current role: <span className='font-medium'>{user.role}</span>
            </p>
          </div>

          {/* Actions */}
          <div className='flex flex-col sm:flex-row gap-3 justify-center'>
            <Link
              href='/dashboard'
              className='px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors'
            >
              Go to Dashboard
            </Link>
            <Link
              href={`/${user.role}`}
              className='px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors'
            >
              Go to My Portal
            </Link>
          </div>

          {/* Help text */}
          <p className='text-xs text-gray-500'>
            Need coach access?{" "}
            <Link href='/contact' className='text-blue-600 hover:underline'>
              Contact support
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // 5. User is authenticated AND authorized - show coach dashboard
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 py-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Coach Dashboard
          </h1>
          <p className='text-gray-600'>
            Welcome back, {user.name || user.email}!
          </p>
        </div>

        {/* Quick Stats */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
          <div className='bg-white rounded-lg shadow p-6'>
            <h3 className='text-sm font-medium text-gray-600 mb-2'>My Teams</h3>
            <p className='text-3xl font-bold text-gray-900'>3</p>
          </div>
          <div className='bg-white rounded-lg shadow p-6'>
            <h3 className='text-sm font-medium text-gray-600 mb-2'>Players</h3>
            <p className='text-3xl font-bold text-gray-900'>48</p>
          </div>
          <div className='bg-white rounded-lg shadow p-6'>
            <h3 className='text-sm font-medium text-gray-600 mb-2'>Upcoming</h3>
            <p className='text-3xl font-bold text-gray-900'>5 Events</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <Link
            href='/coach/teams'
            className='bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow'
          >
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              Manage Teams
            </h3>
            <p className='text-gray-600 text-sm'>
              View and edit team rosters, schedules, and settings
            </p>
          </Link>
          <Link
            href='/coach/schedule'
            className='bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow'
          >
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              Schedule
            </h3>
            <p className='text-gray-600 text-sm'>
              Manage practices, games, and events
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
