# Deploying ambati.dev to Vercel

Nothing here has been run. Each step is yours to do (or to ask Claude to do once you confirm).

## 1. Create the project

Either connect a Git repo in the Vercel dashboard, or from this folder:

```sh
npx vercel login
npx vercel            # preview deploy; accept the detected Vite settings
npx vercel --prod     # production deploy
```

`vercel.json` already sets the build (`npm run build` → `dist/`), long-term caching for `/assets/*`,
security headers (incl. HSTS), and a host-based `www.ambati.dev` → `https://ambati.dev` 308 redirect.

## 2. Add the domains

Vercel → Project → Settings → Domains:

1. Add `ambati.dev`.
2. Add `www.ambati.dev` and choose **Redirect to ambati.dev** (308).

## 3. DNS

**Current setup (Nov 7, 2026): the domain uses Vercel's nameservers** (`ns1/ns2.vercel-dns.com`, set at Hostinger).
In that case you need **no A/CNAME records** — adding `ambati.dev` and `www.ambati.dev` to the project (step 2)
is enough, and Vercel answers DNS itself. Remove any leftover records that point elsewhere
(e.g. an `A @ → 2.57.91.91` Hostinger CDN record) from Vercel → Domains → ambati.dev → DNS Records.
Keep the CAA records (they already allow `letsencrypt.org`).

### Alternative: keep Hostinger's nameservers and add records there

| Type | Name / Host | Value | TTL |
|---|---|---|---|
| A | `@` (apex, `ambati.dev`) | `76.76.21.21` | 3600 (or Auto) |
| CNAME | `www` | `cname.vercel-dns.com.` | 3600 (or Auto) |

- Vercel's Domains page shows the exact values for *your* project after step 2. It sometimes gives a
  project-specific CNAME (e.g. `…vercel-dns-0xx.com`) or a newer A address; if it does, use what it shows.
- Delete any other A / AAAA records on `@`, and any existing record on `www` (parking pages, forwarding).
- If your registrar has **CAA** records, add `0 issue "letsencrypt.org"` so Vercel can issue the certificate.
- `.dev` is HSTS-preloaded: it only works over HTTPS. Vercel issues the certificate automatically once DNS
  resolves (usually minutes; up to 48h for propagation).

## 4. Check

```sh
dig +short ambati.dev A          # → 76.76.21.21 (or the value Vercel gave you)
dig +short www.ambati.dev CNAME  # → cname.vercel-dns.com.
curl -sI https://www.ambati.dev | grep -i location   # → https://ambati.dev/
```
