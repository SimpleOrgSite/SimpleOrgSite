// Photo shapes, shared by the Team grid block. Safe to import from client components (no server code).

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
