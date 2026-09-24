import { Link } from "react-router-dom";
import { type Activity } from "../../data/activities";
import { useSiteData } from "../../context/SiteDataContext";
import { resolveMediaUrl } from "../../utils/media";

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

function getCategoryAnchor(categoryName: string): string {
  const slug = categoryName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug === 'btt' ? 'bike' : slug;
}

function getCategoryContentPrefix(categoryName: string): string {
  const slug = categoryName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return `activities_${slug}`;
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
            <img src={activity.image} alt={activity.alt} loading="lazy" decoding="async" />
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
  const { activities, categories, getContent } = useSiteData();

  const categoryList = categories.length > 0
    ? categories
    : Array.from(new Set(activities.map((a) => a.type)));

  return (
    <>
      {categoryList.map((categoryName) => {
        const anchor = getCategoryAnchor(categoryName);
        const prefix = getCategoryContentPrefix(categoryName);
        const eyebrow = getContent(`${prefix}_eyebrow`);
        const title = getContent(`${prefix}_title`) || categoryName;
        const image = getContent(`${prefix}_image`);
        const hasActivities = activities.some((a) => a.type === categoryName);

        const isHoliday = anchor === 'andorra-holiday-snow';
        if (!hasActivities && !image) return null;

        return (
          <section id={anchor} key={categoryName} className="adventures-section section-space">
            {isHoliday && <span id="holiday" />}
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
    </>
  );
}
