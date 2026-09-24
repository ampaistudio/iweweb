import { Link } from "react-router-dom";
import { type Activity, type ActivityType } from "../../data/activities";
import { useSiteData } from "../../context/SiteDataContext";

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

function ActivityGrid({ type, activities }: { type: ActivityType; activities: Activity[] }) {
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
  const { activities, getContent } = useSiteData();

  const activitiesBikeEyebrow = getContent("activities_bike_eyebrow", "Enduro, E-Bike, BTT y remontes");
  const activitiesBikeTitle = getContent("activities_bike_title", "Bike");
  const activitiesViaFerrataEyebrow = getContent("activities_via_ferrata_eyebrow", "Iniciación y avanzado");
  const activitiesViaFerrataTitle = getContent("activities_via_ferrata_title", "Vía Ferrata");
  const activities4x4Eyebrow = getContent("activities_4x4_eyebrow", "Lagos Off-Road, Tor y Pic Negre");
  const activities4x4Title = getContent("activities_4x4_title", "4×4");
  const activitiesSenderismoEyebrow = getContent("activities_senderismo_eyebrow", "Medio día y día completo");
  const activitiesSenderismoTitle = getContent("activities_senderismo_title", "Senderismo");
  const activitiesEsquiEyebrow = getContent("activities_esqui_eyebrow", "Raquetas y esquí tour");
  const activitiesEsquiTitle = getContent("activities_esqui_title", "Esquí-Snow");

  return (
    <>
      <section id="bike" className="adventures-section section-space">
        <div className="page-width">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">{activitiesBikeEyebrow}</p>
              <h2>{activitiesBikeTitle}</h2>
            </div>
          </div>
          <ActivityGrid type="BTT" activities={activities} />
        </div>
      </section>

      <section id="via-ferrata" className="adventures-section section-space">
        <div className="page-width">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">{activitiesViaFerrataEyebrow}</p>
              <h2>{activitiesViaFerrataTitle}</h2>
            </div>
          </div>
          <ActivityGrid type="Vía Ferrata" activities={activities} />
        </div>
      </section>

      <section id="4x4" className="adventures-section section-space">
        <div className="page-width">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">{activities4x4Eyebrow}</p>
              <h2>{activities4x4Title}</h2>
            </div>
          </div>
          <ActivityGrid type="4x4" activities={activities} />
        </div>
      </section>

      <section id="senderismo" className="adventures-section section-space">
        <div className="page-width">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">{activitiesSenderismoEyebrow}</p>
              <h2>{activitiesSenderismoTitle}</h2>
            </div>
          </div>
          <ActivityGrid type="Senderismo" activities={activities} />
        </div>
      </section>

      <section id="esqui-snow" className="adventures-section section-space">
        <div className="page-width">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">{activitiesEsquiEyebrow}</p>
              <h2>{activitiesEsquiTitle}</h2>
            </div>
          </div>
          <ActivityGrid type="Esquí-Snow" activities={activities} />
        </div>
      </section>
    </>
  );
}

