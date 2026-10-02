export const CATEGORIES = ['Branding', '3D Assets', 'UI/UX', 'Motion Graphics', 'Print & Packaging'];
export const BUDGETS = ['Under $500', '$500 - $2,000', '$2,000 - $5,000', '$5,000+'];
export const token = () => localStorage.getItem('ps_token');

export async function api(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && token()) headers.Authorization = `Bearer ${token()}`;
  const res = await fetch(`/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && auth) {
      localStorage.removeItem('ps_token');
      window.location.href = '/admin/login';
    }
    throw new Error((data && data.error) || 'Something went wrong. Try again.');
  }
  return data;
}
