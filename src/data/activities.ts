export type ActivityType = string;

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
