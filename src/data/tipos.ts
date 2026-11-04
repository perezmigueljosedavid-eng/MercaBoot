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
  /** Cuántos minutos guarda el negocio un pedido apartado antes de soltarlo (15 a 1440). */
  apartadoMin: number;
  /** ¿Recibe pedidos por la app? (si no, solo mensajes). */
  aceptaPedidos: boolean;
  /** ¿Acepta pago por transferencia? (los datos para pagar son privados y solo llegan con un pedido aceptado). */
  aceptaTransferencia: boolean;
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
  /** Existencias (opcional): si el comerciante no las lleva, vale `undefined` y no hay límite. */
  cantidad?: number;
  /** Cuánto está apartado ahora en pedidos activos (lo calcula la base de datos). */
  apartado: number;
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

/**
 * 'texto' = mensaje normal; 'pedido' = tarjeta de un pedido nuevo; 'aviso' = aviso del sistema
 * (un pedido cambió de estado, o el negocio te nombró cliente frecuente).
 */
export type TipoMensaje = 'texto' | 'pedido' | 'aviso';

export interface Mensaje {
  id: string;
  conversacionId: string;
  autorId: string;
  texto: string;
  creado: number;
  tipo: TipoMensaje;
  /** Pedido al que se refiere la tarjeta o el aviso. */
  pedidoId?: string;
  /** Se está enviando (aún sin confirmar por el servidor). */
  pendiente?: boolean;
}

/* ───────── pedidos (carrito y apartado) ───────── */

export type EstadoPedido = 'pendiente' | 'aceptado' | 'listo' | 'completado' | 'cancelado' | 'vencido' | 'no_se_presento';
export type EntregaPedido = 'recoger' | 'domicilio';
export type PagoPedido = 'en_persona' | 'transferencia';
export type EstadoPago = 'por_pagar' | 'reportado' | 'confirmado';

/** Un pedido apartado por un cliente en un negocio. */
export interface Pedido {
  id: string;
  /** Código corto para decirlo en el mostrador, por ejemplo P-3F9A2. */
  codigo: string;
  negocioId: string;
  clienteId: string;
  clienteNombre: string;
  clienteTelefono: string;
  estado: EstadoPedido;
  /** Por qué se canceló o venció (texto listo para mostrar). */
  motivo?: string;
  entrega: EntregaPedido;
  direccion?: string;
  pago: PagoPedido;
  pagoEstado: EstadoPago;
  referenciaPago?: string;
  nota?: string;
  items: number;
  subtotal: number;
  descuentoPct: number;
  descuento: number;
  total: number;
  /** Beneficio de cliente frecuente que tenía al apartar (por ejemplo, un regalo). */
  beneficio?: string;
  /** Hasta cuándo se le guarda el pedido. Sin valor = ya no vence. */
  venceEn?: number;
  creado: number;
  actualizado: number;
}

/** Una línea de un pedido (con el precio y el nombre de cuando se apartó). */
export interface LineaPedido {
  id: string;
  pedidoId: string;
  productoId?: string;
  nombre: string;
  unidad: string;
  precio: number;
  cantidad: number;
  importe: number;
}

/** Cliente frecuente de un negocio, elegido por el comerciante. */
export interface ClienteFrecuente {
  id: string;
  negocioId: string;
  clienteId: string;
  clienteNombre: string;
  descuentoPct: number;
  beneficio?: string;
}

/** Un producto en el carrito del cliente (el carrito vive en el teléfono y es de un solo negocio). */
export interface LineaCarrito {
  productoId: string;
  cantidad: number;
}
