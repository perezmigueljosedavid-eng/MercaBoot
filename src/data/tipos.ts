/** Tipos de datos de Mercaboot (primer avance: cuentas, negocios y productos). */

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
  hash: string;
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
