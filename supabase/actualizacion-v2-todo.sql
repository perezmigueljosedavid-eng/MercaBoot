-- ============================================================================
-- Mercaboot · versión 2 · TODA la actualización de la base de datos en un solo archivo
-- Autor: José David Pérez Miguel
--
-- Archivo generado: lo arma «node scripts/armar-sql-v2.cjs» juntando las partes de supabase/actualizacion-v2-*.sql.
-- No lo edites aquí: cambia la parte que corresponda y vuelve a armarlo.
--
-- Cómo usarlo:  Supabase → tu proyecto → SQL Editor → New query → pega TODO este archivo → Run.
--               Debe terminar con «Success. No rows returned». Todo ocurre en una sola operación: si algo falla, no se aplica nada.
--
-- Es SOLO ADITIVO: agrega tablas, funciones, columnas y reglas nuevas. No borra ni renombra nada de lo que ya usan la versión final
-- registrada, «Mercaboot Voz» y «Mercaboot 2», que comparten esta base de datos. Se puede correr varias veces sin problema.
--
-- Qué trae (en este orden):
--   Parte 1 de 6: Reportar y bloquear  (viene de actualizacion-v2-reportes.sql)
--   Parte 2 de 6: Códigos de barras compartidos  (viene de actualizacion-v2-codigos.sql)
--   Parte 3 de 6: Boti: lo que la gente busca y no encuentra  (viene de actualizacion-v2-boti.sql)
--   Parte 4 de 6: Avisos al teléfono y alertas de productos  (viene de actualizacion-v2-notificaciones.sql)
--   Parte 5 de 6: Pagos: link de tarjeta y link por pedido  (viene de actualizacion-v2-pagos.sql)
--   Parte 6 de 6: Eliminar mi cuenta  (viene de actualizacion-v2-cuenta.sql)
--
-- Ya debe estar aplicado antes: esquema.sql y las actualizaciones 2.1, final, seguridad, detalle de productos,
-- receta-ia y v2-productos (en tu base de datos real ya lo están).
-- ============================================================================


-- ═════════════════════════ Parte 1 de 6 · Reportar y bloquear ═════════════════════════

-- ============================================================================
-- Mercaboot · versión 2 · reportar y bloquear
-- Autor: José David Pérez Miguel
--
-- Solo AGREGA tablas y funciones (y tres disparadores que revisan los bloqueos); no cambia nada de lo que ya existe, así que
-- las apps anteriores siguen funcionando igual. Se puede correr varias veces sin problema.
--
--   1) bloqueos                  Quién bloqueó a quién. Nadie la lee directo: solo las funciones de abajo, y cada persona
--                                solo ve a quién bloqueó ella.
--   2) reportes                  Lo que la gente reporta (mensajes, reseñas, negocios, productos, avisos o personas), con una
--                                copia del texto por si después se borra. Solo la ve quien administra la base de datos
--                                (Supabase → Table Editor). Ver docs/MODERACION.md.
--   3) bloquear_usuario() · desbloquear_usuario() · mis_bloqueos() · reportar()    Lo que usa la app.
--   4) Disparadores en mensajes, conversaciones y pedidos: quien está bloqueado no puede escribirle a quien lo bloqueó, abrirle
--      un chat ni hacerle un pedido (y quien bloqueó tampoco puede escribirle a quien bloqueó, hasta desbloquearlo).
--      Las tarjetas y avisos del sistema de un pedido que ya existe NO se bloquean: el pedido se puede terminar con normalidad.
--
-- Por qué existe: la tienda de apps (Google Play) pide que cualquier app donde la gente escribe o publica contenido tenga una
-- forma de reportarlo y de bloquear a quien abusa.
-- ============================================================================

-- Texto de una sola línea, sin espacios de más ni caracteres de control (null si queda vacío).
-- (Es la misma función de actualizacion-v2-codigos.sql: se puede correr cualquiera de los dos archivos primero.)
create or replace function public._linea_limpia(p_texto text, p_max integer) returns text
language sql immutable set search_path = public as $$
  select nullif(left(btrim(regexp_replace(regexp_replace(coalesce(p_texto, ''), '[[:cntrl:]]', ' ', 'g'), '\s+', ' ', 'g')), p_max), '')
$$;

-- 1) bloqueos -------------------------------------------------------------------------------------------------------------
create table if not exists public.bloqueos (
  bloqueador_id uuid not null references auth.users (id) on delete cascade,
  bloqueado_id  uuid not null references auth.users (id) on delete cascade,
  creado        timestamptz not null default now(),
  primary key (bloqueador_id, bloqueado_id),
  check (bloqueador_id <> bloqueado_id)
);
create index if not exists bloqueos_por_bloqueado on public.bloqueos (bloqueado_id);
comment on table public.bloqueos is 'Quién bloqueó a quién. Solo se toca con bloquear_usuario/desbloquear_usuario/mis_bloqueos.';
alter table public.bloqueos enable row level security;
revoke all on public.bloqueos from public, anon, authenticated;

-- 2) reportes -------------------------------------------------------------------------------------------------------------
create table if not exists public.reportes (
  id           uuid primary key default gen_random_uuid(),
  reportante_id uuid references auth.users (id) on delete set null,
  tipo         text not null check (tipo in ('mensaje', 'resena', 'negocio', 'producto', 'aviso', 'usuario')),
  objeto_id    text not null check (char_length(objeto_id) between 1 and 80),
  motivo       text not null check (motivo in ('ofensivo', 'spam', 'fraude', 'inapropiado', 'otro')),
  detalle      text check (detalle is null or char_length(detalle) <= 300),
  -- Copia de lo reportado tal como estaba (la toma la base de datos, no la app)
  contenido    text check (contenido is null or char_length(contenido) <= 800),
  -- De quién es lo reportado (sin llave foránea: si esa cuenta se borra, el reporte se conserva)
  autor_id     uuid,
  estado       text not null default 'nuevo' check (estado in ('nuevo', 'revisado', 'atendido', 'descartado')),
  creado       timestamptz not null default now()
);
create unique index if not exists reportes_uno_por_persona on public.reportes (reportante_id, tipo, objeto_id) where reportante_id is not null;
create index if not exists reportes_por_estado on public.reportes (estado, creado desc);
create index if not exists reportes_por_autor on public.reportes (autor_id) where autor_id is not null;
comment on table public.reportes is 'Reportes de la gente. Se revisan en Supabase (Table Editor); ver docs/MODERACION.md.';
alter table public.reportes enable row level security;
revoke all on public.reportes from public, anon, authenticated;

-- 3) funciones ------------------------------------------------------------------------------------------------------------

-- ¿Alguno de los dos bloqueó al otro?  'yo' = el primero bloqueó al segundo · 'ellos' = el segundo bloqueó al primero · 'ambos' · null = nadie.
create or replace function public._bloqueo_entre(p_a uuid, p_b uuid) returns text
language sql stable security definer set search_path = public as $$
  select case when x.ab and x.ba then 'ambos' when x.ab then 'yo' when x.ba then 'ellos' end
    from (select exists (select 1 from public.bloqueos where bloqueador_id = p_a and bloqueado_id = p_b) as ab,
                 exists (select 1 from public.bloqueos where bloqueador_id = p_b and bloqueado_id = p_a) as ba) x
   where p_a is not null and p_b is not null
$$;

-- Bloquea a una persona. Devuelve null si salió bien, o el motivo.
-- Si es el dueño de un negocio, la persona también deja de seguir ese negocio (así no le llegan sus avisos).
create or replace function public.bloquear_usuario(p_usuario uuid) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then return 'Inicia sesión para continuar.'; end if;
  if p_usuario is null or p_usuario = v_uid then return 'No puedes bloquearte a ti mismo.'; end if;
  if not exists (select 1 from public.perfiles p where p.id = p_usuario) then return 'No encontré a esa persona.'; end if;
  perform public._limite('bloquear', 30, 3600);
  if not exists (select 1 from public.bloqueos b where b.bloqueador_id = v_uid and b.bloqueado_id = p_usuario)
     and (select count(*) from public.bloqueos b where b.bloqueador_id = v_uid) >= 200 then
    return 'Ya bloqueaste a 200 personas. Desbloquea a alguna para bloquear a otra.';
  end if;
  insert into public.bloqueos (bloqueador_id, bloqueado_id) values (v_uid, p_usuario) on conflict do nothing;
  delete from public.favoritos f using public.negocios n where f.usuario_id = v_uid and f.negocio_id = n.id and n.dueno_id = p_usuario;
  return null;
end $$;

create or replace function public.desbloquear_usuario(p_usuario uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  delete from public.bloqueos where bloqueador_id = auth.uid() and bloqueado_id = p_usuario;
end $$;

-- A quién bloqueó la persona que pregunta (con el nombre del negocio si esa persona tiene uno).
create or replace function public.mis_bloqueos() returns table (usuario_id uuid, nombre text, negocio text, desde timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  return query
    select b.bloqueado_id,
           coalesce(nullif(btrim(p.nombre), ''), 'Persona sin nombre'),
           (select n.nombre from public.negocios n where n.dueno_id = b.bloqueado_id limit 1),
           b.creado
      from public.bloqueos b
      left join public.perfiles p on p.id = b.bloqueado_id
     where b.bloqueador_id = auth.uid()
     order by b.creado desc
     limit 200;
end $$;

-- Reporta algo. Devuelve null si salió bien (también si ya lo había reportado), o el motivo.
--   tipo: mensaje · resena · negocio · producto · aviso · usuario     id: el id de lo reportado (texto)
--   motivo: ofensivo · spam · fraude · inapropiado · otro
create or replace function public.reportar(p_tipo text, p_id text, p_motivo text, p_detalle text default null) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id text := btrim(coalesce(p_id, ''));
  v_uuid uuid;
  v_texto text;
  v_autor uuid;
  v_detalle text := public._linea_limpia(p_detalle, 300);
begin
  if v_uid is null then return 'Inicia sesión para continuar.'; end if;
  if p_tipo is null or p_tipo not in ('mensaje', 'resena', 'negocio', 'producto', 'aviso', 'usuario') then return 'No se puede reportar eso.'; end if;
  if p_motivo is null or p_motivo not in ('ofensivo', 'spam', 'fraude', 'inapropiado', 'otro') then return 'Elige un motivo para el reporte.'; end if;
  if v_id = '' or char_length(v_id) > 80 then return 'No encontré eso para reportarlo.'; end if;
  perform public._limite('reportes', 20, 3600);

  if p_tipo <> 'negocio' then
    begin
      v_uuid := v_id::uuid;
    exception when others then
      return 'No encontré eso para reportarlo.';
    end;
    v_id := v_uuid::text;
  end if;

  if p_tipo = 'mensaje' then
    select m.texto, m.autor_id into v_texto, v_autor
      from public.mensajes m
      join public.conversaciones c on c.id = m.conversacion_id
      join public.negocios n on n.id = c.negocio_id
     where m.id = v_uuid and m.tipo = 'texto' and (c.cliente_id = v_uid or n.dueno_id = v_uid);
    if not found then return 'No encontré ese mensaje.'; end if;
  elsif p_tipo = 'usuario' then
    -- Solo se puede reportar a alguien con quien se tiene (o se tuvo) un chat
    if not exists (select 1 from public.conversaciones c join public.negocios n on n.id = c.negocio_id
                    where (c.cliente_id = v_uid and n.dueno_id = v_uuid) or (n.dueno_id = v_uid and c.cliente_id = v_uuid)) then
      return 'No encontré a esa persona.';
    end if;
    v_autor := v_uuid;
    -- Sus últimos mensajes en ese chat, para que quien revisa tenga contexto
    select string_agg(left(x.texto, 200), ' | ' order by x.creado desc) into v_texto
      from (select m.texto, m.creado
              from public.mensajes m
              join public.conversaciones c on c.id = m.conversacion_id
              join public.negocios n on n.id = c.negocio_id
             where m.autor_id = v_uuid and m.tipo = 'texto'
               and ((c.cliente_id = v_uid and n.dueno_id = v_uuid) or (n.dueno_id = v_uid and c.cliente_id = v_uuid))
             order by m.creado desc limit 3) x;
  elsif p_tipo = 'resena' then
    select r.comentario, r.autor_id into v_texto, v_autor from public.resenas r where r.id = v_uuid;
    if not found then return 'No encontré esa reseña.'; end if;
  elsif p_tipo = 'negocio' then
    select n.nombre, n.dueno_id into v_texto, v_autor from public.negocios n where n.id = v_id;
    if not found then return 'No encontré ese negocio.'; end if;
  elsif p_tipo = 'producto' then
    select p.nombre, n.dueno_id into v_texto, v_autor from public.productos p join public.negocios n on n.id = p.negocio_id where p.id = v_uuid;
    if not found then return 'No encontré ese producto.'; end if;
  elsif p_tipo = 'aviso' then
    select a.texto, n.dueno_id into v_texto, v_autor from public.avisos a join public.negocios n on n.id = a.negocio_id where a.id = v_uuid;
    if not found then return 'No encontré ese aviso.'; end if;
  end if;

  if v_autor = v_uid then return 'No puedes reportar algo tuyo.'; end if;

  insert into public.reportes (reportante_id, tipo, objeto_id, motivo, detalle, contenido, autor_id)
  values (v_uid, p_tipo, v_id, p_motivo, v_detalle, left(coalesce(v_texto, ''), 800), v_autor)
  on conflict (reportante_id, tipo, objeto_id) where reportante_id is not null do nothing;
  return null;
end $$;

-- 4) disparadores ---------------------------------------------------------------------------------------------------------

-- Mensaje escrito por una persona (las tarjetas y avisos del sistema de un pedido no cuentan).
create or replace function public._bloqueo_en_mensajes() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_cliente uuid;
  v_dueno uuid;
  v_otro uuid;
  v_estado text;
begin
  if new.tipo is distinct from 'texto' then return new; end if;
  select c.cliente_id, n.dueno_id into v_cliente, v_dueno
    from public.conversaciones c join public.negocios n on n.id = c.negocio_id where c.id = new.conversacion_id;
  if not found then return new; end if;
  v_otro := case when new.autor_id = v_cliente then v_dueno when new.autor_id = v_dueno then v_cliente end;
  v_estado := public._bloqueo_entre(new.autor_id, v_otro);
  if v_estado in ('yo', 'ambos') then
    raise exception 'Bloqueaste a esta persona. Desbloquéala para escribirle.';
  elsif v_estado = 'ellos' then
    raise exception 'No puedes enviar mensajes en esta conversación.';
  end if;
  return new;
end $$;

-- Solo se revisa cuando es el CLIENTE quien abre el chat. Si la conversación la abre el sistema en nombre del negocio (por ejemplo,
-- un aviso de «cliente frecuente»), no se estorba: lo que importa son los mensajes de texto, que sí se revisan arriba.
create or replace function public._bloqueo_en_conversaciones() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_dueno uuid;
  v_estado text;
begin
  if auth.uid() is distinct from new.cliente_id then return new; end if;
  select n.dueno_id into v_dueno from public.negocios n where n.id = new.negocio_id;
  v_estado := public._bloqueo_entre(new.cliente_id, v_dueno);
  if v_estado in ('yo', 'ambos') then
    raise exception 'Bloqueaste a este negocio. Desbloquéalo en tu perfil para escribirle.';
  elsif v_estado = 'ellos' then
    raise exception 'No puedes escribirle a este negocio.';
  end if;
  return new;
end $$;

create or replace function public._bloqueo_en_pedidos() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_dueno uuid;
  v_estado text;
begin
  select n.dueno_id into v_dueno from public.negocios n where n.id = new.negocio_id;
  v_estado := public._bloqueo_entre(new.cliente_id, v_dueno);
  if v_estado in ('yo', 'ambos') then
    raise exception 'Bloqueaste a este negocio. Desbloquéalo en tu perfil para hacer un pedido.';
  elsif v_estado = 'ellos' then
    raise exception 'Este negocio no puede recibir tu pedido.';
  end if;
  return new;
end $$;

create or replace trigger bloqueo_en_mensajes before insert on public.mensajes
  for each row execute function public._bloqueo_en_mensajes();
create or replace trigger bloqueo_en_conversaciones before insert on public.conversaciones
  for each row execute function public._bloqueo_en_conversaciones();
create or replace trigger bloqueo_en_pedidos before insert on public.pedidos
  for each row execute function public._bloqueo_en_pedidos();

-- Primero se cierra todo (también a «authenticated»: en Supabase las funciones nuevas nacen abiertas para ese rol) y después se abre
-- solo lo que usa la app. Las funciones de ayuda y las de los disparadores quedan cerradas para la app.
revoke all on function public._linea_limpia(text, integer), public._bloqueo_entre(uuid, uuid), public.bloquear_usuario(uuid),
  public.desbloquear_usuario(uuid), public.mis_bloqueos(), public.reportar(text, text, text, text), public._bloqueo_en_mensajes(),
  public._bloqueo_en_conversaciones(), public._bloqueo_en_pedidos() from public, anon, authenticated;
grant execute on function public.bloquear_usuario(uuid), public.desbloquear_usuario(uuid), public.mis_bloqueos(),
  public.reportar(text, text, text, text) to authenticated;

-- ═════════════════════════ Parte 2 de 6 · Códigos de barras compartidos ═════════════════════════

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

-- Primero se cierra todo (también a «authenticated») y después se abre solo lo que usa la app; la función de ayuda queda cerrada.
revoke all on function public._linea_limpia(text, integer), public.codigo_barras_buscar(text),
  public.codigo_barras_guardar(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.codigo_barras_buscar(text) to authenticated;
grant execute on function public.codigo_barras_guardar(text, text, text, text, text) to authenticated;

-- ═════════════════════════ Parte 3 de 6 · Boti: lo que la gente busca y no encuentra ═════════════════════════

-- ============================================================================
-- Mercaboot · versión 2 · Boti con más funciones
-- Autor: José David Pérez Miguel
--
-- Solo AGREGA: no cambia nada de lo que ya existe, así que las apps anteriores siguen funcionando igual.
-- Se puede correr varias veces sin problema.
--
--   1) busquedas_sin_resultado         «Lo que buscan y no encuentran»: el texto de las búsquedas que no dieron ningún producto,
--                                      contado por día. NO guarda quién buscó (ni usuario, ni teléfono, ni hora exacta).
--   2) registrar_busqueda_sin_resultado()   Lo que usa la app al terminar de buscar sin éxito (con sesión iniciada).
--   3) busquedas_sin_resultado_semana()     Lo que lee el comerciante: las 10 búsquedas más repetidas de los últimos 7 días.
--
-- Cómo se cuida:
--  · Solo se acepta texto con letras (de 3 a 40 letras, hasta 4 palabras): nada de números de teléfono, correos ni direcciones.
--  · Nadie puede leer la tabla directamente; solo los dueños de un negocio ven el resumen de la semana.
--  · Cada persona puede registrar hasta 40 búsquedas por hora.
-- ============================================================================

-- Texto sin acentos ni mayúsculas (igual que lo hace la app antes de mandar lo que escribió la persona).
create or replace function public._texto_simple(p_texto text) returns text
language sql immutable set search_path = public as $$
  select btrim(regexp_replace(lower(translate(coalesce(p_texto, ''), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN')), '\s+', ' ', 'g'))
$$;

create table if not exists public.busquedas_sin_resultado (
  termino text not null check (termino ~ '^[a-z]+( [a-z]+){0,3}$' and char_length(termino) between 3 and 40),
  dia     date not null default ((now() at time zone 'America/Mexico_City')::date),
  veces   integer not null default 1 check (veces >= 1),
  primary key (termino, dia)
);
comment on table public.busquedas_sin_resultado is
  'Búsquedas que no dieron ningún producto, contadas por día. Sin datos de quién buscó. Solo se lee con busquedas_sin_resultado_semana().';
alter table public.busquedas_sin_resultado enable row level security;
revoke all on table public.busquedas_sin_resultado from anon, authenticated;

create or replace function public.registrar_busqueda_sin_resultado(p_termino text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_t text := public._texto_simple(p_termino);
begin
  if auth.uid() is null then return; end if;
  if v_t !~ '^[a-z]+( [a-z]+){0,3}$' or char_length(v_t) not between 3 and 40 then return; end if;
  perform public._limite('busqueda_sin_resultado', 40, 3600);
  insert into public.busquedas_sin_resultado as b (termino) values (v_t)
  on conflict (termino, dia) do update set veces = b.veces + 1;
  -- De paso se limpian las búsquedas de hace más de dos meses
  if random() < 0.01 then
    delete from public.busquedas_sin_resultado where dia < (now() at time zone 'America/Mexico_City')::date - 60;
  end if;
end $$;

create or replace function public.busquedas_sin_resultado_semana() returns table (termino text, veces integer)
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null or not exists (select 1 from public.negocios where dueno_id = auth.uid()) then return; end if;
  return query
    select b.termino, sum(b.veces)::integer
      from public.busquedas_sin_resultado b
     where b.dia >= (now() at time zone 'America/Mexico_City')::date - 6
     group by b.termino
     order by sum(b.veces) desc, b.termino
     limit 10;
end $$;

-- Primero se cierra todo (también a «authenticated») y después se abre solo lo que usa la app; la función de ayuda queda cerrada.
revoke all on function public._texto_simple(text), public.registrar_busqueda_sin_resultado(text),
  public.busquedas_sin_resultado_semana() from public, anon, authenticated;
grant execute on function public.registrar_busqueda_sin_resultado(text) to authenticated;
grant execute on function public.busquedas_sin_resultado_semana() to authenticated;

-- ═════════════════════════ Parte 4 de 6 · Avisos al teléfono y alertas de productos ═════════════════════════

-- ============================================================================
-- Mercaboot · versión 2 · Avisos al teléfono (notificaciones)
-- Autor: José David Pérez Miguel
--
-- Solo AGREGA: no cambia nada de lo que ya existe, así que las apps anteriores siguen funcionando igual.
-- Se puede correr varias veces sin problema.
--
--   1) dispositivos                    Los teléfonos (código de Firebase) donde cada cuenta quiere recibir avisos.
--   2) preferencias_notificacion       Qué avisos quiere cada persona (mensajes, pedidos, tiendas favoritas) y «no molestar».
--   3) notificaciones_enviadas         Lista de lo ya avisado, para que un mismo mensaje o pedido no avise dos veces.
--   4) registrar_dispositivo() / quitar_dispositivo() / guardar_preferencias_notificacion()
--                                      Lo que usa la app (con sesión iniciada).
--   5) alertas_producto                «Avísame cuando haya aguacate»: lo que cada persona espera, con sus funciones
--                                      crear_alerta_producto() y quitar_alerta_producto().
--   6) notif_preparar()                Lo que usa SOLO la función «enviar-notificacion»: revisa que quien pide avisar sí
--                                      pueda (que sea parte del chat, dueño del negocio…), que no se haya avisado ya, las
--                                      preferencias y el «no molestar», y devuelve a qué teléfonos y qué texto mandar.
--
-- Cómo se cuida:
--  · Nadie desde la app puede leer los códigos de teléfono de otras personas (la tabla no tiene permisos para la app).
--  · Para avisar de algo, la función revisa en la base de datos que lo pida quien lo hizo y que sea reciente (10 min).
--  · Cada mensaje, pedido o aviso solo se avisa una vez por cada cambio de estado.
-- ============================================================================

-- 1) Teléfonos -----------------------------------------------------------------------------------------------------------
create table if not exists public.dispositivos (
  token       text primary key check (char_length(token) between 20 and 4096),
  usuario_id  uuid not null references auth.users (id) on delete cascade,
  plataforma  text not null default 'android' check (plataforma in ('android', 'ios', 'web')),
  creado      timestamptz not null default now(),
  actualizado timestamptz not null default now()
);
create index if not exists dispositivos_por_usuario on public.dispositivos (usuario_id);
comment on table public.dispositivos is
  'Teléfonos que reciben avisos (código de Firebase Cloud Messaging). La app no puede leerla: solo las funciones de abajo y la función enviar-notificacion.';
alter table public.dispositivos enable row level security;
revoke all on table public.dispositivos from anon, authenticated;

-- 2) Preferencias ---------------------------------------------------------------------------------------------------------
create table if not exists public.preferencias_notificacion (
  usuario_id  uuid primary key references auth.users (id) on delete cascade,
  mensajes    boolean not null default true,
  pedidos     boolean not null default true,
  avisos      boolean not null default true,
  -- «No molestar»: sin avisos de mensajes ni de tiendas entre las 10 de la noche y las 7 de la mañana (hora de Oaxaca).
  silencio    boolean not null default true,
  actualizado timestamptz not null default now()
);
comment on table public.preferencias_notificacion is
  'Qué avisos al teléfono quiere cada persona. Si no tiene fila, valen los valores de omisión (todo encendido).';
alter table public.preferencias_notificacion enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'preferencias_notificacion' and policyname = 'preferencias_notif_ver') then
    create policy preferencias_notif_ver on public.preferencias_notificacion
      for select to authenticated using (usuario_id = (select auth.uid()));
  end if;
end $$;
revoke all on table public.preferencias_notificacion from anon, authenticated;
grant select on table public.preferencias_notificacion to authenticated;

-- 3) Lo ya avisado --------------------------------------------------------------------------------------------------------
create table if not exists public.notificaciones_enviadas (
  clave  text primary key check (char_length(clave) between 3 and 120),
  creado timestamptz not null default now()
);
alter table public.notificaciones_enviadas enable row level security;
revoke all on table public.notificaciones_enviadas from anon, authenticated;

-- 4) Lo que usa la app ----------------------------------------------------------------------------------------------------
-- Guarda (o mueve a esta cuenta) el código del teléfono. Cada cuenta puede tener hasta 5 teléfonos.
create or replace function public.registrar_dispositivo(p_token text, p_plataforma text default 'android')
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_tok text := btrim(coalesce(p_token, ''));
begin
  if v_uid is null then raise exception 'Inicia sesión para continuar.'; end if;
  if char_length(v_tok) < 20 or char_length(v_tok) > 4096 then raise exception 'El código de este teléfono no es válido.'; end if;
  perform public._limite('dispositivo_registro', 30, 3600);

  insert into public.dispositivos as d (token, usuario_id, plataforma, actualizado)
  values (v_tok, v_uid, case when p_plataforma in ('android', 'ios', 'web') then p_plataforma else 'android' end, clock_timestamp())
  on conflict (token) do update
    set usuario_id = excluded.usuario_id, plataforma = excluded.plataforma, actualizado = clock_timestamp();

  -- Como máximo 5 teléfonos por cuenta: se quitan los que hace más que no se usan.
  delete from public.dispositivos
   where usuario_id = v_uid
     and token in (select token from public.dispositivos where usuario_id = v_uid order by actualizado desc offset 5);
end $$;

-- Quita este teléfono de la cuenta (al cerrar sesión o al apagar los avisos).
create or replace function public.quitar_dispositivo(p_token text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  delete from public.dispositivos where token = btrim(coalesce(p_token, '')) and usuario_id = auth.uid();
end $$;

-- Guarda qué avisos quiere la persona.
create or replace function public.guardar_preferencias_notificacion(p_mensajes boolean, p_pedidos boolean, p_avisos boolean, p_silencio boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Inicia sesión para continuar.'; end if;
  perform public._limite('preferencias_notif', 60, 3600);
  insert into public.preferencias_notificacion as p (usuario_id, mensajes, pedidos, avisos, silencio)
  values (v_uid, coalesce(p_mensajes, true), coalesce(p_pedidos, true), coalesce(p_avisos, true), coalesce(p_silencio, true))
  on conflict (usuario_id) do update
    set mensajes = excluded.mensajes, pedidos = excluded.pedidos, avisos = excluded.avisos, silencio = excluded.silencio,
        actualizado = now();
end $$;

-- 4b) «Avísame cuando haya aguacate» --------------------------------------------------------------------------------------
-- Texto sin acentos ni mayúsculas (la app hace lo mismo antes de mandar lo que escribió la persona).
create or replace function public._texto_simple(p_texto text) returns text
language sql immutable set search_path = public as $$
  select btrim(regexp_replace(lower(translate(coalesce(p_texto, ''), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN')), '\s+', ' ', 'g'))
$$;

-- ¿El nombre de un producto es lo que la persona espera? Palabra completa (con su plural): «huevos» coincide con «Huevo blanco»,
-- pero «pan» no coincide con «panela».
create or replace function public._alerta_coincide(p_nombre text, p_termino text) returns boolean
language sql immutable set search_path = public as $$
  select exists (
    select 1
      from unnest(array[p_termino, p_termino || 's', p_termino || 'es', regexp_replace(p_termino, 's$', ''), regexp_replace(p_termino, 'es$', '')]) as c(x)
     where x <> '' and (' ' || btrim(regexp_replace(regexp_replace(public._texto_simple(p_nombre), '[^a-z0-9 ]', ' ', 'g'), '\s+', ' ', 'g')) || ' ') like ('% ' || x || ' %')
  )
$$;

create table if not exists public.alertas_producto (
  usuario_id uuid not null references auth.users (id) on delete cascade,
  termino    text not null check (termino ~ '^[a-z]+( [a-z]+){0,3}$' and char_length(termino) between 3 and 40),
  creado     timestamptz not null default now(),
  primary key (usuario_id, termino)
);
comment on table public.alertas_producto is
  'Lo que cada persona espera («avísame cuando haya aguacate»). Se borra sola cuando se avisa. Cada persona solo ve las suyas.';
alter table public.alertas_producto enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'alertas_producto' and policyname = 'alertas_producto_ver') then
    create policy alertas_producto_ver on public.alertas_producto
      for select to authenticated using (usuario_id = (select auth.uid()));
  end if;
end $$;
revoke all on table public.alertas_producto from anon, authenticated;
grant select on table public.alertas_producto to authenticated;

-- NULL = listo; si no, el motivo en español.
create or replace function public.crear_alerta_producto(p_termino text) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_t text := public._texto_simple(p_termino);
begin
  if v_uid is null then return 'Inicia sesión para continuar.'; end if;
  if v_t !~ '^[a-z]+( [a-z]+){0,3}$' or char_length(v_t) not between 3 and 40 then
    return 'Escribe el producto solo con letras (por ejemplo: aguacate).';
  end if;
  perform public._limite('alerta_producto', 30, 3600);
  if not exists (select 1 from public.alertas_producto where usuario_id = v_uid and termino = v_t)
     and (select count(*) from public.alertas_producto where usuario_id = v_uid) >= 10 then
    return 'Ya tienes 10 avisos de productos. Quita alguno para agregar otro.';
  end if;
  insert into public.alertas_producto (usuario_id, termino) values (v_uid, v_t) on conflict (usuario_id, termino) do nothing;
  return null;
end $$;

create or replace function public.quitar_alerta_producto(p_termino text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  delete from public.alertas_producto where usuario_id = auth.uid() and termino = public._texto_simple(p_termino);
end $$;

-- 6) Lo que usa la función «enviar-notificacion» -----------------------------------------------------------------------------
-- p_quien: la cuenta que pide avisar (la función ya comprobó su sesión). p_tipo: 'mensaje', 'pedido', 'aviso' o 'producto' (un
-- producto que acaba de haber, para quienes pidieron «avísame cuando haya…»). p_id: el id del mensaje, del pedido, del aviso o
-- del producto. p_ahora solo sirve para probar el «no molestar» a otra hora.
-- Devuelve {"ok": true, "tokens": [...], "titulo", "cuerpo", "ruta", "canal", "tipo"} o {"ok": false, "motivo": "..."}.
create or replace function public.notif_preparar(p_quien uuid, p_tipo text, p_id uuid, p_ahora timestamptz default now())
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_hora   integer := extract(hour from (p_ahora at time zone 'America/Mexico_City'))::integer;
  v_noche  boolean := (v_hora >= 22 or v_hora < 7);
  v_dest   uuid[] := '{}';
  v_titulo text;
  v_cuerpo text;
  v_ruta   text;
  v_canal  text;
  v_clave  text;
  v_pref   text;
  v_tokens text[];
  v_total  text;
  m record;
  pe record;
  a record;
  pd record;
begin
  if p_quien is null or p_id is null then return jsonb_build_object('ok', false, 'motivo', 'no_aplica'); end if;

  -- ── Un mensaje de chat: avisa a la otra parte ──
  if p_tipo = 'mensaje' then
    select ms.autor_id, ms.texto, ms.creado, ms.tipo, cv.id as conv, cv.negocio_id, cv.cliente_id, cv.cliente_nombre,
           n.nombre as negocio_nombre, n.dueno_id
      into m
      from public.mensajes ms
      join public.conversaciones cv on cv.id = ms.conversacion_id
      join public.negocios n on n.id = cv.negocio_id
     where ms.id = p_id;
    if not found or m.autor_id <> p_quien or m.tipo <> 'texto' or m.creado < now() - interval '10 minutes' then
      return jsonb_build_object('ok', false, 'motivo', 'no_autorizado');
    end if;
    v_canal := 'mensajes'; v_pref := 'mensajes'; v_clave := 'm:' || p_id;
    v_cuerpo := left(btrim(m.texto), 140);
    if p_quien = m.cliente_id then
      if m.dueno_id is null then return jsonb_build_object('ok', false, 'motivo', 'no_aplica'); end if;
      v_dest := array[m.dueno_id];
      v_titulo := left(m.cliente_nombre, 60);
      v_ruta := '/chat-cliente/' || m.conv;
    elsif p_quien = m.dueno_id then
      v_dest := array[m.cliente_id];
      v_titulo := left(m.negocio_nombre, 60);
      v_ruta := '/chat-negocio/' || m.negocio_id;
    else
      return jsonb_build_object('ok', false, 'motivo', 'no_autorizado');
    end if;

  -- ── Un pedido: avisa al negocio (pedido nuevo, pago reportado, cancelado) o al cliente (aceptado, listo…) ──
  elsif p_tipo = 'pedido' then
    select p.id, p.cliente_id, p.cliente_nombre, p.estado, p.pago_estado, p.pago, p.entrega, p.total, p.items, p.codigo,
           p.motivo, p.actualizado, p.negocio_id, n.nombre as negocio_nombre, n.dueno_id
      into pe
      from public.pedidos p join public.negocios n on n.id = p.negocio_id
     where p.id = p_id;
    if not found or pe.actualizado < now() - interval '10 minutes' then
      return jsonb_build_object('ok', false, 'motivo', 'no_autorizado');
    end if;
    v_canal := 'pedidos'; v_pref := 'pedidos'; v_ruta := '/pedido/' || pe.id;
    v_total := to_char(pe.total, 'FM999999990.00');

    if p_quien = pe.cliente_id then
      if pe.dueno_id is null then return jsonb_build_object('ok', false, 'motivo', 'no_aplica'); end if;
      v_dest := array[pe.dueno_id];
      v_titulo := left(pe.cliente_nombre, 60);
      if pe.pago_estado = 'reportado' and pe.estado in ('pendiente', 'aceptado', 'listo') then
        v_titulo := 'Pago reportado ' || pe.codigo;
        v_cuerpo := pe.cliente_nombre || ' avisó que ya pagó $' || v_total || '. Revísalo y confírmalo.';
        v_clave := 'p:' || pe.id || ':reportado';
      elsif pe.estado = 'pendiente' then
        v_titulo := 'Pedido nuevo ' || pe.codigo;
        v_cuerpo := pe.cliente_nombre || ' apartó ' || pe.items || case when pe.items = 1 then ' producto' else ' productos' end || ' por $' || v_total || '.';
        v_clave := 'p:' || pe.id || ':pendiente';
      elsif pe.estado = 'cancelado' then
        v_titulo := 'Pedido cancelado ' || pe.codigo;
        v_cuerpo := pe.cliente_nombre || ' canceló su pedido.';
        v_clave := 'p:' || pe.id || ':cancelado-cliente';
      else
        return jsonb_build_object('ok', false, 'motivo', 'no_aplica');
      end if;
    elsif p_quien = pe.dueno_id then
      v_dest := array[pe.cliente_id];
      v_titulo := left(pe.negocio_nombre, 60);
      v_clave := 'p:' || pe.id || ':negocio:' || pe.estado || ':' || pe.pago_estado;
      if pe.estado = 'aceptado' then
        v_cuerpo := 'Tu pedido ' || pe.codigo || ' fue aceptado.'
          || case when pe.pago = 'transferencia' and pe.pago_estado = 'por_pagar' then ' Falta tu transferencia.' else '' end;
      elsif pe.estado = 'listo' then
        v_cuerpo := case when pe.entrega = 'domicilio' then 'Tu pedido ' || pe.codigo || ' ya va en camino.' else 'Tu pedido ' || pe.codigo || ' está listo para recoger.' end;
      elsif pe.estado = 'completado' then
        v_cuerpo := 'Pedido ' || pe.codigo || ' entregado. ¡Gracias por tu compra!';
      elsif pe.estado = 'cancelado' then
        v_cuerpo := 'El negocio canceló tu pedido ' || pe.codigo || '.' || case when nullif(btrim(coalesce(pe.motivo, '')), '') is not null then ' ' || left(btrim(pe.motivo), 100) else '' end;
      elsif pe.estado = 'pendiente' and pe.pago_estado = 'confirmado' then
        v_cuerpo := 'Se confirmó tu pago del pedido ' || pe.codigo || '.';
      else
        return jsonb_build_object('ok', false, 'motivo', 'no_aplica');
      end if;
    else
      return jsonb_build_object('ok', false, 'motivo', 'no_autorizado');
    end if;

  -- ── Un aviso del negocio: avisa a quienes lo tienen en favoritos (menos «se acabó» y «cerrado hoy», que molestan) ──
  elsif p_tipo = 'aviso' then
    select av.tipo, av.texto, av.creado, av.negocio_id, n.nombre as negocio_nombre, n.dueno_id
      into a
      from public.avisos av join public.negocios n on n.id = av.negocio_id
     where av.id = p_id;
    if not found or a.dueno_id is distinct from p_quien or a.creado < now() - interval '10 minutes' then
      return jsonb_build_object('ok', false, 'motivo', 'no_autorizado');
    end if;
    if a.tipo in ('agotado', 'cerrado') then return jsonb_build_object('ok', false, 'motivo', 'no_aplica'); end if;
    v_canal := 'avisos'; v_pref := 'avisos'; v_clave := 'a:' || p_id;
    v_titulo := left(a.negocio_nombre, 60);
    v_cuerpo := left(btrim(a.texto), 140);
    v_ruta := '/negocio/' || a.negocio_id;
    select coalesce(array_agg(x.usuario_id), '{}') into v_dest
      from (select f.usuario_id from public.favoritos f where f.negocio_id = a.negocio_id and f.usuario_id <> p_quien limit 300) x;

  -- ── Un producto que vuelve a haber: avisa a quienes pidieron «avísame cuando haya …» ──
  elsif p_tipo = 'producto' then
    select pr.nombre, pr.precio, pr.unidad, pr.disponible, pr.cantidad, pr.actualizado, pr.negocio_id,
           n.nombre as negocio_nombre, n.dueno_id
      into pd
      from public.productos pr join public.negocios n on n.id = pr.negocio_id
     where pr.id = p_id;
    if not found or pd.dueno_id is distinct from p_quien or pd.actualizado < now() - interval '10 minutes' then
      return jsonb_build_object('ok', false, 'motivo', 'no_autorizado');
    end if;
    if not pd.disponible or (pd.cantidad is not null and pd.cantidad <= 0) then
      return jsonb_build_object('ok', false, 'motivo', 'no_aplica');
    end if;
    v_canal := 'avisos'; v_pref := 'avisos';
    v_clave := 'r:' || p_id || ':' || to_char(p_ahora at time zone 'America/Mexico_City', 'YYYYMMDDHH24');
    v_titulo := 'Ya hay ' || left(pd.nombre, 50);
    v_cuerpo := left(pd.negocio_nombre, 60) || ' lo tiene'
      || case when pd.precio is not null then ' a $' || trim_scale(pd.precio)::text || ' por ' || left(pd.unidad, 20) else '' end || '.';
    v_ruta := '/negocio/' || pd.negocio_id;
    select coalesce(array_agg(x.usuario_id), '{}') into v_dest
      from (select al.usuario_id from public.alertas_producto al
             where al.usuario_id <> p_quien and public._alerta_coincide(pd.nombre, al.termino)
             limit 300) x;

  else
    return jsonb_build_object('ok', false, 'motivo', 'no_aplica');
  end if;

  -- Quién sí quiere este tipo de aviso (y no está en «no molestar»)
  select coalesce(array_agg(t.uid), '{}') into v_dest
    from unnest(v_dest) as t(uid)
    left join public.preferencias_notificacion pr on pr.usuario_id = t.uid
   where case v_pref when 'mensajes' then coalesce(pr.mensajes, true) when 'pedidos' then coalesce(pr.pedidos, true) else coalesce(pr.avisos, true) end
     and not (v_noche and v_pref in ('mensajes', 'avisos') and coalesce(pr.silencio, true));
  if cardinality(v_dest) = 0 then return jsonb_build_object('ok', false, 'motivo', 'apagado'); end if;

  -- Un mismo hecho solo se avisa una vez
  insert into public.notificaciones_enviadas (clave) values (v_clave) on conflict (clave) do nothing;
  if not found then return jsonb_build_object('ok', false, 'motivo', 'repetido'); end if;
  if random() < 0.02 then delete from public.notificaciones_enviadas where creado < now() - interval '3 days'; end if;

  select coalesce(array_agg(t.token), '{}') into v_tokens
    from (select d.token from public.dispositivos d where d.usuario_id = any (v_dest) order by d.actualizado desc limit 300) t;
  if cardinality(v_tokens) = 0 then return jsonb_build_object('ok', false, 'motivo', 'sin_dispositivos'); end if;

  -- Lo que se esperaba ya llegó: esas alertas (de quienes sí tienen teléfono registrado) se borran
  if p_tipo = 'producto' then
    delete from public.alertas_producto al
     where al.usuario_id = any (v_dest) and public._alerta_coincide(pd.nombre, al.termino)
       and exists (select 1 from public.dispositivos d where d.usuario_id = al.usuario_id and d.token = any (v_tokens));
  end if;

  return jsonb_build_object('ok', true, 'tokens', to_jsonb(v_tokens), 'titulo', v_titulo, 'cuerpo', v_cuerpo,
                            'ruta', v_ruta, 'canal', v_canal, 'tipo', p_tipo);
end $$;

-- 6) Permisos ------------------------------------------------------------------------------------------------------------
revoke all on function public.notif_preparar(uuid, text, uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.notif_preparar(uuid, text, uuid, timestamptz) to service_role;

revoke all on function public.registrar_dispositivo(text, text), public.quitar_dispositivo(text),
  public.guardar_preferencias_notificacion(boolean, boolean, boolean, boolean) from public, anon, authenticated;
grant execute on function public.registrar_dispositivo(text, text) to authenticated;
grant execute on function public.quitar_dispositivo(text) to authenticated;
grant execute on function public.guardar_preferencias_notificacion(boolean, boolean, boolean, boolean) to authenticated;

-- (Las de ayuda, _texto_simple y _alerta_coincide, quedan cerradas para la app; solo se abren las dos que usa la persona.)
revoke all on function public._texto_simple(text), public._alerta_coincide(text, text),
  public.crear_alerta_producto(text), public.quitar_alerta_producto(text) from public, anon, authenticated;
grant execute on function public.crear_alerta_producto(text) to authenticated;
grant execute on function public.quitar_alerta_producto(text) to authenticated;

-- ═════════════════════════ Parte 5 de 6 · Pagos: link de tarjeta y link por pedido ═════════════════════════

-- ============================================================================
-- Mercaboot · versión 2 · pagar con tarjeta usando el link de pago del propio negocio
-- Autor: José David Pérez Miguel
--
-- Solo AGREGA: no cambia nada de lo que ya existe, así que las apps anteriores siguen funcionando igual.
-- Se puede correr varias veces sin problema.
--
-- Cómo funciona (camino A de la hoja de ruta): el negocio pega UN link de cobro de su propio proveedor (Mercado Pago, Clip, Stripe,
-- PayPal…). Cuando el negocio acepta un pedido que se paga «por adelantado», el cliente ve un botón «Pagar con tarjeta» que abre ese
-- link en el navegador, paga ahí y vuelve a tocar «Ya pagué»; el negocio confirma. Mercaboot NUNCA ve ni guarda tarjetas ni dinero.
-- En la base de datos el pedido sigue siendo «transferencia» (pago por adelantado que el negocio confirma), por eso no hace falta
-- tocar la tabla de pedidos ni sus reglas.
--
--   1) negocios_privado.link_pago     El link de pago del negocio (solo https). Solo lo lee y lo cambia el dueño del negocio.
--                                     Sirve con proveedores donde el cliente escribe el monto (PayPal.Me, Stripe, etc.).
--   2) negocios.acepta_tarjeta        Lo prende y apaga la base de datos sola cuando hay (o no) un link. Es lo único público: sirve
--                                     para decir «también con tarjeta». El link en sí nunca es público.
--   3) pedido_links                   Un link para UN pedido. Muchos proveedores (como Mercado Pago) crean links con un monto fijo:
--                                     el comerciante crea el link por el total exacto del pedido y lo pega en el pedido
--                                     (poner_link_pedido). Tabla cerrada: solo se toca con las funciones de abajo.
--   4) link_pago_pedido()             Lo que usa la app del cliente para recibir el link: solo el cliente de ESE pedido, solo cuando
--                                     el negocio ya lo aceptó, es de pago por adelantado y todavía no está confirmado el pago.
--                                     Si el pedido tiene su propio link se da ese; si no, el del negocio.
-- ============================================================================

alter table public.negocios_privado add column if not exists link_pago text
  check (link_pago is null or (char_length(link_pago) <= 300 and link_pago ~* '^https://[^[:space:]]+$'));

alter table public.negocios add column if not exists acepta_tarjeta boolean not null default false;

-- El dueño escribe su link como el resto de sus datos de pago (la fila ya está protegida: cada dueño solo ve y cambia la suya).
grant insert (link_pago) on public.negocios_privado to authenticated;
grant update (link_pago) on public.negocios_privado to authenticated;
-- «acepta_tarjeta» NO se concede: nadie la escribe desde la app, solo el disparador de abajo.

create or replace function public._sincronizar_tarjeta() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.negocios set acepta_tarjeta = (new.link_pago is not null)
   where id = new.negocio_id and acepta_tarjeta is distinct from (new.link_pago is not null);
  return new;
end $$;

create or replace trigger sincronizar_tarjeta after insert or update of link_pago on public.negocios_privado
  for each row execute function public._sincronizar_tarjeta();

-- Por si algún negocio ya tenía el dato antes de instalar esto (no pasa hoy, pero deja todo parejo).
update public.negocios n set acepta_tarjeta = true
  from public.negocios_privado p
 where p.negocio_id = n.id and p.link_pago is not null and not n.acepta_tarjeta;

-- Un link para UN pedido (monto exacto). Nadie lee ni escribe aquí directo: se usan las funciones de abajo.
create table if not exists public.pedido_links (
  pedido_id uuid primary key references public.pedidos (id) on delete cascade,
  link text not null check (char_length(link) <= 300 and link ~* '^https://[^[:space:]]+$'),
  creado timestamptz not null default now()
);
alter table public.pedido_links enable row level security;
revoke all on table public.pedido_links from public, anon, authenticated;

-- El comerciante pega (o, con vacío, quita) el link de pago de un pedido. Solo el dueño del negocio del pedido, mientras el pedido
-- está aceptado, es de pago por adelantado y todavía no avisaron el pago. (El aviso al cliente lo manda la app como un mensaje
-- normal del chat, así le llega también como notificación al teléfono.)
create or replace function public.poner_link_pedido(p_pedido uuid, p_link text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_o public.pedidos%rowtype;
  v_neg public.negocios%rowtype;
  v_link text := nullif(btrim(coalesce(p_link, '')), '');
begin
  if v_uid is null then raise exception 'Inicia sesión para continuar.'; end if;
  perform public._limite('poner_link_pedido', 40, 3600);
  select * into v_o from public.pedidos where id = p_pedido for update;
  if not found then raise exception 'No encontramos ese pedido.'; end if;
  select * into v_neg from public.negocios where id = v_o.negocio_id;
  if v_neg.dueno_id is distinct from v_uid then raise exception 'No encontramos ese pedido.'; end if;
  if v_o.pago <> 'transferencia' then raise exception 'Este pedido se paga en persona.'; end if;
  if v_o.estado not in ('aceptado', 'listo') then raise exception 'Primero acepta el pedido.'; end if;
  if v_o.pago_estado <> 'por_pagar' then raise exception 'Este pedido ya tiene un pago avisado o confirmado.'; end if;
  if v_link is null then
    delete from public.pedido_links where pedido_id = p_pedido;
  else
    if char_length(v_link) > 300 or v_link !~* '^https://[^[:space:]]+$' then
      raise exception 'Ese link no es válido. Debe empezar con https:// y no llevar espacios.';
    end if;
    insert into public.pedido_links (pedido_id, link) values (p_pedido, v_link)
    on conflict (pedido_id) do update set link = excluded.link, creado = now();
  end if;
  -- Se marca el pedido como «cambió» para que la app del cliente (que lo escucha en vivo) vuelva a pedir su link.
  update public.pedidos set actualizado = now() where id = p_pedido;
end $$;

-- El link que el comerciante ya puso en un pedido suyo (para mostrarle «link enviado»).
create or replace function public.mi_link_pedido(p_pedido uuid) returns text
language sql stable security definer set search_path = public as $$
  select pl.link
    from public.pedido_links pl
    join public.pedidos o on o.id = pl.pedido_id
    join public.negocios n on n.id = o.negocio_id
   where pl.pedido_id = p_pedido and n.dueno_id = auth.uid()
$$;

-- El link de pago de un pedido: solo para el cliente de ESE pedido, después de que el negocio lo aceptó.
create or replace function public.link_pago_pedido(p_pedido uuid) returns text
language sql stable security definer set search_path = public as $$
  select coalesce(pl.link, pr.link_pago)
    from public.pedidos o
    left join public.pedido_links pl on pl.pedido_id = o.id
    left join public.negocios_privado pr on pr.negocio_id = o.negocio_id
   where o.id = p_pedido and o.cliente_id = auth.uid() and o.pago = 'transferencia'
     and o.estado in ('aceptado', 'listo') and o.pago_estado <> 'confirmado'
$$;

-- Primero se cierra todo (también a «authenticated») y después se abre solo lo que usa la app; el disparador queda cerrado.
revoke all on function public._sincronizar_tarjeta(), public.link_pago_pedido(uuid), public.poner_link_pedido(uuid, text), public.mi_link_pedido(uuid)
  from public, anon, authenticated;
grant execute on function public.link_pago_pedido(uuid), public.poner_link_pedido(uuid, text), public.mi_link_pedido(uuid) to authenticated;

-- ═════════════════════════ Parte 6 de 6 · Eliminar mi cuenta ═════════════════════════

-- ============================================================================
-- Mercaboot · versión 2 · eliminar mi cuenta
-- Autor: José David Pérez Miguel
--
-- Solo AGREGA una función: no cambia nada de lo que ya existe, así que las apps anteriores siguen funcionando igual.
-- Se puede correr varias veces sin problema.
--
--   borrar_mi_cuenta(p_confirmacion)     Borra la cuenta de quien la llama y todo lo suyo. Devuelve null si se borró y un
--                                        texto en español si no se pudo (por ejemplo, si tiene pedidos en curso).
--                                        La usa el botón «Eliminar mi cuenta» de la versión 2.
--
-- La función antigua eliminar_mi_cuenta() (sin confirmación) NO se toca: el registro la usa para deshacer una cuenta que quedó
-- a medias, y las apps anteriores dependen de ella. Por eso la nueva tiene otro nombre.
--
-- Qué se borra:  el perfil, favoritos, pedidos, chats y mensajes, reseñas, bloqueos, avisos al teléfono (dispositivos y
--                preferencias) y alertas de productos. Si la persona administra un negocio, se hace lo mismo que con el botón
--                «Dejar de administrar mi negocio» (soltar_negocio): un negocio que ella creó desaparece con sus productos,
--                avisos, chats, pedidos y datos privados de pago; una tienda del directorio de Mercaboot que reclamó vuelve a
--                quedar libre con sus datos originales, para que otra persona pueda reclamarla.
-- Qué se conserva, ya sin nombre ni cuenta:  los reportes que hubo sobre algo que escribió (sin autor), el registro de
--                seguridad (solo «qué pasó y cuándo», sin cuenta ni detalles) y los códigos de barras que ayudó a juntar.
--
-- Cómo se cuida:
--  · Solo borra la cuenta de quien llama (auth.uid()). No recibe ningún identificador: nadie puede borrar la cuenta de otra persona.
--  · Hay que escribir ELIMINAR para confirmar (así no se borra por un toque equivocado).
--  · No deja borrar mientras haya pedidos en curso (pendientes, aceptados o listos), para no dejar a otra persona esperando.
--  · Todo ocurre en una sola operación: si algo falla a la mitad, no se borra nada.
--  · Hay un tope de 5 intentos por hora.
-- ============================================================================

create or replace function public.borrar_mi_cuenta(p_confirmacion text) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_en_curso integer;
  v_motivo text;
begin
  if v_uid is null then return 'Inicia sesión para eliminar tu cuenta.'; end if;
  perform public._limite('cuenta_eliminar', 5, 3600);
  if btrim(coalesce(p_confirmacion, '')) <> 'ELIMINAR' then
    return 'Escribe ELIMINAR (en mayúsculas) para confirmar.';
  end if;

  -- Pedidos que otra persona todavía está esperando (como cliente o como dueño de un negocio)
  select count(*) into v_en_curso
  from public.pedidos p
  where p.estado in ('pendiente', 'aceptado', 'listo')
    and (p.cliente_id = v_uid or exists (select 1 from public.negocios n where n.id = p.negocio_id and n.dueno_id = v_uid));
  if v_en_curso > 0 then
    return 'Tienes pedidos en curso. Termínalos o cancélalos antes de eliminar tu cuenta.';
  end if;

  -- Su negocio, con la misma regla de siempre: lo que ella creó se borra; una tienda del directorio vuelve a quedar libre
  if exists (select 1 from public.negocios n where n.dueno_id = v_uid) then
    v_motivo := public.soltar_negocio();
    if v_motivo is not null then return v_motivo; end if;
  end if;

  -- Rastros que no están atados a la cuenta con llave foránea
  delete from public.limites_uso where usuario_id = v_uid;
  delete from public.intentos_reclamo where clave = 'u:' || v_uid::text;
  update public.reportes set autor_id = null where autor_id = v_uid;

  -- La cuenta. Todo lo demás de la persona (perfil, favoritos, pedidos, mensajes, reseñas, bloqueos, dispositivos, alertas…)
  -- se borra solo porque está atado a la cuenta con «on delete cascade».
  delete from auth.users where id = v_uid;

  -- El registro de seguridad conserva «qué pasó y cuándo», pero ya sin cuenta y sin nombres (también lo que anotó el borrado).
  update public.registro_seguridad set usuario_id = null, detalle = '{}'::jsonb where usuario_id = v_uid;
  return null;
end $$;

revoke all on function public.borrar_mi_cuenta(text) from public, anon, authenticated;
grant execute on function public.borrar_mi_cuenta(text) to authenticated;

-- ═════════════════════════ Fin ═════════════════════════
-- Le avisa a la API de Supabase que hay funciones nuevas (para que la app las vea al instante).
notify pgrst, 'reload schema';
