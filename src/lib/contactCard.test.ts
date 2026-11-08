import { describe, expect, it } from 'vitest';
import { contactCardUrl, parseContactCard } from './contactCard';

const KEY = '3fe48a6fcce3fb00a955ccbf838998bdf928995ddd79522892cf5e6ae6653be0';

describe('contact cards', () => {
  it('builds the MeshCore app contact URL', () => {
    expect(contactCardUrl({ name: 'Example Contact', publicKey: KEY.toUpperCase(), kind: 'chat' }))
      .toBe(`meshcore://contact/add?name=Example+Contact&public_key=${KEY}&type=1`);
    expect(contactCardUrl({ name: 'Rpt & Co', publicKey: KEY, kind: 'repeater' })).toContain('name=Rpt+%26+Co&');
    expect(contactCardUrl({ name: 'R', publicKey: KEY, kind: 'room' })).toMatch(/type=3$/);
  });

  it('round-trips names with emoji and symbols', () => {
    const contact = { name: '🦅 KQ4CIN #1 / base', publicKey: KEY, kind: 'sensor' as const };
    expect(parseContactCard(contactCardUrl(contact))).toEqual({ format: 'url', contact });
  });

  it('parses app URLs, defaulting the type to companion', () => {
    expect(parseContactCard(`  meshcore://contact/add?name=Bob%20B&public_key=${KEY}  `))
      .toEqual({ format: 'url', contact: { name: 'Bob B', publicKey: KEY, kind: 'chat' } });
  });

  it('rejects bad URLs', () => {
    expect(parseContactCard(`meshcore://contact/add?name=Bob&public_key=${KEY.slice(2)}`)).toBeNull();
    expect(parseContactCard(`meshcore://contact/add?public_key=${KEY}`)).toBeNull();
    expect(parseContactCard('meshcore://channel/add?name=Public&secret=8b3387e9c5cdea6ac9e5edbaa115cd72')).toBeNull();
    expect(parseContactCard('hello')).toBeNull();
  });

  it('still accepts older raw advert cards', () => {
    const advert = `1100${KEY}${'00'.repeat(68)}`;
    expect(parseContactCard(`meshcore://${advert}`)).toEqual({ format: 'advert', hex: advert });
    expect(parseContactCard(advert.toUpperCase())).toEqual({ format: 'advert', hex: advert });
  });
});
