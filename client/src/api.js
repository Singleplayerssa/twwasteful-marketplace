export async function api(path, options = {}) {
  const isForm = options.body instanceof FormData;
  const response = await fetch(`/api${path}`, {
    credentials: 'include',
    ...options,
    headers: { ...(isForm ? {} : { 'Content-Type': 'application/json' }), ...(options.headers || {}) }
  });

  if (response.status === 204) return {};
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error('Backend API belum terhubung. Coba lagi setelah layanan server aktif.');
  }

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Permintaan tidak dapat diproses.');
  return data;
}

export const money = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0));
export const number = (value) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(Number(value || 0));
