// Cloudinary Upload Utility
// Supports image and video uploads to Cloudinary via unsigned upload presets

export interface CloudinaryUploadResponse {
  secure_url: string
  public_id: string
  format: string
  width: number
  height: number
}

interface UploadOptions {
  folder?: string
  maxSizeInMB?: number
}

/**
 * Upload image to Cloudinary using an unsigned upload preset.
 * Both NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
 * must be set in .env.local for uploads to work.
 */
export async function uploadToCloudinary(
  file: File,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResponse> {
  const { folder = "foodieflow/general", maxSizeInMB = 10 } = options

  // ── Env guard ──────────────────────────────────────────────────────────
  const cloudName   = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and " +
        "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local."
    )
  }

  // ── Validation ────────────────────────────────────────────────────────
  const maxBytes = maxSizeInMB * 1024 * 1024
  if (file.size > maxBytes) {
    throw new Error(`Image must be smaller than ${maxSizeInMB} MB.`)
  }

  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
  if (!validTypes.includes(file.type)) {
    throw new Error("Only JPG, PNG, GIF, and WEBP images are allowed.")
  }

  // ── Upload ────────────────────────────────────────────────────────────
  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", uploadPreset)
  formData.append("folder", folder)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  )

  // Read body regardless of status so we can surface Cloudinary's error message
  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const msg =
      body?.error?.message ||
      body?.message ||
      `Cloudinary error ${response.status}: ${response.statusText}`
    throw new Error(msg)
  }

  return {
    secure_url: body.secure_url,
    public_id:  body.public_id,
    format:     body.format,
    width:      body.width,
    height:     body.height,
  }
}

/**
 * Upload video to Cloudinary using an unsigned upload preset.
 */
export async function uploadVideoToCloudinary(
  file: File,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResponse> {
  const { folder = "foodieflow/videos", maxSizeInMB = 50 } = options

  const cloudName    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and " +
        "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local."
    )
  }

  const maxBytes = maxSizeInMB * 1024 * 1024
  if (file.size > maxBytes) {
    throw new Error(`Video must be smaller than ${maxSizeInMB} MB.`)
  }

  const validTypes = ["video/mp4", "video/webm", "video/mov", "video/quicktime", "video/avi"]
  if (!validTypes.includes(file.type)) {
    throw new Error("Only MP4, WebM, MOV, and AVI videos are allowed.")
  }

  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", uploadPreset)
  formData.append("folder", folder)
  formData.append("resource_type", "video")

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
    { method: "POST", body: formData }
  )

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const msg =
      body?.error?.message ||
      body?.message ||
      `Cloudinary error ${response.status}: ${response.statusText}`
    throw new Error(msg)
  }

  return {
    secure_url: body.secure_url,
    public_id:  body.public_id,
    format:     body.format,
    width:      body.width  ?? 0,
    height:     body.height ?? 0,
  }
}

/**
 * Get an optimized Cloudinary URL with auto quality + format and optional resize.
 */
export function getOptimizedImageUrl(
  url: string,
  width?: number,
  height?: number
): string {
  if (!url || !url.includes("cloudinary.com")) return url

  const parts: string[] = ["q_auto", "f_auto"]
  if (width)  parts.push(`w_${width}`)
  if (height) parts.push(`h_${height}`)
  if (width || height) parts.push("c_fill")

  return url.replace("/upload/", `/upload/${parts.join(",")}/`)
}

/**
 * Utility: check if a string looks like a Cloudinary URL.
 */
export function isCloudinaryUrl(value: string): boolean {
  return typeof value === "string" && value.includes("cloudinary.com")
}