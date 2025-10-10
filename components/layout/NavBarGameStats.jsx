"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import Button from "../ui/Button";
import { navItemsGameStats } from "@/lib/config";

function NavBarGameStats() {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-close sidebar when route changes (mobile only)
  // useEffect(() => {
  //   setSidebarOpen(false);
  // }, [pathname]);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setSidebarOpen((prev) => !prev)}
        className='fixed top-4 left-4 z-[1200] bg-transparent border-none cursor-pointer '
        aria-label='Toggle menu'
      >
        {sidebarOpen ? (
          <X size={28} className='text-white' />
        ) : (
          <Menu size={28} className='text-text' />
        )}
      </button>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-[1000] transition-opacity duration-300  ${
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
        } `}
      >
        {/* Navigation */}
        <nav className='py-24 left-6 right-6'>
          {navItemsGameStats.map((item, key) => {
            const isActive = pathname === item.id;
            const Icon = item.icon;

            return (
              <Button
                key={`${item.id}${key}`}
                onClick={() =>
                  item.link
                    ? window.open(`${pathname}${item.link}`, "_blank")
                    : router.push(`${pathname}${item.id}`)
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
      </aside>
    </>
  );
}

export default NavBarGameStats;
