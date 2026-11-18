import { getService } from "@/lib/services";
import { SUPPORT_CATEGORIES } from "@/lib/support/supportStore";

/** A service page exists only for slugs we actually know; anything else must 404 instead of falling back to another service's form. */
export function isKnownServiceSlug(slug: string): boolean {
  return Object.prototype.hasOwnProperty.call(SUPPORT_CATEGORIES, slug) || getService(slug) !== undefined;
}
