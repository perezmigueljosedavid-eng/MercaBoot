import type { Negocio } from './tipos';

/**
 * Negocios reales de la comunidad que ya aparecen en Mercaboot (directorio).
 * Nadie los administra hasta que el dueño crea su cuenta de comerciante y reclama su negocio
 * con el código de reclamo que le entrega el equipo de Mercaboot.
 */
export const SEMILLA_NEGOCIOS: Negocio[] = [
  {
    id: 'carniceria-san-javier',
    nombre: 'Carnicería San Javier',
    giro: 'Carnicería',
    aDomicilio: false,
    abierto: true,
    creado: 0,
  },
  {
    id: 'tortilleria-el-maizito',
    nombre: 'Tortillería El Maizito',
    giro: 'Tortillería',
    aDomicilio: false,
    abierto: true,
    creado: 0,
  },
  {
    id: 'carniceria-keren',
    nombre: 'Carnicería Keren',
    giro: 'Carnicería',
    aDomicilio: false,
    abierto: true,
    creado: 0,
  },
];
