import type { ContactKind } from './types';

/**
 * Contact sharing uses the MeshCore app's QR/deep-link format:
 *   meshcore://contact/add?name=<url-encoded>&public_key=<64 hex>&type=<1..4>
 */
const SCHEME = 'meshcore://';
const ADD_PREFIX = `${SCHEME}contact/add`;

const TYPE_OF: Record<ContactKind, number> = { chat: 1, repeater: 2, room: 3, sensor: 4, unknown: 1 };
const KIND_OF: Record<number, ContactKind> = { 1: 'chat', 2: 'repeater', 3: 'room', 4: 'sensor' };

export interface CardContact {
  name: string;
  publicKey: string;
  kind: ContactKind;
}

export type ParsedCard =
  | { format: 'url'; contact: CardContact }
  /** Raw signed advert packet (older `meshcore://<hex>` cards) that the radio imports itself. */
  | { format: 'advert'; hex: string };

export function contactCardUrl({ name, publicKey, kind }: CardContact): string {
  const query = new URLSearchParams({ name, public_key: publicKey.toLowerCase(), type: String(TYPE_OF[kind]) });
  return `${ADD_PREFIX}?${query}`;
}

/** Parses a pasted contact card. Returns null when the text is not a usable card. */
export function parseContactCard(text: string): ParsedCard | null {
  const raw = text.trim();
  if (raw.toLowerCase().startsWith(ADD_PREFIX)) {
    const rest = raw.slice(ADD_PREFIX.length);
    if (!rest.startsWith('?')) return null;
    const q = new URLSearchParams(rest.slice(1));
    const name = (q.get('name') ?? '').trim();
    const publicKey = (q.get('public_key') ?? '').trim().toLowerCase();
    const type = Number(q.get('type') ?? 1);
    if (!name || !/^[0-9a-f]{64}$/.test(publicKey)) return null;
    return { format: 'url', contact: { name, publicKey, kind: KIND_OF[type] ?? 'chat' } };
  }
  const hex = raw.toLowerCase().startsWith(SCHEME) ? raw.slice(SCHEME.length) : raw;
  // An advert is at least header + path len + 32-byte key + timestamp + 64-byte signature.
  if (/^([0-9a-f]{2})+$/i.test(hex) && hex.length >= 2 * 102) return { format: 'advert', hex: hex.toLowerCase() };
  return null;
}
