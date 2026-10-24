# Running Zuzu on Replit

Zuzu is an Urdu, right-to-left reading and writing app using plain JavaScript,
Vite, and the existing externally hosted Supabase project.

## Development

- Click Run to start the **Start application** workflow (`npm run dev`).
- Vite listens on `0.0.0.0:5000` and allows Replit's preview proxy hosts.
- `npm ci` installs the locked dependencies after a fresh checkout.
- `npm run build` creates the production site in `dist/`.
- Hash-based routes handle the feed, reading, writing, profiles, and login.

## External services

The existing Supabase URL and public publishable key are configured in
`src/supabase.js`. Keep using that external database and authentication service;
do not replace it with a different database during environment setup.
Never put a Supabase service-role or secret key in browser code.

The database schema is documented in `supabase/schema.sql`. Do not apply it to
the existing database without checking what is already installed and obtaining
approval. Authentication, content, and uploaded media depend on that project's
availability and configuration. Email confirmation settings and redirect
allowlists are managed in the existing Supabase project.
