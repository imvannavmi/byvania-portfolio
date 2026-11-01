# `</> by.vania`

Bilingual portfolio for Vania Bunga Febrina, built with Next.js App Router, React, and TypeScript. The `/id` and `/en` routes share one component and structured content data.

## Local development

```powershell
npm install
npm run dev
```

Open `http://localhost:3000/id` or `http://localhost:3000/en`.

## Content updates

Edit `src/content.ts` to update translations and static fallback content. The profile photo is stored in `public/images/vania-profile.jpg`. Update the pending education details and social links only after receiving verified information.

The contact form is intentionally not shown as working: no email address or delivery service is configured. Before enabling message submission, add a server-side delivery provider, validation, spam protection, and environment secrets. Keep all secrets out of client code.

## Admin dashboard

Open `http://localhost:3000/admin` while the development server is running. Sign in with a Supabase Auth email/password account that has been granted access in `public.portfolio_admins`.

The project reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`) from `.env.local`. Restart the server after changing environment variables.

The SQL setup is prepared in `supabase/schema.sql` but has **not** been applied to the Supabase project. Review and run it in the intended project's SQL Editor, create the admin Auth user, then grant that user's UUID as shown in the SQL file. The script also prepares the public `project-images` Storage bucket and admin-only upload policies. If that bucket already exists, check its visibility and upload limits in Storage settings.

The dashboard supports bilingual project, experience, skill, education, and section records. Published records are read by the public portfolio. Each project card opens `/{locale}/projects/{slug}`. Project forms include Overview, Key Features, technologies, thumbnail and gallery images, Problem, Objectives, Implementation, Technical Challenges, Solutions, Results, Lessons Learned, repository, and demo links. Enter list items one per line. Upload an image in the admin panel, then copy its URL into the thumbnail or gallery field.

Do not place a Supabase service-role key in a `NEXT_PUBLIC_` variable or browser code. The dashboard uses authenticated sessions and row-level security; only explicitly granted admin users can write CMS records.
