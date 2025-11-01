"use client";
import { LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AuthLogoutButton from "@/app/auth/logout/AuthLogoutButton";
import { navItems } from "@/lib/config";
import Button from "../ui/Button";

function NavBar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!user) return <p>Loading...</p>;
  if (!mounted) return null;

  const { userName, jobTitle, initials } = user;

  const navItemsToShow = () => {
    // Find if current pathname matches any specific route section
    const matchingSection = navItems.find(
      (item) =>
        item.showOnUrl &&
        item.showOnUrl !== "all" &&
        pathname?.includes(item.showOnUrl)
    )?.showOnUrl;

    // Filter items based on the matching section
    const sectionSpecificItems = matchingSection
      ? navItems.filter((item) => item.showOnUrl === matchingSection)
      : navItems.filter((item) => !item.showOnUrl || item.showOnUrl === "all");

    // Always include "all" items and remove duplicates
    const allItems = navItems.filter((item) => item.showOnUrl === "all");
    const uniqueItems = [
      ...allItems,
      ...sectionSpecificItems.filter((item) => item.showOnUrl !== "all"),
    ];

    return uniqueItems;
  };

  // Determine sidebar classes based on whether we're on gameStats
  const isGameStatsRoute = pathname?.includes("/gameStats");
  const sidebarClasses = isGameStatsRoute
    ? // GameStats: always mobile behavior (closed by default, hamburger always visible)
      `fixed top-0 left-0 h-full w-60 bg-gradient-to-br from-primary to-secondary text-white z-[1100] transition-transform duration-300 ease-in-out ${
        sidebarOpen
          ? "translate-x-0 shadow-[4px_0_20px_rgba(0,0,0,0.1)]"
          : "-translate-x-full"
      }`
    : // Regular routes: desktop sidebar, mobile hamburger
      `fixed top-0 left-0 h-full w-60 bg-gradient-to-br from-primary to-secondary text-white z-[1100] transition-transform duration-300 ease-in-out ${
        sidebarOpen
          ? "translate-x-0 shadow-[4px_0_20px_rgba(0,0,0,0.1)]"
          : "-translate-x-full"
      } lg:relative lg:w-[280px] lg:translate-x-0 lg:shadow-none`;

  return (
    <>
      {/* Hamburger Button - Mobile Only (or always for GameStats) */}
      <button
        onClick={() => setSidebarOpen((prev) => !prev)}
        className={`w-14 fixed top-4 left-4 z-[1200] bg-transparent border-none cursor-pointer ${
          isGameStatsRoute ? "" : "lg:hidden"
        }`}
        aria-label='Toggle menu'
      >
        {sidebarOpen ? (
          <X size={28} className='text-white' />
        ) : (
          <Menu
            size={28}
            className={`transition-colors duration-300 ${
              isDarkHeader ? "text-white" : "text-text"
            }`}
          />
        )}
      </button>

      {/* Backdrop - Mobile Only (or always for GameStats) */}
      <div
        className={`fixed inset-0 bg-black/40 z-[1000] transition-opacity duration-300 ${
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
        {/* Header */}
        <div className='p-6 border-b border-white/10'>
          <h1 className='text-2xl font-bold mb-2 bg-gradient-to-r from-white to-[#e2e8f0] bg-clip-text text-transparent'>
            Soccer Stats App
          </h1>

          {/* User Info */}
          <div className='flex items-center gap-3 mt-4'>
            <div className='w-10 h-10 rounded-full bg-gradient-to-br from-[#38bdf8] to-[#06b6d4] flex items-center justify-center font-semibold'>
              {initials}
            </div>
            <div>
              <div className='font-semibold'>{userName}</div>
              <div className='text-sm opacity-80'>{jobTitle}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className='py-6 left-6 right-6'>
          {navItemsToShow().map((item, key) => {
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
                className={`w-full flex items-center gap-4 px-6 py-4 text-white text-base cursor-pointer transition-all duration-200 border-l-4 ${
                  isActive
                    ? "bg-white/10 border-[#38bdf8]"
                    : "bg-transparent border-transparent hover:bg-white/10 hover:translate-x-1"
                }`}
              >
                <div size={20}>
                  {Icon} {item.label}
                </div>
              </Button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className='absolute bottom-6 left-6 right-6'>
          <AuthLogoutButton />
        </div>
      </aside>
    </>
  );
}

export default NavBar;
