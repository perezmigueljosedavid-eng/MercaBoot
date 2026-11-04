import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import type { RealtimeChannel, Session } from '@supabase/supabase-js';
import { NUBE_CONFIGURADA } from './config';
import type {
  CategoriaProducto,
  ClienteFrecuente,
  Conversacion,
  Cuenta,
  EntregaPedido,
  LineaCarrito,
  LineaPedido,
  Mensaje,
  Negocio,
  PagoPedido,
  Pedido,
  Producto,
  Rol,
} from './data/tipos';
import {
  conversacionDeFila,
  esErrorDeRed,
  favoritoDeFila,
  filaDeCambioNegocio,
  frecuenteDeFila,
  lineaDeFila,
  mensajeDeFila,
  negocioDeFila,
  pedidoDeFila,
  productoDeFila,
  textoError,
  type Favorito,
  type FilaConversacion,
  type FilaDetalle,
  type FilaFavorito,
  type FilaFrecuente,
  type FilaMensaje,
  type FilaNegocio,
  type FilaPedido,
  type FilaPerfil,
  type FilaProducto,
} from './lib/nube';
import { avisoDeCambio, cantidadTexto, disponibleParaPedir, esActivo, pasoCantidad, redondear, totales } from './lib/pedidos';
import { supabase } from './lib/supabase';

/**
 * Estado de la app, guardado en la nube (Supabase).
 *
 *  · Cuentas: Supabase Auth (correo + contraseña); la sesión queda en el teléfono.
 *  · Datos: negocios, productos, favoritos, conversaciones, mensajes, pedidos y clientes frecuentes viven en la base de datos compartida.
 *  · Carrito: se arma en el teléfono (es de un solo negocio); al apartarlo, la base de datos revisa todo y crea el pedido.
 *  · En vivo: la app escucha los cambios (Supabase Realtime). Si el aviso en vivo no está disponible, vuelve a
 *    preguntar cada pocos segundos, así que dos teléfonos siempre acaban viendo lo mismo.
 *  · Sin internet: se muestra lo último que se guardó en el teléfono.
 */

export const correoValido = (c: string) => /^\S+@\S+\.\S+$/.test(c.trim());
export const soloDigitos = (t: string) => t.replace(/\D/g, '');
export const telefonoValido = (t: string) => soloDigitos(t).length === 10;

/* ───────── tipos públicos ───────── */

export interface DatosNegocioNuevo {
  nombre: string;
  giro: string;
  direccion?: string;
  lat?: number;
  lng?: number;
  mapsUrl?: string;
}

/** Reclamar un negocio del directorio (con su código de reclamo) o crear uno nuevo. */
export type AltaNegocio = { reclamarId: string; codigo: string } | { nuevo: DatosNegocioNuevo };

export interface Registro {
  nombre: string;
  correo: string;
  telefono: string;
  password: string;
  rol: Rol;
  /** Comerciantes: el negocio que reclaman o crean. */
  negocio?: AltaNegocio;
}

export interface DatosProducto {
  nombre: string;
  precio?: number;
  unidad: string;
  disponible: boolean;
  categoria: CategoriaProducto;
  porEncargo?: boolean;
  /** Existencias (opcional): sin valor = no se lleva la cuenta y no hay límite. */
  cantidad?: number;
}

/** Cómo quiere el cliente recibir y pagar su pedido. */
export interface DatosPedido {
  entrega: EntregaPedido;
  /** Solo para entrega a domicilio. */
  direccion?: string;
  pago: PagoPedido;
  nota?: string;
}

/** Lo que el cliente o el comerciante puede hacerle a un pedido (la base de datos revisa quién puede hacer qué). */
export type AccionPedido =
  | 'cancelar'
  | 'reportar_pago'
  | 'aceptar'
  | 'listo'
  | 'completar'
  | 'no_se_presento'
  | 'extender'
  | 'confirmar_pago'
  | 'rechazar_pago';

/** El carrito guardado en el teléfono: un solo negocio a la vez. */
interface CarritoGuardado {
  uid: string;
  negocioId: string;
  lineas: LineaCarrito[];
}

/** El carrito ya con los productos de verdad (los que dejaron de existir se quitan solos). */
export interface CarritoVista {
  negocio: Negocio;
  lineas: { producto: Producto; cantidad: number }[];
  /** Cuántos productos distintos lleva. */
  cuantos: number;
  subtotal: number;
}

/** Lo que devuelve `agregarAlCarrito` cuando el carrito ya tiene productos de otro negocio. */
export const OTRO_NEGOCIO = 'otro-negocio';

export interface NegocioLibre {
  id: string;
  nombre: string;
  giro: string;
}

/** conectando · en-vivo (avisos al instante) · sin-vivo (se actualiza cada pocos segundos) · sin-internet */
export type EstadoRed = 'conectando' | 'en-vivo' | 'sin-vivo' | 'sin-internet';

export interface Datos {
  negocios: Negocio[];
  productos: Producto[];
  conversaciones: Conversacion[];
  /** Pedidos que esta cuenta puede ver: los que hizo como cliente y los que recibe su negocio. */
  pedidos: Pedido[];
  /** Clientes frecuentes: los del negocio de esta cuenta, y los negocios que la nombraron a ella. */
  frecuentes: ClienteFrecuente[];
}

/** ¿Hay mensajes que esta persona todavía no lee? (`soyCliente`: si es el cliente o el dueño del negocio) */
export function sinLeer(c: Conversacion, miId: string, soyCliente: boolean): boolean {
  if (c.ultimoEn == null || !c.ultimoAutor || c.ultimoAutor === miId) return false;
  return c.ultimoEn > (soyCliente ? c.leidoCliente : c.leidoNegocio);
}

export function textoUltimo(c: Conversacion, miId: string): string {
  if (!c.ultimoTexto) return '';
  return c.ultimoAutor === miId ? `Tú: ${c.ultimoTexto}` : c.ultimoTexto;
}

/* ───────── estado interno ───────── */

interface Base {
  perfil: FilaPerfil | null;
  negocios: Negocio[];
  productos: Producto[];
  favs: Favorito[];
  conversaciones: Conversacion[];
  mensajes: Record<string, Mensaje[]>;
  pedidos: Pedido[];
  frecuentes: ClienteFrecuente[];
}

const VACIO: Base = { perfil: null, negocios: [], productos: [], favs: [], conversaciones: [], mensajes: {}, pedidos: [], frecuentes: [] };

type Accion =
  | { t: 'limpiar' }
  | { t: 'cache'; c: Partial<Base> }
  | { t: 'perfil'; p: FilaPerfil | null }
  | {
      t: 'todo';
      negocios: Negocio[];
      productos: Producto[];
      favs: Favorito[];
      conversaciones: Conversacion[];
      pedidos: Pedido[];
      frecuentes: ClienteFrecuente[];
    }
  | { t: 'neg'; n: Negocio }
  | { t: 'negDel'; id: string }
  | { t: 'prod'; p: Producto }
  | { t: 'prodDel'; id: string }
  | { t: 'fav'; f: Favorito }
  | { t: 'favDel'; id: string }
  | { t: 'conv'; c: Conversacion }
  | { t: 'convDel'; id: string }
  | { t: 'msgs'; conv: string; ms: Mensaje[] }
  | { t: 'msg'; m: Mensaje }
  | { t: 'msgDel'; conv: string; id: string }
  | { t: 'ped'; p: Pedido }
  | { t: 'pedDel'; id: string }
  | { t: 'frec'; f: ClienteFrecuente }
  | { t: 'frecDel'; id: string };

const upsert = <A extends { id: string }>(lista: A[], x: A): A[] => {
  const i = lista.findIndex((y) => y.id === x.id);
  if (i < 0) return [...lista, x];
  const sig = lista.slice();
  sig[i] = x;
  return sig;
};

const porFecha = (a: Mensaje, b: Mensaje) => a.creado - b.creado || a.id.localeCompare(b.id);

/** Agrega un mensaje; si es el mismo que uno «enviando…» (mismo autor y texto), reemplaza a ese. */
function agregarMensaje(lista: Mensaje[], m: Mensaje): Mensaje[] {
  if (lista.some((x) => x.id === m.id)) return lista.map((x) => (x.id === m.id ? m : x));
  const i = lista.findIndex((x) => x.pendiente && x.autorId === m.autorId && x.texto === m.texto);
  const base = i >= 0 ? lista.filter((_, j) => j !== i) : lista;
  return [...base, m].sort(porFecha);
}

function reductor(b: Base, a: Accion): Base {
  switch (a.t) {
    case 'limpiar':
      return VACIO;
    case 'cache':
      return { ...b, ...a.c };
    case 'perfil':
      return { ...b, perfil: a.p };
    case 'todo':
      return {
        ...b,
        negocios: a.negocios,
        productos: a.productos,
        favs: a.favs,
        conversaciones: a.conversaciones,
        pedidos: a.pedidos,
        frecuentes: a.frecuentes,
      };
    case 'neg':
      return { ...b, negocios: upsert(b.negocios, a.n) };
    case 'negDel':
      return { ...b, negocios: b.negocios.filter((x) => x.id !== a.id) };
    case 'prod':
      return { ...b, productos: upsert(b.productos, a.p) };
    case 'prodDel':
      return { ...b, productos: b.productos.filter((x) => x.id !== a.id) };
    case 'fav':
      return { ...b, favs: upsert(b.favs, a.f) };
    case 'favDel':
      return { ...b, favs: b.favs.filter((x) => x.id !== a.id) };
    case 'conv':
      return { ...b, conversaciones: upsert(b.conversaciones, a.c) };
    case 'convDel': {
      const resto = { ...b.mensajes };
      delete resto[a.id];
      return { ...b, conversaciones: b.conversaciones.filter((x) => x.id !== a.id), mensajes: resto };
    }
    case 'msgs': {
      // Lo que ya estaba «enviando…» se conserva hasta que el servidor lo confirme.
      const pendientes = (b.mensajes[a.conv] ?? []).filter((x) => x.pendiente && !a.ms.some((y) => y.autorId === x.autorId && y.texto === x.texto));
      return { ...b, mensajes: { ...b.mensajes, [a.conv]: [...a.ms, ...pendientes].sort(porFecha) } };
    }
    case 'msg': {
      const lista = b.mensajes[a.m.conversacionId];
      // Solo se guardan los mensajes de chats que ya se abrieron; los demás se cargan al abrirlos.
      if (!lista) return b;
      return { ...b, mensajes: { ...b.mensajes, [a.m.conversacionId]: agregarMensaje(lista, a.m) } };
    }
    case 'msgDel':
      return { ...b, mensajes: { ...b.mensajes, [a.conv]: (b.mensajes[a.conv] ?? []).filter((x) => x.id !== a.id) } };
    case 'ped':
      return { ...b, pedidos: upsert(b.pedidos, a.p) };
    case 'pedDel':
      return { ...b, pedidos: b.pedidos.filter((x) => x.id !== a.id) };
    case 'frec':
      return { ...b, frecuentes: upsert(b.frecuentes, a.f) };
    case 'frecDel':
      return { ...b, frecuentes: b.frecuentes.filter((x) => x.id !== a.id) };
    default:
      return b;
  }
}

/* ───────── almacenamiento local ───────── */

const PREFIJO = 'mercaboot:v3:';
const claveModo = (uid: string) => `${PREFIJO}modo:${uid}`;
// «cache21»: la copia de la versión anterior no tenía pedidos ni existencias, así que no se reutiliza.
const claveCache = (uid: string) => `${PREFIJO}cache21:${uid}`;
const claveCarrito = (uid: string) => `${PREFIJO}carrito:${uid}`;
/** Pedidos que se guardan en la copia local cuando no cabe todo. */
const PEDIDOS_EN_COPIA = 40;
/** Un valor muy grande no cabe en el almacenamiento del teléfono: se guarda sin las fotos. */
const LIMITE_CACHE = 1_200_000;

interface Cache {
  perfil: FilaPerfil | null;
  negocios: Negocio[];
  productos: Producto[];
  favs: Favorito[];
  conversaciones: Conversacion[];
  pedidos: Pedido[];
  frecuentes: ClienteFrecuente[];
}

/* ───────── contexto ───────── */

interface Ctx {
  /** La sesión guardada ya se revisó (se puede mostrar la app). */
  ready: boolean;
  /** Ya se pusieron la dirección y la llave de Supabase (src/config.ts). */
  nubeOk: boolean;
  s: Datos;
  cuenta: Cuenta | null;
  /** Negocio que administra la cuenta de comerciante en sesión. */
  negocio: Negocio | null;
  /** Ids de los negocios que esta cuenta guardó en favoritos (es privado: el negocio no lo ve). */
  favoritos: string[];
  /** Cuántos clientes frecuentes tiene el negocio de esta cuenta (los elige el comerciante). */
  numFrecuentes: number;
  /** Cliente: sus pedidos activos. Comerciante: pedidos nuevos que esperan respuesta. */
  pedidosPendientes: number;
  estadoRed: EstadoRed;
  /** Aviso corto y pasajero (por ejemplo «Sin conexión»). */
  aviso: string | null;
  /** Conversaciones con mensajes sin leer, según el modo en que está la cuenta. */
  chatsSinLeer: number;
  refrescar: () => Promise<void>;

  /** Tiendas del directorio que nadie administra (sirve antes de crear la cuenta). `null` si no se pudo consultar. */
  negociosLibres: () => Promise<NegocioLibre[] | null>;
  registrar: (r: Registro) => Promise<string | null>;
  entrar: (correo: string, password: string) => Promise<string | null>;
  salir: () => Promise<void>;
  /** Cambia entre el modo cliente y el modo comerciante de la misma cuenta. */
  cambiarModo: (rol: Rol) => string | null;
  /** Revisa el código de reclamo de un negocio del directorio sin reclamarlo (sirve para avisar antes de confirmar). */
  comprobarReclamo: (negocioId: string, codigo: string) => Promise<string | null>;
  /** Una cuenta que ya existe abre (o reclama, con su código) su negocio y pasa a modo comerciante. */
  abrirNegocio: (alta: AltaNegocio) => Promise<string | null>;
  /** La cuenta deja de administrar su negocio y sigue como cliente. */
  soltarNegocio: () => Promise<string | null>;
  /** Manda al correo un enlace para escribir una contraseña nueva. */
  recuperarPassword: (correo: string) => Promise<string | null>;
  /** Con el enlace del correo: pone la contraseña nueva. */
  restablecerPassword: (nueva: string) => Promise<string | null>;
  actualizarCuenta: (p: Partial<Pick<Cuenta, 'nombre' | 'telefono' | 'fotoUri'>>) => Promise<string | null>;
  cambiarPassword: (actual: string, nueva: string) => Promise<string | null>;
  actualizarNegocio: (p: Partial<Omit<Negocio, 'id' | 'duenoId' | 'creado'>>) => Promise<string | null>;
  toggleFavorito: (negocioId: string) => void;
  agregarProducto: (p: DatosProducto) => Promise<string | null>;
  editarProducto: (id: string, p: Partial<DatosProducto>) => Promise<string | null>;
  eliminarProducto: (id: string) => Promise<string | null>;
  setDisponible: (id: string, v: boolean) => void;

  /** Mensajes de una conversación (vacío hasta que se abre con `observarChat`). */
  mensajesDe: (convId: string) => Mensaje[];
  /** Mientras un chat está abierto se mantiene al día. Devuelve la función que lo deja de seguir. */
  observarChat: (convId: string) => () => void;
  /** El cliente escribe en un negocio: si todavía no hay conversación, la crea con este primer mensaje. */
  enviarComoCliente: (negocioId: string, texto: string) => Promise<string | null>;
  /** El comerciante responde en una conversación de su negocio. */
  enviarComoNegocio: (convId: string, texto: string) => Promise<string | null>;
  marcarLeida: (convId: string) => void;

  /** El carrito del cliente (de un solo negocio). `null` si está vacío. */
  carrito: CarritoVista | null;
  /**
   * Agrega un producto al carrito (un paso más de cantidad, o la `cantidad` que se pida).
   * Devuelve `null` si se agregó; `OTRO_NEGOCIO` si el carrito tiene productos de otro negocio
   * (con `vaciarAntes` se cambia de negocio); o un mensaje de por qué no se pudo.
   */
  agregarAlCarrito: (productoId: string, cantidad?: number, vaciarAntes?: boolean) => string | null;
  /** Pone la cantidad exacta de un producto (0 lo quita). Devuelve un mensaje si tuvo que ajustarla a lo que hay. */
  ponerCantidad: (productoId: string, cantidad: number) => string | null;
  quitarDelCarrito: (productoId: string) => void;
  vaciarCarrito: () => void;
  /** Aparta el carrito como pedido. La base de datos revisa todo y, si algo no se puede, devuelve el motivo. */
  crearPedido: (d: DatosPedido) => Promise<{ error: string } | { pedido: Pedido }>;
  /** Cambia un pedido (aceptar, cancelar, avisar un pago…). Devuelve el motivo si no se pudo. */
  accionPedido: (pedidoId: string, accion: AccionPedido, texto?: string) => Promise<string | null>;
  /** Lo que lleva un pedido, con los nombres y precios de cuando se apartó. `null` si no se pudo leer. */
  lineasDe: (pedidoId: string) => Promise<LineaPedido[] | null>;
  /** Datos para pagar por transferencia: solo los recibe el cliente de ese pedido, cuando el negocio ya lo aceptó. */
  datosPagoDe: (pedidoId: string) => Promise<string | null>;
  /** El comerciante lee sus datos para recibir transferencias (`null` si no se pudieron leer). */
  leerDatosPago: () => Promise<string | null>;
  guardarDatosPago: (texto: string) => Promise<string | null>;
  /** El comerciante nombra (o cambia) a un cliente frecuente: descuento de 0 a 50 % y/o un beneficio. */
  marcarFrecuente: (clienteId: string, descuentoPct: number, beneficio?: string) => Promise<string | null>;
  quitarFrecuente: (clienteId: string) => Promise<string | null>;
}

const StoreCtx = createContext<Ctx | null>(null);

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('useStore fuera de StoreProvider');
  return c;
}

/** Cada cuántos milisegundos se vuelve a preguntar por si algo cambió. */
const SONDEO_SIN_VIVO = 6000;
const SONDEO_EN_VIVO = 60000;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [base, dispatch] = useReducer(reductor, VACIO);
  const [sesion, setSesion] = useState<Session | null>(null);
  const [sesionLeida, setSesionLeida] = useState(!NUBE_CONFIGURADA);
  const [localListo, setLocalListo] = useState(false);
  const [modo, setModo] = useState<Rol | null>(null);
  const [estadoRed, setEstadoRed] = useState<EstadoRed>('conectando');
  const [aviso, setAviso] = useState<string | null>(null);

  const uid = sesion?.user.id ?? null;
  const uidRef = useRef<string | null>(null);
  const baseRef = useRef(base);
  const modoRef = useRef(modo);
  const canalRef = useRef<RealtimeChannel | null>(null);
  const canalVivo = useRef(false);
  const enVuelo = useRef(false);
  const pendiente = useRef(false);
  const abiertos = useRef(new Map<string, number>());
  const avisoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Negocios cuyo dato (por ejemplo el logo) se confirma en un momento, uno por uno. */
  const confirmaciones = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const estadoRedRef = useRef<EstadoRed>('conectando');
  /** Mientras se registra o inicia sesión, la app no cambia de pantalla hasta terminar todos los pasos. */
  const bloqueada = useRef(false);
  const ultimaSesion = useRef<Session | null>(null);
  const [carro, setCarro] = useState<CarritoGuardado | null>(null);
  const carroRef = useRef<CarritoGuardado | null>(null);
  /** Lo que lleva cada pedido no cambia nunca, así que se guarda en memoria después de leerlo. */
  const lineasGuardadas = useRef(new Map<string, LineaPedido[]>());
  /** Pedidos que esta persona acaba de cambiar ella misma (para no avisarle de lo que ya sabe). */
  const propias = useRef(new Map<string, number>());
  /** Última vez que se pidió soltar los pedidos que se pasaron de tiempo. */
  const ultimoVencer = useRef(0);

  useEffect(() => {
    baseRef.current = base;
  }, [base]);
  useEffect(() => {
    modoRef.current = modo;
  }, [modo]);

  const avisar = useCallback((texto: string) => {
    setAviso(texto);
    if (avisoTimer.current) clearTimeout(avisoTimer.current);
    avisoTimer.current = setTimeout(() => setAviso(null), 4500);
  }, []);

  const fijarModo = useCallback((m: Rol, id?: string | null) => {
    setModo(m);
    modoRef.current = m;
    const quien = id ?? uidRef.current;
    if (quien) AsyncStorage.setItem(claveModo(quien), m).catch(() => {});
  }, []);

  /** Cambia el carrito en memoria y lo guarda en el teléfono (`guardar` en false = solo se acaba de leer de ahí). */
  const fijarCarro = useCallback((c: CarritoGuardado | null, guardar = true) => {
    carroRef.current = c;
    setCarro(c);
    const quien = c?.uid ?? uidRef.current;
    if (!guardar || !quien) return;
    if (c && c.lineas.length > 0) AsyncStorage.setItem(claveCarrito(quien), JSON.stringify(c)).catch(() => {});
    else AsyncStorage.removeItem(claveCarrito(quien)).catch(() => {});
  }, []);

  const bloquear = useCallback(() => {
    bloqueada.current = true;
  }, []);
  const desbloquear = useCallback(() => {
    bloqueada.current = false;
    setSesion(ultimaSesion.current);
  }, []);

  /* ───── sesión ───── */

  useEffect(() => {
    if (!NUBE_CONFIGURADA) return;
    let vivo = true;
    const aplicar = (s: Session | null) => {
      ultimaSesion.current = s;
      uidRef.current = s?.user.id ?? uidRef.current;
      if (!s) uidRef.current = null;
      if (!bloqueada.current) setSesion(s);
    };
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!vivo) return;
        aplicar(data.session);
      })
      .catch(() => {})
      .finally(() => {
        if (vivo) setSesionLeida(true);
      });
    // Dentro de este aviso solo se guarda la sesión (nada de llamadas a Supabase: podrían trabarse).
    const { data } = supabase.auth.onAuthStateChange((_evento, s) => aplicar(s));
    return () => {
      vivo = false;
      data.subscription.unsubscribe();
    };
  }, []);

  /* ───── leer y escribir en la nube ───── */

  const refrescar = useCallback(async () => {
    const id = uidRef.current;
    if (!id || !NUBE_CONFIGURADA) return;
    if (enVuelo.current) {
      pendiente.current = true;
      return;
    }
    enVuelo.current = true;
    try {
      do {
        pendiente.current = false;
        // Los pedidos que se pasaron de tiempo se sueltan (la base de datos también lo hace sola cada minuto).
        if (Date.now() - ultimoVencer.current > 30_000) {
          ultimoVencer.current = Date.now();
          supabase.rpc('vencer_pedidos').then(
            () => {},
            () => {},
          );
        }
        const [perfil, negocios, productos, favs, convs, peds, frecs] = await Promise.all([
          supabase.from('perfiles').select('id,nombre,correo,telefono,foto_uri').eq('id', id).maybeSingle(),
          supabase.from('negocios').select('*').order('creado', { ascending: true }),
          supabase.from('productos').select('*'),
          supabase.from('favoritos').select('id,usuario_id,negocio_id'),
          supabase.from('conversaciones').select('*'),
          supabase.from('pedidos').select('*').order('creado', { ascending: false }).limit(300),
          supabase.from('clientes_frecuentes').select('*'),
        ]);
        if (uidRef.current !== id) return;
        const error = [perfil, negocios, productos, favs, convs, peds, frecs].map((r) => r.error).find(Boolean);
        if (error) {
          if (esErrorDeRed(error)) setEstadoRed('sin-internet');
          else setEstadoRed(canalVivo.current ? 'en-vivo' : 'sin-vivo');
          return;
        }
        dispatch({ t: 'perfil', p: (perfil.data as FilaPerfil | null) ?? baseRef.current.perfil });
        dispatch({
          t: 'todo',
          negocios: ((negocios.data ?? []) as FilaNegocio[]).map(negocioDeFila),
          productos: ((productos.data ?? []) as FilaProducto[]).map(productoDeFila),
          favs: ((favs.data ?? []) as FilaFavorito[]).map(favoritoDeFila),
          conversaciones: ((convs.data ?? []) as FilaConversacion[]).map(conversacionDeFila),
          pedidos: ((peds.data ?? []) as FilaPedido[]).map(pedidoDeFila),
          frecuentes: ((frecs.data ?? []) as FilaFrecuente[]).map(frecuenteDeFila),
        });
        setEstadoRed(canalVivo.current ? 'en-vivo' : 'sin-vivo');
        // Los chats que están abiertos también se ponen al día.
        for (const conv of abiertos.current.keys()) {
          const r = await supabase.from('mensajes').select('*').eq('conversacion_id', conv).order('creado', { ascending: true });
          if (!r.error && uidRef.current === id) dispatch({ t: 'msgs', conv, ms: ((r.data ?? []) as FilaMensaje[]).map(mensajeDeFila) });
        }
      } while (pendiente.current);
    } catch (e) {
      if (esErrorDeRed(e)) setEstadoRed('sin-internet');
    } finally {
      enVuelo.current = false;
    }
  }, []);

  /**
   * Vuelve a pedir un solo negocio en un momento (varios avisos juntos se convierten en una sola consulta).
   * Sirve para el logo: las fotos grandes no siempre viajan en el aviso en vivo de un cambio.
   */
  const confirmarNegocio = useCallback((id: string) => {
    const previo = confirmaciones.current.get(id);
    if (previo) clearTimeout(previo);
    confirmaciones.current.set(
      id,
      setTimeout(async () => {
        confirmaciones.current.delete(id);
        const quien = uidRef.current;
        if (!quien) return;
        const { data, error } = await supabase.from('negocios').select('*').eq('id', id).maybeSingle();
        if (!error && data && uidRef.current === quien) dispatch({ t: 'neg', n: negocioDeFila(data as FilaNegocio) });
      }, 700),
    );
  }, []);

  const alCambiar = useCallback(
    (tabla: string, p: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
      const borrar = p.eventType === 'DELETE';
      const nuevo = p.new as never;
      const id = String((p.old as { id?: string })?.id ?? '');
      switch (tabla) {
        case 'negocios':
          if (borrar) dispatch({ t: 'negDel', id });
          else {
            const n = negocioDeFila(nuevo as FilaNegocio);
            // Las fotos grandes pueden no venir en el aviso de un cambio (ni la primera vez que se sube un logo):
            // si el logo falta, se conserva el que ya se tenía y se confirma enseguida con una consulta de ese negocio.
            if (!('logo_uri' in (p.new as object))) {
              const previo = baseRef.current.negocios.find((x) => x.id === n.id);
              if (previo?.logoUri) n.logoUri = previo.logoUri;
              confirmarNegocio(n.id);
            }
            dispatch({ t: 'neg', n });
          }
          break;
        case 'productos':
          if (borrar) dispatch({ t: 'prodDel', id });
          else dispatch({ t: 'prod', p: productoDeFila(nuevo as FilaProducto) });
          break;
        case 'favoritos':
          if (borrar) dispatch({ t: 'favDel', id });
          else dispatch({ t: 'fav', f: favoritoDeFila(nuevo as FilaFavorito) });
          break;
        case 'conversaciones':
          if (borrar) dispatch({ t: 'convDel', id });
          else dispatch({ t: 'conv', c: conversacionDeFila(nuevo as FilaConversacion) });
          break;
        case 'mensajes':
          if (!borrar) dispatch({ t: 'msg', m: mensajeDeFila(nuevo as FilaMensaje) });
          break;
        case 'pedidos':
          if (borrar) dispatch({ t: 'pedDel', id });
          else {
            const ped = pedidoDeFila(nuevo as FilaPedido);
            const yo = uidRef.current;
            const propio = (propias.current.get(ped.id) ?? 0) > Date.now() - 5000;
            if (yo && !propio) {
              const antes = baseRef.current.pedidos.find((x) => x.id === ped.id);
              const esMiNegocio = baseRef.current.negocios.find((x) => x.id === ped.negocioId)?.duenoId === yo;
              const texto = esMiNegocio
                ? avisoDeCambio(antes, ped, 'comerciante')
                : ped.clienteId === yo
                  ? avisoDeCambio(antes, ped, 'cliente')
                  : null;
              if (texto) avisar(texto);
            }
            dispatch({ t: 'ped', p: ped });
          }
          break;
        case 'clientes_frecuentes':
          if (borrar) dispatch({ t: 'frecDel', id });
          else dispatch({ t: 'frec', f: frecuenteDeFila(nuevo as FilaFrecuente) });
          break;
        default:
      }
    },
    [avisar, confirmarNegocio],
  );

  const cerrarCanal = useCallback(() => {
    canalVivo.current = false;
    const c = canalRef.current;
    canalRef.current = null;
    if (c) supabase.removeChannel(c).catch(() => {});
  }, []);

  const abrirCanal = useCallback(
    (id: string) => {
      cerrarCanal();
      let canal = supabase.channel(`mercaboot-${id.slice(0, 8)}-${Date.now().toString(36)}`);
      for (const tabla of ['negocios', 'productos', 'favoritos', 'conversaciones', 'mensajes', 'pedidos', 'clientes_frecuentes']) {
        canal = canal.on('postgres_changes', { event: '*', schema: 'public', table: tabla }, (p) =>
          alCambiar(tabla, p as unknown as Parameters<typeof alCambiar>[1]),
        );
      }
      canal.subscribe((estado) => {
        if (canalRef.current !== canal) return;
        if (estado === 'SUBSCRIBED') {
          canalVivo.current = true;
          setEstadoRed('en-vivo');
          refrescar(); // por si algo cambió mientras se conectaba
        } else if (estado === 'CHANNEL_ERROR' || estado === 'TIMED_OUT' || estado === 'CLOSED') {
          canalVivo.current = false;
          setEstadoRed((e) => (e === 'sin-internet' ? e : 'sin-vivo'));
        }
      });
      canalRef.current = canal;
    },
    [alCambiar, cerrarCanal, refrescar],
  );

  /* ───── cuando cambia la cuenta en sesión ───── */

  useEffect(() => {
    if (!NUBE_CONFIGURADA) return;
    uidRef.current = uid;
    let vivo = true;
    if (!uid) {
      // Sin cuenta en sesión: se borra lo que quedaba en memoria (en el siguiente instante, fuera del efecto).
      queueMicrotask(() => {
        if (!vivo) return;
        cerrarCanal();
        dispatch({ t: 'limpiar' });
        fijarCarro(null, false);
        lineasGuardadas.current.clear();
        propias.current.clear();
        setModo(null);
        setEstadoRed('conectando');
        setLocalListo(true);
      });
      return () => {
        vivo = false;
      };
    }
    (async () => {
      try {
        const [m, c, k] = await Promise.all([
          AsyncStorage.getItem(claveModo(uid)),
          AsyncStorage.getItem(claveCache(uid)),
          AsyncStorage.getItem(claveCarrito(uid)),
        ]);
        if (!vivo) return;
        if (m === 'cliente' || m === 'comerciante') {
          setModo(m);
          modoRef.current = m;
        }
        if (k && !carroRef.current) {
          try {
            const g = JSON.parse(k) as CarritoGuardado;
            const lineas = (Array.isArray(g.lineas) ? g.lineas : [])
              .filter((l) => l && typeof l.productoId === 'string' && typeof l.cantidad === 'number' && l.cantidad > 0)
              .slice(0, 30);
            if (g.uid === uid && typeof g.negocioId === 'string' && lineas.length > 0) {
              fijarCarro({ uid, negocioId: g.negocioId, lineas }, false);
            }
          } catch {
            /* carrito dañado: se empieza vacío */
          }
        }
        if (c && baseRef.current.negocios.length === 0) {
          const guardado = JSON.parse(c) as Cache;
          dispatch({ t: 'cache', c: guardado });
        }
      } catch {
        /* sin copia local: se espera a la nube */
      }
      if (!vivo) return;
      setLocalListo(true);
      await refrescar();
      if (vivo) abrirCanal(uid);
    })();
    return () => {
      vivo = false;
      cerrarCanal();
    };
  }, [uid, abrirCanal, cerrarCanal, fijarCarro, refrescar]);

  // Copia local de lo último visto (para abrir la app sin internet).
  useEffect(() => {
    if (!uid || !base.perfil) return;
    const t = setTimeout(() => {
      let c: Cache = {
        perfil: base.perfil,
        negocios: base.negocios,
        productos: base.productos,
        favs: base.favs,
        conversaciones: base.conversaciones,
        pedidos: base.pedidos,
        frecuentes: base.frecuentes,
      };
      let texto = JSON.stringify(c);
      if (texto.length > LIMITE_CACHE) {
        c = { ...c, negocios: c.negocios.map((n) => ({ ...n, logoUri: undefined })) };
        texto = JSON.stringify(c);
      }
      if (texto.length > LIMITE_CACHE) {
        c = { ...c, pedidos: [...c.pedidos].sort((a, b) => b.creado - a.creado).slice(0, PEDIDOS_EN_COPIA) };
        texto = JSON.stringify(c);
      }
      if (texto.length <= LIMITE_CACHE) AsyncStorage.setItem(claveCache(uid), texto).catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [uid, base.perfil, base.negocios, base.productos, base.favs, base.conversaciones, base.pedidos, base.frecuentes]);

  useEffect(() => {
    estadoRedRef.current = estadoRed;
  }, [estadoRed]);

  // Plan B del tiempo real: preguntar cada tanto (seguido si el aviso en vivo no funciona o no hay internet).
  useEffect(() => {
    if (!uid) return;
    let vueltas = 0;
    const t = setInterval(() => {
      vueltas += 1;
      // Con el aviso en vivo funcionando basta con confirmar de vez en cuando; si no, se pregunta seguido.
      if (!canalVivo.current || estadoRedRef.current === 'sin-internet' || vueltas % Math.round(SONDEO_EN_VIVO / SONDEO_SIN_VIVO) === 0) refrescar();
    }, SONDEO_SIN_VIVO);
    const sub = AppState.addEventListener('change', (e) => {
      if (e === 'active') refrescar();
    });
    // En el navegador el sistema avisa al instante cuando se va o regresa el internet.
    const enWeb = Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.addEventListener === 'function';
    const alVolver = () => {
      refrescar();
    };
    const alIrse = () => setEstadoRed('sin-internet');
    if (enWeb) {
      window.addEventListener('online', alVolver);
      window.addEventListener('offline', alIrse);
    }
    return () => {
      clearInterval(t);
      sub.remove();
      if (enWeb) {
        window.removeEventListener('online', alVolver);
        window.removeEventListener('offline', alIrse);
      }
    };
  }, [uid, refrescar]);

  /* ───── datos derivados ───── */

  const negocio = useMemo(() => (uid ? (base.negocios.find((n) => n.duenoId === uid) ?? null) : null), [uid, base.negocios]);

  const cuenta = useMemo<Cuenta | null>(() => {
    if (!sesion || !uid) return null;
    const meta = (sesion.user.user_metadata ?? {}) as { nombre?: string; telefono?: string };
    const p = base.perfil;
    // Modo: el último que se usó en este teléfono; si no hay, comerciante cuando la cuenta tiene negocio.
    const preferido: Rol = modo ?? (negocio ? 'comerciante' : 'cliente');
    return {
      id: uid,
      nombre: p?.nombre ?? meta.nombre ?? (sesion.user.email ?? 'Cliente').split('@')[0],
      correo: p?.correo ?? sesion.user.email ?? '',
      telefono: p?.telefono ?? meta.telefono ?? '',
      rol: preferido === 'comerciante' && negocio ? 'comerciante' : 'cliente',
      fotoUri: p?.foto_uri ?? undefined,
      negocioId: negocio?.id,
    };
  }, [sesion, uid, base.perfil, modo, negocio]);

  const favoritos = useMemo(() => base.favs.filter((f) => f.usuarioId === uid).map((f) => f.negocioId), [base.favs, uid]);
  const numFrecuentes = useMemo(
    () => (negocio ? base.frecuentes.filter((f) => f.negocioId === negocio.id).length : 0),
    [base.frecuentes, negocio],
  );

  const pedidosPendientes = useMemo(() => {
    if (!uid || !cuenta) return 0;
    if (cuenta.rol === 'comerciante' && negocio) return base.pedidos.filter((p) => p.negocioId === negocio.id && p.estado === 'pendiente').length;
    return base.pedidos.filter((p) => p.clienteId === uid && esActivo(p)).length;
  }, [base.pedidos, cuenta, negocio, uid]);

  const carrito = useMemo<CarritoVista | null>(() => {
    if (!uid || !carro || carro.uid !== uid) return null;
    const neg = base.negocios.find((n) => n.id === carro.negocioId);
    if (!neg) return null;
    const lineas = carro.lineas.flatMap((l) => {
      const producto = base.productos.find((p) => p.id === l.productoId);
      return producto ? [{ producto, cantidad: l.cantidad }] : [];
    });
    if (lineas.length === 0) return null;
    const conPrecio = lineas.flatMap((l) => (l.producto.precio != null ? [{ precio: l.producto.precio, cantidad: l.cantidad }] : []));
    return { negocio: neg, lineas, cuantos: lineas.length, subtotal: totales(conPrecio, 0).subtotal };
  }, [uid, carro, base.negocios, base.productos]);

  const chatsSinLeer = useMemo(() => {
    if (!uid || !cuenta) return 0;
    if (cuenta.rol === 'comerciante' && negocio) {
      return base.conversaciones.filter((c) => c.negocioId === negocio.id && c.ultimoTexto && sinLeer(c, uid, false)).length;
    }
    return base.conversaciones.filter((c) => c.clienteId === uid && c.ultimoTexto && sinLeer(c, uid, true)).length;
  }, [base.conversaciones, cuenta, negocio, uid]);

  const datos = useMemo<Datos>(
    () => ({
      negocios: base.negocios,
      productos: base.productos,
      conversaciones: base.conversaciones,
      pedidos: base.pedidos,
      frecuentes: base.frecuentes,
    }),
    [base.negocios, base.productos, base.conversaciones, base.pedidos, base.frecuentes],
  );

  /* ───── cuenta ───── */

  const negociosLibres = useCallback<Ctx['negociosLibres']>(async () => {
    const { data, error } = await supabase.rpc('negocios_libres');
    if (error) return null;
    return (data ?? []) as NegocioLibre[];
  }, []);

  const comprobarReclamo = useCallback<Ctx['comprobarReclamo']>(async (negocioId, codigo) => {
    const { data, error } = await supabase.rpc('comprobar_reclamo', { p_negocio: negocioId, p_codigo: codigo });
    if (error) return textoError(error);
    return (data as string | null) ?? null;
  }, []);

  /** Revisa el negocio que se quiere reclamar o crear. Devuelve el mensaje de error o null si todo está bien. */
  const validarAlta = useCallback(
    async (alta: AltaNegocio | undefined): Promise<string | null> => {
      if (!alta) return 'Elige tu negocio o regístralo.';
      if ('reclamarId' in alta) return comprobarReclamo(alta.reclamarId, alta.codigo);
      if (!alta.nuevo.nombre.trim()) return 'Escribe el nombre de tu negocio.';
      const { data, error } = await supabase.rpc('nombre_disponible', { p_nombre: alta.nuevo.nombre });
      if (error) return textoError(error);
      return (data as string | null) ?? null;
    },
    [comprobarReclamo],
  );

  /** Con la sesión ya iniciada: deja a la cuenta como dueña del negocio. */
  const aplicarAlta = useCallback(async (alta: AltaNegocio): Promise<string | null> => {
    const r =
      'reclamarId' in alta
        ? await supabase.rpc('reclamar_negocio', { p_negocio: alta.reclamarId, p_codigo: alta.codigo })
        : await supabase.rpc('crear_negocio', {
            p_nombre: alta.nuevo.nombre.trim(),
            p_giro: alta.nuevo.giro,
            p_direccion: alta.nuevo.direccion?.trim() || null,
            p_lat: alta.nuevo.lat ?? null,
            p_lng: alta.nuevo.lng ?? null,
            p_maps_url: alta.nuevo.mapsUrl ?? null,
          });
    if (r.error) return textoError(r.error);
    return (r.data as string | null) ?? null;
  }, []);

  const registrar = useCallback<Ctx['registrar']>(
    async (r) => {
      if (!NUBE_CONFIGURADA) return 'Falta conectar la base de datos (src/config.ts).';
      const correo = r.correo.trim().toLowerCase();
      const telefono = soloDigitos(r.telefono);
      const alta = r.rol === 'comerciante' ? r.negocio : undefined;

      // Primero se revisa el negocio, para no dejar cuentas a medias.
      if (r.rol === 'comerciante') {
        const err = await validarAlta(alta);
        if (err) return err;
      }

      bloquear();
      try {
        let creada = false;
        let sesionNueva: Session | null = null;
        const alta1 = await supabase.auth.signUp({
          email: correo,
          password: r.password,
          options: { data: { nombre: r.nombre.trim(), telefono } },
        });
        if (alta1.error) {
          const cod = (alta1.error as { code?: string }).code ?? '';
          const existe = cod === 'user_already_exists' || cod === 'email_exists' || /already registered/i.test(alta1.error.message);
          if (!existe) return textoError(alta1.error);
        } else if (alta1.data.session) {
          sesionNueva = alta1.data.session;
          creada = true;
        }

        if (!sesionNueva) {
          // Ya tiene cuenta con ese correo: con su contraseña de siempre usa la misma cuenta
          // (por ejemplo, se registró como cliente y ahora también quiere vender).
          const entrada = await supabase.auth.signInWithPassword({ email: correo, password: r.password });
          if (entrada.error) {
            const cod = (entrada.error as { code?: string }).code ?? '';
            if (cod === 'email_not_confirmed') {
              return 'Te enviamos un correo para confirmar tu cuenta. Ábrelo y luego inicia sesión.';
            }
            if (cod === 'invalid_credentials') {
              return 'Ese correo ya tiene una cuenta. Si es tuya, escribe tu contraseña de siempre y agregamos todo a la misma cuenta; si no, usa otro correo.';
            }
            return textoError(entrada.error);
          }
          sesionNueva = entrada.data.session;
        }
        if (!sesionNueva) return 'No pudimos iniciar tu sesión. Inténtalo de nuevo.';
        const id = sesionNueva.user.id;
        uidRef.current = id;
        ultimaSesion.current = sesionNueva;

        if (alta) {
          const err = await aplicarAlta(alta);
          if (err) {
            // Una cuenta que se acaba de crear y no pudo abrir su negocio se retira; una que ya existía se deja como estaba.
            if (creada) await supabase.rpc('eliminar_mi_cuenta');
            await supabase.auth.signOut({ scope: 'local' });
            uidRef.current = null;
            ultimaSesion.current = null;
            return err;
          }
          fijarModo('comerciante', id);
        } else {
          fijarModo('cliente', id);
        }
        await refrescar();
        return null;
      } catch (e) {
        return textoError(e);
      } finally {
        desbloquear();
      }
    },
    [aplicarAlta, bloquear, desbloquear, fijarModo, refrescar, validarAlta],
  );

  const entrar = useCallback<Ctx['entrar']>(
    async (correoIn, password) => {
      if (!NUBE_CONFIGURADA) return 'Falta conectar la base de datos (src/config.ts).';
      const correo = correoIn.trim().toLowerCase();
      bloquear();
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email: correo, password });
        if (error) return textoError(error);
        const id = data.user.id;
        uidRef.current = id;
        ultimaSesion.current = data.session;
        try {
          const m = await AsyncStorage.getItem(claveModo(id));
          if (m === 'cliente' || m === 'comerciante') {
            setModo(m);
            modoRef.current = m;
          } else setModo(null);
        } catch {
          setModo(null);
        }
        await refrescar();
        return null;
      } catch (e) {
        return textoError(e);
      } finally {
        desbloquear();
      }
    },
    [bloquear, desbloquear, refrescar],
  );

  const salir = useCallback<Ctx['salir']>(async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      /* aunque falle la red, la sesión del teléfono se cierra */
    }
    uidRef.current = null;
  }, []);

  const cambiarModo = useCallback<Ctx['cambiarModo']>(
    (rol) => {
      if (!uidRef.current) return 'No hay una sesión activa.';
      if (rol === 'comerciante' && !baseRef.current.negocios.some((n) => n.duenoId === uidRef.current)) return 'Primero abre tu negocio.';
      fijarModo(rol);
      return null;
    },
    [fijarModo],
  );

  const abrirNegocio = useCallback<Ctx['abrirNegocio']>(
    async (alta) => {
      if (!uidRef.current) return 'No hay una sesión activa.';
      if (baseRef.current.negocios.some((n) => n.duenoId === uidRef.current)) return 'Tu cuenta ya administra un negocio.';
      const err = await validarAlta(alta);
      if (err) return err;
      const e2 = await aplicarAlta(alta);
      if (e2) return e2;
      fijarModo('comerciante');
      await refrescar();
      return null;
    },
    [aplicarAlta, fijarModo, refrescar, validarAlta],
  );

  const soltarNegocio = useCallback<Ctx['soltarNegocio']>(async () => {
    if (!uidRef.current) return 'No hay una sesión activa.';
    const { data, error } = await supabase.rpc('soltar_negocio');
    if (error) return textoError(error);
    if (data) return data as string;
    fijarModo('cliente');
    await refrescar();
    return null;
  }, [fijarModo, refrescar]);

  const recuperarPassword = useCallback<Ctx['recuperarPassword']>(async (correoIn) => {
    const correo = correoIn.trim().toLowerCase();
    if (!correoValido(correo)) return 'Escribe un correo válido.';
    const destino = Linking.createURL('restablecer');
    const { error } = await supabase.auth.resetPasswordForEmail(correo, { redirectTo: destino });
    return error ? textoError(error) : null;
  }, []);

  const restablecerPassword = useCallback<Ctx['restablecerPassword']>(async (nueva) => {
    if (nueva.length < 8) return 'La contraseña nueva debe tener al menos 8 caracteres.';
    const { error } = await supabase.auth.updateUser({ password: nueva });
    return error ? textoError(error) : null;
  }, []);

  const actualizarCuenta = useCallback<Ctx['actualizarCuenta']>(
    async (patch) => {
      const id = uidRef.current;
      if (!id) return 'No hay una sesión activa.';
      const cambio: Record<string, unknown> = {};
      if (patch.nombre !== undefined) {
        if (!patch.nombre.trim()) return 'Escribe tu nombre.';
        cambio.nombre = patch.nombre.trim();
      }
      if (patch.telefono !== undefined) {
        if (!telefonoValido(patch.telefono)) return 'El teléfono debe tener 10 dígitos.';
        cambio.telefono = soloDigitos(patch.telefono);
      }
      if ('fotoUri' in patch) cambio.foto_uri = patch.fotoUri || null;
      const { data, error } = await supabase.from('perfiles').update(cambio).eq('id', id).select('id,nombre,correo,telefono,foto_uri').single();
      if (error) return textoError(error);
      dispatch({ t: 'perfil', p: data as FilaPerfil });
      return null;
    },
    [],
  );

  const cambiarPassword = useCallback<Ctx['cambiarPassword']>(async (actual, nueva) => {
    const correo = baseRef.current.perfil?.correo;
    if (!uidRef.current || !correo) return 'No hay una sesión activa.';
    if (nueva.length < 8) return 'La contraseña nueva debe tener al menos 8 caracteres.';
    const prueba = await supabase.auth.signInWithPassword({ email: correo, password: actual });
    if (prueba.error) {
      return (prueba.error as { code?: string }).code === 'invalid_credentials' ? 'La contraseña actual no es correcta.' : textoError(prueba.error);
    }
    const { error } = await supabase.auth.updateUser({ password: nueva });
    return error ? textoError(error) : null;
  }, []);

  /* ───── negocio ───── */

  const miNegocio = () => baseRef.current.negocios.find((n) => n.duenoId === uidRef.current);

  const actualizarNegocio = useCallback<Ctx['actualizarNegocio']>(async (patch) => {
    const mio = miNegocio();
    if (!mio) return 'Tu cuenta no administra ningún negocio.';
    if (patch.nombre !== undefined && !patch.nombre.trim()) return 'Escribe el nombre del negocio.';
    const fila = filaDeCambioNegocio(patch);
    if (Object.keys(fila).length === 0) return null;
    const { data, error } = await supabase.from('negocios').update(fila).eq('id', mio.id).select('*').single();
    if (error) return textoError(error);
    dispatch({ t: 'neg', n: negocioDeFila(data as FilaNegocio) });
    return null;
  }, []);

  const toggleFavorito = useCallback<Ctx['toggleFavorito']>(
    (negocioId) => {
      const id = uidRef.current;
      if (!id) return;
      if (baseRef.current.negocios.find((n) => n.id === negocioId)?.duenoId === id) return;
      const actual = baseRef.current.favs.find((f) => f.usuarioId === id && f.negocioId === negocioId);
      (async () => {
        if (actual) {
          dispatch({ t: 'favDel', id: actual.id });
          const { error } = await supabase.from('favoritos').delete().eq('id', actual.id);
          if (error) {
            dispatch({ t: 'fav', f: actual });
            avisar(textoError(error));
          }
          return;
        }
        const tmp: Favorito = { id: `tmp-${negocioId}`, usuarioId: id, negocioId };
        dispatch({ t: 'fav', f: tmp });
        const { data, error } = await supabase
          .from('favoritos')
          .insert({ usuario_id: id, negocio_id: negocioId })
          .select('id,usuario_id,negocio_id')
          .single();
        dispatch({ t: 'favDel', id: tmp.id });
        if (error) {
          if ((error as { code?: string }).code === '23505') refrescar();
          else avisar(textoError(error));
          return;
        }
        dispatch({ t: 'fav', f: favoritoDeFila(data as FilaFavorito) });
      })();
    },
    [avisar, refrescar],
  );

  /* ───── productos ───── */

  const agregarProducto = useCallback<Ctx['agregarProducto']>(async (d) => {
    const mio = miNegocio();
    if (!mio) return 'Tu cuenta no administra ningún negocio.';
    const nombre = d.nombre.trim();
    if (!nombre) return 'Escribe el nombre del producto.';
    if (d.cantidad != null && !(d.cantidad >= 0 && d.cantidad <= 99999999)) return 'Las existencias deben ser un número de 0 en adelante.';
    if (baseRef.current.productos.some((x) => x.negocioId === mio.id && x.nombre.trim().toLowerCase() === nombre.toLowerCase())) {
      return 'Ya tienes un producto con ese nombre.';
    }
    const { data, error } = await supabase
      .from('productos')
      .insert({
        negocio_id: mio.id,
        nombre,
        precio: d.precio ?? null,
        unidad: d.unidad,
        disponible: d.disponible,
        categoria: d.categoria,
        por_encargo: !!d.porEncargo,
        cantidad: d.cantidad ?? null,
      })
      .select('*')
      .single();
    if (error) return (error as { code?: string }).code === '23505' ? 'Ya tienes un producto con ese nombre.' : textoError(error);
    dispatch({ t: 'prod', p: productoDeFila(data as FilaProducto) });
    return null;
  }, []);

  const editarProducto = useCallback<Ctx['editarProducto']>(async (id, d) => {
    const mio = miNegocio();
    const prod = baseRef.current.productos.find((x) => x.id === id);
    if (!mio || !prod || prod.negocioId !== mio.id) return 'No encontramos ese producto.';
    const fila: Record<string, unknown> = {};
    if (d.nombre !== undefined) {
      const nombre = d.nombre.trim();
      if (!nombre) return 'Escribe el nombre del producto.';
      if (baseRef.current.productos.some((x) => x.id !== id && x.negocioId === mio.id && x.nombre.trim().toLowerCase() === nombre.toLowerCase())) {
        return 'Ya tienes un producto con ese nombre.';
      }
      fila.nombre = nombre;
    }
    if ('precio' in d) fila.precio = d.precio ?? null;
    if (d.unidad !== undefined) fila.unidad = d.unidad;
    if (d.disponible !== undefined) fila.disponible = d.disponible;
    if (d.categoria !== undefined) fila.categoria = d.categoria;
    if (d.porEncargo !== undefined) fila.por_encargo = d.porEncargo;
    if ('cantidad' in d) {
      if (d.cantidad != null && !(d.cantidad >= 0 && d.cantidad <= 99999999)) return 'Las existencias deben ser un número de 0 en adelante.';
      fila.cantidad = d.cantidad ?? null;
    }
    if (Object.keys(fila).length === 0) return null;
    const { data, error } = await supabase.from('productos').update(fila).eq('id', id).select('*');
    if (error) return (error as { code?: string }).code === '23505' ? 'Ya tienes un producto con ese nombre.' : textoError(error);
    if (!data || data.length === 0) return 'No encontramos ese producto.';
    dispatch({ t: 'prod', p: productoDeFila(data[0] as FilaProducto) });
    return null;
  }, []);

  const eliminarProducto = useCallback<Ctx['eliminarProducto']>(async (id) => {
    const mio = miNegocio();
    const prod = baseRef.current.productos.find((x) => x.id === id);
    if (!mio || !prod || prod.negocioId !== mio.id) return 'No encontramos ese producto.';
    const { error } = await supabase.from('productos').delete().eq('id', id);
    if (error) return textoError(error);
    dispatch({ t: 'prodDel', id });
    return null;
  }, []);

  const setDisponible = useCallback<Ctx['setDisponible']>(
    (id, v) => {
      const mio = miNegocio();
      const prod = baseRef.current.productos.find((x) => x.id === id);
      if (!mio || !prod || prod.negocioId !== mio.id || prod.disponible === v) return;
      dispatch({ t: 'prod', p: { ...prod, disponible: v, actualizado: Date.now() } });
      (async () => {
        const { data, error } = await supabase.from('productos').update({ disponible: v }).eq('id', id).select('*');
        if (error || !data || data.length === 0) {
          dispatch({ t: 'prod', p: prod });
          avisar(error ? textoError(error) : 'No se pudo cambiar el producto.');
          return;
        }
        dispatch({ t: 'prod', p: productoDeFila(data[0] as FilaProducto) });
      })();
    },
    [avisar],
  );

  /* ───── chat ───── */

  const cargarMensajes = useCallback(async (conv: string) => {
    const r = await supabase.from('mensajes').select('*').eq('conversacion_id', conv).order('creado', { ascending: true });
    if (r.error) {
      if (esErrorDeRed(r.error)) setEstadoRed('sin-internet');
      return;
    }
    dispatch({ t: 'msgs', conv, ms: ((r.data ?? []) as FilaMensaje[]).map(mensajeDeFila) });
  }, []);

  const observarChat = useCallback<Ctx['observarChat']>(
    (conv) => {
      abiertos.current.set(conv, (abiertos.current.get(conv) ?? 0) + 1);
      cargarMensajes(conv);
      return () => {
        const n = (abiertos.current.get(conv) ?? 1) - 1;
        if (n <= 0) abiertos.current.delete(conv);
        else abiertos.current.set(conv, n);
      };
    },
    [cargarMensajes],
  );

  const mensajesDe = useCallback<Ctx['mensajesDe']>((conv) => base.mensajes[conv] ?? [], [base.mensajes]);

  /** Escribe un mensaje: aparece al instante como «enviando» y el servidor lo confirma. */
  const publicarMensaje = useCallback(
    async (conv: string, texto: string): Promise<string | null> => {
      const id = uidRef.current;
      if (!id) return 'No hay una sesión activa.';
      const limpio = texto.trim();
      if (!limpio) return null;
      if (limpio.length > 2000) return 'El mensaje es muy largo (máximo 2000 letras).';
      const tmp: Mensaje = { id: `tmp-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, conversacionId: conv, autorId: id, texto: limpio, creado: Date.now(), tipo: 'texto', pendiente: true };
      if (!baseRef.current.mensajes[conv]) dispatch({ t: 'msgs', conv, ms: [] });
      dispatch({ t: 'msg', m: tmp });
      const { data, error } = await supabase
        .from('mensajes')
        .insert({ conversacion_id: conv, autor_id: id, texto: limpio })
        .select('*')
        .single();
      if (error) {
        dispatch({ t: 'msgDel', conv, id: tmp.id });
        return textoError(error);
      }
      dispatch({ t: 'msg', m: mensajeDeFila(data as FilaMensaje) });
      return null;
    },
    [],
  );

  const enviarComoCliente = useCallback<Ctx['enviarComoCliente']>(
    async (negocioId, texto) => {
      const id = uidRef.current;
      if (!id) return 'No hay una sesión activa.';
      if (!texto.trim()) return null;
      let conv = baseRef.current.conversaciones.find((c) => c.negocioId === negocioId && c.clienteId === id)?.id;
      if (!conv) {
        const { data, error } = await supabase.rpc('abrir_conversacion', { p_negocio: negocioId });
        if (error) return textoError(error);
        conv = data as string;
        const fila = await supabase.from('conversaciones').select('*').eq('id', conv).single();
        if (!fila.error) dispatch({ t: 'conv', c: conversacionDeFila(fila.data as FilaConversacion) });
      }
      return publicarMensaje(conv, texto);
    },
    [publicarMensaje],
  );

  const enviarComoNegocio = useCallback<Ctx['enviarComoNegocio']>((conv, texto) => publicarMensaje(conv, texto), [publicarMensaje]);

  const marcarLeida = useCallback<Ctx['marcarLeida']>((conv) => {
    const id = uidRef.current;
    const c = baseRef.current.conversaciones.find((x) => x.id === conv);
    if (!id || !c) return;
    const soyCliente = c.clienteId === id;
    const hasta = c.ultimoEn ?? Date.now();
    dispatch({ t: 'conv', c: soyCliente ? { ...c, leidoCliente: Math.max(c.leidoCliente, hasta) } : { ...c, leidoNegocio: Math.max(c.leidoNegocio, hasta) } });
    supabase.rpc('marcar_leida', { p_conv: conv }).then(() => {});
  }, []);

  /* ───── carrito ───── */

  const agregarAlCarrito = useCallback<Ctx['agregarAlCarrito']>(
    (productoId, cantidad, vaciarAntes) => {
      const id = uidRef.current;
      if (!id) return 'Inicia sesión para usar el carrito.';
      const prod = baseRef.current.productos.find((p) => p.id === productoId);
      const neg = prod ? baseRef.current.negocios.find((n) => n.id === prod.negocioId) : undefined;
      if (!prod || !neg) return 'No encontramos ese producto.';
      if (neg.duenoId === id) return 'No puedes hacer pedidos en tu propio negocio.';
      if (!neg.duenoId) return 'Este negocio todavía no usa Mercaboot, así que no recibe pedidos por aquí. Puedes llamarle o ir a verlo.';
      if (!neg.abierto) return `«${neg.nombre}» está cerrado por ahora.`;
      if (!neg.aceptaPedidos) return `«${neg.nombre}» no está recibiendo pedidos por ahora. Escríbele por el chat.`;
      if (prod.precio == null) return `«${prod.nombre}» no tiene precio puesto. Pregúntalo por el chat.`;
      const tope = disponibleParaPedir(prod);
      if (tope <= 0) return `«${prod.nombre}» ya no está disponible.`;
      const actual = carroRef.current && carroRef.current.uid === id ? carroRef.current : null;
      if (actual && actual.lineas.length > 0 && actual.negocioId !== prod.negocioId && !vaciarAntes) return OTRO_NEGOCIO;
      const lineas = actual && actual.negocioId === prod.negocioId ? actual.lineas : [];
      const ya = lineas.find((l) => l.productoId === productoId)?.cantidad ?? 0;
      if (!ya && lineas.length >= 30) return 'Un pedido puede llevar hasta 30 productos distintos.';
      // La primera vez se agrega 1; después sube de a poco (medio kilo, un litro…).
      const nueva = redondear(Math.min(tope, ya + (cantidad ?? (ya ? pasoCantidad(prod.unidad) : 1))));
      if (nueva <= ya) return `De «${prod.nombre}» solo quedan ${cantidadTexto(tope)} ${prod.unidad}.`;
      fijarCarro({
        uid: id,
        negocioId: prod.negocioId,
        lineas: ya ? lineas.map((l) => (l.productoId === productoId ? { ...l, cantidad: nueva } : l)) : [...lineas, { productoId, cantidad: nueva }],
      });
      return null;
    },
    [fijarCarro],
  );

  const ponerCantidad = useCallback<Ctx['ponerCantidad']>(
    (productoId, cantidad) => {
      const id = uidRef.current;
      const actual = carroRef.current;
      if (!id || !actual || actual.uid !== id) return null;
      const quitar = () => {
        const resto = actual.lineas.filter((l) => l.productoId !== productoId);
        fijarCarro(resto.length > 0 ? { ...actual, lineas: resto } : null);
      };
      const q = redondear(cantidad);
      if (!(q > 0)) {
        quitar();
        return null;
      }
      const prod = baseRef.current.productos.find((p) => p.id === productoId);
      const tope = prod ? disponibleParaPedir(prod) : q;
      if (tope <= 0) {
        quitar();
        return prod ? `«${prod.nombre}» ya no está disponible y lo quitamos de tu carrito.` : null;
      }
      const final = Math.min(q, tope);
      fijarCarro({ ...actual, lineas: actual.lineas.map((l) => (l.productoId === productoId ? { ...l, cantidad: final } : l)) });
      return final < q && prod ? `De «${prod.nombre}» solo quedan ${cantidadTexto(tope)} ${prod.unidad}.` : null;
    },
    [fijarCarro],
  );

  const quitarDelCarrito = useCallback<Ctx['quitarDelCarrito']>((productoId) => void ponerCantidad(productoId, 0), [ponerCantidad]);
  const vaciarCarrito = useCallback<Ctx['vaciarCarrito']>(() => fijarCarro(null), [fijarCarro]);

  /* ───── pedidos ───── */

  const crearPedido = useCallback<Ctx['crearPedido']>(
    async (d) => {
      const id = uidRef.current;
      const c = carroRef.current;
      if (!id) return { error: 'No hay una sesión activa.' };
      if (!c || c.uid !== id || c.lineas.length === 0) return { error: 'Tu carrito está vacío.' };
      const direccion = d.entrega === 'domicilio' ? (d.direccion ?? '').trim() : '';
      if (d.entrega === 'domicilio' && !direccion) return { error: 'Escribe la dirección de entrega.' };
      const { data, error } = await supabase.rpc('crear_pedido', {
        p_negocio: c.negocioId,
        p_items: c.lineas.map((l) => ({ producto_id: l.productoId, cantidad: redondear(l.cantidad) })),
        p_entrega: d.entrega,
        p_direccion: direccion || null,
        p_pago: d.pago,
        p_nota: (d.nota ?? '').trim() || null,
      });
      if (error) {
        refrescar(); // por si cambiaron las existencias
        return { error: textoError(error) };
      }
      const pedido = pedidoDeFila(data as FilaPedido);
      propias.current.set(pedido.id, Date.now());
      dispatch({ t: 'ped', p: pedido });
      if (carroRef.current?.uid === id) fijarCarro(null);
      refrescar(); // trae el chat y las existencias ya apartadas
      return { pedido };
    },
    [fijarCarro, refrescar],
  );

  const accionPedido = useCallback<Ctx['accionPedido']>(
    async (pedidoId, accion, texto) => {
      if (!uidRef.current) return 'No hay una sesión activa.';
      propias.current.set(pedidoId, Date.now());
      const { data, error } = await supabase.rpc('pedido_accion', { p_pedido: pedidoId, p_accion: accion, p_texto: (texto ?? '').trim() || null });
      propias.current.set(pedidoId, Date.now());
      if (error) {
        refrescar(); // quizá el pedido ya cambió (venció, lo cancelaron…)
        return textoError(error);
      }
      dispatch({ t: 'ped', p: pedidoDeFila(data as FilaPedido) });
      refrescar(); // trae el aviso del chat y las existencias
      return null;
    },
    [refrescar],
  );

  const lineasDe = useCallback<Ctx['lineasDe']>(async (pedidoId) => {
    const guardadas = lineasGuardadas.current.get(pedidoId);
    if (guardadas) return guardadas;
    const { data, error } = await supabase.from('detalle_pedido').select('*').eq('pedido_id', pedidoId).order('nombre', { ascending: true });
    if (error) {
      if (esErrorDeRed(error)) setEstadoRed('sin-internet');
      return null;
    }
    const lineas = ((data ?? []) as FilaDetalle[]).map(lineaDeFila);
    if (lineas.length > 0) lineasGuardadas.current.set(pedidoId, lineas);
    return lineas;
  }, []);

  const datosPagoDe = useCallback<Ctx['datosPagoDe']>(async (pedidoId) => {
    const { data, error } = await supabase.rpc('datos_pago_pedido', { p_pedido: pedidoId });
    if (error) return null;
    return (data as string | null) ?? null;
  }, []);

  const leerDatosPago = useCallback<Ctx['leerDatosPago']>(async () => {
    const mio = miNegocio();
    if (!mio) return null;
    const { data, error } = await supabase.from('negocios_privado').select('datos_pago').eq('negocio_id', mio.id).maybeSingle();
    if (error) return null;
    return (data as { datos_pago: string | null } | null)?.datos_pago ?? '';
  }, []);

  const guardarDatosPago = useCallback<Ctx['guardarDatosPago']>(async (texto) => {
    const mio = miNegocio();
    if (!mio) return 'Tu cuenta no administra ningún negocio.';
    const limpio = texto.trim();
    if (limpio.length > 500) return 'Los datos de pago son muy largos (máximo 500 letras).';
    // Primero se intenta cambiar la fila que ya existe; si todavía no hay, se crea. (Un «upsert» no sirve aquí:
    // intentaría reescribir también la columna negocio_id y esa no se puede cambiar, a propósito.)
    const valor = limpio || null;
    for (let intento = 0; intento < 2; intento++) {
      const { data, error } = await supabase.from('negocios_privado').update({ datos_pago: valor }).eq('negocio_id', mio.id).select('negocio_id');
      if (error) return textoError(error);
      if (data && data.length > 0) return null;
      const { error: e2 } = await supabase.from('negocios_privado').insert({ negocio_id: mio.id, datos_pago: valor });
      if (!e2) return null;
      if (e2.code !== '23505') return textoError(e2); // 23505: otro teléfono la creó justo ahora → se vuelve a intentar el cambio
    }
    return 'No se pudieron guardar los datos de pago. Inténtalo otra vez.';
  }, []);

  /* ───── clientes frecuentes ───── */

  const marcarFrecuente = useCallback<Ctx['marcarFrecuente']>(
    async (clienteId, descuentoPct, beneficio) => {
      const mio = miNegocio();
      if (!mio) return 'Tu cuenta no administra ningún negocio.';
      const { error } = await supabase.rpc('marcar_frecuente', {
        p_cliente: clienteId,
        p_descuento: Math.round(descuentoPct),
        p_beneficio: (beneficio ?? '').trim() || null,
      });
      if (error) return textoError(error);
      const fila = await supabase.from('clientes_frecuentes').select('*').eq('negocio_id', mio.id).eq('cliente_id', clienteId).maybeSingle();
      if (!fila.error && fila.data) dispatch({ t: 'frec', f: frecuenteDeFila(fila.data as FilaFrecuente) });
      refrescar(); // el aviso llega al chat del cliente
      return null;
    },
    [refrescar],
  );

  const quitarFrecuente = useCallback<Ctx['quitarFrecuente']>(async (clienteId) => {
    const mio = miNegocio();
    if (!mio) return 'Tu cuenta no administra ningún negocio.';
    const { error } = await supabase.rpc('quitar_frecuente', { p_cliente: clienteId });
    if (error) return textoError(error);
    const fila = baseRef.current.frecuentes.find((f) => f.negocioId === mio.id && f.clienteId === clienteId);
    if (fila) dispatch({ t: 'frecDel', id: fila.id });
    return null;
  }, []);

  /* ───── contexto ───── */

  const ready = sesionLeida && (!uid || localListo);

  const value = useMemo<Ctx>(
    () => ({
      ready,
      nubeOk: NUBE_CONFIGURADA,
      s: datos,
      cuenta,
      negocio,
      favoritos,
      numFrecuentes,
      pedidosPendientes,
      estadoRed,
      aviso,
      chatsSinLeer,
      refrescar,
      negociosLibres,
      registrar,
      entrar,
      salir,
      cambiarModo,
      comprobarReclamo,
      abrirNegocio,
      soltarNegocio,
      recuperarPassword,
      restablecerPassword,
      actualizarCuenta,
      cambiarPassword,
      actualizarNegocio,
      toggleFavorito,
      agregarProducto,
      editarProducto,
      eliminarProducto,
      setDisponible,
      mensajesDe,
      observarChat,
      enviarComoCliente,
      enviarComoNegocio,
      marcarLeida,
      carrito,
      agregarAlCarrito,
      ponerCantidad,
      quitarDelCarrito,
      vaciarCarrito,
      crearPedido,
      accionPedido,
      lineasDe,
      datosPagoDe,
      leerDatosPago,
      guardarDatosPago,
      marcarFrecuente,
      quitarFrecuente,
    }),
    [
      ready, datos, cuenta, negocio, favoritos, numFrecuentes, pedidosPendientes, estadoRed, aviso, chatsSinLeer, refrescar, negociosLibres, registrar,
      entrar, salir, cambiarModo, comprobarReclamo, abrirNegocio, soltarNegocio, recuperarPassword, restablecerPassword, actualizarCuenta,
      cambiarPassword, actualizarNegocio, toggleFavorito, agregarProducto, editarProducto, eliminarProducto, setDisponible, mensajesDe,
      observarChat, enviarComoCliente, enviarComoNegocio, marcarLeida, carrito, agregarAlCarrito, ponerCantidad, quitarDelCarrito, vaciarCarrito,
      crearPedido, accionPedido, lineasDe, datosPagoDe, leerDatosPago, guardarDatosPago, marcarFrecuente, quitarFrecuente,
    ],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
