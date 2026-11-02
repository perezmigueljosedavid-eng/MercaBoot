import * as Crypto from 'expo-crypto';
import { crearLimitador, DONDE_PEDIR_CODIGO, HASHES_RECLAMO, normalizarCodigo, textoEspera, textoParaHuella } from '../data/reclamo';

/** Un solo límite para toda la app: si alguien prueba códigos a ciegas, se frena sin importar qué negocio pruebe. */
const limitador = crearLimitador();

/**
 * Revisa el código de reclamo de un negocio del directorio.
 * Devuelve el mensaje de error, o null si el código es correcto.
 * Un negocio sin código registrado en src/data/reclamo.ts no se puede reclamar (seguro por defecto).
 */
export async function revisarCodigoReclamo(negocioId: string, nombre: string, codigo: string): Promise<string | null> {
  const espera = limitador.espera();
  if (espera > 0) return textoEspera(espera);

  const esperado = HASHES_RECLAMO[negocioId];
  if (!esperado) return `«${nombre}» todavía no tiene código de reclamo. Pídelo ${DONDE_PEDIR_CODIGO}.`;
  if (!normalizarCodigo(codigo)) return `Escribe el código de reclamo de «${nombre}». Si eres su dueño, pídelo ${DONDE_PEDIR_CODIGO}.`;

  const huella = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, textoParaHuella(negocioId, codigo));
  if (huella === esperado) {
    limitador.acierto();
    return null;
  }

  const quedan = limitador.fallo();
  return quedan > 0
    ? `Ese código no es el de «${nombre}». Revísalo (no importan mayúsculas ni guiones). Te quedan ${quedan} ${quedan === 1 ? 'intento' : 'intentos'}.`
    : textoEspera(limitador.espera());
}
