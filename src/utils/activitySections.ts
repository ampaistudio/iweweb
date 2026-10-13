import type { Activity } from "../data/activities";

/**
 * The database ID keeps internal anchors stable when the display name changes.
 * Name-based anchors remain available for existing menu links.
 */
export function getCategoryNameAnchor(categoryName: string): string {
  const slug = categoryName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug === "btt" ? "bike" : slug;
}

export function getCategoryAnchor(categoryName: string, categoryId?: number): string {
  return categoryId && categoryId > 0 ? `category-${categoryId}` : getCategoryNameAnchor(categoryName);
}

export function getCategoryAliases(categoryName: string, categoryId: number | undefined, getContent: (key: string) => string): string[] {
  let stored: unknown = [];
  if (categoryId) {
    try {
      stored = JSON.parse(getContent(`activity_type_${categoryId}_anchor_aliases`) || "[]");
    } catch {
      stored = [];
    }
  }
  const aliases = [getCategoryNameAnchor(categoryName), ...(categoryName === "BTT" ? ["btt"] : []), ...(Array.isArray(stored) ? stored : [])];
  return Array.from(new Set(aliases.filter((alias): alias is string => typeof alias === "string" && /^[a-z0-9-]+$/.test(alias))));
}

/**
 * Generates the CMS key prefix for a given category name.
 */
export function getCategoryContentPrefix(categoryName: string): string {
  const slug = categoryName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return `activities_${slug}`;
}

/**
 * Returns the effective list of categories from DB categories or inferred from activities.
 */
export function getEffectiveCategories(categories: string[], activities: Activity[]): string[] {
  return categories.length > 0
    ? categories
    : Array.from(new Set(activities.map((a) => a.type)));
}

/**
 * Determines whether a category section has renderable content
 * (either at least one activity or a CMS image configured for its prefix).
 */
export function isCategorySectionRenderable(
  categoryName: string,
  activities: Activity[],
  getContent: (key: string) => string
): boolean {
  const hasActivities = activities.some((a) => a.type === categoryName);
  if (hasActivities) return true;

  const prefix = getCategoryContentPrefix(categoryName);
  const image = getContent(`${prefix}_image`);
  if (image) return true;

  if (categoryName === "BTT") {
    if (getContent("activities_bike_image") || getContent("activities_btt_image")) {
      return true;
    }
  }

  if (getCategoryAnchor(categoryName) === "andorra-holiday-snow") {
    if (getContent("activities_holiday_image") || getContent("activities_andorra_holiday_snow_image")) {
      return true;
    }
  }

  return false;
}
