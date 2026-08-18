/**
 * Utility functions for capping image resolutions and optimizing web delivery
 * to ensure high-performance rendering and eliminate UI lag in gallery grids.
 */

const CLOUDINARY_CLOUD_NAME = "dfkpmldma";
const DEFAULT_UPLOAD_PRESET = "giki-chronicles";

/**
 * Caps the resolution of a Cloudinary image URL by injecting dynamic transformation
 * parameters (width limit, auto quality, auto format) for web display.
 * 
 * @param url The image URL (Cloudinary or external)
 * @param width The maximum width in pixels (default: 600px for grid cards)
 * @returns The optimized URL with resolution capping applied
 */
export function getOptimizedImageUrl(url?: string | null, width = 600): string {
  if (!url) return '';
  
  // If it's a Cloudinary URL, inject resolution capping transformations
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    // Check if URL already contains scaling or limit transformations
    if (url.includes('/c_scale') || url.includes('/c_limit') || url.includes('/c_fill')) {
      return url;
    }
    // Inject c_limit,w_{width},q_auto,f_auto right after /upload/
    // c_limit ensures we only downscale larger images without distortion or upscaling
    return url.replace('/upload/', `/upload/c_limit,w_${width},q_auto,f_auto/`);
  }
  
  return url;
}

/**
 * Client-side Canvas Image Compression and Resolution Capping.
 * Caps the image resolution before upload so that large camera photos (e.g. 12MP/48MP)
 * do not stall uploads or bloat cloud storage.
 * 
 * @param file The original image file selected by the user
 * @param maxDimension Maximum width or height in pixels (default: 1920px)
 * @param quality JPEG/WebP compression quality (0.0 to 1.0, default: 0.85)
 * @returns A Promise resolving to the capped resolution File object
 */
export async function capImageResolution(
  file: File,
  maxDimension = 1920,
  quality = 0.85
): Promise<File> {
  // If file is not an image or is an SVG/GIF, return original file
  if (!file.type.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif')) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let { width, height } = img;

        // Check if resolution needs capping
        if (width <= maxDimension && height <= maxDimension) {
          resolve(file); // Already within limits
          return;
        }

        // Calculate aspect ratio preserving dimensions
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // Fallback if canvas context fails
          return;
        }

        // High quality image interpolation
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG or WebP
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            // Create a new File object with capped resolution
            const cappedFile = new File([blob], file.name, {
              type: outputType,
              lastModified: Date.now(),
            });
            resolve(cappedFile);
          },
          outputType,
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Uploads an image file to Cloudinary using unsigned preset.
 * 
 * @param file The image file to upload
 * @param uploadPreset Cloudinary unsigned upload preset name
 * @returns Promise with secureUrl and publicId
 */
export async function uploadImageToCloudinary(
  file: File,
  uploadPreset = DEFAULT_UPLOAD_PRESET
): Promise<{ secureUrl: string; publicId: string }> {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let detail = '';
    try { detail = await response.text(); } catch { /* ignore */ }
    throw new Error(`Cloudinary upload failed${detail ? `: ${detail}` : ''}`);
  }

  const data = await response.json();
  if (!data.secure_url) {
    throw new Error("Upload response missing secure_url");
  }

  return {
    secureUrl: data.secure_url,
    publicId: data.public_id || '',
  };
}
