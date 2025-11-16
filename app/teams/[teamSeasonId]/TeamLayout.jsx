// `app/teams/[teamSeasonId]/TeamLayout.jsx`
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Permissions } from "@/lib/clientPermissions";

export default function TeamLayout({
  children,
  teamInfo,
  access,
  teamSeasonId,
}) {
  const pathname = usePathname();

  const canEdit = Permissions.canEditTeam(access);
  const canManageRoster = Permissions.canManageRoster(access);

  const tabs = [
    { name: "Schedule", href: `/teams/${teamSeasonId}/schedule`, public: true },
    { name: "Roster", href: `/teams/${teamSeasonId}/roster`, public: true },
    { name: "Stats", href: `/teams/${teamSeasonId}/stats`, public: true },
    {
      name: "Events",
      href: `/teams/${teamSeasonId}/events`,
      requireAuth: true,
    },
    {
      name: "Settings",
      href: `/teams/${teamSeasonId}/settings`,
      requireEdit: true,
    },
  ];

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Team Header */}
      <div className='bg-white border-b'>
        <div className='max-w-7xl mx-auto px-8 py-6'>
          <h1 className='text-3xl font-bold'>{teamInfo.team_name}</h1>
          <p className='text-gray-600'>
            {teamInfo.club_name} • {teamInfo.season_name}
          </p>
          {access && (
            <span className='inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded'>
              {access.role}
            </span>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className='max-w-7xl mx-auto px-8'>
          <nav className='flex space-x-8'>
            {tabs.map((tab) => {
              // Hide tabs based on permissions
              if (tab.requireEdit && !canEdit) return null;
              if (tab.requireAuth && !access) return null;

              const isActive = pathname.startsWith(tab.href);

              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`py-4 border-b-2 transition ${
                    isActive
                      ? "border-blue-600 text-blue-600 font-semibold"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Page Content */}
      <div className='max-w-7xl mx-auto'>{children}</div>
    </div>
  );
}
