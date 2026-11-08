import type { Bloque, Memoria } from '../ia/vista';
import { MEMORIA_INICIAL } from '../ia/vista';

/** Lo que se ha dicho en la charla con el asistente. Se conserva mientras la app está abierta para que al volver sigas donde ibas. */
export type Turno = { id: string; quien: 'yo'; texto: string } | { id: string; quien: 'ia'; bloques: Bloque[] };

export interface Historial {
  turnos: Turno[];
  memoria: Memoria;
  sugerencias: string[];
  /** Última petición que llegó desde el inicio, para no repetirla al volver a esta pantalla. */
  ultimoEnvio?: string;
}

const porCuenta = new Map<string, Historial>();

export function historialDe(cuentaId: string): Historial | undefined {
  return porCuenta.get(cuentaId);
}

export function guardarHistorial(cuentaId: string, h: Historial) {
  porCuenta.set(cuentaId, h);
}

export function borrarHistorial(cuentaId: string) {
  porCuenta.delete(cuentaId);
}

export const historialVacio = (): Historial => ({ turnos: [], memoria: { ...MEMORIA_INICIAL }, sugerencias: [] });
