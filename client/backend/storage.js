import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'twwasteful-materials';
const supabaseUrl = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

let storageClient = null;
if (supabaseUrl && secretKey) {
  storageClient = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}

export async function uploadMaterialImage(file) {
  if (!file) return null;
  if (!storageClient) {
    const error = new Error('Penyimpanan foto belum dikonfigurasi di backend.');
    error.status = 503;
    throw error;
  }

  const extensionByMime = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
  };
  const extension = extensionByMime[file.mimetype];
  if (!extension) {
    const error = new Error('Foto harus berupa JPG, PNG, atau WEBP.');
    error.status = 400;
    throw error;
  }

  const safeName = `${Date.now()}-${randomUUID()}.${extension}`;
  const objectPath = `listings/${safeName}`;
  const { error } = await storageClient.storage.from(bucket).upload(objectPath, file.buffer, {
    contentType: file.mimetype,
    cacheControl: '3600',
    upsert: false
  });
  if (error) {
    console.error('Supabase Storage upload failed:', error.message);
    const uploadError = new Error('Foto belum dapat diunggah. Periksa bucket penyimpanan di Supabase.');
    uploadError.status = 502;
    throw uploadError;
  }

  const { data } = storageClient.storage.from(bucket).getPublicUrl(objectPath);
  return data.publicUrl;
}
