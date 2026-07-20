"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminPartnerListItem } from "@/lib/admin/partners";
import type { PartnerType } from "@/lib/partners/types";

interface AdminPartnersPanelProps {
  partners: AdminPartnerListItem[];
}

const TYPE_OPTIONS: PartnerType[] = [
  "influencer",
  "gym",
  "affiliate",
  "other",
];

function residualLabel(months: number | null | undefined): string {
  if (months == null) return "Life of subscription";
  return `${months} months`;
}

export function AdminPartnersPanel({ partners }: AdminPartnersPanelProps) {
  const router = useRouter();
  const siteUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://forge-rep.com";

  const [slug, setSlug] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [type, setType] = useState<PartnerType>("influencer");
  const [code, setCode] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [lifetimeResidual, setLifetimeResidual] = useState(false);
  const [durationMonths, setDurationMonths] = useState("12");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [portalEmailByPartner, setPortalEmailByPartner] = useState<
    Record<string, string>
  >({});

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/admin/partners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        slug,
        type,
        displayName,
        code: code || undefined,
        contactEmail: contactEmail || undefined,
        lifetimeResidual,
        durationMonths: lifetimeResidual
          ? null
          : Number.parseInt(durationMonths, 10) || 12,
      }),
    });

    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Create failed.");
      setLoading(false);
      return;
    }

    setMessage(`Partner created. Share link: ${siteUrl}/r/${slug.trim().toLowerCase()}`);
    setSlug("");
    setDisplayName("");
    setCode("");
    setContactEmail("");
    setLifetimeResidual(false);
    setDurationMonths("12");
    router.refresh();
    setLoading(false);
  }

  async function setStatus(partnerId: string, status: "active" | "paused") {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/admin/partners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_status", partnerId, status }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Update failed.");
      setLoading(false);
      return;
    }
    router.refresh();
    setLoading(false);
  }

  async function setTaxForm(
    partnerId: string,
    taxFormStatus: "none" | "received" | "verified"
  ) {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/admin/partners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_tax_form", partnerId, taxFormStatus }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Tax form update failed.");
      setLoading(false);
      return;
    }
    setMessage(`Tax form marked ${taxFormStatus}.`);
    router.refresh();
    setLoading(false);
  }

  async function grantPortal(partnerId: string) {
    const email = portalEmailByPartner[partnerId]?.trim();
    if (!email) {
      setError("Enter a portal user email first.");
      return;
    }
    setLoading(true);
    setError(null);
    const response = await fetch("/api/admin/partners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "portal_grant", partnerId, email }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Portal grant failed.");
      setLoading(false);
      return;
    }
    setMessage(`Portal access granted to ${email}. They sign in at /partner/login.`);
    setPortalEmailByPartner((prev) => ({ ...prev, [partnerId]: "" }));
    router.refresh();
    setLoading(false);
  }

  async function revokePortal(partnerId: string, userId: string) {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/admin/partners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "portal_revoke", partnerId, userId }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Portal revoke failed.");
      setLoading(false);
      return;
    }
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      {message ? (
        <p className="rounded-xl border border-forge-success/30 bg-forge-success/10 px-3 py-2 text-sm text-forge-success">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-forge-coral/30 bg-forge-coral/10 px-3 py-2 text-sm text-forge-coral">
          {error}
        </p>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-forge-surface-raised p-4 sm:p-5">
        <h2 className="font-display text-lg font-bold text-forge-text">
          Create partner
        </h2>
        <p className="mt-1 text-sm text-forge-muted">
          Templates: influencers/affiliates 30-day click · 12-mo residual ·
          net_of_fees. Gyms 90-day click · gross. Override residual below;
          check “life of subscription” for unlimited paid months.
        </p>
        <form onSubmit={handleCreate} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-forge-muted">Slug (URL)</span>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="eos or alex-lifts"
              required
              className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-forge-text"
            />
          </label>
          <label className="block text-sm">
            <span className="text-forge-muted">Display name</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="EoS Fitness"
              required
              className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-forge-text"
            />
          </label>
          <label className="block text-sm">
            <span className="text-forge-muted">Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as PartnerType)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-forge-text"
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-forge-muted">Promo code (optional)</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="EOS20"
              className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-forge-text"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-forge-muted">Contact email (optional)</span>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-forge-text"
            />
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={lifetimeResidual}
              onChange={(e) => setLifetimeResidual(e.target.checked)}
            />
            <span className="text-forge-muted">
              Life of subscription residual (instead of fixed months)
            </span>
          </label>
          {!lifetimeResidual ? (
            <label className="block text-sm">
              <span className="text-forge-muted">Residual months</span>
              <input
                type="number"
                min={1}
                max={120}
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-forge-text"
              />
            </label>
          ) : null}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-forge-ember px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Saving…" : "Create partner"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-white/10 bg-forge-surface-raised p-4 sm:p-5">
        <h2 className="font-display text-lg font-bold text-forge-text">
          Partners
        </h2>
        {partners.length === 0 ? (
          <p className="mt-3 text-sm text-forge-muted">
            No partners yet. Create one above, then share{" "}
            <code className="text-forge-text">/r/&#123;slug&#125;</code>.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-white/10">
            {partners.map((partner) => (
              <li key={partner.id} className="space-y-3 py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium text-forge-text">
                      {partner.displayName}{" "}
                      <span className="text-forge-muted">({partner.type})</span>
                    </p>
                    <p className="mt-1 text-sm text-forge-muted">
                      Status: {partner.status} · Link:{" "}
                      <a
                        className="text-forge-steel hover:underline"
                        href={`/r/${partner.slug}`}
                      >
                        /r/{partner.slug}
                      </a>
                      {partner.codes.length > 0
                        ? ` · Codes: ${partner.codes.join(", ")}`
                        : null}
                    </p>
                    <p className="mt-1 text-sm text-forge-muted">
                      Deal:{" "}
                      {partner.activeDeal
                        ? `${(partner.activeDeal.percentBps ?? 0) / 100}% ${partner.activeDeal.commissionBase} · click ${partner.activeDeal.clickWindowDays}d · residual ${residualLabel(partner.activeDeal.durationMonths)}`
                        : "No active deal"}
                    </p>
                    <p className="mt-1 text-sm text-forge-muted">
                      Payout: Net-{partner.payoutNetDays} · min $
                      {(partner.payoutMinimumCents / 100).toFixed(0)} · tax form:{" "}
                      {partner.taxFormStatus}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {partner.status === "active" ? (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => setStatus(partner.id, "paused")}
                        className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-forge-muted hover:text-forge-text"
                      >
                        Pause
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => setStatus(partner.id, "active")}
                        className="rounded-lg border border-forge-ember/40 px-3 py-1.5 text-xs font-medium text-forge-ember"
                      >
                        Activate
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setTaxForm(partner.id, "received")}
                      className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-forge-muted hover:text-forge-text"
                    >
                      Mark W-9 received
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setTaxForm(partner.id, "verified")}
                      className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-forge-muted hover:text-forge-text"
                    >
                      Mark W-9 verified
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-white/5 bg-forge-surface/50 p-3">
                  <p className="text-xs font-medium text-forge-muted">
                    Portal access (/partner/login)
                  </p>
                  {partner.portalUsers.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {partner.portalUsers.map((user) => (
                        <li
                          key={user.userId}
                          className="flex items-center justify-between gap-2 text-sm"
                        >
                          <span className="text-forge-text">
                            {user.email ?? user.userId.slice(0, 8)}
                          </span>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() =>
                              void revokePortal(partner.id, user.userId)
                            }
                            className="text-xs text-forge-coral hover:underline"
                          >
                            Revoke
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-xs text-forge-muted">
                      No portal users yet.
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <input
                      type="email"
                      placeholder="member@email.com"
                      value={portalEmailByPartner[partner.id] ?? ""}
                      onChange={(e) =>
                        setPortalEmailByPartner((prev) => ({
                          ...prev,
                          [partner.id]: e.target.value,
                        }))
                      }
                      className="min-w-[14rem] flex-1 rounded-lg border border-white/10 bg-forge-surface px-2 py-1.5 text-sm text-forge-text"
                    />
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => void grantPortal(partner.id)}
                      className="rounded-lg border border-forge-ember/40 px-3 py-1.5 text-xs font-medium text-forge-ember"
                    >
                      Grant portal
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
