-- ============================================================================
-- Mercaboot · versión 2 · códigos de barras
-- Autor: José David Pérez Miguel
--
-- Solo AGREGA: no cambia nada de lo que ya existe, así que las apps anteriores siguen funcionando igual.
-- Se puede correr varias veces sin problema.
--
--   1) codigos_barras             Memoria compartida de productos conocidos por su código de barras (nombre, marca y
--                                 cantidad). La llenan los comerciantes al escanear: si un código ya lo escaneó alguien,
--                                 el siguiente comerciante lo recibe al instante, sin volver a preguntar a Open Food Facts,
--                                 y los productos que Open Food Facts no conoce también se van sumando.
--   2) codigo_barras_buscar()     Lo que usa la app al escanear: devuelve lo que se sabe de un código (o nada).
--   3) codigo_barras_guardar()    Lo que usa la app para recordar un código nuevo (no cambia los que ya existen).
--
-- Cómo se cuida:
--  · Nadie puede leer ni escribir la tabla directamente: solo estas dos funciones, y solo dueños de un negocio.
--  · Solo se aceptan códigos de 8 a 14 dígitos; nombre hasta 120 letras, marca hasta 60 y cantidad hasta 30.
--  · No se aceptan direcciones de internet en el texto, y un código ya guardado no se puede sobrescribir.
--  · Hay un tope por hora para buscar (200) y para guardar (60), igual que en el resto de la app.
--  · No se guarda ningún dato del cliente; solo quién lo agregó, para poder revisar abusos, y eso no se muestra a nadie.
-- Los datos que vienen de Open Food Facts (openfoodfacts.org) son de su comunidad y se usan con su licencia ODbL.
-- ============================================================================

create table if not exists public.codigos_barras (
  codigo     text primary key,
  nombre     text not null,
  marca      text,
  cantidad   text,
  fuente     text not null default 'tienda',
  creado_por uuid references auth.users (id) on delete set null,
  creado     timestamptz not null default now(),
  constraint codigos_barras_codigo_ok   check (codigo ~ '^[0-9]{8,14}$'),
  constraint codigos_barras_nombre_ok   check (char_length(nombre) between 2 and 120),
  constraint codigos_barras_marca_ok    check (marca is null or char_length(marca) between 1 and 60),
  constraint codigos_barras_cantidad_ok check (cantidad is null or char_length(cantidad) between 1 and 30),
  constraint codigos_barras_fuente_ok   check (fuente in ('off', 'tienda'))
);
comment on table public.codigos_barras is
  'Productos conocidos por su código de barras (de Open Food Facts o capturados por comerciantes). Solo se toca con codigo_barras_buscar/guardar.';
alter table public.codigos_barras enable row level security;
revoke all on public.codigos_barras from public, anon, authenticated;

-- Texto de una sola línea, sin espacios de más ni caracteres de control (null si queda vacío).
create or replace function public._linea_limpia(p_texto text, p_max integer) returns text
language sql immutable set search_path = public as $$
  select nullif(left(btrim(regexp_replace(regexp_replace(coalesce(p_texto, ''), '[[:cntrl:]]', ' ', 'g'), '\s+', ' ', 'g')), p_max), '')
$$;

create or replace function public.codigo_barras_buscar(p_codigo text)
returns table (nombre text, marca text, cantidad text, fuente text)
language plpgsql security definer set search_path = public as $$
declare
  v_codigo text := btrim(coalesce(p_codigo, ''));
begin
  if auth.uid() is null or not exists (select 1 from public.negocios n where n.dueno_id = auth.uid()) then
    return;
  end if;
  if v_codigo !~ '^[0-9]{8,14}$' then return; end if;
  perform public._limite('codigos_buscar', 200, 3600);
  return query select c.nombre, c.marca, c.cantidad, c.fuente from public.codigos_barras c where c.codigo = v_codigo;
end $$;

-- Devuelve null si todo salió bien (o si el código ya estaba), y un texto si algo no sirve.
create or replace function public.codigo_barras_guardar(p_codigo text, p_nombre text, p_marca text default null, p_cantidad text default null, p_fuente text default 'tienda')
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_codigo text := btrim(coalesce(p_codigo, ''));
  v_nombre text := public._linea_limpia(p_nombre, 120);
  v_marca text := public._linea_limpia(p_marca, 60);
  v_cantidad text := public._linea_limpia(p_cantidad, 30);
  v_fuente text := case when p_fuente = 'off' then 'off' else 'tienda' end;
begin
  if v_uid is null or not exists (select 1 from public.negocios n where n.dueno_id = v_uid) then
    return 'Esta función es para cuentas con negocio.';
  end if;
  if v_codigo !~ '^[0-9]{8,14}$' then return 'El código de barras no es válido.'; end if;
  if v_nombre is null or char_length(v_nombre) < 2 then return 'Falta el nombre del producto.'; end if;
  if v_nombre ~* '(https?://|www\.)' or coalesce(v_marca, '') ~* '(https?://|www\.)' or coalesce(v_cantidad, '') ~* '(https?://|www\.)' then
    return 'El nombre no puede llevar direcciones de internet.';
  end if;
  perform public._limite('codigos_guardar', 60, 3600);
  insert into public.codigos_barras (codigo, nombre, marca, cantidad, fuente, creado_por)
  values (v_codigo, v_nombre, v_marca, v_cantidad, v_fuente, v_uid)
  on conflict (codigo) do nothing;
  return null;
end $$;

revoke all on function public._linea_limpia(text, integer), public.codigo_barras_buscar(text),
  public.codigo_barras_guardar(text, text, text, text, text) from public, anon;
grant execute on function public.codigo_barras_buscar(text) to authenticated;
grant execute on function public.codigo_barras_guardar(text, text, text, text, text) to authenticated;

notify pgrst, 'reload schema';
