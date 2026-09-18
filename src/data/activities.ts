export type ActivityType = "BTT" | "4x4" | "Vía Ferrata" | "Senderismo" | "Esquí-Snow" | "Rafting" | "Heliflight";

export interface ActivityImage {
  id: number;
  activity_id: string;
  image_url: string;
  media_type?: "image" | "video";
  poster_url?: string;
  alt_text: string;
  display_order: number;
  is_cover: boolean;
}

export interface ActivityTechnicalSpecs {
  minAge?: string;
  distanceKm?: string;
  elevationGain?: string;
  elevationLoss?: string;
}

export type Activity = {
  id: string;
  title: string;
  region: string;
  country: string;
  type: ActivityType;
  level: string;
  duration: string;
  image: string;
  alt: string;
  price?: string;
  description: string;
  intro_title?: string | null;
  intro_text?: string | null;
  highlights: string[];
  images?: ActivityImage[];
  itinerary?: string[];
  technicalSpecs?: ActivityTechnicalSpecs;
};

export const activities: Activity[] = [
  {
    id: "esqui-dia",
    title: "Esquí Tour",
    region: "Grandvalira / Vallnord",
    country: "Andorra",
    type: "Esquí-Snow",
    level: "Todos los niveles",
    duration: "6 horas",
    image:
      "https://i-wildland.com/wp-content/uploads/2019/11/Isard-WildLand-Andorra-MTB-Andorra-Winter-Experiences.jpg",
    alt: "Experiencia de esquí en Andorra",
    description:
      "Una jornada completa de esquí en las mejores pistas de Andorra, guiada por instructores certificados que adaptan el recorrido a tu nivel. Ideal para descubrir Grandvalira o Vallnord con acompañamiento local.",
    highlights: [
      "Guía certificado por AADIDES/ISIA",
      "Adaptado a todos los niveles",
      "Acceso a las mejores pistas de la temporada",
    ],
  },
  {
    id: "esqui-montana",
    title: "Esquí de Montaña",
    region: "Andorra",
    country: "Andorra",
    type: "Esquí-Snow",
    level: "Intermedio +",
    duration: "6 horas",
    image:
      "https://i-wildland.com/wp-content/uploads/2019/11/Raquetes-de-Neu-Andorra-Andorra-Turismo-Pyrynees-experiences.jpg",
    alt: "Esquí de montaña en los Pirineos de Andorra",
    description:
      "Sal de las pistas balizadas y descubre el esquí de montaña en los Pirineos andorranos: ascensos con pieles de foca y descensos en nieve virgen, siempre con seguridad y conocimiento del terreno.",
    highlights: [
      "Material técnico recomendado por el guía",
      "Rutas fuera de pista seleccionadas según condiciones del día",
      "Grupos reducidos",
    ],
  },
  {
    id: "raquetas-nieve",
    title: "Caminata con Raquetas de Nieve Nocturna",
    region: "Andorra",
    country: "Andorra",
    type: "Esquí-Snow",
    level: "Principiante +",
    duration: "5 horas",
    image:
      "https://privateyachtexpeditions.com/wp-content/uploads/2023/10/cropped-Isard-WildLand-Andorra-MTB-Andorra-Winter-Experiences-605x605.jpg",
    alt: "Caminata nocturna con raquetas de nieve en Andorra",
    description:
      "Una experiencia distinta: caminar sobre la nieve de noche, con raquetas, bajo el cielo estrellado de los Pirineos. Disponible también en versión diurna de 4 horas.",
    highlights: [
      "Raquetas y frontales incluidos",
      "Apto para toda la familia",
      "Versión diurna disponible (4hs)",
    ],
  },
  {
    id: "raquetas-nieve-diurna",
    title: "Caminata con Raquetas de Nieve Diurna",
    region: "Andorra",
    country: "Andorra",
    type: "Esquí-Snow",
    level: "Principiante +",
    duration: "4 horas",
    image:
      "https://privateyachtexpeditions.com/wp-content/uploads/2023/10/cropped-Isard-WildLand-Andorra-MTB-Andorra-Winter-Experiences-605x605.jpg",
    alt: "Caminata diurna con raquetas de nieve en Andorra",
    description:
      "Una experiencia distinta: caminar sobre la nieve de día, con raquetas, disfrutando de las vistas de los Pirineos andorranos. Disponible también en versión nocturna de 5 horas.",
    highlights: [
      "Raquetas y bastones incluidos",
      "Apto para toda la familia",
      "Versión nocturna disponible (5hs)",
    ],
  },
  {
    id: "ebike-forn-canillo",
    title: "E-Bike Enduro en Forn de Canillo",
    region: "Canillo",
    country: "Andorra",
    type: "BTT",
    level: "Intermedio +",
    duration: "6 horas",
    image:
      "https://privateyachtexpeditions.com/wp-content/uploads/2024/01/IMG-20210729-WA0058-605x605.jpg",
    alt: "E-Bike Enduro en Forn de Canillo, La Cova, 72 curvas",
    description:
      "Enduro en e-bike por el Forn de Canillo, La Cova y las famosas 72 curvas. Alta intensidad física, con e-bikes disponibles para alquilar si no traés la tuya.",
    highlights: [
      "Uplift: 750m / Climb: 450m",
      "Descenso: 20km / -1150m",
      "Grupos de 3 a 8 personas",
      "E-bike disponible para alquilar",
    ],
    itinerary: [
      "Salida desde Envalira, a 2408 metros",
      "Ascenso al Pic Maia",
      "Descenso técnico por \"Port dret\" hasta el valle de Soldeu",
      "Almuerzo breve en Soldeu",
      "Descenso de 1000 metros y 10 km por \"Roca del Forn\" en Canillo",
      "Tramo final: 5 km de sendero por bosque hasta el valle",
      "El itinerario puede variar según condiciones climáticas",
    ],
    technicalSpecs: {
      distanceKm: "10 km (tramo Roca del Forn) + 5 km sendero final",
      elevationLoss: "-1000m (tramo Roca del Forn)",
    },
  },
  {
    id: "ebike-llosada",
    title: "E-Bike Enduro en LLosada",
    region: "Encamp",
    country: "Andorra",
    type: "BTT",
    level: "Intermedio +",
    duration: "Día completo",
    image:
      "https://privateyachtexpeditions.com/wp-content/uploads/2024/01/DSC09590-605x605.jpg",
    alt: "E-Bike Enduro en LLosada, Intermedia Funi, Encamp",
    description:
      "Ruta de enduro en e-bike combinando el funicular con senderos técnicos en LLosada, Encamp. Vistas panorámicas durante el ascenso y descenso con flow por bosque y cresta de montaña.",
    highlights: [
      "Combinación funicular + e-bike",
      "Descensos técnicos y de flow",
      "Zona: Intermedia Funi, Encamp",
    ],
  },
  {
    id: "ebike-arcalis",
    title: "E-Bike Enduro Arcalis All Mountain",
    region: "Arcalís",
    country: "Andorra",
    type: "BTT",
    level: "Todos los niveles / Familia",
    duration: "Día completo",
    image:
      "https://privateyachtexpeditions.com/wp-content/uploads/2023/10/Arcalis-iWE-1-605x605.jpg",
    alt: "E-Bike Arcalis All Mountain en familia",
    description:
      "Ruta All Mountain en e-bike apta para toda la familia, pedaleando junto al río en el entorno de Arcalís. Pensada para compartir la experiencia del enduro con niños.",
    highlights: [
      "Apta para familias con niños",
      "Recorrido junto al río",
      "Nivel adaptable según el grupo",
    ],
  },
  {
    id: "remontes-btt",
    title: "Remontes BTT-Enduro",
    region: "Andorra",
    country: "Andorra",
    type: "BTT",
    level: "Intermedio +",
    duration: "Día completo",
    image:
      "https://i-wildland.com/wp-content/uploads/2020/04/portella-del-forn-canillo-800x533.jpg",
    alt: "Remontes BTT Enduro, rutas únicas en Andorra",
    description:
      "Aprovechá los remontes de Andorra para maximizar el tiempo de descenso en bici: subís en telesilla y bajás por rutas de enduro diseñadas por guías locales.",
    highlights: [
      "Uso de remontes para ahorrar esfuerzo",
      "Rutas exclusivas diseñadas por guías profesionales",
      "Ideal para aprovechar más descensos en menos tiempo",
    ],
  },
  {
    id: "4x4-tor",
    title: "Excursión 4x4 a Tor",
    region: "Tor",
    country: "España",
    type: "4x4",
    level: "Todos los niveles",
    duration: "4 horas",
    price: "€80 por persona",
    image:
      "https://i-wildland.com/wp-content/uploads/2020/05/IMG_20180724_171459-800x533.jpg",
    alt: "Excursión en 4x4 hacia el paraje de Tor",
    description:
      "Excursión de 4 horas en Land Rover Defender por la histórica ruta de los contrabandistas hasta Tor, un pequeño pueblo español de acceso solo practicable en 4x4. Paisajes de alta montaña y parada en el único bar del pueblo.",
    highlights: [
      "Ruta histórica de los contrabandistas",
      "Land Rover Defender con guía-conductor",
      "Parada en el pueblo de Tor",
    ],
  },
  {
    id: "lagos-off-road",
    title: "Lagos Off-Road",
    region: "Pirineos",
    country: "Andorra",
    type: "4x4",
    level: "Todos los niveles",
    duration: "4 horas",
    image:
      "https://privateyachtexpeditions.com/wp-content/uploads/2023/10/4-x-4-Lagos-Off-Road-605x605.jpg",
    alt: "Excursión 4x4 a los lagos de alta montaña",
    description:
      "Excursión en 4x4 hacia los lagos de alta montaña de los Pirineos andorranos, con paradas para observar flora, fauna y los paisajes glaciares típicos de la zona.",
    highlights: [
      "Acceso a lagos de alta montaña",
      "Apto para grupos, familias y viajes de amigos",
      "Guía con conocimiento de la fauna y flora local",
    ],
  },
  {
    id: "pic-negre",
    title: "Pic Negre Off Road",
    region: "Claror",
    country: "Andorra",
    type: "4x4",
    level: "Todos los niveles",
    duration: "4 horas",
    price: "€85 por persona",
    image:
      "https://privateyachtexpeditions.com/wp-content/uploads/2023/10/Claror-verano-605x605.jpg",
    alt: "Excursión 4x4 Pic Negre Off Road",
    description:
      "Aventura en Land Rover Defender para descubrir la belleza natural de la zona de Claror y el Pic Negre, con la misma ruta histórica de los contrabandistas como hilo conductor.",
    highlights: [
      "Land Rover Defender",
      "Ruta de los contrabandistas",
      "4 horas de recorrido off-road",
    ],
  },
  {
    id: "via-ferrata-iniciacion",
    title: "Vía Ferrata Iniciación",
    region: "Andorra",
    country: "Andorra",
    type: "Vía Ferrata",
    level: "Principiante",
    duration: "Medio día",
    price: "€80 por persona",
    image:
      "https://privateyachtexpeditions.com/wp-content/uploads/2023/10/4-605x605.png",
    alt: "Vía ferrata para principiantes en Andorra",
    description:
      "Tu primera vía ferrata: una experiencia única pensada para quienes se quieren iniciar en esta actividad, con equipo de seguridad completo y acompañamiento constante del guía.",
    highlights: [
      "Ideal como primera experiencia en vía ferrata",
      "Equipo de seguridad incluido",
      "Guía certificado en vía ferrata",
    ],
  },
  {
    id: "via-ferrata-avanzado",
    title: "Vía Ferrata Avanzado",
    region: "Andorra",
    country: "Andorra",
    type: "Vía Ferrata",
    level: "Avanzado",
    duration: "Día completo",
    price: "€85 por persona",
    image:
      "https://privateyachtexpeditions.com/wp-content/uploads/2023/10/via-ferrata-3-150x150.jpg",
    alt: "Vía ferrata avanzada en Andorra",
    description:
      "Para quienes ya tienen experiencia: tramos más expuestos y técnicos, con mayor exigencia física, en un entorno de alta montaña con vistas espectaculares.",
    highlights: [
      "Tramos técnicos de mayor exposición",
      "Recomendado con experiencia previa en vía ferrata",
      "Equipo de seguridad incluido",
    ],
  },
  {
    id: "senderismo-incles",
    title: "Senderismo en Incles",
    region: "Vall d'Incles",
    country: "Andorra",
    type: "Senderismo",
    level: "Principiante +",
    duration: "Medio día",
    image:
      "https://privateyachtexpeditions.com/wp-content/uploads/2023/10/INCLES-605x605.jpg",
    alt: "Senderismo de verano en Vall d'Incles",
    description:
      "Recorré la Vall d'Incles a pie, uno de los valles más fotogénicos de Andorra, con bosques de pino y haya, praderas alpinas y posibilidad de avistar marmotas, águilas y rebecos.",
    highlights: [
      "Paisaje de bosques y praderas alpinas",
      "Posibilidad de avistar fauna de montaña",
      "Apto para familias",
    ],
  },
  {
    id: "senderismo-jucla",
    title: "Senderismo en Jucla",
    region: "Jucla",
    country: "Andorra",
    type: "Senderismo",
    level: "Principiante +",
    duration: "Día completo",
    price: "€85 por persona",
    image:
      "https://privateyachtexpeditions.com/wp-content/uploads/2023/10/JUCLA-605x605.jpg",
    alt: "Senderismo en Jucla, Andorra",
    description:
      "Excursión de día completo para toda la familia por la zona de Jucla, combinando naturaleza y patrimonio cultural de los pueblos de montaña andorranos.",
    highlights: [
      "Recorrido de día completo",
      "Incluye paso por pueblos con tradiciones ancestrales",
      "Apto para toda la familia",
    ],
  },
  {
    id: "rafting-noguera",
    title: "Rafting en Noguera Pallaresa",
    region: "Noguera Pallaresa",
    country: "España",
    type: "Rafting",
    level: "Principiante +",
    duration: "Medio día",
    price: "€85 por persona",
    image:
      "https://i-wildland.com/wp-content/uploads/2020/04/noguera-pallaresa-4-scaled.jpg",
    alt: "Rafting en el río Noguera Pallaresa",
    description:
      "Bajada en rafting por uno de los ríos más emblemáticos del Pirineo, el Noguera Pallaresa. Una experiencia para toda la familia con instructores certificados en aguas bravas.",
    highlights: [
      "Apto para toda la familia",
      "Equipo de seguridad incluido",
      "Instructores certificados en aguas bravas",
    ],
  },
  {
    id: "heliflight",
    title: "Heliflight",
    region: "Andorra",
    country: "Andorra",
    type: "Heliflight",
    level: "Todos los niveles",
    duration: "Variable",
    image:
      "https://i-wildland.com/wp-content/uploads/2020/06/G43A2769-2-scaled.jpg",
    alt: "Experiencia de vuelo en helicóptero sobre Andorra",
    description:
      "Sobrevolá los Pirineos andorranos en helicóptero para una perspectiva única de los valles, picos y lagos de montaña. Ideal para combinar con otra actividad terrestre.",
    highlights: [
      "Vistas panorámicas de Andorra desde el aire",
      "Combinable con otras experiencias de iWE",
      "Duración y ruta a medida",
    ],
  },
];

export const packages = [
  { name: "Andorra Holiday & Bike", duration: "5 días / 4 noches" },
  { name: "Andorra Holiday & Bike", duration: "8 días / 7 noches" },
];

export const reviews = [
  {
    quote:
      "Charlie fue un guía excepcional en nuestra ruta 4x4 hasta Tor: gran conocedor de la zona, muy buen conductor y siempre atento a que disfrutáramos cada parada para sacar fotos.",
    name: "Joan",
    location: "Andorra la Vella",
    tour: "4x4 a Tor",
  },
  {
    quote:
      "Salimos en e-bike por las montañas de Andorra con Carlos como guía. Se adaptó a nuestro nivel técnico y físico desde el primer momento y nos llevó por rutas que jamás hubiéramos encontrado solos.",
    name: "Cliente verificado",
    location: "Begur, España",
    tour: "E-Bike Enduro",
  },
  {
    quote:
      "Reservamos una excursión 4x4 con nuestro perro y aprendimos sobre la naturaleza y la historia de la zona durante todo el recorrido. Una experiencia que recomendamos sin dudar.",
    name: "Melanie",
    location: "Países Bajos",
    tour: "4x4 Lagos Off-Road",
  },
];

export const navSections = [
  {
    label: "Nuestra empresa",
    anchor: "/#mission",
    items: [
      { title: "Nuestra empresa", id: "mission" },
      { title: "Nuestro equipo", id: "team" },
    ],
  },
  {
    label: "Bike",
    anchor: "/#bike",
    items: activities
      .filter((activity) => activity.type === "BTT")
      .map((activity) => ({ title: activity.title, id: activity.id })),
  },
  {
    label: "Vía Ferrata",
    anchor: "/#via-ferrata",
    items: activities
      .filter((activity) => activity.type === "Vía Ferrata")
      .map((activity) => ({ title: activity.title, id: activity.id })),
  },
  {
    label: "4×4",
    anchor: "/#4x4",
    items: activities
      .filter((activity) => activity.type === "4x4")
      .map((activity) => ({ title: activity.title, id: activity.id })),
  },
  {
    label: "Senderismo",
    anchor: "/#senderismo",
    items: activities
      .filter((activity) => activity.type === "Senderismo")
      .map((activity) => ({ title: activity.title, id: activity.id })),
  },
  {
    label: "Esquí-Snow",
    anchor: "/#esqui-snow",
    items: activities
      .filter((activity) => activity.type === "Esquí-Snow")
      .map((activity) => ({ title: activity.title, id: activity.id })),
  },
];
