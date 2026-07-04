"use client";

import { getCommunitySeasonCountdown } from "@/lib/coaching/community-season-countdown";
import { getCommunityWeekCountdown } from "@/lib/coaching/community-week-countdown";
import { useMemo } from "react";

interface CountdownArcProps {
  daysLeft: number;
  progressPct: number;
  sublabel: string;
  trackClassName: string;
  arcClassName: string;
  valueClassName: string;
  ariaLabel: string;
}

function CountdownArc({
  daysLeft,
  progressPct,
  sublabel,
  trackClassName,
  arcClassName,
  valueClassName,
  ariaLabel,
}: CountdownArcProps) {
  const size = 40;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progressPct / 100);
  const center = size / 2;
  const dayLabel = daysLeft === 0 ? "0d" : `${daysLeft}d`;

  return (
    <div
      className="flex shrink-0 flex-col items-center"
      role="img"
      aria-label={ariaLabel}
    >
      <svg width={size} height={size} className="block" aria-hidden>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className={trackClassName}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${center} ${center})`}
          className={arcClassName}
        />
        <text
          x={center}
          y={center - 1}
          textAnchor="middle"
          className={`fill-current text-[11px] font-bold ${valueClassName}`}
        >
          {dayLabel}
        </text>
        <text
          x={center}
          y={center + 10}
          textAnchor="middle"
          className="fill-forge-muted text-[7px] font-medium uppercase tracking-wide"
        >
          {sublabel}
        </text>
      </svg>
    </div>
  );
}

export function CommunityCountdownArcs() {
  const week = useMemo(() => getCommunityWeekCountdown(), []);
  const season = useMemo(() => getCommunitySeasonCountdown(), []);

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <CountdownArc
        daysLeft={week.daysLeft}
        progressPct={week.progressPct}
        sublabel="week"
        trackClassName="stroke-forge-surface"
        arcClassName="stroke-forge-ember"
        valueClassName="text-forge-ember"
        ariaLabel={
          week.daysLeft === 0
            ? `Community week ends ${week.endLabel}, final day`
            : `${week.daysLeft} days left in community week, ends ${week.endLabel}`
        }
      />
      <div className="h-5 w-px shrink-0 bg-[var(--border)]" aria-hidden />
      <CountdownArc
        daysLeft={season.daysLeft}
        progressPct={season.progressPct}
        sublabel="season"
        trackClassName="stroke-forge-surface"
        arcClassName="stroke-forge-gold"
        valueClassName="text-forge-gold"
        ariaLabel={
          season.daysLeft === 0
            ? `League season ends today, ${season.endLabel}`
            : `${season.daysLeft} days left in league season, ends ${season.endLabel}`
        }
      />
    </div>
  );
}
