import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEW, mappableContacts, loadFavorites, saveFavorites, toggleFavorite, viewContacts } from './contacts';
import type { Contact } from './types';

const c = (publicKey: string, name: string, kind: Contact['kind'], lastAdvert: number): Contact => ({ publicKey, name, kind, lastAdvert, hops: 0 });
const list = [c('aa', 'Zed', 'chat', 10), c('bb', 'Alpha', 'repeater', 30), c('cc', 'Room1', 'room', 20), c('dd', 'Bob', 'chat', 5)];
const names = (v: Contact[]) => v.map((x) => x.name);

describe('contacts view', () => {
  it('sorts by last seen by default', () => {
    expect(names(viewContacts(list, DEFAULT_VIEW, [], {}))).toEqual(['Alpha', 'Room1', 'Zed', 'Bob']);
  });

  it('filters by type and searches name or key', () => {
    expect(names(viewContacts(list, { ...DEFAULT_VIEW, filter: 'users' }, [], {}))).toEqual(['Zed', 'Bob']);
    expect(names(viewContacts(list, { ...DEFAULT_VIEW, query: 'ROOM' }, [], {}))).toEqual(['Room1']);
    expect(names(viewContacts(list, { ...DEFAULT_VIEW, query: 'dd' }, [], {}))).toEqual(['Bob']);
  });

  it('sorts by name and keeps favorites on top', () => {
    expect(names(viewContacts(list, { ...DEFAULT_VIEW, sort: 'name' }, ['aa'], {}))).toEqual(['Zed', 'Alpha', 'Bob', 'Room1']);
    expect(names(viewContacts(list, { ...DEFAULT_VIEW, filter: 'favorites' }, ['dd'], {}))).toEqual(['Bob']);
  });

  it('filters unread and sorts by recent messages', () => {
    expect(names(viewContacts(list, { ...DEFAULT_VIEW, unreadOnly: true }, [], { 'dm:aa': 2 }))).toEqual(['Zed']);
    expect(names(viewContacts(list, { ...DEFAULT_VIEW, sort: 'recent' }, [], {}, { 'dm:dd': 99 }))[0]).toBe('Bob');
  });

  it('toggles and persists favorites', () => {
    const data = new Map<string, string>();
    const kv = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
    saveFavorites(toggleFavorite(toggleFavorite([], 'aa'), 'bb'), kv);
    expect(loadFavorites(kv)).toEqual(['aa', 'bb']);
    expect(toggleFavorite(['aa', 'bb'], 'aa')).toEqual(['bb']);
  });

  it('keeps only contacts with a real position', () => {
    const pts = mappableContacts([{ ...list[0], lat: 33.7, lon: -84.4 }, { ...list[1], lat: 0, lon: 0 }, { ...list[2], lat: 99, lon: 1 }, list[3]]);
    expect(pts.map((p) => p.name)).toEqual(['Zed']);
  });
});
