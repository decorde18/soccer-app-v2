"use client";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

import Button from "../ui/Button";
import useAuthStore from "@/stores/authStore";
import LogoutButton from "@/app/(public)/auth/LogoutButton";
import { getNavSectionsForUser } from "@/lib/roleutils";
import { navItems } from "@/lib/config";

function NavBar() {
  const user = useAuthStore((s) => s.user);

  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Detect if we're on a "dark" page (like /live or /gameStats)
  const isDarkHeader = pathname?.includes("/live");

  // Handle screen size + auto-open on desktop (but NOT for gameStats)
  useEffect(() => {
    const handleResize = () => {
      // Only auto-open on desktop if NOT on gameStats routes
      if (!pathname?.includes("/gameStats") && window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [pathname]);

  // Auto-close sidebar when route changes (mobile only, or always for gameStats)
  useEffect(() => {
    if (window.innerWidth < 1024 || pathname?.includes("/gameStats")) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  const sections = getNavSectionsForUser(user, navItems);

  // Determine sidebar classes based on whether we're on gameStats
  const isGameStatsRoute = pathname?.includes("/gameStats");
  const sidebarClasses = isGameStatsRoute
    ? // GameStats: always mobile behavior (closed by default, hamburger always visible)
      `fixed top-0 left-0 h-full w-64 bg-gradient-to-br from-primary to-secondary text-white z-[1100] transition-transform duration-300 ease-in-out ${
        sidebarOpen
          ? "translate-x-0 shadow-[4px_0_20px_rgba(0,0,0,0.2)]"
          : "-translate-x-full"
      }`
    : // Regular routes: desktop sidebar, mobile hamburger
      `fixed top-0 left-0 h-full w-64 bg-gradient-to-br from-primary to-secondary text-white z-[1100] transition-transform duration-300 ease-in-out ${
        sidebarOpen
          ? "translate-x-0 shadow-[4px_0_20px_rgba(0,0,0,0.2)]"
          : "-translate-x-full"
      } lg:relative lg:w-[280px] lg:translate-x-0 lg:shadow-none`;

  return (
    <>
      {/* Hamburger Button - Mobile Only (or always for GameStats) */}
      <button
        onClick={() => setSidebarOpen((prev) => !prev)}
        className={`w-14 fixed top-4 left-4 z-[1200] bg-transparent border-none cursor-pointer transition-transform hover:scale-110 ${
          isGameStatsRoute ? "" : "lg:hidden"
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

      {/* Backdrop - Mobile Only (or always for GameStats) */}
      <div
        className={`fixed inset-0 bg-black/50 z-[1000] transition-opacity duration-300 ${
          isGameStatsRoute ? "" : "lg:hidden"
        } ${
          sidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={sidebarClasses}>
        {/* Flex container to handle scrolling properly */}
        <div className='flex flex-col h-full'>
          {/* Header - Fixed */}
          <div className='flex-shrink-0 p-6 border-b border-white/10'>
            <h1 className='text-2xl font-bold mb-1 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent'>
              Soccer Stats
            </h1>
            <p className='text-xs text-white/60 uppercase tracking-wider'>
              Pro Platform
            </p>
          </div>

          {/* Navigation - Scrollable */}
          <nav className='flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar'>
            {sections.map(({ section, items }) =>
              items.length ? (
                <div key={section}>
                  <div className='text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 px-4'>
                    {section}
                  </div>
                  <div className='space-y-1'>
                    {items.map((item, key) => {
                      const isActive = pathname === item.id;
                      const Icon = item.icon;

                      return (
                        <Button
                          key={`${item.id}${key}`}
                          onClick={() =>
                            item.link
                              ? window.open(item.link, "_blank")
                              : router.push(item.id)
                          }
                          className={`w-full flex items-center gap-3 px-4  text-white text-sm cursor-pointer transition-all duration-200 rounded-lg ${
                            isActive
                              ? "bg-white/15 backdrop-blur-sm shadow-lg"
                              : "bg-transparent hover:bg-white/10 hover:translate-x-1"
                          }`}
                        >
                          <div className='flex items-center gap-3 w-full'>
                            {Icon && <span className='text-lg'>{Icon}</span>}
                            <span className='font-medium'>{item.label}</span>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ) : null
            )}
          </nav>

          {/* Footer Actions - Fixed */}
          {user && (
            <div className='flex-shrink-0 p-4 border-t border-white/10 space-y-1 pr-8 bg-gradient-to-t from-black/10 to-transparent'>
              {/* <Button
                onClick={() => router.push("/settings")}
                className={`w-full flex items-center gap-3 px-4 text-white text-sm cursor-pointer transition-all duration-200 rounded-lg ${
                  pathname === "/settings"
                    ? "bg-white/15 backdrop-blur-sm shadow-lg"
                    : "bg-transparent hover:bg-white/10 hover:translate-x-1"
                }`}
              >
                <Settings size={20} />
                <span className='font-medium'>Settings</span>
              </Button> */}
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

          /* Firefox */
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
