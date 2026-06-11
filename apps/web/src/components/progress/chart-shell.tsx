"use client";

import { useEffect, useState } from "react";

/** Recharts ResponsiveContainer needs a client-mounted parent with explicit size. */
export function ChartShell({
  height = 256,
  children,
}: {
  height?: number;
  children: (size: { width: string; height: number }) => React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="w-full animate-pulse rounded-xl bg-forge-surface"
        style={{ height }}
      />
    );
  }

  return (
    <div className="min-w-0 w-full" style={{ height }}>
      {children({ width: "100%", height })}
    </div>
  );
}
