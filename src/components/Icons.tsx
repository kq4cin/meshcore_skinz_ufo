import { useId, type SVGProps } from 'react';
import type { WeatherIcon as WeatherKind } from '../lib/weather';

type P = SVGProps<SVGSVGElement>;
const base = (p: P): P => ({ viewBox: '0 0 48 48', 'aria-hidden': true, focusable: false, ...p });

const Star = ({ x, y, r = 3, fill = 'var(--gold)' }: { x: number; y: number; r?: number; fill?: string }) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return `${(x + rr * Math.cos(a)).toFixed(2)},${(y + rr * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
  return <polygon points={pts} fill={fill} />;
};

const WING_FEATHERS = 'M21.6 18.5 L8.2 13 Q0.2 6.6 3.3 5 L9.6 5.5 L24.4 11.5 Z M25.4 23.8 L12 20.2 Q3.4 14.8 6.2 12.8 L12.5 12.6 L27.3 16.5 Z M29.1 29 L16.1 27.2 Q6.9 22.9 9.5 20.6 L15.7 19.6 L30.2 21.6 Z M32.9 34.2 L20.4 34 Q10.7 30.9 13 28.3 L19.1 26.5 L33.1 26.8 Z M36.7 39.4 L25 40.6 Q14.9 38.7 16.9 35.8 L22.7 33.3 L35.9 31.9 Z M40.5 44.5 L29.6 47 Q19.5 46.3 21.1 43.2 L26.5 40 L38.8 37.2 Z M44.3 49.5 L34.4 53.1 Q24.2 53.6 25.4 50.4 L30.4 46.6 L41.7 42.5 Z';
const WING_COVERTS = 'M48 44 C41 30 33 11 19 9 L22 17 Q18.5 26.1 21 29.2 Q20.5 35.3 26 35.4 Q25.5 41.5 31 41.6 Q30.5 47.7 36 47.8 Q35.5 53.9 41 54 L48 54 Z';
const SHIELD = 'M42 40 H78 V62 C78 80 69 90 60 96 C51 90 42 80 42 62 Z';

const Wing = () => (
  <g stroke="var(--ink)" strokeWidth="1.6" strokeLinejoin="round">
    <path d={WING_FEATHERS} fill="var(--brown)" />
    <path d={WING_COVERTS} fill="var(--brown-2)" />
  </g>
);

/** Bald eagle crest: raised wings, white head with hooked beak, stars-and-stripes shield. */
export function Crest(p: P) {
  const clip = useId();
  return (
    <svg viewBox="0 0 120 100" aria-hidden focusable={false} {...p}>
      <defs><clipPath id={clip}><path d={SHIELD} /></clipPath></defs>
      <Wing />
      <g transform="matrix(-1 0 0 1 120 0)"><Wing /></g>
      <g stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round">
        <path d="M45 38 C50 33 70 33 75 38 L78 60 L42 60 Z" fill="var(--brown)" />
        <path d="M52 88 L46 99 L52 97 L56 100 L60 97 L64 100 L68 97 L74 99 L68 88 Z" fill="var(--cream)" />
        <path d="M49 38 C45 28 47 14 57 9 C65 5 74 7 79 13 L80 25 C76 28 73 32 72 38 L68 34 L65 39 L61 34 L58 39 L54 34 L51 39 Z" fill="var(--cream)" />
        <path d="M78 12 C85 11 91 13 94 18 C96 22 95 27 91 30 C91 27 89 25 86 25 L79 25 Z" fill="var(--gold)" />
        <path d="M79 25 L87 25 C85 28 82 29 79 29 Z" fill="var(--gold-2)" />
      </g>
      <circle cx="71" cy="17.5" r="2.4" fill="var(--gold)" stroke="var(--ink)" strokeWidth="1" />
      <circle cx="71.6" cy="17.5" r="1.1" fill="var(--ink)" />
      <path d="M63 14.5 L79 14 L76 16.5 Z" fill="var(--ink)" />
      <path d="M80 21 C83 21 86 22 88 24" fill="none" stroke="var(--ink)" strokeWidth="1" />
      <g clipPath={`url(#${clip})`}>
        <rect x="40" y="40" width="40" height="60" fill="var(--cream)" />
        <g fill="var(--red)">
          {[44.5, 53.5, 62, 71].map((x) => <rect key={x} x={x} y="52" width="4.5" height="50" />)}
        </g>
        <rect x="40" y="40" width="40" height="12" fill="var(--navy)" />
      </g>
      <path d={SHIELD} fill="none" stroke="var(--ink)" strokeWidth="2.5" />
      <Star x={50} y={46.5} r={3.6} fill="var(--cream)" />
      <Star x={60} y={46.5} r={3.6} fill="var(--cream)" />
      <Star x={70} y={46.5} r={3.6} fill="var(--cream)" />
    </svg>
  );
}

export function MessagesIcon(p: P) {
  return (
    <svg {...base(p)}>
      <path d="M5 8 H31 A3 3 0 0 1 34 11 V27 A3 3 0 0 1 31 30 H16 L8 37 V30 H5 A3 3 0 0 1 2 27 V11 A3 3 0 0 1 5 8 Z" fill="var(--cream)" stroke="var(--ink)" strokeWidth="2.5" />
      <path d="M22 21 H43 A3 3 0 0 1 46 24 V36 A3 3 0 0 1 43 39 H40 V45 L33 39 H22 A3 3 0 0 1 19 36 V24 A3 3 0 0 1 22 21 Z" fill="var(--red)" stroke="var(--ink)" strokeWidth="2.5" />
      <Star x={10} y={19} r={3.4} fill="var(--navy)" />
      <Star x={18} y={19} r={3.4} fill="var(--navy)" />
      <Star x={26} y={19} r={3.4} fill="var(--navy)" />
    </svg>
  );
}

export function NetworkIcon(p: P) {
  const nodes: Array<[number, number]> = [[8, 10], [40, 8], [42, 40], [8, 38], [24, 6]];
  return (
    <svg {...base(p)}>
      {nodes.map(([x, y]) => <line key={`${x}${y}`} x1="24" y1="24" x2={x} y2={y} stroke="var(--cream)" strokeWidth="2" />)}
      <circle cx="24" cy="24" r="7" fill="var(--navy)" stroke="var(--cream)" strokeWidth="2.5" />
      <Star x={8} y={10} r={5} />
      <Star x={42} y={40} r={5} />
      <Star x={8} y={38} r={5} fill="var(--red)" />
      <circle cx="40" cy="8" r="4" fill="var(--red)" stroke="var(--cream)" strokeWidth="1.5" />
      <circle cx="24" cy="6" r="3" fill="var(--cream)" />
    </svg>
  );
}

export function MapIcon(p: P) {
  return (
    <svg {...base(p)}>
      <path d="M6 12l12-5 12 5 12-5v29l-12 5-12-5-12 5z" fill="none" stroke="var(--cream)" strokeWidth="2.5" strokeLinejoin="round" />
      <line x1="18" y1="7" x2="18" y2="36" stroke="var(--cream)" strokeWidth="2" />
      <line x1="30" y1="12" x2="30" y2="41" stroke="var(--cream)" strokeWidth="2" />
      <circle cx="24" cy="22" r="4" fill="var(--red)" stroke="var(--cream)" strokeWidth="1.5" />
    </svg>
  );
}

export function SettingsIcon(p: P) {
  const teeth = Array.from({ length: 8 }, (_, i) => (
    <rect key={i} x="21" y="3" width="6" height="8" rx="1" fill="var(--cream)" transform={`rotate(${i * 45} 24 24)`} />
  ));
  return (
    <svg {...base(p)}>
      {teeth}
      <circle cx="24" cy="24" r="14" fill="var(--cream)" />
      <circle cx="24" cy="24" r="6" fill="var(--navy)" />
      <path d="M10 30 C18 20 30 14 46 12 C38 18 34 20 30 22 C36 22 40 22 44 20 C38 28 30 30 22 30 Z" fill="var(--red)" stroke="var(--ink)" strokeWidth="1.5" />
    </svg>
  );
}

export function WeatherTabIcon(p: P) {
  return (
    <svg {...base(p)}>
      <circle cx="17" cy="17" r="9" fill="var(--gold)" />
      <path d="M14 40 A9 9 0 0 1 15 22 A12 12 0 0 1 37 24 A8 8 0 0 1 38 40 Z" fill="var(--cream)" stroke="var(--ink)" strokeWidth="2.5" />
      <Star x={26} y={32} r={5} fill="var(--red)" />
    </svg>
  );
}

export function WeatherGlyph({ kind, ...p }: P & { kind: WeatherKind }) {
  const cloud = <path d="M12 38 A8 8 0 0 1 13 22 A11 11 0 0 1 34 23 A7.5 7.5 0 0 1 35 38 Z" fill="var(--cream)" />;
  const sun = (r = 9, cx = 24, cy = 22) => (
    <g>
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={cx - 1.5} y={cy - r - 7} width="3" height="5" rx="1.5" fill="var(--gold)" transform={`rotate(${i * 45} ${cx} ${cy})`} />
      ))}
      <circle cx={cx} cy={cy} r={r} fill="var(--gold)" />
    </g>
  );
  const drops = (color: string) => [14, 22, 30].map((x) => <line key={x} x1={x + 2} y1="40" x2={x} y2="46" stroke={color} strokeWidth="2.5" strokeLinecap="round" />);
  const body = {
    sun: sun(10),
    cloud: <>{sun(7, 32, 16)}{cloud}</>,
    rain: <>{cloud}{drops('#6fb7ff')}</>,
    storm: <>{cloud}<path d="M24 36 L18 46 H24 L21 52 L31 40 H25 L28 36 Z" fill="var(--gold)" /></>,
    snow: <>{cloud}{[14, 22, 30].map((x) => <circle key={x} cx={x + 1} cy="44" r="2.2" fill="#fff" />)}</>,
    fog: <>{cloud}{[40, 45].map((y) => <line key={y} x1="10" y1={y} x2="38" y2={y} stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round" opacity=".7" />)}</>,
    wind: [16, 24, 32].map((y, i) => <path key={y} d={`M6 ${y} H${30 + i * 4} a5 5 0 1 0 -5 -5`} fill="none" stroke="var(--cream)" strokeWidth="3" strokeLinecap="round" />),
    unknown: <>{cloud}<Star x={24} y={30} r={6} fill="var(--red)" /></>,
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
