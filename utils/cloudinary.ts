// Utility to upload images to Cloudinary
// Usage: await uploadToCloudinary(uri)

export async function uploadToCloudinary(uri: string): Promise<string> {
  const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dx5ctouc8/image/upload";
  const UPLOAD_PRESET = "Capturefit";
  if (!CLOUDINARY_URL) throw new Error('EXPO_PUBLIC_CLOUDINARY_URL is not set in .env');
  if (!UPLOAD_PRESET) throw new Error('EXPO_PUBLIC_UPLOAD_PRESET is not set in .env');


  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  } as any);
  formData.append('upload_preset', UPLOAD_PRESET as string);

  try {
    const response = await fetch(CLOUDINARY_URL as string, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('Cloudinary upload error:', data);
      throw new Error(`Cloudinary upload failed: ${data?.error?.message || JSON.stringify(data)}`);
    }
    if (!data.secure_url) {
      console.error('Cloudinary response missing secure_url:', data);
      throw new Error('Cloudinary upload failed: No secure_url returned');
    }
    return data.secure_url;
  } catch (err) {
    console.error('Error uploading to Cloudinary:', err);
    throw err;
  }
}
