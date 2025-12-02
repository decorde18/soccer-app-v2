// Additional Suggestions:
// You might also want to add:

// Player Stats - Quick access to individual player performance
// Timeline/Events - View chronological game events
// Substitutions - Quick sub management (if not in Game Management already)
// Export/Share - Generate reports or share game data

"use client";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";

import useGameStore from "@/stores/gameStore";
import GameHeader from "@/components/layout/gameLayout/GameHeader";

function GameNavBar() {
  const { id, teamSeasonId } = useParams();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const game = useGameStore((s) => s.game);
  const gameStage = useGameStore((s) => s.getGameStage());
  const GAME_STAGES = useGameStore((s) => s.GAME_STAGES);

  // Auto-close on route change (mobile behavior)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (!game) return null;

  const baseGamePath = `/gamestats/${teamSeasonId}/${id}`;
  const isGameCompleted = gameStage === GAME_STAGES.END_GAME;

  // Check if we're currently on a "sub-page" (settings, lineup, or manage)
  const isOnSubPage =
    pathname.includes("/settings") ||
    // pathname.includes("/lineup") ||
    pathname.includes("/manage");

  // Navigation items
  const navItems = [
    {
      id: "lineup",
      label: "Lineup",
      path: `${baseGamePath}/lineup`,
      icon: "👥",
    },
    {
      id: "manage",
      label: "Game Management",
      path: `${baseGamePath}/manage`,
      icon: "⚽",
    },
    {
      id: "settings",
      label: "Settings",
      path: `${baseGamePath}/settings`,
      icon: "⚙️",
    },
  ];

  // Add conditional nav items
  if (!isGameCompleted && isOnSubPage) {
    navItems.unshift({
      id: "return-to-game",
      label: "Return to Game",
      path: `${baseGamePath}/live`,
      icon: "🔴",
    });
  }

  if (isGameCompleted) {
    navItems.push({
      id: "summary",
      label: "Game Summary",
      path: `${baseGamePath}/summary`,
      icon: "📋",
    });
  }

  const isDarkHeader = pathname?.includes("/live");

  const NavButton = ({ item }) => {
    const isActive = pathname === item.path;

    return (
      <Link
        href={item.path}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-white text-sm cursor-pointer transition-all duration-200 rounded-lg ${
          isActive
            ? "bg-white/15 backdrop-blur-sm shadow-lg"
            : "bg-transparent hover:bg-white/10 hover:translate-x-1"
        }`}
      >
        <span className='text-base'>{item.icon}</span>
        <span className='font-medium flex-1 text-left'>{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setSidebarOpen((prev) => !prev)}
        className='w-14 fixed top-4 left-4 z-[1200] bg-transparent border-none cursor-pointer transition-transform hover:scale-110'
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
          sidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-gradient-to-br from-primary to-secondary text-white z-[1100] transition-transform duration-300 ease-in-out ${
          sidebarOpen
            ? "translate-x-0 shadow-[4px_0_20px_rgba(0,0,0,0.2)]"
            : "-translate-x-full"
        }`}
      >
        <div className='flex flex-col h-full'>
          {/* Header */}
          <GameHeader />

          {/* Navigation */}
          <nav className='flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar'>
            {navItems.map((item) => (
              <NavButton key={item.id} item={item} />
            ))}
          </nav>

          {/* Footer Info */}
          <div className='flex-shrink-0 p-4 border-t border-white/10 bg-gradient-to-t from-black/10 to-transparent'>
            <div className='text-xs text-white/60 text-center'>
              Game ID: {game.id}
            </div>
          </div>
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

export default GameNavBar;
