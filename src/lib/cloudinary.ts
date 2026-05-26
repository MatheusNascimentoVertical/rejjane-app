const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = 'rejjane_produtos';

export async function uploadFoto(file: File): Promise<string> {
  if (!CLOUD_NAME) throw new Error('VITE_CLOUDINARY_CLOUD_NAME não configurado');

  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', UPLOAD_PRESET);
  form.append('folder', 'rejjane_vendas');

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form }
  );

  if (!res.ok) throw new Error(`Cloudinary error: ${res.status}`);
  const data = await res.json();
  return data.secure_url as string;
}
