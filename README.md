# VIET.MOBILE

Step 1 foundation for separate Customer (`/`), Technician (`/tech`), and Admin (`/admin`) products.

## Run

Copy `.env.example` to `.env.local`, then run `npm run dev`. Visit `http://localhost:3000`, `/tech`, or `/admin`.

## Security baseline

`proxy.ts` maps `tech.viet.mobile` and `admin.viet.mobile` roots to their independent entry points. Set `AUTH_ENFORCEMENT=true` only after Supabase is configured; protected technician/admin routes then require a verified Supabase user with an `app_metadata.role` of `TECHNICIAN`, `ADMIN`, or `STAFF` as appropriate. The service-role key is never imported by browser code.

## Not included yet

Authentication UI, order persistence, payments, messaging, automatic assignment, and settlements remain intentionally unimplemented.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
