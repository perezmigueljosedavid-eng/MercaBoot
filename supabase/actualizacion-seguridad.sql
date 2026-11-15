-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
-- MERCABOOT · Actualización de seguridad (noviembre 2026)
--
-- Para una base que YA tiene la versión final (esquema.sql o actualizacion-final.sql).
-- Se puede correr las veces que haga falta: no borra datos ni cambia lo que ya funciona.
-- En una base nueva NO hace falta: esquema.sql ya trae todo esto (sección K).
--
-- Cómo usarla:  Supabase → SQL Editor → New query → pegar todo este archivo → Run.
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════

-- ═════════════════════════════ K. SEGURIDAD: LÍMITES DE USO, VALIDACIONES Y REGISTRO ═════════════════════════════
-- Tres protecciones que viven en la base de datos (por eso sirven aunque alguien no use la app y le hable
-- directo a la API):
--   K.1  Registro de seguridad: una bitácora de lo importante (cuentas creadas y borradas, negocios reclamados,
--        códigos de reclamo incorrectos, personas que llegaron a un límite). Solo se lee desde el panel de Supabase.
--   K.2  Límites de uso por cuenta: nadie puede mandar miles de mensajes, productos o pedidos en un rato.
--   K.3  Validaciones extra: el enlace del mapa debe ser un enlace web y las fotos deben ser imágenes.

-- ───────────── K.1 Registro de seguridad ─────────────

create table if not exists public.registro_seguridad (
  id bigint generated always as identity primary key,
  creado timestamptz not null default now(),
  -- Sin llave foránea a propósito: el renglón se conserva aunque la cuenta se borre.
  usuario_id uuid,
  evento text not null check (char_length(evento) between 1 and 60),
  detalle jsonb not null default '{}'::jsonb
);
create index if not exists registro_seguridad_por_fecha on public.registro_seguridad (creado desc);
create index if not exists registro_seguridad_por_evento on public.registro_seguridad (evento, creado desc);

-- Contadores para los límites: cuántas veces hizo algo cada cuenta dentro de la ventana de tiempo actual.
create table if not exists public.limites_uso (
  usuario_id uuid not null,
  clave text not null,
  inicio timestamptz not null default now(),
  cuenta integer not null default 0,
  tope integer not null,
  segundos integer not null,
  primary key (usuario_id, clave)
);

-- Nadie las lee ni las escribe desde la app: solo las funciones de abajo (y tú, desde el panel de Supabase).
alter table public.registro_seguridad enable row level security;
alter table public.limites_uso enable row level security;
revoke all on table public.registro_seguridad, public.limites_uso from public, anon, authenticated;

-- Anota un evento en el registro. Nunca falla: si no se puede anotar, la operación principal sigue.
create or replace function public._anotar(p_evento text, p_detalle jsonb default '{}'::jsonb, p_usuario uuid default null)
returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.registro_seguridad (usuario_id, evento, detalle)
  values (coalesce(p_usuario, auth.uid()), left(p_evento, 60), coalesce(p_detalle, '{}'::jsonb));
exception when others then
  null;
end $$;

-- ───────────── K.2 Límites de uso ─────────────

-- Cuenta una acción de la persona en sesión. Si ya hizo «p_tope» en los últimos «p_segundos», la rechaza con un
-- mensaje claro. Cuando alguien llena su cupo queda anotado en el registro de seguridad (y cada intento de más
-- queda en los registros de Postgres con la palabra «mercaboot_seguridad»).
create or replace function public._limite(p_clave text, p_tope integer, p_segundos integer) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v public.limites_uso%rowtype;
begin
  if v_uid is null then return; end if; -- tareas del sistema (sin sesión): no se limitan
  select * into v from public.limites_uso where usuario_id = v_uid and clave = p_clave for update;
  if not found then
    insert into public.limites_uso (usuario_id, clave, inicio, cuenta, tope, segundos)
    values (v_uid, p_clave, now(), 1, p_tope, p_segundos)
    on conflict (usuario_id, clave) do nothing;
    return;
  end if;
  -- La ventana anterior ya terminó: empieza una nueva.
  if v.inicio + make_interval(secs => p_segundos) <= now() then
    update public.limites_uso set inicio = now(), cuenta = 1, tope = p_tope, segundos = p_segundos
    where usuario_id = v_uid and clave = p_clave;
    return;
  end if;
  if v.cuenta >= p_tope then
    raise log 'mercaboot_seguridad limite_superado usuario=% limite=% tope=% segundos=%', v_uid, p_clave, p_tope, p_segundos;
    raise exception 'Vas muy rápido. Espera un momento y vuelve a intentarlo.';
  end if;
  update public.limites_uso set cuenta = cuenta + 1, tope = p_tope, segundos = p_segundos
  where usuario_id = v_uid and clave = p_clave;
  if v.cuenta + 1 >= p_tope then
    perform public._anotar('limite_alcanzado', jsonb_build_object('limite', p_clave, 'tope', p_tope, 'segundos', p_segundos));
  end if;
end $$;

-- Un solo disparador para todas las tablas. Solo cuenta lo que la persona hace directamente
-- (pg_trigger_depth() = 1): los cambios que la base hace sola por dentro (apartar productos, avisos de pedidos…) no cuentan.
create or replace function public.limite_escritura() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or pg_trigger_depth() <> 1 then return new; end if;

  if tg_table_name = 'mensajes' then
    -- Solo lo que escribe la persona; las tarjetas y avisos de pedidos los pone el sistema.
    if new.tipo = 'texto' and new.autor_id = v_uid then
      perform public._limite('mensajes_por_minuto', 30, 60);
      perform public._limite('mensajes_por_dia', 1500, 86400);
    end if;

  elsif tg_table_name = 'productos' then
    if tg_op = 'INSERT' then
      if (select count(*) from public.productos p where p.negocio_id = new.negocio_id) >= 500 then
        raise exception 'Un negocio puede tener hasta 500 productos. Quita alguno que ya no vendas para agregar otro.';
      end if;
      perform public._limite('productos_nuevos', 60, 600);
    else
      perform public._limite('productos_cambios', 300, 60);
    end if;

  elsif tg_table_name = 'negocios' then
    perform public._limite('negocio_cambios', 60, 60);

  elsif tg_table_name = 'perfiles' then
    perform public._limite('perfil_cambios', 30, 60);

  elsif tg_table_name = 'favoritos' then
    if (select count(*) from public.favoritos f where f.usuario_id = new.usuario_id) >= 500 then
      raise exception 'Ya tienes 500 negocios en favoritos. Quita alguno para guardar otro.';
    end if;
    perform public._limite('favoritos_nuevos', 60, 60);

  elsif tg_table_name = 'conversaciones' then
    if new.cliente_id = v_uid then perform public._limite('chats_nuevos', 30, 3600); end if;

  elsif tg_table_name = 'pedidos' then
    if new.cliente_id = v_uid then perform public._limite('pedidos_nuevos', 30, 3600); end if;

  elsif tg_table_name = 'resenas' then
    if new.autor_id = v_uid then perform public._limite('resenas_guardadas', 30, 3600); end if;

  elsif tg_table_name = 'avisos' then
    perform public._limite('avisos_nuevos', 40, 3600);
  end if;
  return new;
end $$;

drop trigger if exists mercaboot_limite on public.mensajes;
create trigger mercaboot_limite before insert on public.mensajes
  for each row execute function public.limite_escritura();
drop trigger if exists mercaboot_limite on public.productos;
create trigger mercaboot_limite before insert or update on public.productos
  for each row execute function public.limite_escritura();
drop trigger if exists mercaboot_limite on public.negocios;
create trigger mercaboot_limite before update on public.negocios
  for each row execute function public.limite_escritura();
drop trigger if exists mercaboot_limite on public.perfiles;
create trigger mercaboot_limite before update on public.perfiles
  for each row execute function public.limite_escritura();
drop trigger if exists mercaboot_limite on public.favoritos;
create trigger mercaboot_limite before insert on public.favoritos
  for each row execute function public.limite_escritura();
drop trigger if exists mercaboot_limite on public.conversaciones;
create trigger mercaboot_limite before insert on public.conversaciones
  for each row execute function public.limite_escritura();
drop trigger if exists mercaboot_limite on public.pedidos;
create trigger mercaboot_limite before insert on public.pedidos
  for each row execute function public.limite_escritura();
drop trigger if exists mercaboot_limite on public.resenas;
create trigger mercaboot_limite before insert on public.resenas
  for each row execute function public.limite_escritura();
drop trigger if exists mercaboot_limite on public.avisos;
create trigger mercaboot_limite before insert on public.avisos
  for each row execute function public.limite_escritura();

-- ───────────── K.1 (sigue) Qué se anota en el registro ─────────────

create or replace function public.registro_evento() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'perfiles' then
    if tg_op = 'INSERT' then
      perform public._anotar('cuenta_creada', '{}'::jsonb, new.id);
    elsif tg_op = 'DELETE' then
      perform public._anotar('cuenta_eliminada', '{}'::jsonb, old.id);
      delete from public.limites_uso where usuario_id = old.id; -- sus contadores se van con la cuenta
    end if;

  elsif tg_table_name = 'negocios' then
    if tg_op = 'INSERT' and new.dueno_id is not null then
      perform public._anotar('negocio_creado', jsonb_build_object('negocio', new.id, 'nombre', new.nombre), new.dueno_id);
    elsif tg_op = 'UPDATE' and old.dueno_id is null and new.dueno_id is not null then
      perform public._anotar('negocio_reclamado', jsonb_build_object('negocio', new.id, 'nombre', new.nombre), new.dueno_id);
    elsif tg_op = 'UPDATE' and old.dueno_id is not null and new.dueno_id is null then
      perform public._anotar('negocio_soltado', jsonb_build_object('negocio', old.id, 'nombre', old.nombre), old.dueno_id);
    elsif tg_op = 'DELETE' and old.dueno_id is not null then
      perform public._anotar('negocio_eliminado', jsonb_build_object('negocio', old.id, 'nombre', old.nombre), old.dueno_id);
    end if;

  elsif tg_table_name = 'intentos_reclamo' then
    -- «clave» dice a quién se le cuenta el fallo: «n:<negocio>» o «u:<cuenta>».
    if tg_op = 'INSERT' then
      perform public._anotar('codigo_reclamo_incorrecto', jsonb_build_object('clave', new.clave, 'fallos', new.fallos));
    else
      if new.fallos > old.fallos then
        perform public._anotar('codigo_reclamo_incorrecto', jsonb_build_object('clave', new.clave, 'fallos', new.fallos));
      end if;
      if new.bloqueado_hasta is not null and old.bloqueado_hasta is distinct from new.bloqueado_hasta then
        perform public._anotar('reclamo_bloqueado', jsonb_build_object('clave', new.clave, 'hasta', new.bloqueado_hasta));
      end if;
    end if;
  end if;
  return null;
exception when others then
  return null; -- el registro nunca tumba la operación principal
end $$;

drop trigger if exists mercaboot_registro on public.perfiles;
create trigger mercaboot_registro after insert or delete on public.perfiles
  for each row execute function public.registro_evento();
drop trigger if exists mercaboot_registro on public.negocios;
create trigger mercaboot_registro after insert or update of dueno_id or delete on public.negocios
  for each row execute function public.registro_evento();
drop trigger if exists mercaboot_registro on public.intentos_reclamo;
create trigger mercaboot_registro after insert or update on public.intentos_reclamo
  for each row execute function public.registro_evento();

-- ───────────── K.3 Validaciones extra ─────────────

-- El enlace del mapa se limpia antes de guardarse: solo queda la parte que es un enlace web (http o https).
-- Así nadie puede guardar otra clase de enlace para que se abra en el teléfono de los clientes.
create or replace function public.negocio_enlaces_ok() returns trigger
language plpgsql set search_path = public as $$
begin
  new.maps_url := substring(btrim(coalesce(new.maps_url, '')) from '^[Hh][Tt][Tt][Pp][Ss]?://[^[:space:]]+');
  return new;
end $$;

drop trigger if exists mercaboot_negocio_enlaces on public.negocios;
create trigger mercaboot_negocio_enlaces before insert or update of maps_url on public.negocios
  for each row execute function public.negocio_enlaces_ok();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'negocios_maps_url_web') then
    alter table public.negocios add constraint negocios_maps_url_web
      check (maps_url is null or maps_url ~* '^https?://[^[:space:]]+$');
  end if;
  -- Logo y foto de perfil: la app los guarda como imagen dentro del texto (data:image/…). No se aceptan
  -- direcciones de otros sitios (podrían usarse para rastrear a quien abre la app).
  if not exists (select 1 from pg_constraint where conname = 'negocios_logo_es_imagen') then
    alter table public.negocios add constraint negocios_logo_es_imagen
      check (logo_uri is null or logo_uri ~ '^data:image/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'perfiles_foto_es_imagen') then
    alter table public.perfiles add constraint perfiles_foto_es_imagen
      check (foto_uri is null or foto_uri ~ '^data:image/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'negocios_correo_formato') then
    alter table public.negocios add constraint negocios_correo_formato
      check (correo is null or correo ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'negocios_telefono_formato') then
    alter table public.negocios add constraint negocios_telefono_formato
      check (telefono is null or telefono ~ '^[0-9+() -]{0,30}$');
  end if;
end $$;

-- ───────────── Permisos y limpieza ─────────────

-- Estas funciones son internas: la app no puede llamarlas.
revoke all on function public._anotar(text, jsonb, uuid), public._limite(text, integer, integer),
  public.limite_escritura(), public.registro_evento(), public.negocio_enlaces_ok()
  from public, anon, authenticated;

-- Cada madrugada se borra lo viejo: contadores de hace más de 2 días y registro de hace más de 180 días.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('mercaboot-limpiar-seguridad', '23 9 * * *',
      $cron$delete from public.limites_uso where inicio < now() - interval '2 days'; delete from public.registro_seguridad where creado < now() - interval '180 days'$cron$);
  else
    raise notice 'Esta base no tiene pg_cron: el registro de seguridad no se limpia solo (no estorba; ocupa muy poco).';
  end if;
exception when others then
  raise notice 'No se pudo programar la limpieza del registro de seguridad (%).', sqlerrm;
end $$;

-- Supabase recarga su API solo; esto lo pide de nuevo por si acaso.
notify pgrst, 'reload schema';
