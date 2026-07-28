const CLOUD_NAME = 'dfkpmldma';
const UPLOAD_PRESET = 'giki-chronicles';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadImageToCloudinary(file: File): Promise<{
  success: boolean;
  imageUrl?: string;
  cloudinaryId?: string;
  error?: string;
}> {
  if (!file.type.startsWith('image/')) {
    return { success: false, error: 'Please select an image file.' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: 'Max file size is 10MB.' };
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );

    if (!response.ok) {
      let detail = '';
      try {
        detail = await response.text();
      } catch {
        /* ignore */
      }
      throw new Error(`Image upload failed${detail ? `: ${detail}` : ''}`);
    }

    const data = await response.json();
    if (!data.secure_url) {
      throw new Error(
        `Upload response missing URL${data.error?.message ? `: ${data.error.message}` : ''}`
      );
    }

    return {
      success: true,
      imageUrl: data.secure_url as string,
      cloudinaryId: data.public_id as string,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to upload image.';
    return { success: false, error: message };
  }
}
