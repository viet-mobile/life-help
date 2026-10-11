#!/usr/bin/env bash
# Logical backup of the Supabase Postgres database (schema + data) to an encrypted file.
#
#   SUPABASE_DB_URL='postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres' \
#   BACKUP_GPG_RECIPIENT='ops@your-domain' scripts/ops/pg-backup.sh [output-dir]
#
# The connection string is read from the environment only (never printed, never written to disk). The dump is piped through gpg,
# so an unencrypted dump never touches the disk. Keep the output outside the repository (it is gitignored under /backups).
set -euo pipefail
: "${SUPABASE_DB_URL:?set SUPABASE_DB_URL (Supabase > Project settings > Database > Connection string, direct connection)}"
: "${BACKUP_GPG_RECIPIENT:?set BACKUP_GPG_RECIPIENT (a gpg public key you hold)}"
out_dir="${1:-./backups}"
mkdir -p "$out_dir"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
file="$out_dir/life-help-$stamp.sql.gpg"
pg_dump --no-owner --no-privileges --format=plain "$SUPABASE_DB_URL" \
  | gpg --batch --yes --encrypt --recipient "$BACKUP_GPG_RECIPIENT" --output "$file"
size="$(wc -c < "$file" | tr -d ' ')"
if [ "$size" -lt 1024 ]; then echo "backup suspiciously small ($size bytes): $file" >&2; exit 1; fi
echo "backup written: $file ($size bytes)"
