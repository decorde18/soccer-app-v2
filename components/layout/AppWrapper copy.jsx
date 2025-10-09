"use client";
// import React from "react";
// import NavBar from "./NavBar";
// import Header from "./Header";
// import Footer from "./Footer";
// import Providers from "@/contexts/Providers";

// export default function AppWrapper({ children }) {
//   return (
//     <Providers>
//       <div className='layout'>
//         <div className='main-body'>
//           <NavBar />
//           <div className='main-content'>
//             <Header />
//             {children}
//           </div>
//         </div>
//         <Footer>
//           <p>
//             &copy; {new Date().getFullYear()}{" "}
//             <span lang='en'>David Cordero de Jesus</span>
//           </p>
//         </Footer>
//       </div>
//     </Providers>
//   );
// }
import React, { useState, useEffect } from "react";
import {
  Menu,
  X,
  Home,
  FileText,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Bell,
  Search,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  ShoppingCart,
  UserCheck,
} from "lucide-react";

// Mock user data - replace with your auth context
const mockUser = {
  name: "John Doe",
  role: "admin", // admin, user, or guest
  initials: "JD",
  email: "john.doe@company.com",
};

// Navigation items with role requirements
const navItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
    minRole: "guest",
    path: "/dashboard",
  },
  {
    id: "documents",
    label: "Documents",
    icon: FileText,
    minRole: "user",
    path: "/documents",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    minRole: "user",
    path: "/analytics",
  },
  {
    id: "reports",
    label: "Reports",
    icon: Activity,
    minRole: "user",
    path: "/reports",
  },
  {
    id: "team",
    label: "Team Management",
    icon: Users,
    minRole: "admin",
    path: "/team",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    minRole: "admin",
    path: "/settings",
  },
];

// Role hierarchy
const roleHierarchy = { guest: 0, user: 1, admin: 2 };

const canAccessItem = (userRole, minRole) => {
  return roleHierarchy[userRole] >= roleHierarchy[minRole];
};

// Dashboard stat cards
const statCards = [
  {
    title: "Total Revenue",
    value: "$45,231",
    change: "+20.1%",
    trend: "up",
    icon: DollarSign,
  },
  {
    title: "Active Users",
    value: "2,345",
    change: "+15.3%",
    trend: "up",
    icon: UserCheck,
  },
  {
    title: "Orders",
    value: "1,234",
    change: "-5.2%",
    trend: "down",
    icon: ShoppingCart,
  },
  {
    title: "Conversion Rate",
    value: "3.24%",
    change: "+8.4%",
    trend: "up",
    icon: TrendingUp,
  },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    setMounted(true);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [currentPage]);

  if (!mounted) return null;

  const filteredNavItems = navItems.filter((item) =>
    canAccessItem(mockUser.role, item.minRole)
  );

  return (
    <div className='flex flex-col h-screen overflow-hidden bg-background'>
      {/* Hamburger Button - Mobile Only */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className='fixed top-4 left-4 z-[60] p-2 rounded-md bg-surface shadow-md lg:hidden hover:bg-surface/80 transition-colors'
        aria-label='Toggle menu'
      >
        {sidebarOpen ? (
          <X size={24} className='text-text' />
        ) : (
          <Menu size={24} className='text-text' />
        )}
      </button>

      {/* Backdrop - Mobile Only */}
      <div
        className={`fixed inset-0 bg-black/50 z-[40] transition-opacity duration-300 lg:hidden ${
          sidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <div className='flex flex-1 min-h-0 overflow-hidden'>
        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 h-full w-[280px] bg-gradient-to-br from-primary to-secondary text-white z-[50] transition-transform duration-300 ease-in-out shadow-xl ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:relative lg:translate-x-0`}
        >
          {/* Sidebar Header */}
          <div className='p-6 border-b border-white/10'>
            <h1 className='text-2xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent'>
              MyApp
            </h1>
            <p className='text-sm text-white/70 mt-1'>Enterprise Dashboard</p>
          </div>

          {/* Navigation */}
          <nav className='flex-1 py-4 overflow-y-auto'>
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center gap-3 px-6 py-3 text-white text-sm font-medium transition-all duration-200 border-l-4 ${
                    isActive
                      ? "bg-white/15 border-white shadow-lg"
                      : "bg-transparent border-transparent hover:bg-white/10 hover:border-white/30"
                  }`}
                >
                  <Icon size={20} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className='p-4 border-t border-white/10'>
            <div className='flex items-center gap-3 px-2 py-3 mb-2 rounded-lg bg-white/5'>
              <div className='w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center font-semibold text-sm'>
                {mockUser.initials}
              </div>
              <div className='flex-1 min-w-0'>
                <div className='font-semibold text-sm truncate'>
                  {mockUser.name}
                </div>
                <div className='text-xs text-white/70 capitalize'>
                  {mockUser.role}
                </div>
              </div>
            </div>
            <button
              onClick={() => console.log("Logout")}
              className='w-full flex items-center gap-3 px-4 py-2 text-white/90 text-sm font-medium rounded-lg hover:bg-white/10 transition-colors'
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className='flex-1 flex flex-col min-w-0 overflow-hidden'>
          {/* Header */}
          <header className='bg-surface border-b border-border shadow-sm z-30'>
            <div className='flex items-center justify-between px-4 lg:px-8 py-4'>
              {/* Left: Logo/Title (mobile) or Search */}
              <div className='flex items-center gap-4 flex-1 lg:pl-0 pl-12'>
                <h2 className='text-xl font-bold text-text lg:hidden'>MyApp</h2>
                <div className='hidden lg:flex items-center gap-2 flex-1 max-w-md'>
                  <div className='relative flex-1'>
                    <Search
                      className='absolute left-3 top-1/2 -translate-y-1/2 text-muted'
                      size={18}
                    />
                    <input
                      type='text'
                      placeholder='Search...'
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className='w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all'
                    />
                  </div>
                </div>
              </div>

              {/* Right: User Actions */}
              <div className='flex items-center gap-4'>
                <button className='relative p-2 rounded-lg hover:bg-background transition-colors'>
                  <Bell size={20} className='text-text' />
                  <span className='absolute top-1 right-1 w-2 h-2 bg-danger rounded-full'></span>
                </button>

                <div className='hidden lg:flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-background transition-colors cursor-pointer'>
                  <div className='w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center font-semibold text-sm text-white'>
                    {mockUser.initials}
                  </div>
                  <div className='text-sm'>
                    <div className='font-semibold text-text'>
                      {mockUser.name}
                    </div>
                  </div>
                  <ChevronDown size={16} className='text-muted' />
                </div>
              </div>
            </div>
          </header>

          {/* Main Content - Scrollable */}
          <main className='flex-1 overflow-y-auto bg-background'>
            <div className='p-4 lg:p-8'>
              {/* Page Title */}
              <div className='mb-6'>
                <h1 className='text-3xl font-bold text-text mb-2'>Dashboard</h1>
                <p className='text-muted'>
                  Welcome back, {mockUser.name}! Here's your overview.
                </p>
              </div>

              {/* Stat Cards */}
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
                {statCards.map((card, index) => {
                  const Icon = card.icon;
                  const TrendIcon =
                    card.trend === "up" ? TrendingUp : TrendingDown;

                  return (
                    <div
                      key={index}
                      className='bg-surface rounded-lg border border-border p-6 shadow-sm hover:shadow-md transition-shadow'
                    >
                      <div className='flex items-start justify-between mb-4'>
                        <div className='p-3 rounded-lg bg-primary/10'>
                          <Icon size={24} className='text-primary' />
                        </div>
                        <div
                          className={`flex items-center gap-1 text-sm font-medium ${
                            card.trend === "up" ? "text-success" : "text-danger"
                          }`}
                        >
                          <TrendIcon size={16} />
                          {card.change}
                        </div>
                      </div>
                      <h3 className='text-muted text-sm font-medium mb-1'>
                        {card.title}
                      </h3>
                      <p className='text-3xl font-bold text-text'>
                        {card.value}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Additional Content Area */}
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <div className='bg-surface rounded-lg border border-border p-6 shadow-sm'>
                  <h2 className='text-xl font-bold text-text mb-4'>
                    Recent Activity
                  </h2>
                  <div className='space-y-4'>
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className='flex items-start gap-3 pb-4 border-b border-border last:border-0'
                      >
                        <div className='w-2 h-2 rounded-full bg-primary mt-2'></div>
                        <div className='flex-1'>
                          <p className='text-sm text-text font-medium'>
                            Activity item {i}
                          </p>
                          <p className='text-xs text-muted mt-1'>2 hours ago</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className='bg-surface rounded-lg border border-border p-6 shadow-sm'>
                  <h2 className='text-xl font-bold text-text mb-4'>
                    Quick Actions
                  </h2>
                  <div className='grid grid-cols-2 gap-4'>
                    {[
                      "Create Report",
                      "Add User",
                      "View Analytics",
                      "Export Data",
                    ].map((action, i) => (
                      <button
                        key={i}
                        className='px-4 py-3 rounded-lg border border-border bg-background hover:bg-primary hover:text-white hover:border-primary transition-all text-sm font-medium text-text'
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className='bg-surface border-t border-border py-4 px-4 lg:px-8'>
            <p className='text-sm text-muted text-center'>
              © {new Date().getFullYear()} MyApp. All rights reserved.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
