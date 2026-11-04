/**
 * Conexión de la app con la base de datos en la nube (Supabase).
 *
 * Aquí solo van dos datos que Supabase te muestra en  Project Settings → API  (o «Connect»):
 *   · la dirección del proyecto (Project URL),
 *   · la llave pública (anon / publishable key).
 * La llave pública NO es un secreto: va dentro de la app por diseño, y los datos los protegen las reglas
 * de seguridad (RLS) de supabase/esquema.sql. NUNCA pegues aquí la llave «service_role» ni «secret».
 *
 * Proyecto actual del equipo: «MercaBoot» (llave «anon», pública por diseño).
 *
 * Para pruebas locales se pueden cambiar sin tocar el archivo con las variables
 * EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY.
 */
const URL_NUBE = 'https://osvcnthsulwjyisfhsny.supabase.co';
const LLAVE_PUBLICA =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zdmNudGhzdWx3anlpc2Zoc255Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3NDU0NzksImV4cCI6MjEwOTMyMTQ3OX0.kla7nI3C2z6sSd_l60EFFsTEuuVHGJFq7CzT7G1xQUk';

export const SUPABASE_URL: string = process.env.EXPO_PUBLIC_SUPABASE_URL || URL_NUBE;
export const SUPABASE_ANON_KEY: string = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || LLAVE_PUBLICA;

/** Falso mientras no se hayan puesto los datos reales: la app muestra una pantalla que explica qué falta. */
export const NUBE_CONFIGURADA = !SUPABASE_URL.includes('REEMPLAZA') && !SUPABASE_ANON_KEY.includes('REEMPLAZA');
