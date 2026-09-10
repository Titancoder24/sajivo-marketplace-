export type GalleryCollection = {
  slug: string;
  title: string;
  category: "project" | "material";
  description: string;
  images: string[];
};

function collection(
  slug: string,
  title: string,
  category: GalleryCollection["category"],
  description: string,
  count: number,
): GalleryCollection {
  return {
    slug,
    title,
    category,
    description,
    images: Array.from(
      { length: count },
      (_, index) => `/media/sajivo-gallery/${slug}/${String(index + 1).padStart(2, "0")}.webp`,
    ),
  };
}

export const galleryCollections: GalleryCollection[] = [
  collection("warm-minimal-apartment", "Warm minimal apartment", "project", "Calm neutral rooms planned around daylight, practical circulation and understated finishes.", 6),
  collection("comfort-led-living", "Comfort-led living", "project", "Generous seating, warm lighting and layered materials for everyday family life.", 6),
  collection("indoor-outdoor-residence", "Indoor-outdoor residence", "project", "Courtyards, shaded transitions and planted spaces that connect the home with nature.", 6),
  collection("layered-natural-home", "Layered natural home", "project", "Natural textures, crafted details and soft daylight across connected living spaces.", 6),
  collection("crafted-dining-space", "Crafted dining space", "project", "Dining settings shaped by timber, statement lighting and garden-facing views.", 6),
  collection("calm-family-lounge", "Calm family lounge", "project", "Comfortable contemporary lounges with balanced lighting and durable finishes.", 6),
  collection("soft-modern-bedroom", "Soft modern bedroom", "project", "Restful bedrooms using warm neutrals, clean storage and gentle natural light.", 6),
  collection("quiet-luxury-room", "Quiet luxury room", "project", "Refined rooms with integrated lighting, deep tones and carefully controlled detailing.", 6),
  collection("quiet-luxury-room-set-two", "Quiet luxury room - collection two", "project", "A second supplied direction for premium bedrooms and lounge interiors.", 6),
  collection("pvc-wall-panels", "PVC wall panels", "material", "Decorative panel applications for feature walls, joinery and low-maintenance surfaces.", 12),
  collection("natural-stone", "Natural stone", "material", "Stone formats for tactile feature walls, fireplaces and architectural surfaces.", 12),
  collection("engineered-wood", "Engineered wood", "material", "Stable timber flooring patterns and finishes for contemporary interiors.", 12),
  collection("textured-paint", "Textured paint", "material", "Textured and mineral-look finishes for expressive walls and quieter tonal rooms.", 12),
];

export const projectCollections = galleryCollections.filter((item) => item.category === "project");
export const materialCollections = galleryCollections.filter((item) => item.category === "material");
