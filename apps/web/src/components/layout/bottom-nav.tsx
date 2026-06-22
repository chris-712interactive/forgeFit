"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/workout", label: "Workout", icon: WorkoutIcon },
  { href: "/nutrition", label: "Nutrition", icon: NutritionIcon },
  { href: "/progress", label: "Progress", icon: ProgressIcon },
  { href: "/community", label: "Community", icon: CommunityIcon },
  { href: "/profile", label: "Profile", icon: ProfileIcon },
] as const;

interface BottomNavProps {
  unreadCommunityCount?: number;
}

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

export function BottomNav({ unreadCommunityCount = 0 }: BottomNavProps) {
  const pathname = usePathname();
  const online = useSyncExternalStore(
    subscribeOnline,
    getOnlineSnapshot,
    getServerSnapshot
  );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-forge-surface/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-1 py-1.5 sm:justify-around sm:px-2 sm:py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            pathname.startsWith(`${href}/`) ||
            (href === "/workout" && pathname === "/workout");
          const showBadge = href === "/community" && unreadCommunityCount > 0;
          const className = `relative flex min-h-[52px] min-w-0 flex-1 max-w-[4.25rem] flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 text-[10px] font-medium transition-colors sm:min-w-[56px] sm:max-w-none sm:px-2 sm:text-xs ${
            active
              ? "text-forge-ember"
              : "text-forge-muted hover:text-forge-text"
          }`;

          const content = (
            <>
              <span className="relative">
                <Icon active={active} />
                {showBadge && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-forge-coral px-1 text-[10px] font-bold text-white">
                    {unreadCommunityCount > 9 ? "9+" : unreadCommunityCount}
                  </span>
                )}
              </span>
              <span>{label}</span>
            </>
          );

          if (!online) {
            return (
              <a key={href} href={href} className={className}>
                {content}
              </a>
            );
          }

          return (
            <Link key={href} href={href} className={className}>
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.5z" />
    </svg>
  );
}

function WorkoutIcon({ active: _active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 9h2v6H6zM16 9h2v6h-2z" fill="currentColor" stroke="none" />
      <path d="M4 12h16" strokeWidth="2.5" />
    </svg>
  );
}

function NutritionIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 2C9 6 8 10 8 14a4 4 0 008 0c0-4-1-8-4-12z" />
    </svg>
  );
}

function ProgressIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path
        d="M8 17V11M12 17V7M16 17v-4"
        strokeLinecap="round"
        fill={active ? "currentColor" : "none"}
      />
    </svg>
  );
}

function CommunityIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}
