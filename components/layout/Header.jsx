"use client";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { ChevronDown, Settings } from "lucide-react";
import useAuthStore from "@/stores/authStore";
import Link from "next/link";
import TeamSelector from "./TeamSelector";

function Header() {
  const user = useAuthStore((s) => s.user);
  const [mounted, setMounted] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

  // Track window size for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    // Set initial width
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuOpen && !e.target.closest(".user-menu-container")) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [userMenuOpen]);

  if (!user) return null;
  if (!mounted) return null;

  const { name, roles } = user;
  const firstNameInitial = user.first_name ? user.first_name[0] : "";
  const lastNameInitial = user.last_name ? user.last_name[0] : "";
  const initials = `${firstNameInitial}${lastNameInitial}`.toUpperCase();

  const formattedDate = format(new Date(), "EEEE, MMMM d, yyyy");

  // Responsive breakpoints (matching Tailwind defaults)
  const isXL = windowWidth >= 1280;
  const isSM = windowWidth >= 640;
  const isLG = windowWidth >= 1024;

  return (
    <header className='bg-surface border-b border-border sticky top-0 z-50 shadow-sm pt-2'>
      <div className='flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 h-16'>
        {/* Left - Date (hidden on mobile and tablet) */}
        {isXL && (
          <div className='text-sm text-muted whitespace-nowrap'>
            {formattedDate}
          </div>
        )}

        {/* Center - Team Selector - shifts right on mobile for hamburger */}
        <div className={`flex-1 flex justify-center ${!isLG ? "ml-14" : ""}`}>
          <TeamSelector type='header' />
        </div>

        {/* Right - User Menu */}
        <div className='relative user-menu-container flex justify-end'>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className='flex items-center gap-3 hover:bg-background rounded-lg p-2 transition-colors'
          >
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-semibold text-sm shadow-md'>
                {initials}
              </div>
              {isSM && (
                <div className='text-left'>
                  <div className='font-semibold text-sm text-text'>{name}</div>
                  <div className='text-xs text-muted capitalize'>
                    {roles[0]}
                  </div>
                </div>
              )}
            </div>
            {isSM && (
              <ChevronDown
                size={16}
                className={`text-muted transition-transform ${
                  userMenuOpen ? "rotate-180" : ""
                }`}
              />
            )}
          </button>

          {/* Dropdown Menu */}
          {userMenuOpen && (
            <div className='absolute right-0 mt-2 w-56 bg-surface rounded-lg shadow-lg border border-border py-2 z-50'>
              {/* User Info (mobile only) */}
              {!isSM && (
                <div className='px-4 py-3 border-b border-border'>
                  <div className='font-semibold text-sm text-text'>{name}</div>
                  <div className='text-xs text-muted capitalize'>
                    {roles[0]}
                  </div>
                </div>
              )}

              <Link href='/profile'>
                <button
                  onClick={() => setUserMenuOpen(false)}
                  className='w-full px-4 py-2 text-left text-sm text-text hover:bg-background transition-colors flex items-center gap-2'
                >
                  <div className='w-4 h-4 flex items-center justify-center'>
                    👤
                  </div>
                  View Profile
                </button>
              </Link>

              <Link href='/settings'>
                <button
                  onClick={() => setUserMenuOpen(false)}
                  className='w-full px-4 py-2 text-left text-sm text-text hover:bg-background transition-colors flex items-center gap-2'
                >
                  <Settings size={16} className='text-muted' />
                  Settings
                </button>
              </Link>

              <div className='border-t border-border my-2'></div>

              <Link href='/logout'>
                <button
                  onClick={() => setUserMenuOpen(false)}
                  className='w-full px-4 py-2 text-left text-sm text-danger hover:bg-red-50 transition-colors flex items-center gap-2'
                >
                  <div className='w-4 h-4 flex items-center justify-center'>
                    🚪
                  </div>
                  Logout
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
