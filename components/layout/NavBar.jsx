"use client";
import { Menu, X, ChevronDown, ChevronRight, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

import Button from "../ui/Button";

import { useUserContextStore } from "@/stores/userContextStore";
import useGameStore from "@/stores/gameStore";
import LogoutButton from "@/app/(public)/auth/LogoutButton";
import {
  buildCompleteNavigation,
  getRoleBadgeInfo,
} from "@/lib/navigationUtils";
import useAuthStore from "@/stores/authStore";

// import { formatTime } from "@/lib/timeUtils";

function NavBar() {
  const user = useAuthStore((s) => s.user);
  const { myTeams, myClubs } = useUserContextStore();
  const router = useRouter();
  const pathname = usePathname();

  // Game-specific state
  const game = useGameStore((s) => s.game);
  const gameStage = useGameStore((s) => s.getGameStage());
  const GAME_STAGES = useGameStore((s) => s.GAME_STAGES);
  const getCurrentPeriodLabel = useGameStore((s) => s.getCurrentPeriodLabel());

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedClubs, setExpandedClubs] = useState({});
  const [expandedTeams, setExpandedTeams] = useState({});

  // Detect if we're in a game route
  const isGameRoute =
    pathname?.includes("/gamestats/") && pathname?.match(/\/gamestats\/[^/]+/);
  const isDarkHeader = pathname?.includes("/live");

  // Handle screen size + auto-open on desktop (but NOT for game routes)
  useEffect(() => {
    const handleResize = () => {
      if (!isGameRoute && window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [pathname, isGameRoute]);

  // Auto-close sidebar when route changes (mobile only, or always for game routes)
  useEffect(() => {
    if (window.innerWidth < 1024 || isGameRoute) {
      setSidebarOpen(false);
    }
  }, [pathname, isGameRoute]);

  // Auto-expand the club/team that contains the current route
  useEffect(() => {
    const teamMatch = pathname?.match(/\/teams\/(\d+)/);
    if (teamMatch && myTeams.length > 0) {
      const teamSeasonId = parseInt(teamMatch[1]);
      const team = myTeams.find((t) => t.team_season_id === teamSeasonId);

      if (team) {
        setExpandedClubs((prev) => ({ ...prev, [team.club_id]: true }));
        setExpandedTeams((prev) => ({ ...prev, [teamSeasonId]: true }));
      }
    }
  }, [pathname, myTeams]);

  // Toggle functions
  const toggleClub = (clubId) => {
    setExpandedClubs((prev) => ({ ...prev, [clubId]: !prev[clubId] }));
  };

  const toggleTeam = (teamSeasonId) => {
    setExpandedTeams((prev) => ({
      ...prev,
      [teamSeasonId]: !prev[teamSeasonId],
    }));
  };

  // Get the appropriate navigation based on route
  const getNavigation = () => {
    if (isGameRoute && game) {
      return getGameNavigation();
    }
    return buildCompleteNavigation(user, myTeams, myClubs);
  };

  // Build game-specific navigation based on game stage
  const getGameNavigation = () => {
    const baseGamePath = `/gamestats/${game.id}`;

    // Helper to get the correct "Return to Game" path
    const getReturnPath = () => {
      switch (gameStage) {
        case GAME_STAGES.BEFORE_START:
          return `${baseGamePath}`;
        case GAME_STAGES.DURING_PERIOD:
        case GAME_STAGES.IN_STOPPAGE:
          return `${baseGamePath}/live`;
        case GAME_STAGES.BETWEEN_PERIODS:
          return `${baseGamePath}/period-break`;
        case GAME_STAGES.END_GAME:
          return `${baseGamePath}/summary`;
        default:
          return baseGamePath;
      }
    };

    const sections = [
      {
        id: "game-overview",
        label: "Game Overview",
        items: [
          {
            id: "return-to-game",
            label: "Return to Game",
            path: getReturnPath(),
            icon: "⚽",
          },
          {
            id: "lineup",
            label: "Lineup",
            path: `${baseGamePath}/lineup`,
            icon: "👥",
          },
          {
            id: "settings",
            label: "Game Settings",
            path: `${baseGamePath}/settings`,
            icon: "⚙️",
          },
        ],
      },
    ];

    // Add stage-specific navigation
    if (gameStage !== GAME_STAGES.BEFORE_START) {
      sections.push({
        id: "game-stats",
        label: "Statistics",
        items: [
          {
            id: "live-stats",
            label: "Live Stats",
            path: `${baseGamePath}/stats`,
            icon: "📊",
          },
          {
            id: "player-stats",
            label: "Player Stats",
            path: `${baseGamePath}/player-stats`,
            icon: "👤",
          },
        ],
      });
    }

    if (gameStage === GAME_STAGES.END_GAME) {
      sections.push({
        id: "game-review",
        label: "Game Review",
        items: [
          {
            id: "summary",
            label: "Game Summary",
            path: `${baseGamePath}/summary`,
            icon: "📋",
          },
          {
            id: "highlights",
            label: "Highlights",
            path: `${baseGamePath}/highlights`,
            icon: "✨",
          },
        ],
      });
    }

    return sections;
  };

  const sections = getNavigation();

  // Sidebar classes
  const sidebarClasses = isGameRoute
    ? `fixed top-0 left-0 h-full w-72 bg-gradient-to-br from-primary to-secondary text-white z-[1100] transition-transform duration-300 ease-in-out ${
        sidebarOpen
          ? "translate-x-0 shadow-[4px_0_20px_rgba(0,0,0,0.2)]"
          : "-translate-x-full"
      }`
    : `fixed top-0 left-0 h-full w-72 bg-gradient-to-br from-primary to-secondary text-white z-[1100] transition-transform duration-300 ease-in-out ${
        sidebarOpen
          ? "translate-x-0 shadow-[4px_0_20px_rgba(0,0,0,0.2)]"
          : "-translate-x-full"
      } lg:relative lg:translate-x-0 lg:shadow-none`;

  // Nav button component
  const NavButton = ({ item, indent = 0 }) => {
    const isActive = pathname === item.path;

    return (
      <Link
        href={item.path}
        className={`w-full flex items-center gap-3 py-2.5 text-white text-sm cursor-pointer transition-all duration-200 rounded-lg ${
          isActive
            ? "bg-white/15 backdrop-blur-sm shadow-lg"
            : "bg-transparent hover:bg-white/10 hover:translate-x-1"
        }`}
        style={{ paddingLeft: `${16 + indent * 12}px` }}
      >
        <div className='flex items-center gap-3 w-full'>
          {item.icon && <span className='text-base'>{item.icon}</span>}
          <span className='font-medium flex-1 text-left'>{item.label}</span>
          {item.badge && (
            <span className='text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white/90'>
              {item.badge}
            </span>
          )}
        </div>
      </Link>
    );
  };

  // Game header component
  const GameHeader = () => {
    if (!isGameRoute || !game) return null;

    const getStageDisplay = () => {
      switch (gameStage) {
        case GAME_STAGES.BEFORE_START:
          return { text: "Pre-Game", color: "bg-yellow-500/20" };
        case GAME_STAGES.DURING_PERIOD:
          return { text: getCurrentPeriodLabel, color: "bg-green-500/20" };
        case GAME_STAGES.BETWEEN_PERIODS:
          return { text: "Period Break", color: "bg-blue-500/20" };
        case GAME_STAGES.IN_STOPPAGE:
          return { text: "Stoppage", color: "bg-orange-500/20" };
        case GAME_STAGES.END_GAME:
          return { text: "Final", color: "bg-gray-500/20" };
        default:
          return { text: "Unknown", color: "bg-gray-500/20" };
      }
    };

    const stageInfo = getStageDisplay();

    return (
      <div className='p-4 border-b border-white/10 bg-black/10'>
        <div className='flex items-center justify-between mb-2'>
          <h2 className='text-lg font-bold text-white'>
            Game #{game.id.slice(-8)}
          </h2>
          <span
            className={`text-xs px-2 py-1 rounded-full ${stageInfo.color} text-white`}
          >
            {stageInfo.text}
          </span>
        </div>
        {game.homeTeam && game.awayTeam && (
          <div className='text-xs text-white/70'>
            {game.homeTeam} vs {game.awayTeam}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setSidebarOpen((prev) => !prev)}
        className={`w-14 fixed top-4 left-4 z-[1200] bg-transparent border-none cursor-pointer transition-transform hover:scale-110 ${
          isGameRoute ? "" : "lg:hidden"
        }`}
        aria-label='Toggle menu'
      >
        {sidebarOpen ? (
          <X size={28} className='text-white drop-shadow-lg' />
        ) : (
          <Menu
            size={28}
            className={`transition-colors duration-300 drop-shadow-lg ${
              isDarkHeader ? "text-white" : "text-text"
            }`}
          />
        )}
      </button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-[1000] transition-opacity duration-300 ${
          isGameRoute ? "" : "lg:hidden"
        } ${
          sidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={sidebarClasses}>
        <div className='flex flex-col h-full'>
          {/* Header */}
          {!isGameRoute ? (
            <div className='flex-shrink-0 p-6 border-b border-white/10'>
              <h1 className='text-2xl font-bold mb-1 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent'>
                Soccer Stats
              </h1>
              <p className='text-xs text-white/60 uppercase tracking-wider'>
                Pro Platform
              </p>
            </div>
          ) : (
            <GameHeader />
          )}

          {/* Navigation */}
          <nav className='flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar'>
            {sections.map((section) => (
              <div key={section.id}>
                {/* Section Header */}
                <div className='text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 px-4'>
                  {section.label}
                </div>

                {/* Simple list items */}
                {section.items && (
                  <div className='space-y-1'>
                    {section.items.map((item) => (
                      <NavButton key={item.id} item={item} />
                    ))}
                  </div>
                )}

                {/* Hierarchical structure (clubs > teams > routes) */}
                {section.type === "hierarchical" && section.clubs && (
                  <div className='space-y-1'>
                    {section.clubs.map((club) => (
                      <div key={club.club_id}>
                        {/* Club Header */}
                        <button
                          onClick={() => toggleClub(club.club_id)}
                          className='w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold hover:text-white/90 transition-colors rounded-lg hover:bg-white/5'
                        >
                          {expandedClubs[club.club_id] ? (
                            <ChevronDown size={14} />
                          ) : (
                            <ChevronRight size={14} />
                          )}
                          <span className='flex-1 text-left'>
                            {club.club_name}
                          </span>
                        </button>

                        {/* Teams under this club */}
                        {expandedClubs[club.club_id] && (
                          <div className='space-y-1 mt-1'>
                            {club.teams.map((team) => {
                              const badge = getRoleBadgeInfo(team.role);

                              return (
                                <div key={team.team_season_id}>
                                  {/* Team Header */}
                                  <div className='w-full flex items-center gap-2 px-4 py-2 ml-2'>
                                    <button
                                      onClick={() =>
                                        toggleTeam(team.team_season_id)
                                      }
                                      className='hover:bg-white/5 rounded p-1'
                                    >
                                      {expandedTeams[team.team_season_id] ? (
                                        <ChevronDown size={16} />
                                      ) : (
                                        <ChevronRight size={16} />
                                      )}
                                    </button>

                                    <Link
                                      href={`/teams/${team.team_season_id}`}
                                      className='flex-1 flex items-center gap-2 text-sm hover:bg-white/10 rounded-lg transition-all py-2 px-2'
                                    >
                                      <span className='flex-1 text-left font-medium truncate'>
                                        {team.team_name}
                                      </span>
                                      <span
                                        className={`text-[10px] px-2 py-0.5 rounded-full ${badge.color}`}
                                      >
                                        {badge.text}
                                      </span>
                                    </Link>
                                  </div>

                                  {/* Team Navigation */}
                                  {expandedTeams[team.team_season_id] && (
                                    <div className='space-y-1 mt-1 ml-2'>
                                      {team.navigation
                                        .filter((nav) => nav.type !== "divider")
                                        .map((navItem) => (
                                          <NavButton
                                            key={navItem.id}
                                            item={navItem}
                                            indent={2}
                                          />
                                        ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Footer Actions */}
          {user && (
            <div className='flex-shrink-0 p-4 border-t border-white/10 space-y-2 bg-gradient-to-t from-black/10 to-transparent'>
              <LogoutButton />
            </div>
          )}
        </div>

        {/* Custom Scrollbar Styles */}
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            margin: 8px 0;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            transition: background 0.2s;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
          }

          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05);
          }
        `}</style>
      </aside>
    </>
  );
}

export default NavBar;
