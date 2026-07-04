"use client";

interface CommunityQuickActionsProps {
  unreadNotificationCount: number;
  showSquad: boolean;
  crewProgressLabel: string | null;
  onCheerWins: () => void;
  onSquad: () => void;
  onAlerts: () => void;
}

export function CommunityQuickActions({
  unreadNotificationCount,
  showSquad,
  crewProgressLabel,
  onCheerWins,
  onSquad,
  onAlerts,
}: CommunityQuickActionsProps) {
  const actions = [
    { key: "cheer", label: "Cheer wins", badge: null as string | null, onClick: onCheerWins },
    ...(showSquad
      ? [
          {
            key: "squad",
            label: "Squad",
            badge: crewProgressLabel,
            onClick: onSquad,
          },
        ]
      : []),
    {
      key: "alerts",
      label: "Alerts",
      badge:
        unreadNotificationCount > 0
          ? unreadNotificationCount > 9
            ? "9+"
            : String(unreadNotificationCount)
          : null,
      onClick: onAlerts,
    },
  ];

  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${actions.length}, 1fr)` }}>
      {actions.map((action) => (
        <button
          key={action.key}
          type="button"
          onClick={action.onClick}
          className="relative rounded-xl border border-[var(--border)] bg-forge-surface-raised px-2 py-2.5 text-center transition-colors hover:border-forge-ember/35 hover:text-forge-text"
        >
          {action.badge && (
            <span
              className={`absolute right-2 top-1.5 text-[9px] font-bold ${
                action.key === "alerts" ? "text-forge-coral" : "text-forge-gold"
              }`}
            >
              {action.badge}
            </span>
          )}
          <span className="text-[10px] font-semibold text-forge-text">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function useCommunityQuickActionHandlers() {
  return {
    scrollToWins: () => scrollToSection("community-wins"),
    scrollToSquad: () => scrollToSection("community-squad"),
    scrollToAlerts: () => scrollToSection("community-notifications"),
  };
}
