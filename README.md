# header-scan

A security header auditor. Paste a URL, get a plain-English breakdown of
which security response headers are present, missing, or set too loosely —
with a letter grade and raw values you can expand.

## Checks performed

- Content-Security-Policy (and whether it allows unsafe-inline/wildcards)
- Strict-Transport-Security (and whether max-age is long enough)
- Clickjacking protection (X-Frame-Options or CSP frame-ancestors)
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy
- Set-Cookie flags (Secure / HttpOnly / SameSite)

## Run locally

npm install
npm run dev

Open http://localhost:3000

## Deploy

Push to GitHub, import into Vercel or Netlify, no environment variables
needed. The scan runs server-side via a Next.js API route (app/api/scan),
so there are no CORS issues fetching arbitrary target sites.

## Notes

This checks response headers only. It is not a full penetration test, and
a passing grade does not mean a site is otherwise secure.
