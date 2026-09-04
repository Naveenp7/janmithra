/**
 * Cloudinary Media Storage Service
 * Handles direct unsigned uploads to Cloudinary with client-side compression
 * and upload progress monitoring.
 */

export function getCloudinaryConfig() {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim();

  const isConfigured = Boolean(
    cloudName &&
    uploadPreset &&
    !cloudName.includes('your_cloudinary') &&
    !uploadPreset.includes('your_unsigned')
  );

  return { cloudName, uploadPreset, isConfigured };
}

export const isCloudinaryConfigured = getCloudinaryConfig().isConfigured;

/**
 * Compresses an image client-side before uploading to save bandwidth and speed up mobile uploads
 */
export async function compressImage(file, maxWidth = 1600, maxHeight = 1600, quality = 0.85) {
  if (!file || !file.type.startsWith('image/')) return file;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio while scaling down
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '') + '.jpg',
              {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }
            );
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image file directly to Cloudinary using an unsigned upload preset.
 * 
 * @param {File} file - The image file to upload
 * @param {Function} [onProgress] - Optional callback receiving progress percentage (0-100)
 * @returns {Promise<string>} - Returns the secure HTTPS Cloudinary URL
 */
export async function uploadImageToCloudinary(file, onProgress) {
  if (!file) return null;

  const { cloudName, uploadPreset, isConfigured } = getCloudinaryConfig();

  if (!isConfigured) {
    throw new Error(
      'Cloudinary is not configured. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your .env file.'
    );
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file (JPG, PNG, WEBP).');
  }

  // Optimize and compress before uploading
  if (onProgress) onProgress(5);
  const fileToUpload = await compressImage(file);
  if (onProgress) onProgress(15);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'janmithra_complaints');

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          // Map progress from 15% to 95%
          const percent = 15 + Math.round((event.loaded / event.total) * 80);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (onProgress) onProgress(100);
          resolve(response.secure_url || response.url);
        } catch (e) {
          reject(new Error('Invalid response from Cloudinary API.'));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(
            new Error(
              err.error?.message ||
              `Cloudinary upload failed (HTTP ${xhr.status}). Please check your Cloud Name and Upload Preset.`
            )
          );
        } catch (e) {
          reject(new Error(`Cloudinary upload failed with HTTP status ${xhr.status}.`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error occurred while connecting to Cloudinary.'));
    };

    xhr.send(formData);
  });
}
