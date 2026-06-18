"use client";

import {
  createCrew,
  joinCrewByCode,
  leaveCrew,
} from "@/app/actions/community";
import type { CrewChallengeView, CrewContext } from "@/lib/coaching/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CrewPanelProps {
  crew: CrewContext | null;
  crewChallenge: CrewChallengeView | null;
}

export function CrewPanel({ crew, crewChallenge }: CrewPanelProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "create" | "join">("idle");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    setBusy(true);
    setError(null);
    const result = await createCrew(name);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Could not create crew.");
      return;
    }
    setMode("idle");
    setName("");
    router.refresh();
  }

  async function handleJoin() {
    setBusy(true);
    setError(null);
    const result = await joinCrewByCode(code);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Could not join crew.");
      return;
    }
    setMode("idle");
    setCode("");
    router.refresh();
  }

  async function handleLeave() {
    setBusy(true);
    setError(null);
    const result = await leaveCrew();
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Could not leave crew.");
      return;
    }
    router.refresh();
  }

  async function copyInviteLink() {
    if (!crew) return;
    const url = `${window.location.origin}/community/join?code=${crew.inviteCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy link.");
    }
  }

  if (!crew) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
          Crew
        </h2>
        <p className="mt-1 text-xs text-forge-muted">
          Start or join a 3–8 person accountability squad in your bucket.
        </p>

        {mode === "idle" && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode("create")}
              className="rounded-xl bg-forge-ember px-4 py-2 text-sm font-medium text-white"
            >
              Start a crew
            </button>
            <button
              type="button"
              onClick={() => setMode("join")}
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-forge-text"
            >
              Join with code
            </button>
          </div>
        )}

        {mode === "create" && (
          <div className="mt-4 space-y-3">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Crew name"
              maxLength={40}
              className="w-full rounded-xl border border-[var(--border)] bg-forge-surface px-3 py-2 text-sm text-forge-text"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy || name.trim().length < 2}
                onClick={() => void handleCreate()}
                className="rounded-xl bg-forge-ember px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setMode("idle")}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-forge-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {mode === "join" && (
          <div className="mt-4 space-y-3">
            <input
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="Invite code"
              maxLength={8}
              className="w-full rounded-xl border border-[var(--border)] bg-forge-surface px-3 py-2 text-sm uppercase tracking-widest text-forge-text"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy || code.trim().length < 4}
                onClick={() => void handleJoin()}
                className="rounded-xl bg-forge-ember px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Join crew
              </button>
              <button
                type="button"
                onClick={() => setMode("idle")}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-forge-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-3 text-xs text-forge-coral">{error}</p>}
      </section>
    );
  }

  const crewProgressPct =
    crewChallenge && crewChallenge.memberCount > 0
      ? Math.round(
          (crewChallenge.completedCount / crewChallenge.memberCount) * 100
        )
      : 0;

  return (
    <section className="rounded-2xl border border-forge-steel/30 bg-forge-steel/5 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-forge-steel">
            Your crew
          </p>
          <h2 className="mt-1 font-display text-base font-semibold text-forge-text">
            {crew.name}
          </h2>
          <p className="mt-1 text-xs text-forge-muted">
            {crew.memberCount}/{crew.maxMembers} members
            {crew.isOwner ? " · You are the owner" : ""}
          </p>
        </div>
        {crewChallenge?.crewMetGoal && (
          <span className="rounded-full border border-forge-steel/40 bg-forge-steel/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-forge-steel">
            Crew goal met
          </span>
        )}
      </div>

      {crewChallenge && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-forge-muted">
            <span>
              Crew challenge progress ({crewChallenge.targetPercent}% target)
            </span>
            <span className="font-medium text-forge-text">
              {crewChallenge.completedCount}/{crewChallenge.memberCount} complete
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-forge-surface">
            <div
              className="h-full rounded-full bg-forge-steel transition-all"
              style={{ width: `${crewProgressPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copyInviteLink()}
          className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-medium text-forge-text"
        >
          {copied ? "Link copied!" : "Copy invite link"}
        </button>
        <span className="self-center text-xs text-forge-muted">
          Code: <span className="font-mono text-forge-text">{crew.inviteCode}</span>
        </span>
      </div>

      <ol className="mt-4 space-y-2">
        {crew.members.map((member, index) => (
          <li
            key={member.userId}
            className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-forge-surface/60 px-3 py-2"
          >
            <div className="flex items-center gap-3">
              <span className="font-display w-6 text-sm font-bold text-forge-muted">
                {index + 1}
              </span>
              <span className="text-sm text-forge-text">
                {member.displayLabel}
                {member.role === "owner" ? " · owner" : ""}
              </span>
            </div>
            <span className="text-sm text-forge-muted">
              {member.habitScore != null ? `${member.habitScore} pts` : "—"}
            </span>
          </li>
        ))}
      </ol>

      <button
        type="button"
        disabled={busy}
        onClick={() => void handleLeave()}
        className="mt-4 text-xs font-medium text-forge-coral underline-offset-2 hover:underline disabled:opacity-50"
      >
        {crew.isOwner ? "Disband crew" : "Leave crew"}
      </button>

      {error && <p className="mt-2 text-xs text-forge-coral">{error}</p>}
    </section>
  );
}
