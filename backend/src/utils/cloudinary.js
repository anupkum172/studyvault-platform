import { v2 as cloudinary } from 'cloudinary';

export const hasCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

export function uploadBuffer(buffer, originalName) {
  if (!hasCloudinary) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: 'studyvault',
        resource_type: 'raw',
        use_filename: true,
        unique_filename: true,
        filename_override: originalName
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );

    upload.end(buffer);
  });
}

export function getCloudinaryDownloadUrl(resource) {
  if (!hasCloudinary || !resource?.publicId) return resource?.fileUrl || '';

  const extension = resource.originalName?.includes('.')
    ? resource.originalName.split('.').pop()
    : undefined;

  return cloudinary.utils.private_download_url(resource.publicId, extension, {
    resource_type: resource.resourceType || 'raw',
    type: 'upload',
    attachment: true,
    expires_at: Math.floor(Date.now() / 1000) + 300
  });
}

export async function deleteCloudinaryFile(publicId) {
  if (!hasCloudinary || !publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }).catch(() => {});
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' }).catch(() => {});
  await cloudinary.uploader.destroy(publicId, { resource_type: 'video' }).catch(() => {});
}
