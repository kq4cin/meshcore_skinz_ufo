import { dmConvo } from './store';
import type { Contact } from './types';

export type ContactFilter = 'all' | 'users' | 'repeaters' | 'rooms' | 'favorites';
export type ContactSort = 'lastSeen' | 'name' | 'recent';

export interface ContactView {
  filter: ContactFilter;
  sort: ContactSort;
  query: string;
  unreadOnly: boolean;
}

export const DEFAULT_VIEW: ContactView = { filter: 'all', sort: 'lastSeen', query: '', unreadOnly: false };

const FAVORITES_KEY = 'mcc.favorites.v1';

type KV = Pick<Storage, 'getItem' | 'setItem'>;

function kvOrNull(): KV | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadFavorites(kv: KV | null = kvOrNull()): string[] {
  try {
    const raw = kv?.getItem(FAVORITES_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((k): k is string => typeof k === 'string') : [];
  } catch {
    return [];
  }
}

export function saveFavorites(keys: string[], kv: KV | null = kvOrNull()): void {
  try {
    kv?.setItem(FAVORITES_KEY, JSON.stringify(keys));
  } catch {
    // storage unavailable: favorites stay in memory
  }
}

export function toggleFavorite(keys: string[], publicKey: string): string[] {
  return keys.includes(publicKey) ? keys.filter((k) => k !== publicKey) : [...keys, publicKey];
}

const matchesFilter = (c: Contact, filter: ContactFilter, favorites: Set<string>) => {
  switch (filter) {
    case 'users': return c.kind === 'chat';
    case 'repeaters': return c.kind === 'repeater';
    case 'rooms': return c.kind === 'room';
    case 'favorites': return favorites.has(c.publicKey);
    default: return true;
  }
};

/** Filters, searches and sorts contacts. Favorites always float to the top of the list. */
export function viewContacts(
  contacts: Contact[],
  view: ContactView,
  favorites: string[],
  unread: Record<string, number>,
  lastMessageAt: Record<string, number> = {},
): Contact[] {
  const favSet = new Set(favorites);
  const q = view.query.trim().toLowerCase();
  const recent = (c: Contact) => lastMessageAt[dmConvo(c.publicKey)] ?? 0;
  const list = contacts.filter((c) =>
    matchesFilter(c, view.filter, favSet)
    && (!q || c.name.toLowerCase().includes(q) || c.publicKey.toLowerCase().startsWith(q))
    && (!view.unreadOnly || (unread[dmConvo(c.publicKey)] ?? 0) > 0));
  const cmp = (a: Contact, b: Contact) => {
    if (view.sort === 'name') return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    if (view.sort === 'recent') return recent(b) - recent(a) || b.lastAdvert - a.lastAdvert;
    return b.lastAdvert - a.lastAdvert;
  };
  return list.sort((a, b) => Number(favSet.has(b.publicKey)) - Number(favSet.has(a.publicKey)) || cmp(a, b));
}

export interface MapPoint {
  publicKey: string;
  name: string;
  kind: Contact['kind'];
  lat: number;
  lon: number;
}

/** Contacts with a usable position (the radio reports 0,0 when a node has no GPS fix). */
export function mappableContacts(contacts: Contact[]): MapPoint[] {
  return contacts.flatMap((c) =>
    c.lat != null && c.lon != null && Number.isFinite(c.lat) && Number.isFinite(c.lon)
    && Math.abs(c.lat) <= 90 && Math.abs(c.lon) <= 180 && (c.lat !== 0 || c.lon !== 0)
      ? [{ publicKey: c.publicKey, name: c.name, kind: c.kind, lat: c.lat, lon: c.lon }]
      : []);
}
