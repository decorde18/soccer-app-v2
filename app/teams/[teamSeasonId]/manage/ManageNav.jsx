// app/teams/[teamSeasonId]/manage/ManageNav.jsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Permissions } from "@/lib/clientPermissions";

export default function ManageNav({ teamSeasonId, access }) {
  const pathname = usePathname();

  const tabs = [
    {
      name: "Schedule",
      href: `/teams/${teamSeasonId}/manage/schedule`,
      permission: "can_edit",
    },
    {
      name: "Roster",
      href: `/teams/${teamSeasonId}/manage/roster`,
      permission: "can_manage_roster",
    },
    {
      name: "Stats Entry",
      href: `/teams/${teamSeasonId}/manage/stats`,
      permission: "can_enter_stats",
    },
    {
      name: "Settings",
      href: `/teams/${teamSeasonId}/manage/settings`,
      permission: "can_edit",
    },
  ];

  return (
    <div className='bg-white border-b mb-6'>
      <div className='max-w-7xl mx-auto px-8'>
        <div className='flex items-center justify-between py-4'>
          <h2 className='text-lg font-semibold text-gray-900'>
            Team Management
          </h2>
          <Link
            href={`/teams/${teamSeasonId}`}
            className='text-sm text-gray-600 hover:text-gray-900'
          >
            ← Back to Team
          </Link>
        </div>

        <nav className='flex space-x-8 -mb-px'>
          {tabs.map((tab) => {
            // Check permission
            if (tab.permission && !access?.[tab.permission]) {
              return null;
            }

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
  );
}
