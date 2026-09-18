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
  imageNumbers: number | readonly number[],
): GalleryCollection {
  return {
    slug,
    title,
    category,
    description,
    images: (typeof imageNumbers === "number"
      ? Array.from({ length: imageNumbers }, (_, index) => index + 1)
      : imageNumbers
    ).map((number) => `/media/sajivo-gallery/${slug}/${String(number).padStart(2, "0")}.webp`),
  };
}

export const galleryCollections: GalleryCollection[] = [
  collection("warm-minimal-apartment", "Warm minimal apartment", "project", "Calm neutral rooms planned around daylight, practical circulation and understated finishes.", 6),
  collection("comfort-led-living", "Comfort-led living", "project", "Generous seating, warm lighting and layered materials for everyday family life.", 6),
  collection("indoor-outdoor-residence", "Indoor-outdoor residence", "project", "Courtyards, shaded transitions and planted spaces that connect the home with nature.", 6),
  collection("layered-natural-home", "Layered natural home", "project", "Natural textures, crafted details and soft daylight across connected living spaces.", 6),
  collection("crafted-dining-space", "Crafted dining space", "project", "Dining settings shaped by timber, statement lighting and garden-facing views.", [1, 2, 4, 5, 6]),
  collection("calm-family-lounge", "Calm family lounge", "project", "Comfortable contemporary lounges with balanced lighting and durable finishes.", 6),
  collection("soft-modern-bedroom", "Soft modern bedroom", "project", "Restful bedrooms using warm neutrals, clean storage and gentle natural light.", 6),
  collection("quiet-luxury-room", "Quiet luxury room", "project", "Refined rooms with integrated lighting, deep tones and carefully controlled detailing.", [1, 2, 3, 4, 6]),
  collection("pvc-wall-panels", "PVC wall panels", "material", "Decorative panel applications for feature walls, joinery and low-maintenance surfaces.", [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12]),
  collection("natural-stone", "Natural stone", "material", "Stone formats for tactile feature walls, fireplaces and architectural surfaces.", 12),
  collection("engineered-wood", "Engineered wood", "material", "Stable timber flooring patterns and finishes for contemporary interiors.", 12),
  collection("textured-paint", "Textured paint", "material", "Textured and mineral-look finishes for expressive walls and quieter tonal rooms.", 12),
];

export const projectCollections = galleryCollections.filter((item) => item.category === "project");
export const materialCollections = galleryCollections.filter((item) => item.category === "material");

const approvedGalleryImages = new Set(galleryCollections.flatMap((item) => item.images));

// Also protect gallery cards supplied by persisted or external work-photo data.
export function isGalleryImageAllowed(image: string): boolean {
  try {
    const path = decodeURIComponent(new URL(image, "https://gallery.local").pathname);
    return !path.startsWith("/media/sajivo-gallery/") || approvedGalleryImages.has(path);
  } catch {
    return false;
  }
}
