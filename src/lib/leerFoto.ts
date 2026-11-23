import { FunctionsHttpError } from '@supabase/supabase-js';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { interpretarRespuesta, mensajeDeFoto, type ResultadoFoto } from './fotoAProductos';
import { supabase } from './supabase';

/**
 * «Desde una foto»: toma o elige la foto de la lista de precios, la reduce y se la manda a la función «foto-a-productos» del servidor.
 * La llave de la IA nunca está en la app, y la foto no se guarda en ningún lado: solo viaja a leerse.
 * Autor: José David Pérez Miguel
 */

export type OrigenDeFoto = 'camara' | 'galeria';

/** La IA no aprovecha más de ~1568 px por lado; más grande solo pesaría de más. */
const LADO_MAXIMO = 1568;
/** Lo mismo que acepta la función (3,000,000 letras de base64). */
const MAX_BASE64 = 2_900_000;
/** La función espera hasta 60 s a la IA; la app espera un poco más. */
const ESPERA_MS = 70_000;

/** Abre la cámara o la galería y deja la foto lista para mandar. Devuelve `null` si la persona cancela; lanza un Error con mensaje legible si algo falla. */
export async function tomarFotoDeLista(origen: OrigenDeFoto): Promise<string | null> {
  if (origen === 'camara') {
    const permiso = await ImagePicker.requestCameraPermissionsAsync().catch(() => null);
    if (!permiso?.granted) {
      throw new Error(
        permiso && !permiso.canAskAgain
          ? 'La cámara está bloqueada para Mercaboot. Ábrela en los ajustes del teléfono (Aplicaciones → Mercaboot → Permisos → Cámara) o elige una foto de tu galería.'
          : 'Sin permiso de la cámara no se puede tomar la foto. Puedes elegir una foto de tu galería.',
      );
    }
  }
  let res: ImagePicker.ImagePickerResult;
  try {
    res =
      origen === 'camara'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9, allowsEditing: false })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9, allowsEditing: false, allowsMultipleSelection: false });
  } catch {
    throw new Error(origen === 'camara' ? 'No pudimos abrir la cámara. Revisa los permisos de la app.' : 'No pudimos abrir tus fotos. Revisa los permisos de la app.');
  }
  const foto = res.assets?.[0];
  if (res.canceled || !foto) return null;

  try {
    const ctx = ImageManipulator.manipulate(foto.uri);
    const mayor = Math.max(foto.width ?? 0, foto.height ?? 0);
    if (mayor > LADO_MAXIMO) ctx.resize((foto.width ?? 0) >= (foto.height ?? 0) ? { width: LADO_MAXIMO } : { height: LADO_MAXIMO });
    const imagen = await ctx.renderAsync();
    const salida = await imagen.saveAsync({ base64: true, compress: 0.75, format: SaveFormat.JPEG });
    if (!salida.base64) throw new Error('sin datos');
    if (salida.base64.length > MAX_BASE64) throw new Error('muy grande');
    return salida.base64;
  } catch {
    throw new Error('No pudimos preparar esa foto. Prueba con otra.');
  }
}

/** Manda la foto a leer. Nunca lanza un error: devuelve el motivo (ya explicado en español) si no se pudo. */
export async function leerListaDeFoto(base64: string): Promise<ResultadoFoto> {
  const { data: sesion } = await supabase.auth.getSession();
  if (!sesion.session) return { ok: false, motivo: 'sin_sesion', mensaje: mensajeDeFoto('sin_sesion') };
  try {
    const { data, error } = await supabase.functions.invoke('foto-a-productos', { body: { imagen: base64 }, timeout: ESPERA_MS });
    if (error) {
      if (error instanceof FunctionsHttpError) {
        // La función contestó con un error (límite, IA no activada…): el motivo viene en el cuerpo
        try {
          return interpretarRespuesta(await error.context.json());
        } catch {
          return interpretarRespuesta(null);
        }
      }
      return interpretarRespuesta(null);
    }
    return interpretarRespuesta(data);
  } catch {
    return interpretarRespuesta(null);
  }
}
