/**
 * Generador de códigos QR (versiones 1 a 10, modo «bytes», cualquier nivel de corrección de errores).
 * Se escribió aquí, sin librerías externas, porque Mercaboot solo necesita un QR corto (un enlace) y así no se agrega
 * ningún paquete más a la app. Sigue el estándar ISO/IEC 18004: datos → bloques con corrección de errores Reed-Solomon →
 * patrones fijos (esquinas, alineación, tiempo, formato) → máscara con la menor penalización.
 * Lo que sale se comprueba con un lector independiente (OpenCV) en las pruebas del proyecto.
 * Autor: José David Pérez Miguel
 */

export type NivelQR = 'L' | 'M' | 'Q' | 'H';

export interface MatrizQR {
  /** Módulos por lado (21 en la versión 1, 25 en la 2, …). */
  tamano: number;
  version: number;
  nivel: NivelQR;
  mascara: number;
  /** `modulos[fila][columna]`: verdadero = cuadrito oscuro. */
  modulos: boolean[][];
}

export const VERSION_MAXIMA = 10;

/** Bytes de corrección de errores por bloque, según la versión (el lugar 0 no se usa). */
const ECC_POR_BLOQUE: Record<NivelQR, number[]> = {
  L: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18],
  M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26],
  Q: [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24],
  H: [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28],
};

/** Cuántos bloques de datos hay, según la versión. */
const BLOQUES: Record<NivelQR, number[]> = {
  L: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4],
  M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5],
  Q: [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8],
  H: [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8],
};

/** Los 2 bits que identifican el nivel dentro de la información de formato. */
const BITS_DE_NIVEL: Record<NivelQR, number> = { L: 1, M: 0, Q: 3, H: 2 };

/** UTF-8 a mano (para no depender de TextEncoder en todos los motores). */
export function aBytesUtf8(texto: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < texto.length; i++) {
    let c = texto.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < texto.length) {
      const d = texto.charCodeAt(i + 1);
      if (d >= 0xdc00 && d <= 0xdfff) {
        c = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00);
        i++;
      }
    }
    if (c < 0x80) bytes.push(c);
    else if (c < 0x800) bytes.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else bytes.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return bytes;
}

const bit = (n: number, i: number): boolean => ((n >>> i) & 1) !== 0;

/** Cuántos módulos de un QR de esa versión sirven para datos y corrección (sin los patrones fijos). */
function modulosDeDatos(version: number): number {
  let r = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const n = Math.floor(version / 7) + 2;
    r -= (25 * n - 10) * n - 55;
    if (version >= 7) r -= 36;
  }
  return r;
}

/** Bytes de datos (sin corrección de errores) que caben en esa versión y nivel. */
export function capacidadEnBytes(version: number, nivel: NivelQR): number {
  return Math.floor(modulosDeDatos(version) / 8) - ECC_POR_BLOQUE[nivel][version] * BLOQUES[nivel][version];
}

/** Cuántos bytes de texto caben como máximo en la versión y nivel dados. */
export function maximoDeTexto(version: number, nivel: NivelQR): number {
  const bitsConteo = version <= 9 ? 8 : 16;
  const bitsDisponibles = capacidadEnBytes(version, nivel) * 8 - 4 - bitsConteo;
  return Math.floor(bitsDisponibles / 8);
}

/* ───────── Reed-Solomon sobre GF(256) ───────── */

function multiplicar(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}

function divisorRS(grado: number): number[] {
  const r: number[] = new Array(grado).fill(0);
  r[grado - 1] = 1;
  let raiz = 1;
  for (let i = 0; i < grado; i++) {
    for (let j = 0; j < r.length; j++) {
      r[j] = multiplicar(r[j], raiz);
      if (j + 1 < r.length) r[j] ^= r[j + 1];
    }
    raiz = multiplicar(raiz, 0x02);
  }
  return r;
}

function residuoRS(datos: number[], divisor: number[]): number[] {
  const r: number[] = divisor.map(() => 0);
  for (const b of datos) {
    const factor = b ^ (r.shift() as number);
    r.push(0);
    divisor.forEach((coef, i) => {
      r[i] ^= multiplicar(coef, factor);
    });
  }
  return r;
}

/** Datos + corrección de errores, repartidos en bloques y entrelazados como pide el estándar. */
function conCorreccion(datos: number[], version: number, nivel: NivelQR): number[] {
  const numBloques = BLOQUES[nivel][version];
  const eccBloque = ECC_POR_BLOQUE[nivel][version];
  const crudos = Math.floor(modulosDeDatos(version) / 8);
  const numCortos = numBloques - (crudos % numBloques);
  const largoCorto = Math.floor(crudos / numBloques);
  const divisor = divisorRS(eccBloque);
  const bloques: number[][] = [];
  for (let i = 0, k = 0; i < numBloques; i++) {
    const dat = datos.slice(k, k + largoCorto - eccBloque + (i < numCortos ? 0 : 1));
    k += dat.length;
    const ecc = residuoRS(dat, divisor);
    if (i < numCortos) dat.push(0); // relleno para alinear columnas; se salta al entrelazar
    bloques.push(dat.concat(ecc));
  }
  const salida: number[] = [];
  for (let i = 0; i < bloques[0].length; i++) {
    bloques.forEach((b, j) => {
      if (i !== largoCorto - eccBloque || j >= numCortos) salida.push(b[i]);
    });
  }
  return salida;
}

/* ───────── dibujo ───────── */

function posicionesDeAlineacion(version: number): number[] {
  if (version === 1) return [];
  const n = Math.floor(version / 7) + 2;
  const paso = Math.ceil((version * 4 + 4) / (n * 2 - 2)) * 2;
  const r = [6];
  for (let pos = version * 4 + 10; r.length < n; pos -= paso) r.splice(1, 0, pos);
  return r;
}

class Lienzo {
  readonly tamano: number;
  readonly modulos: boolean[][];
  readonly fijos: boolean[][];

  constructor(readonly version: number, readonly nivel: NivelQR) {
    this.tamano = version * 4 + 17;
    this.modulos = Array.from({ length: this.tamano }, () => new Array<boolean>(this.tamano).fill(false));
    this.fijos = Array.from({ length: this.tamano }, () => new Array<boolean>(this.tamano).fill(false));
    this.patronesFijos();
  }

  private poner(x: number, y: number, oscuro: boolean) {
    this.modulos[y][x] = oscuro;
    this.fijos[y][x] = true;
  }

  private esquina(cx: number, cy: number) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < this.tamano && y >= 0 && y < this.tamano) this.poner(x, y, d !== 2 && d !== 4);
      }
    }
  }

  private alineacion(cx: number, cy: number) {
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) this.poner(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }

  private patronesFijos() {
    const t = this.tamano;
    for (let i = 0; i < t; i++) {
      this.poner(6, i, i % 2 === 0);
      this.poner(i, 6, i % 2 === 0);
    }
    this.esquina(3, 3);
    this.esquina(t - 4, 3);
    this.esquina(3, t - 4);
    const pos = posicionesDeAlineacion(this.version);
    const n = pos.length;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (!((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0))) this.alineacion(pos[i], pos[j]);
      }
    }
    this.formato(0); // solo reserva el lugar; el verdadero se escribe al final con la máscara elegida
    this.versionInfo();
  }

  formato(mascara: number) {
    const t = this.tamano;
    const datos = (BITS_DE_NIVEL[this.nivel] << 3) | mascara;
    let rem = datos;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((datos << 10) | rem) ^ 0x5412;
    for (let i = 0; i <= 5; i++) this.poner(8, i, bit(bits, i));
    this.poner(8, 7, bit(bits, 6));
    this.poner(8, 8, bit(bits, 7));
    this.poner(7, 8, bit(bits, 8));
    for (let i = 9; i < 15; i++) this.poner(14 - i, 8, bit(bits, i));
    for (let i = 0; i < 8; i++) this.poner(t - 1 - i, 8, bit(bits, i));
    for (let i = 8; i < 15; i++) this.poner(8, t - 15 + i, bit(bits, i));
    this.poner(8, t - 8, true); // el módulo oscuro que siempre va
  }

  private versionInfo() {
    if (this.version < 7) return;
    let rem = this.version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (this.version << 12) | rem;
    const t = this.tamano;
    for (let i = 0; i < 18; i++) {
      const a = t - 11 + (i % 3);
      const b = Math.floor(i / 3);
      this.poner(a, b, bit(bits, i));
      this.poner(b, a, bit(bits, i));
    }
  }

  /** Coloca los bytes en zigzag, de abajo hacia arriba y de derecha a izquierda, saltando los patrones fijos. */
  colocar(bytes: number[]) {
    const t = this.tamano;
    let i = 0;
    for (let derecha = t - 1; derecha >= 1; derecha -= 2) {
      if (derecha === 6) derecha = 5;
      for (let vert = 0; vert < t; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = derecha - j;
          const arriba = ((derecha + 1) & 2) === 0;
          const y = arriba ? t - 1 - vert : vert;
          if (!this.fijos[y][x] && i < bytes.length * 8) {
            this.modulos[y][x] = bit(bytes[i >>> 3], 7 - (i & 7));
            i++;
          }
        }
      }
    }
  }

  aplicarMascara(mascara: number) {
    for (let y = 0; y < this.tamano; y++) {
      for (let x = 0; x < this.tamano; x++) {
        let invertir: boolean;
        switch (mascara) {
          case 0: invertir = (x + y) % 2 === 0; break;
          case 1: invertir = y % 2 === 0; break;
          case 2: invertir = x % 3 === 0; break;
          case 3: invertir = (x + y) % 3 === 0; break;
          case 4: invertir = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: invertir = ((x * y) % 2) + ((x * y) % 3) === 0; break;
          case 6: invertir = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          default: invertir = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; break;
        }
        if (!this.fijos[y][x] && invertir) this.modulos[y][x] = !this.modulos[y][x];
      }
    }
  }

  /** Qué tan «difícil de leer» quedó (reglas N1 a N4 del estándar): menos es mejor. */
  penalizacion(): number {
    const t = this.tamano;
    const m = this.modulos;
    let r = 0;
    // N1: rachas de 5 o más módulos iguales, en filas y columnas
    for (let eje = 0; eje < 2; eje++) {
      for (let a = 0; a < t; a++) {
        let color = false;
        let racha = 0;
        for (let b = 0; b < t; b++) {
          const v = eje === 0 ? m[a][b] : m[b][a];
          if (b > 0 && v === color) {
            racha++;
            if (racha === 5) r += 3;
            else if (racha > 5) r += 1;
          } else {
            color = v;
            racha = 1;
          }
        }
      }
    }
    // N2: cuadros de 2 × 2 del mismo color
    for (let y = 0; y < t - 1; y++) for (let x = 0; x < t - 1; x++) if (m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) r += 3;
    // N3: algo parecido a la esquina de un QR (1:1:3:1:1 con espacio claro de 4 a un lado)
    const patrones = ['10111010000', '00001011101'];
    for (let eje = 0; eje < 2; eje++) {
      for (let a = 0; a < t; a++) {
        let texto = '';
        for (let b = 0; b < t; b++) texto += (eje === 0 ? m[a][b] : m[b][a]) ? '1' : '0';
        for (const p of patrones) {
          let desde = texto.indexOf(p);
          while (desde !== -1) {
            r += 40;
            desde = texto.indexOf(p, desde + 1);
          }
        }
      }
    }
    // N4: que haya más o menos la mitad de módulos oscuros
    let oscuros = 0;
    for (const fila of m) for (const v of fila) if (v) oscuros++;
    const total = t * t;
    r += (Math.ceil(Math.abs(oscuros * 20 - total * 10) / total) - 1) * 10;
    return r;
  }
}

/**
 * Crea el QR de un texto. Elige la versión más chica donde cabe. Lanza un error si el texto no cabe en la versión 10
 * (unos 150 caracteres con el nivel M): para enlaces cortos sobra.
 */
export function crearQR(texto: string, nivel: NivelQR = 'M'): MatrizQR {
  const bytes = aBytesUtf8(texto);
  let version = 1;
  while (version <= VERSION_MAXIMA && bytes.length > maximoDeTexto(version, nivel)) version++;
  if (version > VERSION_MAXIMA) throw new Error('El texto es demasiado largo para el código QR.');

  // Bits: modo «bytes» (0100), cuántos bytes, los bytes, terminador y relleno
  const bits: number[] = [];
  const agregar = (valor: number, cuantos: number) => {
    for (let i = cuantos - 1; i >= 0; i--) bits.push((valor >>> i) & 1);
  };
  agregar(0b0100, 4);
  agregar(bytes.length, version <= 9 ? 8 : 16);
  for (const b of bytes) agregar(b, 8);
  const capacidadBits = capacidadEnBytes(version, nivel) * 8;
  agregar(0, Math.min(4, capacidadBits - bits.length));
  agregar(0, (8 - (bits.length % 8)) % 8);
  const datos: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let k = 0; k < 8; k++) b = (b << 1) | bits[i + k];
    datos.push(b);
  }
  for (let relleno = 0xec; datos.length < capacidadEnBytes(version, nivel); relleno ^= 0xec ^ 0x11) datos.push(relleno);

  const lienzo = new Lienzo(version, nivel);
  lienzo.colocar(conCorreccion(datos, version, nivel));

  // Se prueba cada una de las 8 máscaras y se queda la que deja el código más fácil de leer
  let mejor = 0;
  let menor = Infinity;
  for (let mascara = 0; mascara < 8; mascara++) {
    lienzo.aplicarMascara(mascara);
    lienzo.formato(mascara);
    const p = lienzo.penalizacion();
    if (p < menor) {
      menor = p;
      mejor = mascara;
    }
    lienzo.aplicarMascara(mascara); // se deshace (aplicar dos veces la misma máscara no cambia nada)
  }
  lienzo.aplicarMascara(mejor);
  lienzo.formato(mejor);
  return { tamano: lienzo.tamano, version, nivel, mascara: mejor, modulos: lienzo.modulos };
}

/**
 * El dibujo como un solo trazo SVG (una línea por cada racha de cuadritos oscuros), con el margen blanco que pide el estándar
 * (4 módulos). Sirve tanto para la pantalla (react-native-svg) como para el cartel que se imprime.
 */
export function trazoSvg(m: MatrizQR, margen = 4, solape = 0): { d: string; lado: number } {
  // `solape`: cuánto se estira cada línea hacia abajo para que, en pantallas con medidas que no son enteras, no se vea una
  // rayita clara entre renglones (en el cartel impreso se deja en 0).
  const alto = 1 + solape;
  let d = '';
  for (let y = 0; y < m.tamano; y++) {
    let x = 0;
    while (x < m.tamano) {
      if (!m.modulos[y][x]) {
        x++;
        continue;
      }
      let fin = x;
      while (fin < m.tamano && m.modulos[y][fin]) fin++;
      d += `M${x + margen} ${y + margen}h${fin - x}v${alto}h${x - fin}z`;
      x = fin;
    }
  }
  return { d, lado: m.tamano + margen * 2 };
}

/** El QR completo como texto SVG (fondo blanco y cuadritos negros). */
export function qrComoSvg(m: MatrizQR, opciones: { margen?: number; ancho?: string } = {}): string {
  const { d, lado } = trazoSvg(m, opciones.margen ?? 4);
  const ancho = opciones.ancho ? ` width="${opciones.ancho}" height="${opciones.ancho}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${lado}"${ancho} shape-rendering="crispEdges"><rect width="${lado}" height="${lado}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}
