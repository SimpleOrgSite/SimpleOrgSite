// Safe to import from client components (no server code).

export type Director = {
  id: string;
  name: string;
  title: string;
  affiliation: string;
  photo_path: string | null;
  bio: string;
  email: string;
};

export const DIRECTOR_LAYOUTS = [
  { key: "list", label: "Names and titles only" },
  { key: "modal", label: "Photo, name and title; click to show bio" },
  { key: "side", label: "Photo, name and title with bio on the side" },
  { key: "cards", label: "Photo, name and title, no bio" },
] as const;
export type DirectorLayout = (typeof DIRECTOR_LAYOUTS)[number]["key"];

export const PHOTO_SHAPES = [
  { key: "rectangle", label: "Rectangle" },
  { key: "rounded", label: "Rounded rectangle" },
  { key: "oval", label: "Oval" },
  { key: "circle", label: "Circle" },
] as const;
export type PhotoShape = (typeof PHOTO_SHAPES)[number]["key"];

// The photo box is cropped to the shape (object-cover), never stretched.
export const SHAPE_CLASSES: Record<PhotoShape, string> = {
  rectangle: "aspect-[4/5]",
  rounded: "aspect-[4/5] rounded-2xl",
  oval: "aspect-[4/5] rounded-[50%]",
  circle: "aspect-square rounded-full",
};
