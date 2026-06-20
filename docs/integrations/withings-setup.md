# Withings integration — setup & QA

Pro+ feature. Imports **body weight** from Withings scales into **Progress → Measurements** (`body_measurements`).

## Environment variables

Set on **Vercel Production** (and `apps/web/.env.local` for local dev):

| Variable | Notes |
|----------|--------|
| `WITHINGS_CLIENT_ID` | From [Withings Partner Hub](https://developer.withings.com/) |
| `WITHINGS_CLIENT_SECRET` | Same app |
| `INTEGRATIONS_TOKEN_ENCRYPTION_KEY` | `openssl rand -base64 32` — encrypts OAuth tokens at rest |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin, **no trailing slash** (e.g. `https://forge-rep.com`) |

Redeploy after adding env vars so server routes see them.

## Partner Hub — registered callback URL

Register **exactly** this URL under **Registered URLs**:

```
{NEXT_PUBLIC_SITE_URL}/api/integrations/withings/callback
```

Production example:

```
https://forge-rep.com/api/integrations/withings/callback
```

The Profile → Integrations card shows this URI when Withings is configured and not yet connected.

### URL probe (must return 200)

Withings validates the callback with HEAD/GET **without** OAuth query params. A 307 redirect fails validation.

Verify locally or on production:

```bash
curl -I "https://forge-rep.com/api/integrations/withings/callback"
# Expect: HTTP/2 200

curl "https://forge-rep.com/api/integrations/withings/callback"
# Expect: 200 OK
```

Same probe behavior is implemented for Fitbit and Strava callbacks.

## Connect flow (manual QA)

Prerequisites: **Pro+** subscription, env vars deployed, callback URL registered.

1. Sign in → **Profile** → expand **Integrations**
2. **Withings** should show **Connect** (not “Coming soon”)
3. Tap **Connect** → Withings OAuth → approve `user.metrics`
4. Redirect back to Profile with `?integration=withings_connected` (or readable error in banner)
5. Card shows **Connected** and **Last sync** timestamp

### Weight sync

- First connect triggers an automatic sync (90-day lookback)
- **Sync now** calls `POST /api/integrations/withings/sync`
- Open **Progress** → confirm new weight entries match Withings app dates/values
- Re-sync skips rows within 0.05 kg of existing data for the same date

### Disconnect

Profile → Integrations → **Disconnect** removes the `user_integrations` row. Historical `body_measurements` remain.

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| “Coming soon” on Withings | `INTEGRATION_AVAILABLE.withings` false or not deployed |
| “OAuth credentials not configured” | Missing env vars on this deployment |
| Partner Hub URL test fails | Callback returns redirect instead of 200 — redeploy probe fix |
| `redirect_uri_mismatch` | Registered URL ≠ `withingsOAuthRedirectUri()` (check `NEXT_PUBLIC_SITE_URL`) |
| Connect succeeds, no weight | No recent weigh-ins in Withings; try **Sync now** after a scale reading |
| 403 on sync | Account is Pro but not Pro+ |

## Related polish / QA (same deploy)

After deploying recent fixes, spot-check:

- **Equipment → bodyweight only** → regenerate program → no machine exercises (e.g. Back Extension)
- **Equipment save** → “Regenerate program” defaults **on**
- **Program regen mid-week** → new sessions start today+, completed logs preserved by weekday slot
- **Fitbit workout recap** → HR zone bar shows multiple zones (re-sync after Google Health parser fix)
