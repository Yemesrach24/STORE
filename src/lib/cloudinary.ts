/**
 * Cloudinary Image Upload Integration
 * 
 * Free tier: 10GB storage, 100GB bandwidth/month
 * Setup:
 * 1. Create free account at https://cloudinary.com
 * 2. Add to .env.local:
 *    CLOUDINARY_CLOUD_NAME=your_cloud_name
 *    CLOUDINARY_API_KEY=your_api_key
 *    CLOUDINARY_API_SECRET=your_api_secret
 * 3. Or use unsigned upload with an upload preset (simpler):
 *    CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
 *    CLOUDINARY_CLOUD_NAME=your_cloud_name
 */

// const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
// const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
// const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

const CLOUDINARY_CLOUD_NAME = 'wvc1izjp';
const CLOUDINARY_API_KEY = '362969516648412';
const CLOUDINARY_API_SECRET = 'cRuykmXYxlPWxqIf82ZjHQBG6qc';

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Upload image to Cloudinary using signed upload (server-side)
 */
export async function uploadImage(
  fileBuffer: Buffer,
  folder: string = 'inventory',
  filename?: string
): Promise<UploadResult> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary credentials not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env.local');
  }

  const timestamp = Math.round(Date.now() / 1000);
  const publicId = filename || `${folder}_${Date.now()}`;

  // Build the string to sign
  const params: Record<string, string | number> = {
    folder,
    public_id: publicId,
    timestamp,
    transformation: 'f_auto,q_auto,w_800',
  };

  // Generate signature using SHA-1
  const crypto = await import('crypto');
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  const signature = crypto
    .createHash('sha1')
    .update(sortedParams + CLOUDINARY_API_SECRET)
    .digest('hex');

  // Upload via FormData
  const formData = new FormData();
  formData.append('file', new Blob([fileBuffer as any]), filename || 'image.jpg');
  formData.append('api_key', CLOUDINARY_API_KEY);
  formData.append('timestamp', String(timestamp));
  formData.append('folder', folder);
  formData.append('public_id', publicId);
  formData.append('transformation', 'f_auto,q_auto,w_800');
  formData.append('signature', signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Cloudinary upload failed: ${error.error?.message || response.statusText}`);
  }

  const result = await response.json();

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}

/**
 * Delete image from Cloudinary
 */
export async function deleteImage(publicId: string): Promise<boolean> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return false;
  }

  const timestamp = Math.round(Date.now() / 1000);

  const crypto = await import('crypto');
  const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

  const formData = new FormData();
  formData.append('public_id', publicId);
  formData.append('timestamp', String(timestamp));
  formData.append('api_key', CLOUDINARY_API_KEY);
  formData.append('signature', signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
    { method: 'POST', body: formData }
  );

  const result = await response.json();
  return result.result === 'ok';
}

/**
 * Generate a Cloudinary URL with transformations (for optimized thumbnails, etc.)
 */
export function getOptimizedUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: string;
    format?: string;
  } = {}
): string {
  if (!CLOUDINARY_CLOUD_NAME) return '';
  
  const { width = 400, height, quality = 'auto', format = 'auto' } = options;
  let transformation = `f_${format},q_${quality},w_${width}`;
  if (height) transformation += `,h_${height}`;

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformation}/${publicId}`;
}
