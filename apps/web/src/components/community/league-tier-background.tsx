"use client";

import type { LeagueTier } from "@/lib/coaching/types";
import { useId } from "react";

const PLATE_PATH =
  "M 12 0 L 308 0 L 320 12 L 320 64 L 308 76 L 12 76 L 0 64 L 0 12 Z";

const TIER_CHEVRONS: Record<LeagueTier, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
};

interface TierPalette {
  primary: string;
  secondary: string;
  plate: string;
  fill: string;
  dark: string;
  glow: string;
  border: string;
}

function tierPalette(tier: LeagueTier): TierPalette {
  switch (tier) {
    case "bronze":
      return {
        primary: "var(--forge-ember)",
        secondary: "var(--forge-coral)",
        plate: "color-mix(in srgb, var(--forge-ember) 18%, transparent)",
        fill: "color-mix(in srgb, var(--forge-ember) 32%, transparent)",
        dark: "color-mix(in srgb, var(--forge-coral) 35%, transparent)",
        glow: "color-mix(in srgb, var(--forge-ember) 45%, transparent)",
        border: "color-mix(in srgb, var(--forge-ember) 55%, transparent)",
      };
    case "silver":
      return {
        primary: "var(--forge-steel)",
        secondary: "var(--forge-muted)",
        plate: "color-mix(in srgb, var(--forge-steel) 16%, transparent)",
        fill: "color-mix(in srgb, var(--forge-steel) 28%, transparent)",
        dark: "color-mix(in srgb, var(--forge-muted) 40%, transparent)",
        glow: "color-mix(in srgb, var(--forge-steel) 50%, transparent)",
        border: "color-mix(in srgb, var(--forge-steel) 58%, transparent)",
      };
    case "gold":
      return {
        primary: "var(--forge-gold)",
        secondary: "var(--forge-ember)",
        plate: "color-mix(in srgb, var(--forge-gold) 22%, transparent)",
        fill: "color-mix(in srgb, var(--forge-gold) 32%, transparent)",
        dark: "color-mix(in srgb, var(--forge-ember) 30%, transparent)",
        glow: "color-mix(in srgb, var(--forge-gold) 55%, transparent)",
        border: "color-mix(in srgb, var(--forge-gold) 60%, transparent)",
      };
  }
}

function RankChevrons({
  count,
  x,
  y,
  color,
}: {
  count: number;
  x: number;
  y: number;
  color: string;
}) {
  const spacing = 11;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const offset = i * spacing;
        const opacity = 0.22 - i * 0.04;
        return (
          <path
            key={i}
            d={`M ${x - 18 + offset} ${y + 18} L ${x + offset} ${y} L ${x + 18 + offset} ${y + 18} L ${x + 14 + offset} ${y + 18} L ${x + offset} ${y + 5} L ${x - 14 + offset} ${y + 18} Z`}
            fill={color}
            opacity={opacity}
          />
        );
      })}
    </>
  );
}

interface LeagueTierBackgroundProps {
  tier: LeagueTier;
}

export function LeagueTierBackground({ tier }: LeagueTierBackgroundProps) {
  const uid = useId().replace(/:/g, "");
  const pid = `league-${uid}`;
  const t = tierPalette(tier);
  const chevrons = TIER_CHEVRONS[tier];

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
      viewBox="0 0 320 76"
    >
      <defs>
        {tier === "bronze" && (
          <>
            <pattern
              id={`${pid}-hammer`}
              width="16"
              height="14"
              patternUnits="userSpaceOnUse"
            >
              <rect width="16" height="14" fill="transparent" />
              <ellipse
                cx="4"
                cy="4"
                rx="3.5"
                ry="2.5"
                fill={t.primary}
                opacity="0.1"
              />
              <ellipse
                cx="12"
                cy="10"
                rx="3"
                ry="2"
                fill={t.dark}
                opacity="0.12"
              />
            </pattern>
            <pattern
              id={`${pid}-heat`}
              width="32"
              height="8"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M0 4 Q8 1 16 4 T32 4"
                fill="none"
                stroke={t.primary}
                strokeWidth="0.6"
                opacity="0.14"
              />
            </pattern>
          </>
        )}
        {tier === "silver" && (
          <pattern
            id={`${pid}-brush`}
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-18)"
          >
            <rect width="6" height="6" fill="transparent" />
            <line
              x1="0"
              y1="1"
              x2="6"
              y2="1"
              stroke={t.primary}
              strokeWidth="0.55"
              opacity="0.22"
            />
            <line
              x1="0"
              y1="4"
              x2="6"
              y2="4"
              stroke={t.secondary}
              strokeWidth="0.4"
              opacity="0.12"
            />
          </pattern>
        )}
        {tier === "gold" && (
          <pattern
            id={`${pid}-weave`}
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <rect width="10" height="10" fill="transparent" />
            <line
              x1="0"
              y1="0"
              x2="10"
              y2="10"
              stroke={t.primary}
              strokeWidth="0.4"
              opacity="0.14"
            />
            <line
              x1="10"
              y1="0"
              x2="0"
              y2="10"
              stroke={t.primary}
              strokeWidth="0.4"
              opacity="0.14"
            />
          </pattern>
        )}
      </defs>

      <path d={PLATE_PATH} fill={t.plate} />
      <path d={PLATE_PATH} fill={t.fill} opacity="0.55" />

      {tier === "bronze" && (
        <>
          <path d={PLATE_PATH} fill={`url(#${pid}-hammer)`} />
          <path d={PLATE_PATH} fill={`url(#${pid}-heat)`} />
          <rect x="248" y="8" width="52" height="28" fill={t.glow} opacity="0.18" />
          <path
            d="M 252 36 L 296 36 L 292 44 L 256 44 Z"
            fill={t.dark}
            opacity="0.25"
          />
          {[262, 274, 286].map((sx) => (
            <line
              key={sx}
              x1={sx}
              y1="10"
              x2={sx + 6}
              y2="32"
              stroke={t.secondary}
              strokeWidth="0.6"
              opacity="0.2"
            />
          ))}
        </>
      )}

      {tier === "silver" && (
        <>
          <path d={PLATE_PATH} fill={`url(#${pid}-brush)`} />
          <line
            x1="6"
            y1="3"
            x2="314"
            y2="3"
            stroke={t.glow}
            strokeWidth="1"
            opacity="0.45"
          />
          {[18, 302].map((bx) => (
            <g key={bx}>
              <circle cx={bx} cy="12" r="4" fill={t.dark} opacity="0.35" />
              <circle
                cx={bx}
                cy="12"
                r="1.6"
                fill="var(--forge-surface)"
                opacity="0.7"
              />
            </g>
          ))}
          {[22, 30, 38].map((y) => (
            <line
              key={y}
              x1="14"
              y1={y}
              x2="306"
              y2={y}
              stroke={t.primary}
              strokeWidth="0.5"
              opacity={0.12 - (y - 22) * 0.02}
            />
          ))}
        </>
      )}

      {tier === "gold" && (
        <>
          <path d={PLATE_PATH} fill={`url(#${pid}-weave)`} />
          <line
            x1="4"
            y1="2"
            x2="316"
            y2="2"
            stroke={t.glow}
            strokeWidth="1.2"
            opacity="0.55"
          />
          <line
            x1="4"
            y1="74"
            x2="316"
            y2="74"
            stroke={t.dark}
            strokeWidth="0.8"
            opacity="0.35"
          />
          {[
            [18, 12],
            [302, 12],
            [18, 64],
            [302, 64],
          ].map(([bx, by]) => (
            <g key={`${bx}-${by}`}>
              <circle cx={bx} cy={by} r="4" fill={t.dark} opacity="0.35" />
              <circle
                cx={bx}
                cy={by}
                r="1.6"
                fill="var(--forge-surface)"
                opacity="0.7"
              />
            </g>
          ))}
        </>
      )}

      <RankChevrons
        count={chevrons}
        x={268}
        y={22}
        color={t.primary}
      />

      {[
        [10, 10],
        [310, 10],
        [10, 66],
        [310, 66],
      ].map(([cx, cy]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r="3.2" fill={t.dark} opacity="0.55" />
          <circle cx={cx} cy={cy} r="2" fill={t.primary} opacity="0.35" />
          <line
            x1={cx - 1.2}
            y1={cy}
            x2={cx + 1.2}
            y2={cy}
            stroke="var(--forge-surface)"
            strokeWidth="0.5"
            opacity="0.5"
          />
        </g>
      ))}

      <path d={PLATE_PATH} fill="none" stroke={t.border} strokeWidth="1.75" />
      <path
        d="M 14 2 L 306 2 L 316 12 L 316 62 L 306 72 L 14 72 L 4 62 L 4 12 Z"
        fill="none"
        stroke={t.glow}
        strokeWidth="0.5"
        opacity="0.35"
      />
      <line
        x1="8"
        y1="74"
        x2="312"
        y2="74"
        stroke={t.dark}
        strokeWidth="1"
        opacity="0.4"
      />
    </svg>
  );
}
