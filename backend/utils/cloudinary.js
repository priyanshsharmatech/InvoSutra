const { v2: cloudinary } = require("cloudinary");
const env = require("../config/env");
const ApiError = require("./ApiError");

const isCloudinaryConfigured = () =>
  Boolean(
    env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET
  );

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Upload an in-memory image buffer to Cloudinary. Returns { url, publicId }.
const uploadImage = (buffer, folder) => {
  if (!isCloudinaryConfigured()) {
    throw new ApiError(
      503,
      "Image uploads are not configured on the server. Add your Cloudinary credentials to enable this."
    );
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) {
          console.error("Cloudinary image upload error:", error);
          return reject(
            new ApiError(502, `Image upload failed: ${error.message || "unknown error"}`)
          );
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

// Best-effort delete; never throws (used when replacing an old asset).
const deleteImage = async (publicId) => {
  if (!publicId || !isCloudinaryConfigured()) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete failed:", err.message);
  }
};

// Upload any file type (pdf, docs, images) as a raw/auto resource.
// Returns { url, publicId, resourceType }.
const uploadFile = (buffer, folder, filename) => {
  if (!isCloudinaryConfigured()) {
    throw new ApiError(
      503,
      "File uploads are not configured on the server. Add your Cloudinary credentials to enable this."
    );
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto", use_filename: true, filename_override: filename },
      (error, result) => {
        if (error) {
          console.error("Cloudinary file upload error:", error);
          return reject(
            new ApiError(502, `File upload failed: ${error.message || "unknown error"}`)
          );
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
        });
      }
    );
    stream.end(buffer);
  });
};

// Best-effort delete of any resource type.
const deleteFile = async (publicId, resourceType = "image") => {
  if (!publicId || !isCloudinaryConfigured()) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error("Cloudinary delete failed:", err.message);
  }
};

module.exports = {
  isCloudinaryConfigured,
  uploadImage,
  deleteImage,
  uploadFile,
  deleteFile,
};
