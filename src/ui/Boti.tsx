import React, { useMemo } from 'react';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, Rect } from 'react-native-svg';

/**
 * Boti, la bolsa del mandado que guía al usuario. Es el personaje propio de Mercaboot:
 * una bolsa verde con asas, franja ámbar cosida, mejillas y patitas. Cambia de gesto y de
 * accesorio según la pantalla (diseño aprobado en el boceto «Boti: poses y accesorios»).
 */
export type PoseBoti = 'saludo' | 'lupa' | 'cocina' | 'caja' | 'palma' | 'megafono' | 'fiesta' | 'dormido';

let contador = 0;

export function Boti({ pose = 'saludo', size = 110, claro = false }: { pose?: PoseBoti; size?: number; claro?: boolean }) {
  // En fondo verde (bienvenida) el cuerpo es más claro y el trazo más oscuro para que contraste.
  const trazo = claro ? '#0E3B21' : '#14532D';
  const cuerpo = claro ? '#3FB778' : '#2E9B63';
  const brillo = claro ? '#9BE8BE' : '#7FD6A5';
  const tinta = '#14301F';
  const ambar = '#F2B33D';
  const hilo = '#FFF3D6';
  const verdeAcc = '#1F7A4D';
  // Cada Boti en pantalla necesita su propio id de recorte para la franja.
  const clipId = useMemo(() => `boti-clip-${++contador}`, []);

  const ojosAbiertos = (cy = 66) => (
    <>
      <Circle cx={46} cy={cy} r={5.8} fill={tinta} />
      <Circle cx={47.8} cy={cy - 2} r={1.7} fill="#FFFFFF" />
      <Circle cx={74} cy={cy} r={5.8} fill={tinta} />
      <Circle cx={75.8} cy={cy - 2} r={1.7} fill="#FFFFFF" />
    </>
  );
  const sonrisa = <Path d="M51 76 Q60 86 69 76" stroke={tinta} strokeWidth={3.5} fill="none" strokeLinecap="round" />;
  const brazo = (d: string) => <Path d={d} stroke={trazo} strokeWidth={7} strokeLinecap="round" />;
  const brazosNormales = (
    <>
      {brazo('M20 70 L6 84')}
      {brazo('M100 70 L114 84')}
    </>
  );

  return (
    <Svg width={size} height={size} viewBox="-20 -24 160 160">
      <Defs>
        <ClipPath id={clipId}>
          <Rect x={20} y={36} width={80} height={76} rx={24} />
        </ClipPath>
      </Defs>

      {/* asas */}
      <Path d="M38 42 C38 12 58 12 58 42" fill="none" stroke={trazo} strokeWidth={8} strokeLinecap="round" />
      <Path d="M62 42 C62 12 82 12 82 42" fill="none" stroke={trazo} strokeWidth={8} strokeLinecap="round" />
      <Path d="M42 38 C42 20 50 17 54 22" fill="none" stroke={brillo} strokeWidth={2.4} strokeLinecap="round" opacity={0.8} />
      <Path d="M66 38 C66 20 74 17 78 22" fill="none" stroke={brillo} strokeWidth={2.4} strokeLinecap="round" opacity={0.8} />

      {/* patitas */}
      <Ellipse cx={44} cy={114} rx={11} ry={6} fill={trazo} />
      <Ellipse cx={76} cy={114} rx={11} ry={6} fill={trazo} />

      {/* cuerpo */}
      <Rect x={20} y={36} width={80} height={76} rx={24} fill={cuerpo} />
      <G clipPath={`url(#${clipId})`}>
        <Rect x={20} y={86} width={80} height={14} fill={ambar} />
        <Path d="M20 88.2 H100 M20 97.8 H100" stroke={hilo} strokeWidth={1.3} strokeDasharray="3 2.6" strokeLinecap="round" opacity={0.9} />
      </G>
      <Rect x={20} y={36} width={80} height={76} rx={24} fill="none" stroke={trazo} strokeWidth={4} />

      {/* mejillas */}
      <Circle cx={35} cy={78} r={7} fill="#F9A98A" opacity={0.75} />
      <Circle cx={85} cy={78} r={7} fill="#F9A98A" opacity={0.75} />
      <Circle cx={35} cy={78} r={4} fill="#FBC4A8" opacity={0.8} />
      <Circle cx={85} cy={78} r={4} fill="#FBC4A8" opacity={0.8} />

      {/* brazos, accesorios y cara según la pose */}
      {pose === 'saludo' ? (
        <>
          {brazosNormales}
          {ojosAbiertos()}
          {sonrisa}
        </>
      ) : null}

      {pose === 'lupa' ? (
        <>
          {brazo('M20 70 L6 80')}
          {brazo('M100 72 L112 62')}
          <Circle cx={122} cy={46} r={14} fill="#FCEFD6" stroke={trazo} strokeWidth={5} />
          <Path d="M113 57 L104 70" stroke={trazo} strokeWidth={6} strokeLinecap="round" />
          <Circle cx={46} cy={66} r={5} fill={tinta} />
          <Circle cx={47.6} cy={64.2} r={1.5} fill="#FFFFFF" />
          <Circle cx={76} cy={64} r={7} fill={tinta} />
          <Circle cx={78} cy={61.8} r={1.9} fill="#FFFFFF" />
          <Path d="M54 78 Q60 82 66 78" stroke={tinta} strokeWidth={3.5} fill="none" strokeLinecap="round" />
        </>
      ) : null}

      {pose === 'cocina' ? (
        <>
          {brazosNormales}
          <Path d="M34 30 C22 28 22 8 38 10 C40 -6 62 -8 62 6 C70 -6 92 0 84 14 C98 14 98 30 86 30 Z" fill="#FFFFFF" stroke={trazo} strokeWidth={4} strokeLinejoin="round" />
          <Rect x={34} y={28} width={52} height={12} rx={4} fill="#FFFFFF" stroke={trazo} strokeWidth={4} />
          {ojosAbiertos()}
          <Path d="M52 76 Q60 86 68 76 Z" fill={tinta} stroke={tinta} strokeWidth={2} strokeLinejoin="round" />
        </>
      ) : null}

      {pose === 'caja' ? (
        <>
          <Rect x={38} y={84} width={44} height={34} rx={5} fill="#E8C48A" stroke={trazo} strokeWidth={4} />
          <Path d="M60 84 V100" stroke={trazo} strokeWidth={4} />
          {brazo('M20 78 L38 96')}
          {brazo('M100 78 L82 96')}
          {ojosAbiertos(62)}
          <Path d="M52 71 Q60 79 68 71" stroke={tinta} strokeWidth={3.5} fill="none" strokeLinecap="round" />
        </>
      ) : null}

      {pose === 'palma' ? (
        <>
          {brazo('M20 70 L4 62')}
          {brazo('M100 70 L116 62')}
          <Ellipse cx={60} cy={34} rx={56} ry={10} fill={ambar} stroke={trazo} strokeWidth={4} />
          <Path d="M36 32 C36 6 84 6 84 32 Z" fill={ambar} stroke={trazo} strokeWidth={4} strokeLinejoin="round" />
          <Path d="M37 27 H83" stroke={verdeAcc} strokeWidth={5} />
          {ojosAbiertos()}
          {sonrisa}
        </>
      ) : null}

      {pose === 'megafono' ? (
        <>
          {brazo('M20 70 L6 80')}
          {brazo('M100 72 L110 66')}
          <Path d="M106 58 L132 44 V84 L106 72 Z" fill={ambar} stroke={trazo} strokeWidth={4} strokeLinejoin="round" />
          <Path d="M140 54 L148 50 M140 64 H150 M140 74 L148 78" stroke={verdeAcc} strokeWidth={4} strokeLinecap="round" />
          {ojosAbiertos()}
          <Ellipse cx={60} cy={79} rx={6} ry={5} fill={tinta} />
        </>
      ) : null}

      {pose === 'fiesta' ? (
        <>
          {brazo('M20 66 L4 46')}
          {brazo('M100 66 L116 46')}
          <Path d="M60 -18 L42 34 H78 Z" fill={ambar} stroke={trazo} strokeWidth={4} strokeLinejoin="round" />
          <Circle cx={60} cy={-18} r={6} fill="#FFFFFF" stroke={trazo} strokeWidth={4} />
          <Circle cx={2} cy={20} r={4} fill={ambar} />
          <Circle cx={122} cy={16} r={4} fill={cuerpo} />
          <Circle cx={132} cy={70} r={4} fill={ambar} />
          <Circle cx={-10} cy={74} r={4} fill={cuerpo} />
          <Path d="M41 68 Q46 60 51 68 M69 68 Q74 60 79 68" stroke={tinta} strokeWidth={3.5} fill="none" strokeLinecap="round" />
          <Path d="M50 75 Q60 88 70 75 Z" fill={tinta} />
        </>
      ) : null}

      {pose === 'dormido' ? (
        <>
          {brazo('M20 78 L10 92')}
          {brazo('M100 78 L110 92')}
          <Path d="M40 66 Q46 72 52 66 M68 66 Q74 72 80 66" stroke={tinta} strokeWidth={3.5} fill="none" strokeLinecap="round" />
          <Circle cx={60} cy={79} r={3.5} fill={tinta} />
          <Path d="M104 26 H116 L104 40 H116 M122 2 H132 L122 14 H132" stroke={verdeAcc} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : null}
    </Svg>
  );
}
