"use client";

interface SectionTab {
  id: string;
  label: string;
}

interface SectionTabsProps {
  tabs: SectionTab[];
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel: string;
}

export function SectionTabs({
  tabs,
  activeId,
  onChange,
  ariaLabel,
}: SectionTabsProps) {
  return (
    <div
      className="grid gap-1 rounded-xl border border-[var(--border)] bg-forge-surface p-1"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeId === tab.id}
          onClick={() => onChange(tab.id)}
          className={`min-h-[40px] rounded-lg px-2 text-xs font-semibold transition-colors sm:text-sm ${
            activeId === tab.id
              ? "bg-forge-ember text-white"
              : "text-forge-muted hover:text-forge-text"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
