// Additional Suggestions:
// You might also want to add:

// Player Stats - Quick access to individual player performance
// Timeline/Events - View chronological game events
// Substitutions - Quick sub management (if not in Game Management already)
// Export/Share - Generate reports or share game data

"use client";
import { Menu, X, ChevronRight, Home, Settings, BarChart2, Activity, Clock } from "lucide-react";
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

  // Auto-close on route change (mobile/tablet behavior)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (!game) return null;

  const baseGamePath = `/gamestats/${teamSeasonId}/${id}`;
  const isGameCompleted = gameStage === GAME_STAGES.END_GAME;

  // Check if we're currently on a "sub-page" (settings, lineup, or manage)
  const isOnSubPage =
    pathname.includes("/settings") ||
    pathname.includes("/manage");

  // Navigation items
  const navItems = [
    {
      id: "lineup",
      label: "Lineup",
      path: `${baseGamePath}/lineup`,
      icon: <UsersIcon className="w-5 h-5" />,
    },
    {
      id: "manage",
      label: "Game Management",
      path: `${baseGamePath}/manage`,
      icon: <Activity className="w-5 h-5" />,
    },
    {
      id: "settings",
      label: "Settings",
      path: `${baseGamePath}/settings`,
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  // Add conditional nav items
  if (!isGameCompleted && isOnSubPage) {
    navItems.unshift({
      id: "return-to-game",
      label: "Return to Game",
      path: `${baseGamePath}/live`,
      icon: <Activity className="w-5 h-5 text-emerald-400" />,
    });
  }

  if (isGameCompleted) {
    navItems.push({
      id: "summary",
      label: "Game Summary",
      path: `${baseGamePath}/summary`,
      icon: <BarChart2 className="w-5 h-5" />,
    });
  }

  const isDarkHeader = pathname?.includes("/live");

  const NavButton = ({ item }) => {
    const isActive = pathname === item.path;

    return (
      <Link
        href={item.path}
        className={`group relative flex items-center gap-4 px-4 py-3 text-sm font-medium transition-all duration-300 rounded-xl overflow-hidden ${
          isActive
            ? "bg-white/10 text-white shadow-lg backdrop-blur-sm border border-white/10"
            : "text-white/70 hover:text-white hover:bg-white/5"
        }`}
      >
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-secondary" />
        )}
        
        <span className={`transition-transform duration-300 ${isActive ? "scale-110 text-primary-light" : "group-hover:scale-110"}`}>
          {item.icon}
        </span>
        
        <span className="flex-1">{item.label}</span>
        
        {isActive && <ChevronRight className="w-4 h-4 text-white/50" />}
      </Link>
    );
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setSidebarOpen((prev) => !prev)}
        className={`print:hidden fixed top-4 left-4 z-[1200] w-16 h-16 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-105 active:scale-95 ${
          sidebarOpen 
            ? "translate-x-64 bg-transparent" 
            : "translate-x-0 bg-white/10 backdrop-blur-md border border-white/20 shadow-lg"
        }`}
        aria-label='Toggle menu'
      >
        {sidebarOpen ? (
          <X size={32} className='text-white' />
        ) : (
          <Menu
            size={32}
            className={`${isDarkHeader ? "text-white" : "text-gray-800"}`}
          />
        )}
      </button>

      {/* Backdrop */}
      <div
        className={`print:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] transition-all duration-500 ${
          sidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`print:hidden fixed top-0 left-0 h-full w-80 bg-[#0f172a] text-white z-[1100] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] border-r border-white/5 shadow-2xl ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className='flex flex-col h-full bg-gradient-to-b from-primary/10 to-transparent'>
          {/* Header Area */}
          <div className="p-6 pb-2">
            <div className="flex items-center gap-3 mb-8">
               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="text-xl">⚽</span>
               </div>
               <div>
                  <h2 className="font-bold text-lg leading-tight">Game Center</h2>
                  <p className="text-xs text-white/50">Manage your match</p>
               </div>
            </div>
            
            <div className="mb-6">
               <GameHeader />
            </div>
          </div>

          {/* Navigation */}
          <nav className='flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar'>
            <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 px-2">Menu</div>
            {navItems.map((item) => (
              <NavButton key={item.id} item={item} />
            ))}
          </nav>

          {/* Footer Info */}
          <div className='mt-auto p-6 border-t border-white/5 bg-black/20 backdrop-blur-md'>
            <div className='flex items-center justify-between text-xs text-white/40'>
               <span>Game ID</span>
               <span className="font-mono bg-white/5 px-2 py-1 rounded">{game.id}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

// Simple icon component for fallback since we're using lucide-react mainly
function UsersIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export default GameNavBar;
