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

notify pgrst, 'reload schema';
