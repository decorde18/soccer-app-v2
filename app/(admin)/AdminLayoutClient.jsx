// app/(admin)/AdminLayoutClient.jsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Trophy,
  Calendar,
  Settings,
  ChevronLeft,
} from "lucide-react";

export default function AdminLayoutClient({ children, user }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Clubs", href: "/admin/clubs", icon: Building2 },
    { name: "Teams", href: "/admin/teams", icon: Trophy },
    { name: "Seasons", href: "/admin/seasons", icon: Calendar },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className='flex min-h-screen bg-gray-100'>
      {/* Sidebar */}
      <aside className='w-64 bg-gray-900 text-white'>
        <div className='p-4 border-b border-gray-800'>
          <div className='flex items-center space-x-2'>
            <span className='text-xl font-bold'>Admin Panel</span>
          </div>
          <p className='text-xs text-gray-400 mt-1'>{user.email}</p>
        </div>

        <nav className='p-4 space-y-1'>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                <Icon className='w-5 h-5' />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Back to main app */}
        <div className='absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800'>
          <Link
            href='/dashboard'
            className='flex items-center space-x-2 text-gray-400 hover:text-white transition'
          >
            <ChevronLeft className='w-4 h-4' />
            <span>Back to App</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className='flex-1 p-8'>{children}</main>
    </div>
  );
}
