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

  // Handle screen size + auto-open on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-close sidebar when route changes (mobile only)
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!user) return <p>Loading...</p>;
  if (!mounted) return null;

  const { userName, jobTitle, initials } = user;

  return (
    <>
      {/* Hamburger Button - Mobile Only */}
      <button
        onClick={() => setSidebarOpen((prev) => !prev)}
        className='fixed top-4 left-4 z-[1200] bg-transparent border-none cursor-pointer lg:hidden'
        aria-label='Toggle menu'
      >
        {sidebarOpen ? (
          <X size={28} className='text-white' />
        ) : (
          <Menu size={28} className='text-text' />
        )}
      </button>

      {/* Backdrop - Mobile Only */}
      <div
        className={`fixed inset-0 bg-black/40 z-[1000] transition-opacity duration-300 lg:hidden ${
          sidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-60 bg-gradient-to-br from-primary to-secondary text-white z-[1100] transition-transform duration-300 ease-in-out ${
          sidebarOpen
            ? "translate-x-0 shadow-[4px_0_20px_rgba(0,0,0,0.1)]"
            : "-translate-x-full"
        } lg:relative lg:w-[280px] lg:translate-x-0 lg:shadow-none`}
      >
        {/* Header */}
        <div className='p-6 border-b border-white/10'>
          <h1 className='text-2xl font-bold mb-2 bg-gradient-to-r from-white to-[#e2e8f0] bg-clip-text text-transparent'>
            RBT Forms
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
        <nav className='py-6'>
          {navItems.map((item, key) => {
            const isActive = pathname === item.id;
            const Icon = item.icon;

            return (
              <Button
                key={key}
                variant='primary'
                onClick={() =>
                  item.link
                    ? window.open(item.link, "_blank")
                    : router.push(item.id)
                }
              >
                <div size={20}>
                  {Icon}
                  {item.label}
                </div>
              </Button>
              // <Button
              //   key={`${item.id}${key}`}
              //   onClick={() =>
              //     item.link
              //       ? window.open(item.link, "_blank")
              //       : router.push(item.id)
              //   }
              //   // className={`w-full flex items-center gap-4 px-6 py-4 text-white text-base cursor-pointer transition-all duration-200 border-l-4 ${
              //   //   isActive
              //   //     ? "bg-white/10 border-[#38bdf8]"
              //   //     : "bg-transparent border-transparent hover:bg-white/10 hover:translate-x-1"
              //   // }`}
              // >
              //   <div size={20}>
              //     {Icon} {item.label}
              //   </div>
              // </Button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className='absolute bottom-6 left-6 right-6'>
          {/* <button
            onClick={() => console.log("Logout")}
            className='w-full flex items-center gap-4 px-6 py-4 bg-transparent border-transparent text-white text-base cursor-pointer transition-all duration-200 hover:bg-white/10 hover:translate-x-1 border-l-4'
          >
            <LogOut size={20} />
            Logout
          </button> */}
          <AuthLogoutButton />
        </div>
      </aside>
    </>
  );
}

export default NavBar;
