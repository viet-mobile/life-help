#!/usr/bin/env node
// Creates two confirmed test students in the STAGING Supabase project (for tests/staging).
// Safety: refuses to run unless EXPECTED_SUPABASE_REF is set and is contained in the URL,
// and refuses any URL that looks like the production project when PRODUCTION_SUPABASE_REF is given.
//
//   NEXT_PUBLIC_SUPABASE_URL=https://<staging-ref>.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=<staging service role key> EXPECTED_SUPABASE_REF=<staging-ref> \
//   STAGING_TEST_PASSWORD='<choose a strong password>' node scripts/learn/create-staging-users.mjs
import { createClient } from "@supabase/supabase-js";

const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key, EXPECTED_SUPABASE_REF: ref, PRODUCTION_SUPABASE_REF: prod, STAGING_TEST_PASSWORD: pw } = process.env;
if (!url || !key || !ref || !pw) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, EXPECTED_SUPABASE_REF, STAGING_TEST_PASSWORD");
if (!url.includes(ref)) throw new Error("URL does not match EXPECTED_SUPABASE_REF; refusing.");
if (prod && url.includes(prod)) throw new Error("URL is the PRODUCTION project; refusing.");
if (pw.length < 12) throw new Error("Use a password of at least 12 characters.");

const admin = createClient(url.replace(/\/rest\/v1\/?$/, ""), key, { auth: { persistSession: false } });
for (const who of ["a", "b"]) {
  const email = `learn-staging-${who}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: pw, email_confirm: true });
  console.log(who, error ? `exists/failed: ${error.message}` : `created ${data.user.id}`);
}
console.log("Accounts: learn-staging-a@example.com / learn-staging-b@example.com (password = STAGING_TEST_PASSWORD)");
