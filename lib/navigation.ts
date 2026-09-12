/**
 * Navigation utility to handle cross-subdomain transitions between
 * tech.life.help, chat.life.help, admin.life.help and the main customer portal (life.help / viet.mobile / localhost).
 */

export function getMainHomeHref(): string {
  if (typeof window === "undefined") return "/";
  const { hostname, protocol, port } = window.location;
  const portStr = port ? `:${port}` : "";

  // Handle subdomain navigation (e.g., tech.life.help -> life.help)
  if (
    hostname.startsWith("tech.") ||
    hostname.startsWith("chat.") ||
    hostname.startsWith("admin.")
  ) {
    const mainHost = hostname.replace(/^(tech|chat|admin)\./, "");
    return `${protocol}//${mainHost}${portStr}/`;
  }

  // Standard localhost or root domain
  return "/";
}

export function navigateToMainHome(e?: React.MouseEvent) {
  if (typeof window === "undefined") return;
  const { hostname, protocol, port } = window.location;
  const portStr = port ? `:${port}` : "";

  if (
    hostname.startsWith("tech.") ||
    hostname.startsWith("chat.") ||
    hostname.startsWith("admin.")
  ) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const mainHost = hostname.replace(/^(tech|chat|admin)\./, "");
    window.location.href = `${protocol}//${mainHost}${portStr}/`;
  }
}

