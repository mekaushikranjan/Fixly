import { uploadUserAvatar, UploadedProfilePhoto } from './r2Storage';

export const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PROFILE_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function isAllowedProfilePhotoType(contentType: string): boolean {
  return ALLOWED_PROFILE_PHOTO_TYPES.has(contentType.toLowerCase());
}

export function needsGoogleProfilePhotoMigration(avatar: string | null | undefined): boolean {
  if (!avatar) return true;
  try {
    return new URL(avatar).hostname.endsWith('.googleusercontent.com');
  } catch {
    return false;
  }
}

export function decodeProfilePhoto(base64: string, contentType: string): Buffer {
  if (!isAllowedProfilePhotoType(contentType)) {
    throw new Error('Profile photo must be a JPEG, PNG, or WebP image.');
  }
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64)) {
    throw new Error('Profile photo data must be valid base64.');
  }
  const image = Buffer.from(base64, 'base64');
  if (!image.length || image.length > MAX_PROFILE_PHOTO_BYTES) {
    throw new Error('Profile photo must be smaller than 5 MB.');
  }
  return image;
}

export async function uploadGoogleProfilePhoto(
  userId: string,
  photoUrl: string,
): Promise<UploadedProfilePhoto> {
  const url = new URL(photoUrl);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.googleusercontent.com')) {
    throw new Error('Google profile photo URL is not from an approved image host.');
  }

  const response = await fetch(url, {
    redirect: 'error',
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`Google profile photo returned HTTP ${response.status}.`);

  const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() ?? '';
  if (!isAllowedProfilePhotoType(contentType)) {
    throw new Error('Google profile photo uses an unsupported image format.');
  }
  const contentLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_PROFILE_PHOTO_BYTES) {
    throw new Error('Google profile photo exceeds the allowed size.');
  }

  if (!response.body) throw new Error('Google profile photo response has no image data.');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_PROFILE_PHOTO_BYTES) {
        await reader.cancel();
        throw new Error('Google profile photo exceeds the allowed size.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (!totalBytes) throw new Error('Google profile photo is empty.');

  const image = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), totalBytes);
  return uploadUserAvatar(userId, image.toString('base64'), contentType);
}
