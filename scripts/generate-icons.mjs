import { readFile, writeFile } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';

const icons = [
  ['icon.svg', 'icon-192.png', 192],
  ['icon.svg', 'icon-512.png', 512],
  ['maskable.svg', 'maskable-512.png', 512],
];
for (const [src, out, size] of icons) {
  const svg = await readFile(new URL(`../public/icons/${src}`, import.meta.url), 'utf8');
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  await writeFile(new URL(`../public/icons/${out}`, import.meta.url), png);
}
console.log('Icons generated');
