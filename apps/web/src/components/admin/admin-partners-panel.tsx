"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AdminPartnerListItem } from "@/lib/admin/partners";
import {
  dealTemplateForPartnerType,
  type AttributionModel,
  type CommissionBase,
  type CommissionType,
  type PartnerType,
} from "@/lib/partners/types";

interface AdminPartnersPanelProps {
  partners: AdminPartnerListItem[];
}

const TYPE_OPTIONS: PartnerType[] = [
  "influencer",
  "gym",
  "affiliate",
  "other",
];

const COMMISSION_TYPES: CommissionType[] = ["percent", "cpa", "hybrid"];
const COMMISSION_BASES: CommissionBase[] = [
  "gross",
  "net_of_fees",
  "net_of_fees_and_tax",
];
const ATTRIBUTION_MODELS: AttributionModel[] = ["first_touch", "last_touch"];
const TIER_OPTIONS = [
  { id: "pro", label: "Pro" },
  { id: "pro_plus", label: "Pro+" },
] as const;

function residualLabel(months: number | null | undefined): string {
  if (months == null) return "Life of subscription";
  return `${months} months`;
}

function bpsToPercentInput(bps: number | null): string {
  if (bps == null) return "";
  return String(bps / 100);
}

function centsToDollarsInput(cents: number | null): string {
  if (cents == null) return "";
  return String(cents / 100);
}

function applyTypeDefaults(partnerType: PartnerType) {
  const template = dealTemplateForPartnerType(partnerType);
  return {
    commissionType: template.commissionType,
    commissionBase: template.commissionBase,
    percent: bpsToPercentInput(template.percentBps),
    cpaDollars: centsToDollarsInput(template.cpaCents),
    clickWindowDays: String(template.clickWindowDays),
    lifetimeResidual: template.durationMonths == null,
    durationMonths:
      template.durationMonths == null ? "12" : String(template.durationMonths),
    attributionModel: template.attributionModel,
  };
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
  const [defaultLandingPath, setDefaultLandingPath] = useState("/signup");
  const [dealNotes, setDealNotes] = useState("");

  const initialDefaults = applyTypeDefaults("influencer");
  const [commissionType, setCommissionType] = useState<CommissionType>(
    initialDefaults.commissionType
  );
  const [commissionBase, setCommissionBase] = useState<CommissionBase>(
    initialDefaults.commissionBase
  );
  const [percent, setPercent] = useState(initialDefaults.percent);
  const [cpaDollars, setCpaDollars] = useState(initialDefaults.cpaDollars);
  const [clickWindowDays, setClickWindowDays] = useState(
    initialDefaults.clickWindowDays
  );
  const [lifetimeResidual, setLifetimeResidual] = useState(
    initialDefaults.lifetimeResidual
  );
  const [durationMonths, setDurationMonths] = useState(
    initialDefaults.durationMonths
  );
  const [attributionModel, setAttributionModel] = useState<AttributionModel>(
    initialDefaults.attributionModel
  );
  const [eligibleTiers, setEligibleTiers] = useState<string[]>([
    "pro",
    "pro_plus",
  ]);
  const [payoutMinimumDollars, setPayoutMinimumDollars] = useState("50");
  const [payoutNetDays, setPayoutNetDays] = useState("30");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [portalEmailByPartner, setPortalEmailByPartner] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    const defaults = applyTypeDefaults(type);
    setCommissionType(defaults.commissionType);
    setCommissionBase(defaults.commissionBase);
    setPercent(defaults.percent);
    setCpaDollars(defaults.cpaDollars);
    setClickWindowDays(defaults.clickWindowDays);
    setLifetimeResidual(defaults.lifetimeResidual);
    setDurationMonths(defaults.durationMonths);
    setAttributionModel(defaults.attributionModel);
  }, [type]);

  function resetCreateForm() {
    setSlug("");
    setDisplayName("");
    setCode("");
    setContactEmail("");
    setDefaultLandingPath("/signup");
    setDealNotes("");
    setEligibleTiers(["pro", "pro_plus"]);
    setPayoutMinimumDollars("50");
    setPayoutNetDays("30");
    setType("influencer");
    const defaults = applyTypeDefaults("influencer");
    setCommissionType(defaults.commissionType);
    setCommissionBase(defaults.commissionBase);
    setPercent(defaults.percent);
    setCpaDollars(defaults.cpaDollars);
    setClickWindowDays(defaults.clickWindowDays);
    setLifetimeResidual(defaults.lifetimeResidual);
    setDurationMonths(defaults.durationMonths);
    setAttributionModel(defaults.attributionModel);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const percentNum = Number.parseFloat(percent);
    const percentBps =
      commissionType === "cpa"
        ? null
        : Number.isFinite(percentNum)
          ? Math.round(percentNum * 100)
          : null;

    const cpaNum = Number.parseFloat(cpaDollars);
    const cpaCents =
      commissionType === "percent"
        ? null
        : Number.isFinite(cpaNum)
          ? Math.round(cpaNum * 100)
          : null;

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
        defaultLandingPath,
        dealNotes: dealNotes || undefined,
        lifetimeResidual,
        durationMonths: lifetimeResidual
          ? null
          : Number.parseInt(durationMonths, 10) || 12,
        commissionType,
        commissionBase,
        percentBps,
        cpaCents,
        clickWindowDays: Number.parseInt(clickWindowDays, 10) || undefined,
        attributionModel,
        eligibleTiers,
        payoutMinimumCents: Math.round(
          (Number.parseFloat(payoutMinimumDollars) || 0) * 100
        ),
        payoutNetDays: Number.parseInt(payoutNetDays, 10) || 30,
      }),
    });

    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Create failed.");
      setLoading(false);
      return;
    }

    setMessage(
      `Partner created. Share link: ${siteUrl}/r/${slug.trim().toLowerCase()}`
    );
    resetCreateForm();
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

  async function handleDelete(partner: AdminPartnerListItem) {
    const confirmed = window.confirm(
      `Permanently delete ${partner.displayName} (${partner.slug})?\n\nThis removes their deals, codes, portal users, attributions, and commission history. Profile acquisition links are cleared. This cannot be undone.`
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    setMessage(null);
    const response = await fetch("/api/admin/partners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", partnerId: partner.id }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Delete failed.");
      setLoading(false);
      return;
    }
    setMessage(`Deleted partner ${partner.displayName}.`);
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
    setMessage(
      `Portal access granted to ${email}. They sign in at /partner/login.`
    );
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

  function toggleTier(tierId: string) {
    setEligibleTiers((prev) =>
      prev.includes(tierId)
        ? prev.filter((t) => t !== tierId)
        : [...prev, tierId]
    );
  }

  const showPercent =
    commissionType === "percent" || commissionType === "hybrid";
  const showCpa = commissionType === "cpa" || commissionType === "hybrid";

  return (
    <div className="min-w-0 space-y-6">
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

      <section className="min-w-0 rounded-2xl border border-white/10 bg-forge-surface-raised p-4 sm:p-5">
        <h2 className="font-display text-lg font-bold text-forge-text">
          Create partner
        </h2>
        <p className="mt-1 text-sm text-forge-muted">
          Changing type loads template defaults. Edit any field before creating —
          nothing is locked to the template.
        </p>
        <form
          onSubmit={handleCreate}
          className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2"
        >
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
            <span className="text-forge-muted">Type (template seed)</span>
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
          <label className="block text-sm sm:col-span-2">
            <span className="text-forge-muted">Landing path after /r/slug</span>
            <input
              value={defaultLandingPath}
              onChange={(e) => setDefaultLandingPath(e.target.value)}
              placeholder="/signup"
              className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-forge-text"
            />
          </label>

          <div className="sm:col-span-2 mt-1 border-t border-white/10 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-forge-muted">
              Deal terms
            </p>
          </div>

          <label className="block text-sm">
            <span className="text-forge-muted">Commission type</span>
            <select
              value={commissionType}
              onChange={(e) =>
                setCommissionType(e.target.value as CommissionType)
              }
              className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-forge-text"
            >
              {COMMISSION_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-forge-muted">Commission base</span>
            <select
              value={commissionBase}
              onChange={(e) =>
                setCommissionBase(e.target.value as CommissionBase)
              }
              className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-forge-text"
            >
              {COMMISSION_BASES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          {showPercent ? (
            <label className="block text-sm">
              <span className="text-forge-muted">Percent (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-forge-text"
              />
            </label>
          ) : null}
          {showCpa ? (
            <label className="block text-sm">
              <span className="text-forge-muted">CPA ($)</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={cpaDollars}
                onChange={(e) => setCpaDollars(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-forge-text"
              />
            </label>
          ) : null}
          <label className="block text-sm">
            <span className="text-forge-muted">Click window (days)</span>
            <input
              type="number"
              min={1}
              max={365}
              value={clickWindowDays}
              onChange={(e) => setClickWindowDays(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-forge-text"
            />
          </label>
          <label className="block text-sm">
            <span className="text-forge-muted">Attribution model</span>
            <select
              value={attributionModel}
              onChange={(e) =>
                setAttributionModel(e.target.value as AttributionModel)
              }
              className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-forge-text"
            >
              {ATTRIBUTION_MODELS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
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

          <fieldset className="sm:col-span-2">
            <legend className="text-sm text-forge-muted">Eligible tiers</legend>
            <div className="mt-2 flex flex-wrap gap-4">
              {TIER_OPTIONS.map((tier) => (
                <label
                  key={tier.id}
                  className="flex items-center gap-2 text-sm text-forge-text"
                >
                  <input
                    type="checkbox"
                    checked={eligibleTiers.includes(tier.id)}
                    onChange={() => toggleTier(tier.id)}
                  />
                  {tier.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="sm:col-span-2 mt-1 border-t border-white/10 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-forge-muted">
              Payout policy
            </p>
          </div>

          <label className="block text-sm">
            <span className="text-forge-muted">Payout minimum ($)</span>
            <input
              type="number"
              min={0}
              step={1}
              value={payoutMinimumDollars}
              onChange={(e) => setPayoutMinimumDollars(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-forge-text"
            />
          </label>
          <label className="block text-sm">
            <span className="text-forge-muted">Payout Net days</span>
            <input
              type="number"
              min={0}
              max={120}
              value={payoutNetDays}
              onChange={(e) => setPayoutNetDays(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-forge-text"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-forge-muted">Deal notes (optional)</span>
            <textarea
              value={dealNotes}
              onChange={(e) => setDealNotes(e.target.value)}
              rows={2}
              placeholder="Internal notes for this deal…"
              className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-forge-text"
            />
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={loading || eligibleTiers.length === 0}
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
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 break-words">
                    <p className="font-medium text-forge-text">
                      {partner.displayName}{" "}
                      <span className="text-forge-muted">
                        ({partner.type})
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-forge-muted">
                      Status: {partner.status} · Link:{" "}
                      <a
                        className="break-all text-forge-steel hover:underline"
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
                        ? `${partner.activeDeal.commissionType} · ${(partner.activeDeal.percentBps ?? 0) / 100}% ${partner.activeDeal.commissionBase}${partner.activeDeal.cpaCents ? ` · CPA $${(partner.activeDeal.cpaCents / 100).toFixed(0)}` : ""} · click ${partner.activeDeal.clickWindowDays}d · residual ${residualLabel(partner.activeDeal.durationMonths)}`
                        : "No active deal"}
                    </p>
                    <p className="mt-1 text-sm text-forge-muted">
                      Payout: Net-{partner.payoutNetDays} · min $
                      {(partner.payoutMinimumCents / 100).toFixed(0)} · tax
                      form: {partner.taxFormStatus}
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
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => void handleDelete(partner)}
                      className="rounded-lg border border-forge-coral/40 px-3 py-1.5 text-xs font-medium text-forge-coral"
                    >
                      Delete
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
                      className="min-w-0 w-full flex-1 rounded-lg border border-white/10 bg-forge-surface px-2 py-1.5 text-sm text-forge-text sm:min-w-[14rem]"
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
