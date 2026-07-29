import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  Upload,
  Camera,
  Clock,
  BarChart3,
  Cpu,
  Settings,
  Sun,
  Moon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAppStore } from "@/lib/store";

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Upload, label: "Upload", path: "/upload" },
  { icon: Camera, label: "Camera", path: "/live" },
  { icon: Clock, label: "History", path: "/history" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Cpu, label: "Model", path: "/model" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const TAB_ITEMS = NAV_ITEMS.slice(0, 5);

function DesktopSidebar() {
  const location = useLocation();
  const { theme, toggleTheme } = useAppStore();

  return (
    <aside
      className="hidden md:flex h-screen w-[68px] shrink-0 flex-col items-center py-6 gap-2"
      style={{
        background: "var(--bg-secondary)",
        borderRight: "0.5px solid var(--separator)",
      }}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl mb-4 font-bold text-white"
        style={{ background: "var(--accent)", fontSize: 15 }}
      >
        DF
      </div>

      <nav className="flex flex-col items-center gap-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.path === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-150"
              style={{
                color: isActive ? "var(--accent)" : "var(--label-secondary)",
              }}
              title={item.label}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-pill"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: "var(--fill-tertiary)" }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                />
              )}
              <Icon className="h-[20px] w-[20px] relative z-10" strokeWidth={isActive ? 2 : 1.5} />
            </NavLink>
          );
        })}
      </nav>

      <button
        onClick={toggleTheme}
        className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-150"
        style={{ color: "var(--label-secondary)" }}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
      >
        {theme === "light" ? (
          <Moon className="h-[18px] w-[18px]" strokeWidth={1.5} />
        ) : (
          <Sun className="h-[18px] w-[18px]" strokeWidth={1.5} />
        )}
      </button>
    </aside>
  );
}

function MobileTabBar() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-end justify-around"
      style={{
        background: "var(--bg-secondary)",
        borderTop: "0.5px solid var(--separator)",
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
        paddingTop: 6,
      }}
    >
      {TAB_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.path === "/"
          ? location.pathname === "/"
          : location.pathname.startsWith(item.path);

        return (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-[56px]"
            style={{
              color: isActive ? "var(--accent)" : "var(--label-tertiary)",
            }}
          >
            <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2 : 1.5} />
            <span
              className="text-caption-2"
              style={{
                fontWeight: isActive ? 500 : 400,
              }}
            >
              {item.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  return (
    <>
      <DesktopSidebar />
      <MobileTabBar />
    </>
  );
}
