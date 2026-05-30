export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? 'https://wc-telehealth.onrender.com'
).replace(/\/$/, '');

export function apiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}
