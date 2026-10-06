import { createClient } from "@/lib/supabase/client";

// Browser-side uploads for block images and documents. Safe to import from client components only.
export const IMAGE_TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg" };
export const FILE_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};
const RULES = {
  logos: { prefix: "block", types: IMAGE_TYPES, maxMb: 5, kind: "Images must be a PNG, JPG, WebP or SVG, under 5 MB." },
  "block-files": { prefix: "doc", types: FILE_TYPES, maxMb: 10, kind: "Files must be a PDF or Word document, under 10 MB." },
} as const;

export async function uploadToBucket(bucket: keyof typeof RULES, file: File): Promise<{ path: string } | { error: string }> {
  const rule = RULES[bucket];
  const ext = rule.types[file.type];
  if (!ext || file.size > rule.maxMb * 1024 * 1024) return { error: rule.kind };
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Please sign in again to upload." };
  // The server checks that paths it receives follow exactly this shape and sit in the owner's own folder.
  const path = `${data.user.id}/${rule.prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type });
  return error ? { error: error.message } : { path };
}

export const publicUrl = (bucket: keyof typeof RULES, path: string) => createClient().storage.from(bucket).getPublicUrl(path).data.publicUrl;
