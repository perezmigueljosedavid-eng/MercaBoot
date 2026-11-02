import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { DONDE_PEDIR_CODIGO, negocioDelDirectorioConNombre } from './data/reclamo';
import { SEMILLA_NEGOCIOS } from './data/semilla';
import type { CategoriaProducto, Cuenta, Negocio, Producto, Rol } from './data/tipos';
import { revisarCodigoReclamo } from './lib/reclamo';

/**
 * Estado de la app guardado en el teléfono (AsyncStorage).
 * Mientras no haya un servidor en la nube, las cuentas y los datos viven solo en cada dispositivo.
 * Cada colección se guarda por separado para que ninguna crezca demasiado.
 */

export interface Guardado {
  cuentas: Cuenta[];
  sesionId: string | null;
  negocios: Negocio[];
  productos: Producto[];
  /** Negocios favoritos ("cliente frecuente") por id de cuenta. */
  favoritos: Record<string, string[]>;
}

const INICIAL: Guardado = {
  cuentas: [],
  sesionId: null,
  negocios: SEMILLA_NEGOCIOS,
  productos: [],
  favoritos: {},
};

const PREFIJO = 'mercaboot:v2:';
const CAMPOS = Object.keys(INICIAL) as (keyof Guardado)[];

let contador = 0;
export const nuevoId = () =>
  `${Date.now().toString(36)}${(contador++).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

const hashear = (id: string, pass: string) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${id}:${pass}:mercaboot`);

export const correoValido = (c: string) => /^\S+@\S+\.\S+$/.test(c.trim());
export const soloDigitos = (t: string) => t.replace(/\D/g, '');
export const telefonoValido = (t: string) => soloDigitos(t).length === 10;

/** Agrega los negocios del directorio y actualiza los que nadie ha reclamado. */
function fusionarSemilla(guardados: Negocio[]): Negocio[] {
  const res = [...guardados];
  for (const sem of SEMILLA_NEGOCIOS) {
    const i = res.findIndex((n) => n.id === sem.id);
    if (i < 0) res.push(sem);
    else if (!res[i].duenoId) res[i] = { ...sem };
  }
  return res;
}

/**
 * Que nadie se haga pasar por un negocio del directorio con un nombre igual (o casi igual).
 * `propioId` es el negocio que se está renombrando: usar su propio nombre sí está permitido.
 */
function errorNombreDeDirectorio(nombre: string, propioId?: string): string | null {
  const parecido = negocioDelDirectorioConNombre(nombre);
  if (!parecido || parecido.id === propioId) return null;
  return propioId
    ? `«${parecido.nombre}» es otro negocio de la comunidad. Escribe un nombre distinto para el tuyo.`
    : `Ya existe «${parecido.nombre}» en Mercaboot. Si es tu negocio, elige «Ya aparece en la lista» y escribe tu código de reclamo; si ya no aparece ahí, avísalo ${DONDE_PEDIR_CODIGO}. Si es otro negocio, ponle un nombre distinto.`;
}

/**
 * Revisa que se pueda reclamar o crear el negocio. Devuelve el mensaje de error o null si todo está bien.
 * Reclamar un negocio del directorio exige su código de reclamo; así un toque por equivocación (o un curioso) no se queda con la tienda.
 */
async function validarAlta(act: Guardado, alta: AltaNegocio | undefined): Promise<string | null> {
  if (!alta) return 'Elige tu negocio o regístralo.';
  if ('reclamarId' in alta) {
    const n = act.negocios.find((x) => x.id === alta.reclamarId);
    if (!n) return 'No encontramos ese negocio.';
    if (n.duenoId) return 'Ese negocio ya tiene un comerciante registrado.';
    return revisarCodigoReclamo(n.id, n.nombre, alta.codigo);
  }
  if (!alta.nuevo.nombre.trim()) return 'Escribe el nombre de tu negocio.';
  return errorNombreDeDirectorio(alta.nuevo.nombre);
}

/** Deja a la cuenta como dueña de un negocio (reclamado o nuevo) y en modo comerciante. */
function aplicarAlta(p: Guardado, cuentaId: string, telefono: string, alta: AltaNegocio, idNuevo: string): Guardado {
  // Por si dos toques llegan casi juntos: una cuenta no administra dos negocios y un negocio no tiene dos dueños.
  if (p.cuentas.find((c) => c.id === cuentaId)?.negocioId) return p;
  if ('reclamarId' in alta && p.negocios.find((n) => n.id === alta.reclamarId)?.duenoId) return p;
  let negocios = p.negocios;
  let negocioId: string;
  if ('reclamarId' in alta) {
    negocioId = alta.reclamarId;
    negocios = negocios.map((n) =>
      n.id === negocioId ? { ...n, duenoId: cuentaId, telefono: n.telefono ?? telefono, abierto: true } : n,
    );
  } else {
    negocioId = idNuevo;
    const d = alta.nuevo;
    negocios = [
      ...negocios,
      {
        id: negocioId,
        nombre: d.nombre.trim(),
        giro: d.giro,
        direccion: d.direccion?.trim() || undefined,
        telefono,
        aDomicilio: false,
        abierto: true,
        duenoId: cuentaId,
        creado: Date.now(),
      },
    ];
  }
  return {
    ...p,
    negocios,
    cuentas: p.cuentas.map((c) => (c.id === cuentaId ? { ...c, negocioId, rol: 'comerciante' as Rol } : c)),
  };
}

/** Una cuenta solo puede estar en modo comerciante si de verdad administra un negocio. */
function normalizarCuentas(cuentas: Cuenta[], negocios: Negocio[]): Cuenta[] {
  return cuentas.map((c) => {
    const tiene = !!c.negocioId && negocios.some((n) => n.id === c.negocioId && n.duenoId === c.id);
    if (tiene) return c;
    // Sin un negocio propio no hay modo comerciante, y un negocio que ya no es suyo no se queda enlazado
    if (c.rol === 'comerciante' || c.negocioId) return { ...c, rol: 'cliente' as Rol, negocioId: undefined };
    return c;
  });
}

/* ───────── contexto ───────── */

export interface DatosNegocioNuevo {
  nombre: string;
  giro: string;
  direccion?: string;
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
}

interface Ctx {
  ready: boolean;
  s: Guardado;
  cuenta: Cuenta | null;
  /** Negocio que administra la cuenta de comerciante en sesión. */
  negocio: Negocio | null;
  favoritos: string[];
  registrar: (r: Registro) => Promise<string | null>;
  entrar: (correo: string, password: string) => Promise<string | null>;
  salir: () => void;
  /** Cambia entre el modo cliente y el modo comerciante de la misma cuenta. */
  cambiarModo: (rol: Rol) => string | null;
  /** Revisa el código de reclamo de un negocio del directorio sin reclamarlo (sirve para avisar antes de confirmar). */
  comprobarReclamo: (negocioId: string, codigo: string) => Promise<string | null>;
  /** Una cuenta que ya existe abre (o reclama, con su código) su negocio y pasa a modo comerciante. */
  abrirNegocio: (alta: AltaNegocio) => Promise<string | null>;
  /** La cuenta deja de administrar su negocio y sigue como cliente. */
  soltarNegocio: () => string | null;
  recuperarPassword: (correo: string, telefono: string, nueva: string) => Promise<string | null>;
  actualizarCuenta: (p: Partial<Pick<Cuenta, 'nombre' | 'correo' | 'telefono' | 'fotoUri'>>) => string | null;
  cambiarPassword: (actual: string, nueva: string) => Promise<string | null>;
  actualizarNegocio: (p: Partial<Omit<Negocio, 'id' | 'duenoId' | 'creado'>>) => string | null;
  toggleFavorito: (negocioId: string) => void;
  agregarProducto: (p: DatosProducto) => string | null;
  editarProducto: (id: string, p: Partial<DatosProducto>) => string | null;
  eliminarProducto: (id: string) => void;
  setDisponible: (id: string, v: boolean) => void;
}

const StoreCtx = createContext<Ctx | null>(null);

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('useStore fuera de StoreProvider');
  return c;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<Guardado>(INICIAL);
  const [ready, setReady] = useState(false);
  const guardado = useRef<Partial<Guardado>>({});

  useEffect(() => {
    (async () => {
      try {
        const pares = await AsyncStorage.multiGet(CAMPOS.map((k) => PREFIJO + k));
        const leido: Record<string, unknown> = {};
        for (const [clave, valor] of pares) {
          if (!valor) continue;
          try {
            leido[clave.slice(PREFIJO.length)] = JSON.parse(valor);
          } catch {
            /* un campo dañado se ignora y arranca con los datos iniciales */
          }
        }
        const base = { ...INICIAL, ...(leido as Partial<Guardado>) };
        const negocios = fusionarSemilla(base.negocios);
        setS({ ...base, negocios, cuentas: normalizarCuentas(base.cuentas, negocios) });
      } catch {
        /* si falla la lectura se arranca con los datos iniciales */
      }
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      for (const k of CAMPOS) {
        if (guardado.current[k] !== s[k]) {
          guardado.current = { ...guardado.current, [k]: s[k] };
          AsyncStorage.setItem(PREFIJO + k, JSON.stringify(s[k])).catch(() => {});
        }
      }
    }, 250);
    return () => clearTimeout(t);
  }, [s, ready]);

  // Siempre apunta al estado más reciente; se actualiza antes que cualquier efecto de las pantallas.
  const ultimo = useRef(s);
  useLayoutEffect(() => {
    ultimo.current = s;
  }, [s]);

  const cuenta = useMemo(() => s.cuentas.find((c) => c.id === s.sesionId) ?? null, [s.cuentas, s.sesionId]);
  const negocio = useMemo(
    () => (cuenta?.negocioId ? (s.negocios.find((n) => n.id === cuenta.negocioId) ?? null) : null),
    [cuenta, s.negocios],
  );
  const favoritos = useMemo(() => (cuenta ? (s.favoritos[cuenta.id] ?? []) : []), [cuenta, s.favoritos]);

  /* ───── cuenta ───── */

  const registrar = useCallback(async (r: Registro) => {
    const correo = r.correo.trim().toLowerCase();
    const act = ultimo.current;
    const existente = act.cuentas.find((c) => c.correo === correo);

    if (r.rol === 'comerciante') {
      const err = await validarAlta(act, r.negocio);
      if (err) return err;
    }
    const alta = r.rol === 'comerciante' ? r.negocio : undefined;

    // Ya tiene cuenta con ese correo: con su contraseña de siempre usa la misma cuenta
    // (por ejemplo, se registró como cliente y ahora también quiere vender).
    if (existente) {
      if ((await hashear(existente.id, r.password)) !== existente.hash) {
        return 'Ese correo ya tiene una cuenta. Si es tuya, escribe tu contraseña de siempre y agregamos todo a la misma cuenta; si no, usa otro correo.';
      }
      if (alta) {
        if (existente.negocioId) return 'Tu cuenta ya administra un negocio. Entra con "Iniciar sesión" y cambia de modo desde tu perfil.';
        const idNuevo = nuevoId();
        setS((p) => ({ ...aplicarAlta(p, existente.id, existente.telefono, alta, idNuevo), sesionId: existente.id }));
      } else {
        setS((p) => ({
          ...p,
          sesionId: existente.id,
          cuentas: p.cuentas.map((c) => (c.id === existente.id ? { ...c, rol: 'cliente' as Rol } : c)),
        }));
      }
      return null;
    }

    const id = nuevoId();
    const hash = await hashear(id, r.password);
    const telefono = soloDigitos(r.telefono);
    const cuentaNueva: Cuenta = { id, nombre: r.nombre.trim(), correo, telefono, hash, rol: 'cliente' };
    const idNegocio = nuevoId();

    setS((p) => {
      const conCuenta: Guardado = { ...p, cuentas: [...p.cuentas, cuentaNueva], sesionId: id };
      return alta ? aplicarAlta(conCuenta, id, telefono, alta, idNegocio) : conCuenta;
    });
    return null;
  }, []);

  const entrar = useCallback(async (correoIn: string, password: string) => {
    const correo = correoIn.trim().toLowerCase();
    const c = ultimo.current.cuentas.find((x) => x.correo === correo);
    if (!c) return 'No encontramos esa cuenta. Crea una primero.';
    const hash = await hashear(c.id, password);
    if (c.hash !== hash) return 'Correo o contraseña incorrectos.';
    setS((p) => ({ ...p, sesionId: c.id }));
    return null;
  }, []);

  const salir = useCallback(() => setS((p) => ({ ...p, sesionId: null })), []);

  const cambiarModo = useCallback<Ctx['cambiarModo']>((rol) => {
    const act = ultimo.current;
    const yo = act.cuentas.find((c) => c.id === act.sesionId);
    if (!yo) return 'No hay una sesión activa.';
    if (rol === 'comerciante' && !yo.negocioId) return 'Primero abre tu negocio.';
    setS((p) => ({ ...p, cuentas: p.cuentas.map((c) => (c.id === yo.id ? { ...c, rol } : c)) }));
    return null;
  }, []);

  const comprobarReclamo = useCallback<Ctx['comprobarReclamo']>(async (negocioId, codigo) => {
    const n = ultimo.current.negocios.find((x) => x.id === negocioId);
    if (!n) return 'No encontramos ese negocio.';
    if (n.duenoId) return 'Ese negocio ya tiene un comerciante registrado.';
    return revisarCodigoReclamo(n.id, n.nombre, codigo);
  }, []);

  const abrirNegocio = useCallback<Ctx['abrirNegocio']>(async (alta) => {
    const antes = ultimo.current;
    const yo = antes.cuentas.find((c) => c.id === antes.sesionId);
    if (!yo) return 'No hay una sesión activa.';
    if (yo.negocioId) return 'Tu cuenta ya administra un negocio.';
    const err = await validarAlta(antes, alta);
    if (err) return err;
    // Revisar el código toma un instante: antes de guardar se confirma que nada cambió mientras tanto.
    const act = ultimo.current;
    if (act.sesionId !== yo.id) return 'Tu sesión cambió. Inicia sesión otra vez.';
    if (act.cuentas.find((c) => c.id === yo.id)?.negocioId) return 'Tu cuenta ya administra un negocio.';
    if ('reclamarId' in alta && act.negocios.find((n) => n.id === alta.reclamarId)?.duenoId) return 'Ese negocio ya tiene un comerciante registrado.';
    const idNuevo = nuevoId();
    setS((p) => aplicarAlta(p, yo.id, yo.telefono, alta, idNuevo));
    return null;
  }, []);

  const soltarNegocio = useCallback<Ctx['soltarNegocio']>(() => {
    const act = ultimo.current;
    const yo = act.cuentas.find((c) => c.id === act.sesionId);
    if (!yo?.negocioId) return 'Tu cuenta no administra ningún negocio.';
    const nid = yo.negocioId;
    const original = SEMILLA_NEGOCIOS.find((n) => n.id === nid);
    setS((p) => {
      // Una tienda del directorio vuelve a quedar sin dueño; un negocio que creó la persona desaparece.
      const negocios = original ? p.negocios.map((n) => (n.id === nid ? { ...original } : n)) : p.negocios.filter((n) => n.id !== nid);
      const favoritos = original
        ? p.favoritos
        : Object.fromEntries(Object.entries(p.favoritos).map(([k, v]) => [k, v.filter((x) => x !== nid)]));
      return {
        ...p,
        negocios,
        favoritos,
        productos: p.productos.filter((x) => x.negocioId !== nid),
        cuentas: p.cuentas.map((c) => (c.id === yo.id ? { ...c, negocioId: undefined, rol: 'cliente' as Rol } : c)),
      };
    });
    return null;
  }, []);

  const recuperarPassword = useCallback(async (correoIn: string, telefono: string, nueva: string) => {
    const correo = correoIn.trim().toLowerCase();
    const c = ultimo.current.cuentas.find((x) => x.correo === correo);
    if (!c || c.telefono !== soloDigitos(telefono)) return 'El correo y el teléfono no coinciden con ninguna cuenta.';
    if (nueva.length < 8) return 'La contraseña nueva debe tener al menos 8 caracteres.';
    const hash = await hashear(c.id, nueva);
    setS((p) => ({ ...p, cuentas: p.cuentas.map((x) => (x.id === c.id ? { ...x, hash } : x)) }));
    return null;
  }, []);

  const actualizarCuenta = useCallback<Ctx['actualizarCuenta']>((patch) => {
    const act = ultimo.current;
    const yo = act.cuentas.find((c) => c.id === act.sesionId);
    if (!yo) return 'No hay una sesión activa.';
    const sig: Partial<Cuenta> = { ...patch };
    if (patch.nombre !== undefined) {
      if (!patch.nombre.trim()) return 'Escribe tu nombre.';
      sig.nombre = patch.nombre.trim();
    }
    if (patch.correo !== undefined) {
      const c = patch.correo.trim().toLowerCase();
      if (!correoValido(c)) return 'Escribe un correo válido.';
      if (act.cuentas.some((x) => x.id !== yo.id && x.correo === c)) return 'Ya existe una cuenta con ese correo.';
      sig.correo = c;
    }
    if (patch.telefono !== undefined) {
      if (!telefonoValido(patch.telefono)) return 'El teléfono debe tener 10 dígitos.';
      sig.telefono = soloDigitos(patch.telefono);
    }
    setS((p) => ({ ...p, cuentas: p.cuentas.map((c) => (c.id === yo.id ? { ...c, ...sig } : c)) }));
    return null;
  }, []);

  const cambiarPassword = useCallback<Ctx['cambiarPassword']>(async (actual, nueva) => {
    const act = ultimo.current;
    const yo = act.cuentas.find((c) => c.id === act.sesionId);
    if (!yo) return 'No hay una sesión activa.';
    if ((await hashear(yo.id, actual)) !== yo.hash) return 'La contraseña actual no es correcta.';
    if (nueva.length < 8) return 'La contraseña nueva debe tener al menos 8 caracteres.';
    const hash = await hashear(yo.id, nueva);
    setS((p) => ({ ...p, cuentas: p.cuentas.map((c) => (c.id === yo.id ? { ...c, hash } : c)) }));
    return null;
  }, []);

  /* ───── negocio ───── */

  const actualizarNegocio = useCallback<Ctx['actualizarNegocio']>((patch) => {
    const act = ultimo.current;
    const yo = act.cuentas.find((c) => c.id === act.sesionId);
    if (!yo?.negocioId) return 'Tu cuenta no administra ningún negocio.';
    if (patch.nombre !== undefined) {
      if (!patch.nombre.trim()) return 'Escribe el nombre del negocio.';
      // Tampoco se vale cambiarle el nombre al negocio propio para hacerse pasar por uno del directorio
      const choque = errorNombreDeDirectorio(patch.nombre, yo.negocioId);
      if (choque) return choque;
    }
    const limpio: Partial<Negocio> = { ...patch };
    if (patch.nombre !== undefined) limpio.nombre = patch.nombre.trim();
    setS((p) => ({ ...p, negocios: p.negocios.map((n) => (n.id === yo.negocioId ? { ...n, ...limpio } : n)) }));
    return null;
  }, []);

  const toggleFavorito = useCallback((negocioId: string) => {
    setS((p) => {
      if (!p.sesionId) return p;
      if (p.negocios.find((n) => n.id === negocioId)?.duenoId === p.sesionId) return p;
      const lista = p.favoritos[p.sesionId] ?? [];
      const sig = lista.includes(negocioId) ? lista.filter((x) => x !== negocioId) : [...lista, negocioId];
      return { ...p, favoritos: { ...p.favoritos, [p.sesionId]: sig } };
    });
  }, []);

  /* ───── productos ───── */

  const miNegocioId = () => {
    const act = ultimo.current;
    return act.cuentas.find((c) => c.id === act.sesionId)?.negocioId;
  };

  const agregarProducto = useCallback<Ctx['agregarProducto']>((d) => {
    const negocioId = miNegocioId();
    if (!negocioId) return 'Tu cuenta no administra ningún negocio.';
    const nombre = d.nombre.trim();
    if (!nombre) return 'Escribe el nombre del producto.';
    const igual = (x: Producto) => x.negocioId === negocioId && x.nombre.toLowerCase() === nombre.toLowerCase();
    if (ultimo.current.productos.some(igual)) return 'Ya tienes un producto con ese nombre.';
    const nuevo: Producto = { ...d, nombre, id: nuevoId(), negocioId, actualizado: Date.now() };
    setS((p) => ({ ...p, productos: [...p.productos, nuevo] }));
    return null;
  }, []);

  const editarProducto = useCallback<Ctx['editarProducto']>((id, d) => {
    const negocioId = miNegocioId();
    const prod = ultimo.current.productos.find((x) => x.id === id);
    if (!prod || prod.negocioId !== negocioId) return 'No encontramos ese producto.';
    const patch: Partial<Producto> = { ...d, actualizado: Date.now() };
    if (d.nombre !== undefined) {
      const nombre = d.nombre.trim();
      if (!nombre) return 'Escribe el nombre del producto.';
      if (ultimo.current.productos.some((x) => x.id !== id && x.negocioId === negocioId && x.nombre.toLowerCase() === nombre.toLowerCase())) {
        return 'Ya tienes un producto con ese nombre.';
      }
      patch.nombre = nombre;
    }
    setS((p) => ({ ...p, productos: p.productos.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
    return null;
  }, []);

  const eliminarProducto = useCallback((id: string) => {
    const negocioId = miNegocioId();
    setS((p) => ({ ...p, productos: p.productos.filter((x) => !(x.id === id && x.negocioId === negocioId)) }));
  }, []);

  const setDisponible = useCallback((id: string, v: boolean) => {
    const negocioId = miNegocioId();
    setS((p) => ({
      ...p,
      productos: p.productos.map((x) => (x.id === id && x.negocioId === negocioId ? { ...x, disponible: v, actualizado: Date.now() } : x)),
    }));
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ready,
      s,
      cuenta,
      negocio,
      favoritos,
      registrar,
      entrar,
      salir,
      cambiarModo,
      comprobarReclamo,
      abrirNegocio,
      soltarNegocio,
      recuperarPassword,
      actualizarCuenta,
      cambiarPassword,
      actualizarNegocio,
      toggleFavorito,
      agregarProducto,
      editarProducto,
      eliminarProducto,
      setDisponible,
    }),
    [
      ready, s, cuenta, negocio, favoritos, registrar, entrar, salir, cambiarModo, comprobarReclamo, abrirNegocio, soltarNegocio,
      recuperarPassword, actualizarCuenta,
      cambiarPassword, actualizarNegocio, toggleFavorito, agregarProducto, editarProducto, eliminarProducto,
      setDisponible,
    ],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
