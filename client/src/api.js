export async function api(path, options = {}) {
  const isForm = options.body instanceof FormData;
  let response;
  try {
    response = await fetch(`/api${path}`, {
      credentials: 'include',
      ...options,
      headers: {
        ...(isForm ? {} : { 'Content-Type': 'application/json' }),
        ...(options.headers || {})
      }
    });
  } catch {
    throw new Error('Tidak dapat menghubungi server. Periksa koneksi internet atau konfigurasi deployment.');
  }

  const raw = response.status === 204 ? '' : await response.text();
  let data = {};
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = { error: 'Server tidak mengirim respons JSON yang valid.' };
    }
  }

  if (!response.ok) {
    throw new Error(data.error || `Permintaan gagal (HTTP ${response.status}).`);
  }
  return data;
}

export const money = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', maximumFractionDigits: 0
}).format(Number(value || 0));

export const number = (value) => new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 1
}).format(Number(value || 0));
