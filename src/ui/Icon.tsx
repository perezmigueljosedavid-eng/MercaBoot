import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

type Def = { paths: string[]; circles?: [number, number, number][] };

const ICONS = {
  bell: { paths: ['M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9', 'M10.3 21a1.94 1.94 0 0 0 3.4 0'] },
  search: { paths: ['m20 20-3.5-3.5'], circles: [[11, 11, 7]] },
  sparkles: {
    paths: [
      'M12 3l1.8 4.6L18 9.4l-4.2 1.8L12 16l-1.8-4.8L6 9.4l4.2-1.8z',
      'M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z',
    ],
  },
  sparkle: { paths: ['M12 3l1.8 4.6L18 9.4l-4.2 1.8L12 16l-1.8-4.8L6 9.4l4.2-1.8z'] },
  home: { paths: ['M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z'] },
  heart: {
    paths: ['M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 12 5.6 5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z'],
  },
  chat: { paths: ['M21 12a8 8 0 0 1-11.8 7L3 21l2-6.2A8 8 0 1 1 21 12z'] },
  user: { paths: ['M4 21a8 8 0 0 1 16 0'], circles: [[12, 8, 4]] },
  back: { paths: ['m15 18-6-6 6-6'] },
  down: { paths: ['m6 9 6 6 6-6'] },
  check: { paths: ['m5 12 5 5L20 7'] },
  bag: { paths: ['M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9z', 'M9 8V6a3 3 0 0 1 6 0v2'] },
  bagCheck: {
    paths: [
      'M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9z',
      'M9 8V6a3 3 0 0 1 6 0v2',
      'M9.5 13.5 11 15l3.5-3.5',
    ],
  },
  store: {
    paths: [
      'M3 9 5 4h14l2 5',
      'M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0',
      'M5 12v8h14v-8',
      'M10 20v-5h4v5',
    ],
  },
  box: { paths: ['M21 8 12 3 3 8v8l9 5 9-5z', 'M3 8l9 5 9-5', 'M12 13v8'] },
  megaphone: { paths: ['M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z', 'M17 9a4 4 0 0 1 0 6'] },
  camera: {
    paths: ['M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z'],
    circles: [[12, 13, 3.5]],
  },
  send: { paths: ['M22 2 11 13', 'M22 2 15 22l-4-9-9-4z'] },
  gift: {
    paths: ['M20 12v10H4V12', 'M2 7h20v5H2z', 'M12 22V7', 'M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z', 'M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z'],
  },
  pin: { paths: ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'], circles: [[12, 10, 3]] },
  phone: {
    paths: [
      'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
    ],
  },
  edit: { paths: ['M12 20h9', 'M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z'] },
  mail: { paths: ['M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'm22 6-10 7L2 6'] },
  clock: { paths: ['M12 6v6l4 2'], circles: [[12, 12, 10]] },
  trash: { paths: ['M3 6h18', 'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6', 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', 'M10 11v6', 'M14 11v6'] },
  plus: { paths: ['M12 5v14', 'M5 12h14'] },
  navigation: { paths: ['M3 11l19-9-9 19-2-8-8-2z'] },
  info: { paths: ['M12 16v-4', 'M12 8h.01'], circles: [[12, 12, 10]] },
  star: { paths: ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'] },
  logout: { paths: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'm16 17 5-5-5-5', 'M21 12H9'] },
  lock: { paths: ['M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z', 'M8 11V7a4 4 0 0 1 8 0v4'] },
  help: { paths: ['M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3', 'M12 17h.01'], circles: [[12, 12, 10]] },
  close: { paths: ['M18 6 6 18', 'm6 6 12 12'] },
  next: { paths: ['m9 18 6-6-6-6'] },
  image: { paths: ['M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'm21 15-5-5L5 21'], circles: [[8.5, 8.5, 1.5]] },
  locate: { paths: ['M12 2v4', 'M12 18v4', 'M2 12h4', 'M18 12h4'], circles: [[12, 12, 6]] },
} satisfies Record<string, Def>;

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  size = 22,
  color = '#000',
  stroke = 2,
}: {
  name: IconName;
  size?: number;
  color?: string;
  stroke?: number;
}) {
  const def: Def = ICONS[name];
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {def.paths.map((d, i) => (
        <Path key={i} d={d} />
      ))}
      {def.circles?.map(([cx, cy, r], i) => (
        <Circle key={i} cx={cx} cy={cy} r={r} />
      ))}
    </Svg>
  );
}
