// app/teams/[teamSeasonId]/TeamLayoutClient.jsx
"use client";

import { createContext, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Permissions } from "@/lib/clientPermissions";
import { ChevronDown, Menu, LogIn, Settings } from "lucide-react";
import { TEAM_ROUTES } from "@/lib/config/teamRoutes";

// ✅ Create context to share layout data with nested pages
export const TeamContext = createContext(null);

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

  // ✅ Calculate permissions once in layout
  const permissions = {
    canEdit: access ? Permissions.canEditTeam(access) : false,
    canManageRoster: access ? Permissions.canManageRoster(access) : false,
    canEnterStats: access ? Permissions.canEnterStats(access) : false,
    canViewEvents: access ? Permissions.canViewTeam(access) : false,
  };

  // Build tabs with visibility rules
  const tabs = TEAM_ROUTES.map((route) => {
    const tab = {
      name: route.name,
      href: `/teams/${teamSeasonId}${route.path ? `/${route.path}` : ""}`,
      exact: route.exact,
    };

    // Apply visibility rules
    switch (route.path) {
      case "events":
        tab.visible = isAuthenticated && permissions.canViewEvents;
        break;
      case "settings":
        tab.visible = isAuthenticated && permissions.canEdit;
        tab.icon = Settings;
        break;
      default:
        tab.visible = true; // Public routes
    }

    return tab;
  }).filter((tab) => tab.visible);

  const handleTeamSwitch = (newTeamSeasonId) => {
    setShowTeamSwitcher(false);
    const pathParts = pathname.split("/");
    const currentPage = pathParts[pathParts.length - 1];

    if (currentPage && currentPage !== teamSeasonId) {
      router.push(`/teams/${newTeamSeasonId}/${currentPage}`);
    } else {
      router.push(`/teams/${newTeamSeasonId}`);
    }
  };

  // ✅ Provide context to all children
  const contextValue = {
    teamInfo,
    relatedTeams,
    access,
    teamSeasonId,
    user,
    isAuthenticated,
    permissions,
  };

  return (
    <TeamContext.Provider value={contextValue}>
      <div className='flex flex-col min-h-screen bg-background'>
        {/* Team Header */}
        <div className='flex-shrink-0 bg-surface border-b border-border'>
          <div className='max-w-7xl mx-auto px-4 sm:px-8 py-4'>
            <div className='flex items-center justify-between'>
              {/* Team Info */}
              <div className='flex items-center space-x-4'>
                <div>
                  <h1 className='text-2xl sm:text-3xl font-bold text-text'>
                    {teamInfo.team_name}
                  </h1>
                  <p className='text-sm text-muted'>
                    {teamInfo.club_name} • {teamInfo.season_name}
                  </p>
                </div>

                {/* Team Switcher */}
                {relatedTeams.length > 0 && (
                  <div className='relative'>
                    <button
                      onClick={() => setShowTeamSwitcher(!showTeamSwitcher)}
                      className='p-2 hover:bg-primary/10 rounded-lg transition'
                      aria-label='Switch team'
                    >
                      <ChevronDown className='w-5 h-5 text-text' />
                    </button>

                    {showTeamSwitcher && (
                      <>
                        <div
                          className='fixed inset-0 z-40'
                          onClick={() => setShowTeamSwitcher(false)}
                        />

                        <div className='absolute top-full left-0 mt-2 w-64 bg-surface rounded-lg shadow-lg border border-border p-2 z-50'>
                          <div className='px-4 py-2 text-xs font-semibold text-text-label uppercase'>
                            Other Teams
                          </div>
                          {relatedTeams.map((team) => (
                            <button
                              key={team.team_season_id}
                              onClick={() =>
                                handleTeamSwitch(team.team_season_id)
                              }
                              className='w-full text-left px-4 py-2 hover:bg-primary/10 transition'
                            >
                              <div className='font-medium text-text'>
                                {team.team_name}
                              </div>
                              <div className='text-xs text-muted'>
                                {team.season_name}
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Right Side - Auth Status */}
              <div className='flex items-center space-x-3'>
                {isAuthenticated ? (
                  <>
                    {access && (
                      <span className='hidden sm:inline-block px-3 py-1 bg-success/10 text-success text-xs rounded-full font-semibold capitalize'>
                        {access.role}
                      </span>
                    )}
                    <span className='text-sm text-muted hidden md:block'>
                      {user?.email}
                    </span>
                  </>
                ) : (
                  <Link
                    href={`/auth/login?redirect=/teams/${teamSeasonId}`}
                    className='flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-accent-hover transition'
                  >
                    <LogIn className='w-4 h-4' />
                    <span>Sign In</span>
                  </Link>
                )}

                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className='sm:hidden p-2 hover:bg-primary/10 rounded-lg'
                  aria-label='Toggle menu'
                >
                  <Menu className='w-6 h-6 text-text' />
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className='max-w-7xl mx-auto px-4 sm:px-8 hidden sm:block'>
            <nav className='flex space-x-8'>
              {tabs.map((tab) => {
                const isActive = tab.exact
                  ? pathname === tab.href
                  : pathname.startsWith(tab.href);

                const Icon = tab.icon;

                return (
                  <Link
                    key={tab.name}
                    href={tab.href}
                    className={`py-4 border-b-2 transition flex items-center space-x-1 ${
                      isActive
                        ? "border-primary text-primary font-semibold"
                        : "border-transparent text-muted hover:text-text"
                    }`}
                  >
                    {Icon && <Icon className='w-4 h-4' />}
                    <span>{tab.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className='sm:hidden border-t border-border bg-surface'>
              <nav className='px-4 py-2 space-y-1'>
                {tabs.map((tab) => {
                  const isActive = tab.exact
                    ? pathname === tab.href
                    : pathname.startsWith(tab.href);

                  const Icon = tab.icon;

                  return (
                    <Link
                      key={tab.name}
                      href={tab.href}
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center space-x-2 py-2 px-3 rounded transition ${
                        isActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted hover:bg-primary/5 hover:text-text"
                      }`}
                    >
                      {Icon && <Icon className='w-4 h-4' />}
                      <span>{tab.name}</span>
                    </Link>
                  );
                })}

                {!isAuthenticated && (
                  <Link
                    href={`/auth/login?redirect=/teams/${teamSeasonId}`}
                    onClick={() => setShowMobileMenu(false)}
                    className='flex items-center space-x-2 py-2 px-3 text-primary font-semibold'
                  >
                    <LogIn className='w-4 h-4' />
                    <span>Sign In</span>
                  </Link>
                )}
              </nav>
            </div>
          )}
        </div>

        {/* Page Content - Scrollable Area */}
        <div className='flex-1 overflow-hidden'>{children}</div>
      </div>
    </TeamContext.Provider>
  );
}
