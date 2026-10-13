import { Link } from "react-router-dom";
import { type Activity } from "../../data/activities";
import { useSiteData } from "../../context/SiteDataContext";
import { resolveMediaUrl } from "../../utils/media";
import {
  getCategoryAnchor,
  getCategoryAliases,
  getCategoryContentPrefix,
  getEffectiveCategories,
  getCategoryNameAnchor,
  isCategorySectionRenderable,
} from "../../utils/activitySections";

function ArrowIcon({ direction = "right" }: { direction?: "right" | "left" }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-4 w-4 ${direction === "left" ? "rotate-180" : ""}`}
      viewBox="0 0 16 16"
      fill="none"
    >
      <path d="M2 8h11M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function ActivityGrid({ type, activities }: { type: string; activities: Activity[] }) {
  const filtered = activities.filter((activity) => activity.type === type);

  if (filtered.length === 0) {
    return null;
  }

  return (
    <div className="tour-grid">
      {filtered.map((activity) => (
        <Link className="tour-item" id={activity.id} to={`/tour/${activity.id}`} key={activity.id}>
          <div className="tour-image-wrap">
            {activity.image && <img src={activity.image} alt={activity.alt} loading="lazy" decoding="async" />}
            <span className="tour-arrow"><ArrowIcon /></span>
          </div>
          <div className="tour-details">
            <div className="tour-meta"><span>{activity.region}</span><span>{activity.type}</span></div>
            <h3>{activity.title}</h3>
            <div className="tour-submeta"><span>{activity.country}</span><span>{activity.level} / {activity.duration}</span></div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function HomeAdventuresSection() {
  const { activities, categories, categoryItems, getContent } = useSiteData();

  const categoryList = getEffectiveCategories(categories, activities);
  const reservedAnchors = new Set(categoryItems.map((item) => `category-${item.id}`));
  const claimedAliases = new Set<string>();

  return (
    <div id="activities">
      {categoryList.map((categoryName) => {
        if (!isCategorySectionRenderable(categoryName, activities, getContent)) {
          return null;
        }

        const categoryId = categoryItems.find((item) => item.name === categoryName)?.id;
        const anchor = getCategoryAnchor(categoryName, categoryId);
        const aliases = getCategoryAliases(categoryName, categoryId, getContent).filter((alias) => {
          if (alias === anchor || reservedAnchors.has(alias) || claimedAliases.has(alias)) return false;
          claimedAliases.add(alias);
          return true;
        });
        const prefix = getCategoryContentPrefix(categoryName);
        const isBike = aliases.includes("bike");
        const isHoliday = getCategoryNameAnchor(categoryName) === "andorra-holiday-snow" || aliases.includes("andorra-holiday-snow");

        const eyebrow =
          getContent(`${prefix}_eyebrow`) ||
          (isBike ? getContent("activities_bike_eyebrow") : "") ||
          (isHoliday ? getContent("activities_holiday_eyebrow") : "");
        const title =
          getContent(`${prefix}_title`) ||
          (isBike ? getContent("activities_bike_title") : "") ||
          (isHoliday ? getContent("activities_holiday_title") : "") ||
          categoryName;
        const image =
          getContent(`${prefix}_image`) ||
          (isBike ? getContent("activities_bike_image") || getContent("activities_btt_image") : "") ||
          (isHoliday ? getContent("activities_holiday_image") || getContent("activities_andorra_holiday_snow_image") : "");
        const hasActivities = activities.some((a) => a.type === categoryName);

        return (
          <section id={anchor} key={categoryName} className="adventures-section section-space">
            {aliases.map((alias) => <span id={alias} key={alias} />)}
            {isHoliday && !aliases.includes("holiday") && <span id="holiday" />}
            <div className="page-width">
              <div className="section-heading-row">
                <div>
                  {eyebrow && <p className="eyebrow">{eyebrow}</p>}
                  <h2>{title}</h2>
                </div>
              </div>
              <ActivityGrid type={categoryName} activities={activities} />
              {!hasActivities && image && (
                <a className="tour-item holiday-preview" href="#contact">
                  <div className="tour-image-wrap">
                    <img src={resolveMediaUrl(image)} alt={categoryName} loading="lazy" decoding="async" />
                    <span className="tour-arrow"><ArrowIcon /></span>
                  </div>
                </a>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
