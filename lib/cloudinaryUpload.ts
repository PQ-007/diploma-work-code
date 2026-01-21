export type CloudinaryUploadResult = {
  secureUrl: string;
  publicId?: string;
};

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const uploadUrl = CLOUD_NAME
  ? `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
  : undefined;

export async function uploadImageToCloudinary(
  file: File,
): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary config missing. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.",
    );
  }

  if (!uploadUrl) {
    throw new Error("Upload URL could not be constructed.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  let json: any;
  if (!res.ok) {
    try {
      json = await res.json();
    } catch (e) {
      // ignore
    }

    const apiMessage = json?.error?.message as string | undefined;
    const message =
      apiMessage || (await res.text().catch(() => res.statusText));
    throw new Error(`Cloudinary upload failed: ${message || res.statusText}`);
  }

  json = json ?? (await res.json());
  if (!json?.secure_url) {
    throw new Error("Cloudinary response missing secure_url.");
  }

  return {
    secureUrl: json.secure_url as string,
    publicId: typeof json.public_id === "string" ? json.public_id : undefined,
  };
}
