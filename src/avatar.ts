export function getAvatarUrl(name: string, existingUrl?: string | null): string {
  if (existingUrl) return existingUrl;
  const initial = name.charAt(0).toUpperCase();
  const hue = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=${hue.toString(16).padStart(2, '0')}3388&color=fff&size=128&bold=true`;
}
