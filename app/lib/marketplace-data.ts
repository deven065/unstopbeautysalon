import { query } from "@/app/lib/postgres";

export type ServiceCategory = {
  name: string;
  slug: string;
  detail: string;
  price: string;
  tone: string;
};

export type Salon = {
  id: string;
  name: string;
  area: string;
  coords: {
    lat: number;
    lng: number;
  };
  categories: string[];
  rating: number;
  reviews: number;
  basePrice: number;
  distanceKm: number;
  responseMins: number;
  hygieneScore: number;
  homeVisit: boolean;
  bridalReady: boolean;
  luxury: boolean;
  slots: string[];
  tags: string[];
  specialty: string;
};

type CategoryRow = {
  name: string;
  slug: string;
  detail: string;
  price_label: string;
  tone: string;
};

type SalonRow = {
  id: string;
  name: string;
  area: string;
  lat: string;
  lng: string;
  categories: string[];
  rating: string;
  reviews: number;
  base_price: number;
  distance_km: string;
  response_mins: number;
  hygiene_score: number;
  home_visit: boolean;
  bridal_ready: boolean;
  luxury: boolean;
  slots: string[];
  tags: string[];
  specialty: string;
};

export type TrustedSalon = {
  name: string;
  basePrice: number;
};

export async function getMarketplaceData() {
  const [categoriesResult, salonsResult] = await Promise.all([
    query<CategoryRow>(
      `
        SELECT name, slug, detail, price_label, tone
        FROM service_categories
        WHERE active = true
        ORDER BY display_order, name
      `,
    ),
    query<SalonRow>(
      `
        SELECT
          s.id,
          s.name,
          s.area,
          s.lat,
          s.lng,
          s.rating,
          s.reviews,
          s.base_price,
          s.distance_km,
          s.response_mins,
          s.hygiene_score,
          s.home_visit,
          s.bridal_ready,
          s.luxury,
          s.specialty,
          ARRAY(
            SELECT sc.category_slug
            FROM salon_categories sc
            WHERE sc.salon_id = s.id
            ORDER BY sc.position, sc.category_slug
          ) AS categories,
          ARRAY(
            SELECT ss.slot_label
            FROM salon_slots ss
            WHERE ss.salon_id = s.id
            ORDER BY ss.position, ss.slot_label
          ) AS slots,
          ARRAY(
            SELECT st.tag
            FROM salon_tags st
            WHERE st.salon_id = s.id
            ORDER BY st.position, st.tag
          ) AS tags
        FROM salons s
        WHERE s.active = true
        ORDER BY s.display_order, s.name
      `,
    ),
  ]);

  return {
    serviceCategories: categoriesResult.rows.map((category) => ({
      name: category.name,
      slug: category.slug,
      detail: category.detail,
      price: category.price_label,
      tone: category.tone,
    })),
    salons: salonsResult.rows.map((salon) => ({
      id: salon.id,
      name: salon.name,
      area: salon.area,
      coords: {
        lat: Number(salon.lat),
        lng: Number(salon.lng),
      },
      categories: salon.categories,
      rating: Number(salon.rating),
      reviews: salon.reviews,
      basePrice: salon.base_price,
      distanceKm: Number(salon.distance_km),
      responseMins: salon.response_mins,
      hygieneScore: salon.hygiene_score,
      homeVisit: salon.home_visit,
      bridalReady: salon.bridal_ready,
      luxury: salon.luxury,
      slots: salon.slots,
      tags: salon.tags,
      specialty: salon.specialty,
    })),
  };
}

export async function getTrustedSalonFromDb(salonId: unknown): Promise<TrustedSalon | undefined> {
  if (typeof salonId !== "string") return undefined;

  const result = await query<{ name: string; base_price: number }>(
    `
      SELECT name, base_price
      FROM salons
      WHERE id = $1 AND active = true
      LIMIT 1
    `,
    [salonId],
  );
  const row = result.rows[0];

  return row ? { name: row.name, basePrice: row.base_price } : undefined;
}
