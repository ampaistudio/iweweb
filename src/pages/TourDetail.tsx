import { Link, Navigate, useParams } from "react-router-dom";
import { activities } from "../data/activities";

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

function TourDetail() {
  const { tourId } = useParams<{ tourId: string }>();
  const activity = activities.find((item) => item.id === tourId);

  if (!activity) {
    return <Navigate to="/" replace />;
  }

  const related = activities.filter((item) => item.type === activity.type && item.id !== activity.id).slice(0, 3);

  return (
    <main className="tour-detail page-width section-space">
      <Link className="text-link dark-link tour-detail-back" to="/">
        <ArrowIcon direction="left" /> Volver al inicio
      </Link>

      <div className="tour-detail-layout">
        <div className="tour-detail-image">
          <img src={activity.image} alt={activity.alt} />
        </div>

        <div className="tour-detail-copy">
          <p className="eyebrow">{activity.type} · {activity.region}</p>
          <h1>{activity.title}</h1>
          <div className="tour-detail-meta">
            <span>{activity.country}</span>
            <span>{activity.level}</span>
            <span>{activity.duration}</span>
            {activity.price && <span className="tour-detail-price">{activity.price}</span>}
          </div>
          <p className="large-copy">{activity.description}</p>

          <ul className="tour-detail-highlights">
            {activity.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>

          <a className="button button-dark" href="mailto:info@i-wildland.com">
            Reservar esta experiencia <ArrowIcon />
          </a>
        </div>
      </div>

      {related.length > 0 && (
        <div className="tour-detail-related">
          <p className="eyebrow">También te puede interesar</p>
          <div className="tour-grid">
            {related.map((item) => (
              <Link className="tour-item" to={`/tour/${item.id}`} key={item.id}>
                <div className="tour-image-wrap">
                  <img src={item.image} alt={item.alt} />
                  <span className="tour-arrow"><ArrowIcon /></span>
                </div>
                <div className="tour-details">
                  <div className="tour-meta"><span>{item.region}</span><span>{item.type}</span></div>
                  <h3>{item.title}</h3>
                  <div className="tour-submeta"><span>{item.country}</span><span>{item.level} / {item.duration}</span></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

export default TourDetail;
