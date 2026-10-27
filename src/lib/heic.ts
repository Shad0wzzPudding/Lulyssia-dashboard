/**
 * HEIC/HEIF photos (what iPhones save by default). Only Safari can show them; Chrome, Edge, Firefox
 * and Android show a broken picture, and LINE only takes JPEG and PNG. New uploads are turned into
 * JPEG, and HEIC files saved before that are converted on screen when the browser can't show them.
 * The converter (heic-to, about 3 MB) is downloaded only the first time a HEIC file is involved.
 */

const HEIC_TYPES = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'];

/** By its type, or by its name when the browser gave no type (some do for HEIC). */
export const isHeic = (file: { type?: string | null; name?: string | null }) =>
  HEIC_TYPES.includes((file.type || '').toLowerCase()) || /\.(heic|heif)$/i.test(file.name || '');

const toJpegBlob = async (blob: Blob) => {
  const { heicTo } = await import('heic-to');
  return heicTo({ blob, type: 'image/jpeg', quality: 0.9 });
};

/** The same photo as a JPEG file named "<name>.jpg", ready to upload. */
export const heicFileToJpeg = async (file: File) => {
  const jpeg = await toJpegBlob(file);
  const name = `${file.name.replace(/\.(heic|heif)$/i, '') || 'photo'}.jpg`;
  return new File([jpeg], name, { type: 'image/jpeg', lastModified: file.lastModified });
};

// One conversion per stored file for as long as the page is open (cards redraw and links renew)
const previews = new Map<string, Promise<string>>();

/**
 * A picture address the browser can show for a stored HEIC file: downloaded once from its link,
 * converted to JPEG, kept for this visit. Rejects if it can't be converted.
 */
export const heicPreviewUrl = (path: string, signedUrl: string) => {
  let preview = previews.get(path);
  if (!preview) {
    preview = (async () => {
      const res = await fetch(signedUrl);
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);
      return URL.createObjectURL(await toJpegBlob(await res.blob()));
    })();
    // A failure isn't kept, so a later try (e.g. back online) can work
    preview.catch(() => previews.delete(path));
    previews.set(path, preview);
  }
  return preview;
};
