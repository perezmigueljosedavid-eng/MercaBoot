import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/**
 * Deja elegir una foto de la galería, la recorta cuadrada, la reduce y la devuelve como texto (data URI).
 * Así el logo pesa unos 20 KB y se guarda junto con el resto de los datos.
 * Devuelve null si la persona cancela. Lanza un Error con mensaje legible si algo falla.
 */
export async function elegirImagen(lado = 360): Promise<string | null> {
  let res: ImagePicker.ImagePickerResult;
  try {
    res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
  } catch {
    throw new Error('No pudimos abrir tus fotos. Revisa los permisos de la app.');
  }
  if (res.canceled || !res.assets?.[0]) return null;
  try {
    const ctx = ImageManipulator.manipulate(res.assets[0].uri);
    ctx.resize({ width: lado });
    const imagen = await ctx.renderAsync();
    const salida = await imagen.saveAsync({ base64: true, compress: 0.7, format: SaveFormat.JPEG });
    if (!salida.base64) throw new Error('sin datos');
    return `data:image/jpeg;base64,${salida.base64}`;
  } catch {
    throw new Error('No pudimos preparar esa foto. Prueba con otra.');
  }
}
