import { useSiteData } from "../../context/SiteDataContext";

export function HomeWeatherSection() {
  const { getContent } = useSiteData();

  const weatherEyebrow = getContent("weather_eyebrow", "Condiciones en tiempo real");
  const weatherTitleLine1 = getContent("weather_title_line1", "El tiempo en Andorra");
  const weatherTitleLine2 = getContent("weather_title_line2", "y los Pirineos.");
  const weatherCopy = getContent("weather_copy", "Previsión meteorológica y mapa interactivo de viento en directo para planificar tus salidas de BTT, senderismo o esquí con la máxima seguridad.");
  const weatherMapLat = getContent("weather_map_lat", "42.5459743");
  const weatherMapLon = getContent("weather_map_lon", "1.5140217");
  const weatherMetaLocation = getContent("weather_meta_location", "Andorra (42.55° N, 1.51° E) • Modelo ECMWF");
  const weatherMetaBadge = getContent("weather_meta_badge", "Viento & Previsión en vivo");

  return (
    <section id="weather" className="weather-section section-space">
      <div className="page-width">
        <div className="weather-header">
          <p className="eyebrow">{weatherEyebrow}</p>
          <h2>{weatherTitleLine1}<br /><em>{weatherTitleLine2}</em></h2>
          <p>{weatherCopy}</p>
        </div>
        <div className="weather-map-wrap">
          <iframe
            className="weather-map-frame"
            title="Mapa meteorológico y viento en Andorra - Windy"
            src={`https://embed.windy.com/embed2.html?lat=${encodeURIComponent(weatherMapLat)}&lon=${encodeURIComponent(weatherMapLon)}&detailLat=${encodeURIComponent(weatherMapLat)}&detailLon=${encodeURIComponent(weatherMapLon)}&width=650&height=450&zoom=10&level=surface&overlay=wind&product=ecmwf&menu=&message=&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`}
            loading="lazy"
          />
          <div className="weather-meta-bar">
            <span>{weatherMetaLocation}</span>
            <span className="weather-meta-badge">{weatherMetaBadge}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

