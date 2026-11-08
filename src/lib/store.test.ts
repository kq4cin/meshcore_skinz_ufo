import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, MAX_PER_CONVO, loadMessages, loadSettings, saveMessages, saveSettings, upsertMessage, type ChatMessage } from './store';

function memory() {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
}

const msg = (id: string, ts: number, text = 'hi'): ChatMessage => ({ id, convo: 'ch:#weather', from: 'a', text, ts, outgoing: false });

describe('store', () => {
  it('round-trips settings with defaults', () => {
    const kv = memory();
    expect(loadSettings(kv)).toEqual(DEFAULT_SETTINGS);
    saveSettings({ ...DEFAULT_SETTINGS, zip: '30301', onboarded: true }, kv);
    expect(loadSettings(kv)).toMatchObject({ zip: '30301', onboarded: true, weatherChannel: '#weather' });
  });

  it('upserts, sorts and caps messages', () => {
    let map = upsertMessage({}, msg('b', 2));
    map = upsertMessage(map, msg('a', 1));
    map = upsertMessage(map, msg('b', 2, 'edited'));
    expect(map['ch:#weather'].map((m) => m.id)).toEqual(['a', 'b']);
    expect(map['ch:#weather'][1].text).toBe('edited');
    for (let i = 0; i < MAX_PER_CONVO + 10; i++) map = upsertMessage(map, msg(`m${i}`, 10 + i));
    expect(map['ch:#weather']).toHaveLength(MAX_PER_CONVO);
    const kv = memory();
    saveMessages(map, kv);
    expect(loadMessages(kv)).toEqual(map);
  });
});
