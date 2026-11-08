import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { hashtagSecret, isValidHashtag, normalizeHashtag } from './hashtag';

describe('hashtag', () => {
  it('normalises names', () => {
    expect(normalizeHashtag('Weather')).toBe('#weather');
    expect(normalizeHashtag('  ##WX ')).toBe('#wx');
    expect(normalizeHashtag('#my weather!')).toBe('#myweather');
    expect(normalizeHashtag('#')).toBe('');
  });

  it('validates', () => {
    expect(isValidHashtag('weather')).toBe(true);
    expect(isValidHashtag('#')).toBe(false);
    expect(isValidHashtag('x'.repeat(40))).toBe(false);
  });

  it('derives the MeshCore secret from SHA-256 of "#name"', async () => {
    const expected = createHash('sha256').update('#weather').digest().subarray(0, 16);
    expect(Array.from(await hashtagSecret('Weather'))).toEqual(Array.from(expected));
  });
});
