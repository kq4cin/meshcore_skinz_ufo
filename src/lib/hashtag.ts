const encoder = new TextEncoder();

/** Normalises user input like "Weather", " #WX " or "##wx" to "#weather" / "#wx". */
export function normalizeHashtag(input: string): string {
  const body = input.trim().replace(/^#+/, '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
  return body ? `#${body}` : '';
}

export function isValidHashtag(input: string): boolean {
  const tag = normalizeHashtag(input);
  return tag.length >= 2 && tag.length <= 31;
}

/** MeshCore hashtag channel secret: first 16 bytes of SHA-256("#name"). */
export async function hashtagSecret(name: string): Promise<Uint8Array> {
  const tag = normalizeHashtag(name);
  if (!tag) throw new Error('Channel name is empty');
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('Web Crypto is unavailable (needs HTTPS)');
  const digest = await subtle.digest('SHA-256', encoder.encode(tag));
  return new Uint8Array(digest).slice(0, 16);
}
