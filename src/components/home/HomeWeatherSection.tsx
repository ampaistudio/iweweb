import { useSiteData } from "../../context/SiteDataContext";

export function HomeWeatherSection() {
  const { getContent } = useSiteData();

  const weatherEyebrow = getContent("weather_eyebrow");
  const weatherTitleLine1 = getContent("weather_title_line1");
  const weatherTitleLine2 = getContent("weather_title_line2");
  const weatherCopy = getContent("weather_copy");
  const weatherMapLat = getContent("weather_map_lat");
  const weatherMapLon = getContent("weather_map_lon");
  const weatherMetaLocation = getContent("weather_meta_location");
  const weatherMetaBadge = getContent("weather_meta_badge");

  return (
    <section id="weather" className="weather-section section-space">
      <div className="page-width">
        <div className="weather-header">
          <p className="eyebrow">{weatherEyebrow}</p>
          <h2>{weatherTitleLine1}<br /><em>{weatherTitleLine2}</em></h2>
          <p>{weatherCopy}</p>
        </div>
        <div className="weather-map-wrap">
          {weatherMapLat && weatherMapLon && <iframe
            className="weather-map-frame"
            title="Mapa meteorológico y viento en Andorra - Windy"
            src={`https://embed.windy.com/embed2.html?lat=${encodeURIComponent(weatherMapLat)}&lon=${encodeURIComponent(weatherMapLon)}&detailLat=${encodeURIComponent(weatherMapLat)}&detailLon=${encodeURIComponent(weatherMapLon)}&width=650&height=450&zoom=10&level=surface&overlay=wind&product=ecmwf&menu=&message=&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`}
            loading="lazy"
          />}
          <div className="weather-meta-bar">
            <span>{weatherMetaLocation}</span>
            <span className="weather-meta-badge">{weatherMetaBadge}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
