import imageCompression from 'browser-image-compression';

export const uploadReportImage = async (file: Blob | File): Promise<string> => {
  const signatureRes = await fetch("/api/cloudinary/signature");

  if (!signatureRes.ok) {
    throw new Error("Unable to authorize image upload.");
  }

  const signaturePayload = (await signatureRes.json()) as {
    cloudName: string;
    apiKey: string;
    timestamp: number;
    folder: string;
    allowedFormats: string;
    signature: string;
  };

  let compressedFile = file;
  if (file instanceof File) {
    try {
      compressedFile = await imageCompression(file, {
        maxSizeMB: 1, // Compress to max 1MB
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });
    } catch (error) {
      console.warn("Image compression failed, using original file:", error);
    }
  }

  const formData = new FormData();
  formData.append("file", compressedFile);
  formData.append("api_key", signaturePayload.apiKey);
  formData.append("timestamp", signaturePayload.timestamp.toString());
  formData.append("signature", signaturePayload.signature);
  formData.append("folder", signaturePayload.folder);
  if (signaturePayload.allowedFormats) {
    formData.append("allowed_formats", signaturePayload.allowedFormats);
  }

  const uploadUrl = `https://api.cloudinary.com/v1_1/${signaturePayload.cloudName}/image/upload`;
  const res = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Image upload failed.");
  }

  const payload = (await res.json()) as { secure_url?: string; url?: string };
  const uploadedUrl = payload.secure_url ?? payload.url;

  if (!uploadedUrl) {
    throw new Error("Upload finished but no image URL was returned.");
  }

  return uploadedUrl;
};
