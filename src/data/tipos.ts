/** Tipos de datos de Mercaboot (segundo avance: cuentas, negocios, productos, ubicación y chat). */

/** Un punto del mapa. */
export interface Coord {
  lat: number;
  lng: number;
}

export type Rol = 'cliente' | 'comerciante';

export type CategoriaProducto =
  | 'carne'
  | 'ave'
  | 'pescado'
  | 'lacteo'
  | 'masa'
  | 'pan'
  | 'verdura'
  | 'fruta'
  | 'despensa'
  | 'dulce'
  | 'bebida'
  | 'preparado'
  | 'otro';

export interface Cuenta {
  id: string;
  nombre: string;
  correo: string;
  telefono: string;
  /**
   * Modo en el que está usando la app ahora. Una misma cuenta sirve para comprar y para vender:
   * todos pueden usar el modo cliente, y el modo comerciante existe cuando la cuenta tiene un negocio.
   */
  rol: Rol;
  /** Foto de perfil (data URI). */
  fotoUri?: string;
  /** Negocio que administra la cuenta (si ya abrió uno). */
  negocioId?: string;
}

export interface Negocio {
  id: string;
  nombre: string;
  giro: string;
  descripcion?: string;
  /** Calle o referencia en texto. */
  direccion?: string;
  telefono?: string;
  correo?: string;
  horario?: string;
  /** Logo (data URI). */
  logoUri?: string;
  aDomicilio: boolean;
  zonaEntrega?: string;
  abierto: boolean;
  /** Dónde está el negocio en el mapa (lo guarda el comerciante). */
  lat?: number;
  lng?: number;
  /** Enlace de Google Maps, para negocios cuyo punto exacto no se pudo leer. */
  mapsUrl?: string;
  /** Es una tienda que ya estaba en la lista de la comunidad (se reclama con código y, al soltarla, vuelve a la lista). */
  delDirectorio?: boolean;
  /** Cuenta del comerciante. Si no existe, el negocio está en el directorio pero nadie lo ha reclamado. */
  duenoId?: string;
  creado: number;
}

export interface Producto {
  id: string;
  negocioId: string;
  nombre: string;
  precio?: number;
  unidad: string;
  disponible: boolean;
  categoria: CategoriaProducto;
  /** Se prepara cuando alguien lo pide (pasteles, platillos…). */
  porEncargo?: boolean;
  actualizado: number;
}

/** Conversación entre un cliente y un negocio (una por pareja). */
export interface Conversacion {
  id: string;
  negocioId: string;
  clienteId: string;
  clienteNombre: string;
  creado: number;
  ultimoTexto?: string;
  /** Quién escribió el último mensaje (id de cuenta). */
  ultimoAutor?: string;
  ultimoEn?: number;
  /** Hasta qué momento leyó cada parte; lo que llegó después está «sin leer». */
  leidoCliente: number;
  leidoNegocio: number;
}

export interface Mensaje {
  id: string;
  conversacionId: string;
  autorId: string;
  texto: string;
  creado: number;
  /** Se está enviando (aún sin confirmar por el servidor). */
  pendiente?: boolean;
}
