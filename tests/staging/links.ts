/**
 * Recovery-link helpers for the staging journey. The app renders the link as a RELATIVE href (`/chat?r=<id>#t=<token>`) on purpose;
 * a browser navigation needs an absolute URL, so the test resolves it against the target. Nothing here may print a token.
 */
const TOKEN = /[0-9a-f]{64}/g;

/** Resolves a relative or absolute href against `base`, keeping the path, the query and the #fragment exactly. */
export const resolveLink = (href: string, base: string): string => new URL(href, base).toString();

/** A string that is safe to show: fragment tokens and any 64-hex secret are replaced. */
export const redact = (text: string): string => text.replace(/#t=[^\s"'&]*/g, "#t=<redacted>").replace(TOKEN, "<redacted>");

/** The request id of a recovery link, or null. Never returns the token. */
export const requestIdOf = (link: string): string | null => link.match(/[?&]r=([0-9a-f-]{36})/)?.[1] ?? null;

/** True when the link has the expected shape (id in the query, 64-hex token in the fragment). Returns a boolean so a failed assertion cannot echo the token. */
export const isRecoveryLink = (link: string): boolean => /\/chat\?r=[0-9a-f-]{36}#t=[0-9a-f]{64}$/.test(link);

/** Opens a link; any failure is rethrown with the token redacted from the message. */
export async function openLink(page: { goto(url: string): Promise<unknown> }, link: string): Promise<void> {
  try {
    await page.goto(link);
  } catch (e) {
    throw new Error(redact(e instanceof Error ? e.message : String(e)));
  }
}
