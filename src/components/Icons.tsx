import { useId, type SVGProps } from 'react';
import type { WeatherIcon as WeatherKind } from '../lib/weather';

type P = SVGProps<SVGSVGElement>;
const base = (p: P): P => ({ viewBox: '0 0 48 48', 'aria-hidden': true, focusable: false, ...p });

const Star = ({ x, y, r = 3, fill = 'var(--flare)' }: { x: number; y: number; r?: number; fill?: string }) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return `${(x + rr * Math.cos(a)).toFixed(2)},${(y + rr * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
  return <polygon points={pts} fill={fill} />;
};

/** Small flying saucer: hull disc, glass dome and a row of lights. */
const Saucer = ({ x, y, w = 14 }: { x: number; y: number; w?: number }) => {
  const s = w / 14;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke="var(--ink)" strokeLinejoin="round">
      <path d="M-4.5 -0.5 A4.5 4.5 0 0 1 4.5 -0.5 Z" fill="var(--teal)" strokeWidth={1.2 / s} />
      <ellipse cx="0" cy="0.5" rx="7" ry="2.6" fill="var(--bronze)" strokeWidth={1.2 / s} />
      {[-4, 0, 4].map((dx) => <circle key={dx} cx={dx} cy="0.8" r=".9" fill="var(--flare)" stroke="none" />)}
    </g>
  );
};

const TENTACLES = ['M48 60 C44 70 50 76 44 84 C40 89 34 88 34 84', 'M60 62 C60 72 66 78 60 86 C57 90 52 90 52 86', 'M72 60 C76 70 70 76 76 84 C80 89 86 88 86 84'];
const SAUCER_LIGHTS = [22, 36, 50, 70, 84, 98];

/** Galaxy Core crest: tentacled flying saucer with a little green pilot, bursting out of a glowing star badge. */
export function Crest(p: P) {
  const id = useId();
  const glow = `${id}g`, space = `${id}s`, dome = `${id}d`;
  return (
    <svg viewBox="0 0 120 100" aria-hidden focusable={false} {...p}>
      <defs>
        <radialGradient id={glow}><stop offset=".55" stopColor="var(--flare)" stopOpacity=".55" /><stop offset="1" stopColor="var(--flare)" stopOpacity="0" /></radialGradient>
        <radialGradient id={space} cx="50%" cy="35%" r="70%"><stop offset="0" stopColor="var(--void-2)" /><stop offset="1" stopColor="var(--void-deep)" /></radialGradient>
        <linearGradient id={dome} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bff3ea" /><stop offset="1" stopColor="var(--teal)" /></linearGradient>
      </defs>
      <circle cx="60" cy="48" r="50" fill={`url(#${glow})`} />
      <circle cx="60" cy="48" r="40" fill={`url(#${space})`} stroke="var(--ink)" strokeWidth="2.5" />
      <circle cx="60" cy="48" r="37" fill="none" stroke="var(--flare)" strokeWidth="1.2" opacity=".7" />
      {[[34, 20, 1], [84, 18, 1.3], [92, 36, .9], [40, 34, .8], [76, 30, .7]].map(([x, y, r]) => <circle key={`${x}${y}`} cx={x} cy={y} r={r} fill="var(--hull)" />)}
      <g stroke="var(--ink)" strokeWidth="1.4">
        <circle cx="31" cy="27" r="5.5" fill="var(--teal)" />
        <ellipse cx="31" cy="27" rx="9" ry="2.4" fill="none" stroke="var(--flare)" strokeWidth="1.4" transform="rotate(-18 31 27)" />
        <circle cx="90" cy="70" r="3.6" fill="var(--ember)" />
      </g>
      {TENTACLES.map((d) => (
        <g key={d} fill="none" strokeLinecap="round">
          <path d={d} stroke="var(--ink)" strokeWidth="7.5" />
          <path d={d} stroke="var(--slime)" strokeWidth="4.5" />
          <path d={d} stroke="var(--slime-2)" strokeWidth="1.2" strokeDasharray="1 3" />
        </g>
      ))}
      <g stroke="var(--ink)" strokeLinejoin="round">
        <path d="M38 50 A22 21 0 0 1 82 50 Z" fill={`url(#${dome})`} strokeWidth="2" />
        <ellipse cx="60" cy="40" rx="7.5" ry="8.5" fill="var(--slime)" strokeWidth="1.4" />
        <ellipse cx="56.6" cy="40.5" rx="2.8" ry="1.6" fill="var(--ink)" transform="rotate(25 56.6 40.5)" strokeWidth="0" />
        <ellipse cx="63.4" cy="40.5" rx="2.8" ry="1.6" fill="var(--ink)" transform="rotate(-25 63.4 40.5)" strokeWidth="0" />
        <path d="M44 42 A17 16 0 0 1 54 32" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".55" />
        <ellipse cx="60" cy="59" rx="24" ry="5.5" fill="var(--bronze-2)" strokeWidth="2" />
        <ellipse cx="60" cy="53" rx="47" ry="10" fill="var(--bronze)" strokeWidth="2.5" />
        <path d="M16 51 Q60 44 104 51" fill="none" stroke="var(--flare-2)" strokeWidth="1.4" />
      </g>
      {SAUCER_LIGHTS.map((x) => <circle key={x} cx={x} cy={x < 30 || x > 90 ? 55 : 57} r="2.6" fill="var(--flare)" stroke="var(--ink)" strokeWidth="1" />)}
    </svg>
  );
}

export function MessagesIcon(p: P) {
  return (
    <svg {...base(p)}>
      <path d="M5 8 H31 A3 3 0 0 1 34 11 V27 A3 3 0 0 1 31 30 H16 L8 37 V30 H5 A3 3 0 0 1 2 27 V11 A3 3 0 0 1 5 8 Z" fill="var(--hull)" stroke="var(--ink)" strokeWidth="2.5" />
      <path d="M22 21 H43 A3 3 0 0 1 46 24 V36 A3 3 0 0 1 43 39 H40 V45 L33 39 H22 A3 3 0 0 1 19 36 V24 A3 3 0 0 1 22 21 Z" fill="var(--slime)" stroke="var(--ink)" strokeWidth="2.5" />
      {[10, 18].map((x) => <circle key={x} cx={x} cy="19" r="2.4" fill="var(--nebula)" />)}
      <ellipse cx="28.5" cy="30" rx="3.6" ry="2.1" fill="var(--ink)" transform="rotate(25 28.5 30)" />
      <ellipse cx="36.5" cy="30" rx="3.6" ry="2.1" fill="var(--ink)" transform="rotate(-25 36.5 30)" />
    </svg>
  );
}

export function NetworkIcon(p: P) {
  const nodes: Array<[number, number]> = [[8, 10], [40, 8], [42, 40], [8, 38], [24, 6]];
  return (
    <svg {...base(p)}>
      {nodes.map(([x, y]) => <line key={`${x}${y}`} x1="24" y1="24" x2={x} y2={y} stroke="var(--hull)" strokeWidth="2" />)}
      <circle cx="24" cy="24" r="7.5" fill="var(--nebula)" stroke="var(--hull)" strokeWidth="2.5" />
      <circle cx="21.5" cy="21.5" r="2" fill="#fff" opacity=".6" />
      <Star x={8} y={10} r={5.5} />
      <circle cx="42" cy="40" r="4.5" fill="var(--teal)" stroke="var(--hull)" strokeWidth="1.5" />
      <ellipse cx="42" cy="40" rx="7.5" ry="2" fill="none" stroke="var(--flare)" strokeWidth="1.5" transform="rotate(-20 42 40)" />
      <circle cx="8" cy="38" r="4.5" fill="var(--slime)" stroke="var(--hull)" strokeWidth="1.5" />
      <circle cx="40" cy="8" r="4" fill="var(--ember)" stroke="var(--hull)" strokeWidth="1.5" />
      <circle cx="24" cy="6" r="3" fill="var(--hull)" />
    </svg>
  );
}

export function MapIcon(p: P) {
  return (
    <svg {...base(p)}>
      <path d="M6 12l12-5 12 5 12-5v29l-12 5-12-5-12 5z" fill="none" stroke="var(--hull)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M11 34 L14 27 L22 31 L27 25" fill="none" stroke="var(--flare)" strokeWidth="1.3" strokeDasharray="2 2" />
      {[[11, 34], [14, 27], [22, 31], [36, 33]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.4" fill="var(--flare)" />)}
      <path d="M24 21 L18 32 H34 L28 21 Z" fill="var(--slime)" opacity=".55" />
      <Saucer x={26} y={19} w={18} />
    </svg>
  );
}

export function SettingsIcon(p: P) {
  const teeth = Array.from({ length: 8 }, (_, i) => (
    <rect key={i} x="21" y="3" width="6" height="8" rx="1" fill="var(--hull)" transform={`rotate(${i * 45} 24 24)`} />
  ));
  return (
    <svg {...base(p)}>
      {teeth}
      <circle cx="24" cy="24" r="14" fill="var(--hull)" />
      <circle cx="24" cy="24" r="6" fill="var(--void)" />
      <Saucer x={31} y={33} w={30} />
    </svg>
  );
}

export function WeatherTabIcon(p: P) {
  return (
    <svg {...base(p)}>
      <circle cx="17" cy="17" r="9" fill="var(--flare)" stroke="var(--ink)" strokeWidth="1.5" />
      <ellipse cx="17" cy="17" rx="15" ry="3.6" fill="none" stroke="var(--nebula)" strokeWidth="2.2" transform="rotate(-20 17 17)" />
      <path d="M14 40 A9 9 0 0 1 15 22 A12 12 0 0 1 37 24 A8 8 0 0 1 38 40 Z" fill="var(--hull)" stroke="var(--ink)" strokeWidth="2.5" />
      <Star x={26} y={32} r={5} fill="var(--slime-2)" />
    </svg>
  );
}

export function WeatherGlyph({ kind, ...p }: P & { kind: WeatherKind }) {
  const cloud = <path d="M12 38 A8 8 0 0 1 13 22 A11 11 0 0 1 34 23 A7.5 7.5 0 0 1 35 38 Z" fill="var(--hull)" stroke="var(--ink)" strokeWidth="2" />;
  const sun = (r = 9, cx = 24, cy = 22) => (
    <g>
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={cx - 1.5} y={cy - r - 7} width="3" height="5" rx="1.5" fill="var(--flare)" transform={`rotate(${i * 45} ${cx} ${cy})`} />
      ))}
      <circle cx={cx} cy={cy} r={r} fill="var(--flare)" />
    </g>
  );
  const drops = (color: string) => [14, 22, 30].map((x) => <line key={x} x1={x + 2} y1="40" x2={x} y2="46" stroke={color} strokeWidth="2.5" strokeLinecap="round" />);
  const body = {
    sun: sun(10),
    cloud: <>{sun(7, 32, 16)}{cloud}</>,
    rain: <>{cloud}{drops('#6fb7ff')}</>,
    storm: <>{cloud}<path d="M24 36 L18 46 H24 L21 52 L31 40 H25 L28 36 Z" fill="var(--flare)" /></>,
    snow: <>{cloud}{[14, 22, 30].map((x) => <circle key={x} cx={x + 1} cy="44" r="2.2" fill="#fff" stroke="var(--ink)" strokeWidth=".8" />)}</>,
    fog: <>{cloud}{[40, 45].map((y) => <line key={y} x1="10" y1={y} x2="38" y2={y} stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round" />)}</>,
    wind: [16, 24, 32].map((y, i) => <path key={y} d={`M6 ${y} H${30 + i * 4} a5 5 0 1 0 -5 -5`} fill="none" stroke="var(--teal)" strokeWidth="3" strokeLinecap="round" />),
    unknown: <>{cloud}<Saucer x={24} y={31} w={18} /></>,
  }[kind];
  return <svg viewBox="0 0 48 52" aria-hidden focusable={false} {...p}>{body}</svg>;
}

export function StarGlyph(p: P) {
  return <svg viewBox="0 0 10 10" aria-hidden focusable={false} {...p}><Star x={5} y={5.4} r={5} fill="currentColor" /></svg>;
}

export const BackIcon = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden focusable={false} {...p}><path d="M15 5 L8 12 L15 19" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export const SendIcon = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden focusable={false} {...p}><path d="M3 11.5 L21 3 L14.5 21 L11.5 13 Z" fill="currentColor" /></svg>
);

export const BluetoothIcon = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden focusable={false} {...p}><path d="M7 7 L17 16 L12 21 V3 L17 8 L7 17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export const UsbIcon = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden focusable={false} {...p}><path d="M12 2 V18 M12 18 m-2.5 0 a2.5 2.5 0 1 0 5 0 a2.5 2.5 0 1 0 -5 0 M12 13 L7 9 V6 M12 11 L17 8 V5 M5.5 4 H8.5 V7 H5.5 Z M17 3 l1.5 2.5 h-3 Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
);

export const RefreshIcon = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden focusable={false} {...p}><path d="M20 11 A8 8 0 0 0 5.5 6.5 L4 8 M4 13 A8 8 0 0 0 18.5 17.5 L20 16 M4 3 V8 H9 M20 21 V16 H15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export const BroadcastIcon = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden focusable={false} {...p}><circle cx="12" cy="12" r="2.5" fill="currentColor" /><path d="M7.8 7.8 a6 6 0 0 0 0 8.4 M16.2 7.8 a6 6 0 0 1 0 8.4 M4.9 4.9 a10 10 0 0 0 0 14.2 M19.1 4.9 a10 10 0 0 1 0 14.2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
);

export const ShareIcon = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden focusable={false} {...p}><path d="M12 15 V3 M7 8 L12 3 L17 8 M5 13 V20 H19 V13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export const AddPersonIcon = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden focusable={false} {...p}><circle cx="9" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="2.2" /><path d="M2 21 a7 7 0 0 1 14 0 M19 8 V14 M16 11 H22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
);
