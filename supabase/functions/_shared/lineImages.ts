// Photo attachments sent along with LINE messages (the morning letter and starting-soon reminders).
import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export type ImageMessage = { type: 'image'; originalContentUrl: string; previewImageUrl: string };

/**
 * Signed https URLs for image attachments LINE can fetch (JPEG/PNG only). Only files in the
 * owner's own folder: the stored path is user data, and this signs with full access.
 */
export async function imageMessages(
  supabase: SupabaseClient,
  attachments: unknown,
  userId: string,
): Promise<ImageMessage[]> {
  const list = Array.isArray(attachments) ? attachments : [];
  const images = list.filter(
    (a: Record<string, unknown>) =>
      typeof a?.type === 'string' && /^image\/(jpeg|jpg|png)$/i.test(a.type as string) &&
      typeof a?.path === 'string' && (a.path as string).startsWith(`${userId}/`) &&
      !(a.path as string).split('/').includes('..'),
  );
  const out: ImageMessage[] = [];
  for (const img of images) {
    const { data } = await supabase.storage
      .from('attachments')
      .createSignedUrl(img.path as string, 60 * 60 * 24);
    if (data?.signedUrl) {
      out.push({ type: 'image', originalContentUrl: data.signedUrl, previewImageUrl: data.signedUrl });
    }
  }
  return out;
}
