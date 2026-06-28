"use client";

import Link from "next/link";
import { useState } from "react";

const FAB_BOTTOM =
  "calc(5rem + env(safe-area-inset-bottom) + 0.75rem)" as const;

export function NutritionFab() {
  const [open, setOpen] = useState(false);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close add menu"
          className="fixed inset-0 z-40 bg-forge-text/20 backdrop-blur-[1px]"
          onClick={closeMenu}
        />
      )}

      <div
        className="fixed right-4 z-50 flex flex-col items-end gap-3"
        style={{ bottom: FAB_BOTTOM }}
      >
        {open && (
          <div className="flex flex-col items-end gap-2">
            <Link
              href="/nutrition/log-macros"
              onClick={closeMenu}
              className="flex min-h-[48px] items-center rounded-full border border-[var(--border)] bg-forge-surface-raised px-5 py-3 font-display text-sm font-semibold text-forge-text shadow-lg transition-colors hover:border-forge-ember/40 hover:text-forge-ember"
            >
              Log macros
            </Link>
            <Link
              href="/nutrition/build-meal"
              onClick={closeMenu}
              className="flex min-h-[48px] items-center rounded-full border border-[var(--border)] bg-forge-surface-raised px-5 py-3 font-display text-sm font-semibold text-forge-text shadow-lg transition-colors hover:border-forge-ember/40 hover:text-forge-ember"
            >
              Build meal
            </Link>
          </div>
        )}

        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? "Close add menu" : "Add food or meal"}
          onClick={() => setOpen((value) => !value)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-forge-ember font-display text-2xl font-bold text-white shadow-lg shadow-forge-ember/30 transition-transform hover:bg-forge-ember/90 active:scale-95"
        >
          <span
            className={`block transition-transform duration-200 ${open ? "rotate-45" : ""}`}
            aria-hidden
          >
            +
          </span>
        </button>
      </div>
    </>
  );
}
