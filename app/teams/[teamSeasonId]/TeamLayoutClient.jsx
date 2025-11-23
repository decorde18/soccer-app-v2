// app/teams/[teamSeasonId]/TeamLayoutClient.jsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Permissions } from "@/lib/clientPermissions";
import { ChevronDown, Menu, LogIn } from "lucide-react";

export default function TeamLayoutClient({
  children,
  teamInfo,
  relatedTeams,
  access,
  teamSeasonId,
  user,
  isAuthenticated,
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [showTeamSwitcher, setShowTeamSwitcher] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // ✅ Safe permission checks (handle null access)
  const canEdit = access ? Permissions.canEditTeam(access) : false;
  const canManageRoster = access ? Permissions.canManageRoster(access) : false;
  const canViewEvents = access ? Permissions.canViewTeam(access) : false;

  // ✅ Define tabs with visibility rules
  const tabs = [
    {
      name: "Schedule",
      href: `/teams/${teamSeasonId}/schedule`,
      visible: true, // Always visible (public)
    },
    {
      name: "Roster",
      href: `/teams/${teamSeasonId}/roster`,
      visible: true, // Always visible (public)
    },
    {
      name: "Stats",
      href: `/teams/${teamSeasonId}/stats`,
      visible: true, // Always visible (public)
    },
    {
      name: "Events",
      href: `/teams/${teamSeasonId}/events`,
      visible: isAuthenticated && canViewEvents, // Auth required
    },
    {
      name: "Settings",
      href: `/teams/${teamSeasonId}/settings`,
      visible: isAuthenticated && canEdit, // Edit permission required
    },
  ];

  const handleTeamSwitch = (newTeamSeasonId) => {
    setShowTeamSwitcher(false);
    const currentPage = pathname.split("/").pop();
    router.push(`/teams/${newTeamSeasonId}/${currentPage}`);
  };
  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Team Header */}
      <div className='bg-white border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-8 py-4'>
          <div className='flex items-center justify-between'>
            {/* Team Info */}
            <div className='flex items-center space-x-4'>
              <div>
                <h1 className='text-2xl sm:text-3xl font-bold'>
                  {teamInfo.team_name}
                </h1>
                <p className='text-sm text-gray-600'>
                  {teamInfo.club_name} • {teamInfo.season_name}
                </p>
              </div>

              {/* Team Switcher (if related teams exist) */}
              {relatedTeams.length > 0 && (
                <div className='relative'>
                  <button
                    onClick={() => setShowTeamSwitcher(!showTeamSwitcher)}
                    className='p-2 hover:bg-gray-100 rounded-lg'
                  >
                    <ChevronDown className='w-5 h-5' />
                  </button>

                  {showTeamSwitcher && (
                    <div className='absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border py-2 z-50'>
                      <div className='px-4 py-2 text-xs font-semibold text-gray-500'>
                        Other Teams
                      </div>
                      {relatedTeams.map((team) => (
                        <button
                          key={team.team_season_id}
                          onClick={() => handleTeamSwitch(team.team_season_id)}
                          className='w-full text-left px-4 py-2 hover:bg-gray-50'
                        >
                          {team.team_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Side - Auth Status */}
            <div className='flex items-center space-x-3'>
              {isAuthenticated ? (
                <>
                  {access && (
                    <span className='hidden sm:inline-block px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-semibold'>
                      {access.role}
                    </span>
                  )}
                  <span className='text-sm text-gray-600 hidden sm:block'>
                    {user?.email}
                  </span>
                </>
              ) : (
                // ✅ Show login button for public visitors
                <Link
                  href={`/auth/login?redirect=/teams/${teamSeasonId}`}
                  className='flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition'
                >
                  <LogIn className='w-4 h-4' />
                  <span>Sign In</span>
                </Link>
              )}

              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className='sm:hidden p-2 hover:bg-gray-100 rounded-lg'
              >
                <Menu className='w-6 h-6' />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className='max-w-7xl mx-auto px-4 sm:px-8 hidden sm:block'>
          <nav className='flex space-x-8'>
            {tabs
              .filter((tab) => tab.visible)
              .map((tab) => {
                const isActive = pathname === tab.href;

                return (
                  <Link
                    key={tab.name}
                    href={tab.href}
                    className={`py-4 border-b-2 transition ${
                      isActive
                        ? "border-primary text-primary font-semibold"
                        : "border-transparent text-muted hover:text-gray-900"
                    }`}
                  >
                    {tab.name}
                  </Link>
                );
              })}
          </nav>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className='sm:hidden border-t'>
            <nav className='px-4 py-2 space-y-1'>
              {tabs
                .filter((tab) => tab.visible)
                .map((tab) => {
                  const isActive = pathname === tab.href;

                  return (
                    <Link
                      key={tab.name}
                      href={tab.href}
                      onClick={() => setShowMobileMenu(false)}
                      className={`block py-2 px-3 rounded ${
                        isActive
                          ? "bg-blue-50 text-blue-600 font-semibold"
                          : "text-gray-600"
                      }`}
                    >
                      {tab.name}
                    </Link>
                  );
                })}

              {/* Mobile login button */}
              {!isAuthenticated && (
                <Link
                  href={`/auth/login?redirect=/teams/${teamSeasonId}`}
                  className='block py-2 px-3 text-blue-600 font-semibold'
                >
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Page Content */}
      <div className='max-w-7xl mx-auto'>{children}</div>
    </div>
  );
}
