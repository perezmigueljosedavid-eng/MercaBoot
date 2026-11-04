-- =====================================================================================
-- Mercaboot · Avance 2 · Base de datos en la nube (Supabase = PostgreSQL)
--
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar TODO este archivo → Run.
-- Se puede ejecutar más de una vez sin problema (no borra datos).
--
-- Qué crea:
--   perfiles ........ datos de cada cuenta (nombre, teléfono, foto)
--   negocios ........ el directorio de tiendas (con ubicación: lat, lng)
--   productos ....... lo que vende cada negocio (disponible / agotado)
--   favoritos ....... «Cliente frecuente»
--   conversaciones / mensajes ... el chat entre cliente y comerciante
--   negocios_reclamo / intentos_reclamo ... código secreto para reclamar una tienda (nadie lo puede leer)
-- Seguridad: cada tabla tiene RLS (reglas por fila). Un comerciante solo cambia SU negocio y SUS productos;
-- un chat solo lo ven las dos personas que participan.
-- =====================================================================================

-- ───────────────────────────── 1. TABLAS ─────────────────────────────

create table if not exists public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 120),
  correo text not null,
  telefono text not null default '' check (telefono = '' or telefono ~ '^[0-9]{10}$'),
  foto_uri text check (foto_uri is null or char_length(foto_uri) <= 200000),
  creado timestamptz not null default now()
);

create table if not exists public.negocios (
  id text primary key default gen_random_uuid()::text,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 120),
  giro text not null check (char_length(btrim(giro)) between 1 and 80),
  descripcion text check (descripcion is null or char_length(descripcion) <= 1000),
  direccion text check (direccion is null or char_length(direccion) <= 300),
  telefono text check (telefono is null or char_length(telefono) <= 30),
  correo text check (correo is null or char_length(correo) <= 200),
  horario text check (horario is null or char_length(horario) <= 300),
  logo_uri text check (logo_uri is null or char_length(logo_uri) <= 200000),
  a_domicilio boolean not null default false,
  zona_entrega text check (zona_entrega is null or char_length(zona_entrega) <= 300),
  abierto boolean not null default true,
  dueno_id uuid references auth.users (id) on delete set null,
  lat double precision check (lat is null or lat between -90 and 90),
  lng double precision check (lng is null or lng between -180 and 180),
  maps_url text check (maps_url is null or char_length(maps_url) <= 500),
  -- Verdadero para las tiendas que pusimos nosotros en el directorio (se llena solo, ver negocios_reclamo).
  del_directorio boolean not null default false,
  creado timestamptz not null default now(),
  check ((lat is null) = (lng is null))
);
-- Una cuenta administra un solo negocio.
create unique index if not exists negocios_un_negocio_por_cuenta on public.negocios (dueno_id) where dueno_id is not null;

alter table public.negocios add column if not exists del_directorio boolean not null default false;

create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  negocio_id text not null references public.negocios (id) on delete cascade,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 120),
  precio numeric(10, 2) check (precio is null or precio >= 0),
  unidad text not null default 'pieza' check (char_length(unidad) <= 60),
  disponible boolean not null default true,
  categoria text not null default 'otro' check (char_length(categoria) <= 30),
  por_encargo boolean not null default false,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);
create unique index if not exists productos_nombre_unico on public.productos (negocio_id, lower(btrim(nombre)));
create index if not exists productos_por_negocio on public.productos (negocio_id);

-- «id» propio: cuando se borra un favorito, el aviso en tiempo real solo trae la llave primaria,
-- y así ese aviso no revela qué persona dejó de seguir a qué negocio.
create table if not exists public.favoritos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  negocio_id text not null references public.negocios (id) on delete cascade,
  creado timestamptz not null default now(),
  unique (usuario_id, negocio_id)
);
create index if not exists favoritos_por_negocio on public.favoritos (negocio_id);

create table if not exists public.conversaciones (
  id uuid primary key default gen_random_uuid(),
  negocio_id text not null references public.negocios (id) on delete cascade,
  cliente_id uuid not null references auth.users (id) on delete cascade,
  cliente_nombre text not null,
  creado timestamptz not null default now(),
  -- Resumen del último mensaje (lo llena un disparador) y hasta cuándo leyó cada parte.
  ultimo_texto text,
  ultimo_autor uuid,
  ultimo_en timestamptz,
  leido_cliente timestamptz not null default 'epoch',
  leido_negocio timestamptz not null default 'epoch',
  unique (negocio_id, cliente_id)
);
create index if not exists conversaciones_por_cliente on public.conversaciones (cliente_id);

create table if not exists public.mensajes (
  id uuid primary key default gen_random_uuid(),
  conversacion_id uuid not null references public.conversaciones (id) on delete cascade,
  autor_id uuid not null references auth.users (id) on delete cascade,
  texto text not null check (char_length(btrim(texto)) between 1 and 2000),
  creado timestamptz not null default now()
);
create index if not exists mensajes_por_conversacion on public.mensajes (conversacion_id, creado);

-- Código de reclamo de cada tienda del directorio: solo la «huella» (SHA-256), nunca el código.
-- Esta tabla no tiene permisos para la app: únicamente la leen las funciones de abajo.
create table if not exists public.negocios_reclamo (
  negocio_id text primary key references public.negocios (id) on delete cascade,
  huella text not null,
  -- Datos originales de la tienda, para devolverla al directorio si su dueño la suelta.
  original jsonb not null
);

create table if not exists public.intentos_reclamo (
  clave text primary key,
  fallos integer not null default 0,
  bloqueado_hasta timestamptz
);

-- ───────────────────────────── 2. FUNCIONES DE APOYO ─────────────────────────────

-- «Tortillería El Maizito» = «maizito tortilleria»: sin acentos, artículos ni orden.
create or replace function public.clave_nombre(t text) returns text
language sql immutable set search_path = public as $$
  select coalesce(string_agg(w, ' ' order by w), '')
  from (
    select distinct w
    from regexp_split_to_table(
      regexp_replace(translate(lower(coalesce(t, '')), 'áàäâéèëêíìïîóòöôúùüûñ', 'aaaaeeeeiiiioooouuuun'), '[^a-z0-9]+', ' ', 'g'),
      ' '
    ) as w
    where w <> '' and w not in ('el', 'la', 'los', 'las', 'de', 'del', 'y', 'e')
  ) q
$$;

create or replace function public._texto_espera(p_segundos integer) returns text
language sql immutable set search_path = public as $$
  select 'Por seguridad esperamos unos minutos después de varios códigos incorrectos. Vuelve a intentar en '
    || greatest(1, ceil(p_segundos / 60.0))::int
    || case when greatest(1, ceil(p_segundos / 60.0))::int = 1 then ' minuto.' else ' minutos.' end
$$;

-- Anota un código incorrecto; a los 5 seguidos bloquea 5 minutos. Devuelve cuántos intentos quedan.
create or replace function public._fallo_reclamo(p_clave text) returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_fallos integer;
begin
  insert into public.intentos_reclamo (clave, fallos) values (p_clave, 1)
  on conflict (clave) do update set fallos = public.intentos_reclamo.fallos + 1
  returning fallos into v_fallos;
  if v_fallos >= 5 then
    update public.intentos_reclamo set bloqueado_hasta = now() + interval '5 minutes' where clave = p_clave;
  end if;
  return greatest(0, 5 - v_fallos);
end $$;

-- ¿Esta persona es parte de la conversación? (cliente, o dueño del negocio)
create or replace function public.soy_participante(p_conv uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.conversaciones c
    join public.negocios n on n.id = c.negocio_id
    where c.id = p_conv and (c.cliente_id = auth.uid() or n.dueno_id = auth.uid())
  )
$$;

-- ───────────────────────────── 3. DISPARADORES ─────────────────────────────

-- Al crearse una cuenta en Supabase Auth se crea su perfil con los datos que mandó la app.
create or replace function public.nueva_cuenta() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_nombre text := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'nombre', '')), '');
  v_tel text := regexp_replace(coalesce(new.raw_user_meta_data ->> 'telefono', ''), '[^0-9]', '', 'g');
begin
  if char_length(v_tel) <> 10 then v_tel := ''; end if;
  insert into public.perfiles (id, nombre, correo, telefono)
  values (new.id, left(coalesce(v_nombre, split_part(coalesce(new.email, 'cliente'), '@', 1)), 120), lower(coalesce(new.email, '')), v_tel)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists mercaboot_nueva_cuenta on auth.users;
create trigger mercaboot_nueva_cuenta after insert on auth.users
  for each row execute function public.nueva_cuenta();

-- Si la persona cambia su nombre, sus conversaciones lo muestran actualizado.
create or replace function public.perfil_cambio() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.nombre is distinct from old.nombre then
    update public.conversaciones set cliente_nombre = new.nombre where cliente_id = new.id;
  end if;
  return new;
end $$;

drop trigger if exists mercaboot_perfil_cambio on public.perfiles;
create trigger mercaboot_perfil_cambio after update on public.perfiles
  for each row execute function public.perfil_cambio();

-- Nadie puede ponerle a su negocio el nombre de otro negocio del directorio.
create or replace function public.negocio_nombre_ok() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_otro text;
begin
  if tg_op = 'INSERT' or new.nombre is distinct from old.nombre then
    select r.original ->> 'nombre' into v_otro
    from public.negocios_reclamo r
    where r.negocio_id <> new.id and public.clave_nombre(r.original ->> 'nombre') = public.clave_nombre(new.nombre)
    limit 1;
    if v_otro is not null then
      raise exception '«%» es otro negocio de la comunidad. Escribe un nombre distinto para el tuyo.', v_otro
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists mercaboot_negocio_nombre on public.negocios;
create trigger mercaboot_negocio_nombre before insert or update of nombre on public.negocios
  for each row execute function public.negocio_nombre_ok();

-- Marca (o desmarca) la tienda como «del directorio» cuando se le agrega (o quita) su código de reclamo.
create or replace function public.reclamo_marca() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    update public.negocios set del_directorio = false where id = old.negocio_id;
    return old;
  end if;
  update public.negocios set del_directorio = true where id = new.negocio_id;
  return new;
end $$;

drop trigger if exists mercaboot_reclamo_marca on public.negocios_reclamo;
create trigger mercaboot_reclamo_marca after insert or delete on public.negocios_reclamo
  for each row execute function public.reclamo_marca();

create or replace function public.producto_actualizado() returns trigger
language plpgsql set search_path = public as $$
begin
  new.actualizado := now();
  return new;
end $$;

drop trigger if exists mercaboot_producto_actualizado on public.productos;
create trigger mercaboot_producto_actualizado before update on public.productos
  for each row execute function public.producto_actualizado();

-- Cada mensaje nuevo actualiza el resumen de su conversación y marca como leído para quien lo escribió.
create or replace function public.mensaje_nuevo() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.conversaciones c
  set ultimo_texto = left(new.texto, 160),
      ultimo_autor = new.autor_id,
      ultimo_en = new.creado,
      leido_cliente = case when new.autor_id = c.cliente_id then new.creado else c.leido_cliente end,
      leido_negocio = case when new.autor_id <> c.cliente_id then new.creado else c.leido_negocio end
  where c.id = new.conversacion_id;
  return new;
end $$;

drop trigger if exists mercaboot_mensaje_nuevo on public.mensajes;
create trigger mercaboot_mensaje_nuevo after insert on public.mensajes
  for each row execute function public.mensaje_nuevo();

-- ───────────────────────────── 4. FUNCIONES QUE USA LA APP (RPC) ─────────────────────────────

-- Revisa el código de reclamo de una tienda del directorio. Devuelve el mensaje de error o NULL si es correcto.
-- Puede llamarse antes de crear la cuenta; por eso cuenta los intentos por tienda y, con sesión, también por cuenta.
create or replace function public.comprobar_reclamo(p_negocio text, p_codigo text) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_neg public.negocios%rowtype;
  v_huella text;
  v_norm text := upper(regexp_replace(coalesce(p_codigo, ''), '[^A-Za-z0-9]', '', 'g'));
  v_claves text[];
  v_clave text;
  v_espera integer;
  v_quedan integer := 5;
  v_q integer;
begin
  v_claves := case when v_uid is null then array['n:' || coalesce(p_negocio, '')]
                   else array['n:' || coalesce(p_negocio, ''), 'u:' || v_uid::text] end;

  -- Un bloqueo que ya terminó se olvida.
  delete from public.intentos_reclamo where clave = any (v_claves) and bloqueado_hasta is not null and bloqueado_hasta <= now();
  select coalesce(max(ceil(extract(epoch from (bloqueado_hasta - now())))), 0)::integer into v_espera
  from public.intentos_reclamo where clave = any (v_claves) and bloqueado_hasta > now();
  if v_espera > 0 then return public._texto_espera(v_espera); end if;

  select * into v_neg from public.negocios where id = p_negocio;
  if not found then return 'No encontramos ese negocio.'; end if;
  if v_neg.dueno_id is not null then return 'Ese negocio ya tiene un comerciante registrado.'; end if;
  select huella into v_huella from public.negocios_reclamo where negocio_id = p_negocio;
  if v_huella is null then
    return format('«%s» todavía no tiene código de reclamo. Pídelo al equipo de Mercaboot.', v_neg.nombre);
  end if;
  if v_norm = '' then
    return format('Escribe el código de reclamo de «%s». Si eres su dueño, pídelo al equipo de Mercaboot.', v_neg.nombre);
  end if;

  if encode(sha256(convert_to(p_negocio || ':' || v_norm || ':mercaboot-reclamo', 'UTF8')), 'hex') = v_huella then
    delete from public.intentos_reclamo where clave = any (v_claves) and bloqueado_hasta is null;
    return null;
  end if;

  foreach v_clave in array v_claves loop
    v_q := public._fallo_reclamo(v_clave);
    v_quedan := least(v_quedan, v_q);
  end loop;
  if v_quedan > 0 then
    return format('Ese código no es el de «%s». Revísalo (no importan mayúsculas ni guiones). Te quedan %s %s.',
                  v_neg.nombre, v_quedan, case when v_quedan = 1 then 'intento' else 'intentos' end);
  end if;
  return public._texto_espera(300);
end $$;

-- La cuenta en sesión reclama una tienda del directorio con su código. NULL = listo; si no, el mensaje de error.
create or replace function public.reclamar_negocio(p_negocio text, p_codigo text) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_err text;
  v_tel text;
begin
  if v_uid is null then return 'No hay una sesión activa.'; end if;
  if exists (select 1 from public.negocios where dueno_id = v_uid) then return 'Tu cuenta ya administra un negocio.'; end if;
  v_err := public.comprobar_reclamo(p_negocio, p_codigo);
  if v_err is not null then return v_err; end if;
  select telefono into v_tel from public.perfiles where id = v_uid;
  update public.negocios
  set dueno_id = v_uid, telefono = coalesce(nullif(telefono, ''), nullif(v_tel, '')), abierto = true
  where id = p_negocio and dueno_id is null;
  if not found then return 'Ese negocio ya tiene un comerciante registrado.'; end if;
  return null;
exception when unique_violation then
  return 'Tu cuenta ya administra un negocio.';
end $$;

-- ¿Se puede usar este nombre para un negocio nuevo? NULL = sí; si no, el mensaje de error.
-- Se puede llamar antes de crear la cuenta (el registro lo usa para no dejar cuentas a medias).
create or replace function public.nombre_disponible(p_nombre text) returns text
language plpgsql stable security definer set search_path = public as $$
declare
  v_otro text;
begin
  if btrim(coalesce(p_nombre, '')) = '' then return 'Escribe el nombre de tu negocio.'; end if;
  select r.original ->> 'nombre' into v_otro
  from public.negocios_reclamo r
  where public.clave_nombre(r.original ->> 'nombre') = public.clave_nombre(p_nombre) limit 1;
  if v_otro is not null then
    return format('Ya existe «%s» en Mercaboot. Si es tu negocio, elige «Ya aparece en la lista» y escribe tu código de reclamo; si ya no aparece ahí, avísalo al equipo de Mercaboot. Si es otro negocio, ponle un nombre distinto.', v_otro);
  end if;
  return null;
end $$;

-- Tiendas del directorio que todavía nadie administra (solo nombre y giro), para elegir cuál reclamar.
-- Se puede llamar antes de iniciar sesión: así el registro muestra la lista sin abrir toda la tabla.
create or replace function public.negocios_libres() returns table (id text, nombre text, giro text)
language sql stable security definer set search_path = public as $$
  select n.id, n.nombre, n.giro
  from public.negocios n
  where n.dueno_id is null and exists (select 1 from public.negocios_reclamo r where r.negocio_id = n.id)
  order by n.nombre
$$;

-- La cuenta en sesión abre un negocio nuevo. NULL = listo; si no, el mensaje de error.
create or replace function public.crear_negocio(
  p_nombre text, p_giro text, p_direccion text default null,
  p_lat double precision default null, p_lng double precision default null, p_maps_url text default null
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_nombre text := btrim(coalesce(p_nombre, ''));
  v_tel text;
  v_err text;
begin
  if v_uid is null then return 'No hay una sesión activa.'; end if;
  v_err := public.nombre_disponible(v_nombre);
  if v_err is not null then return v_err; end if;
  if btrim(coalesce(p_giro, '')) = '' then return 'Elige el giro de tu negocio.'; end if;
  if exists (select 1 from public.negocios where dueno_id = v_uid) then return 'Tu cuenta ya administra un negocio.'; end if;
  select nullif(telefono, '') into v_tel from public.perfiles where id = v_uid;
  insert into public.negocios (nombre, giro, direccion, telefono, lat, lng, maps_url, a_domicilio, abierto, dueno_id)
  values (v_nombre, btrim(p_giro), nullif(btrim(coalesce(p_direccion, '')), ''), v_tel,
          case when p_lat is not null and p_lng is not null then p_lat end,
          case when p_lat is not null and p_lng is not null then p_lng end,
          nullif(btrim(coalesce(p_maps_url, '')), ''), false, true, v_uid);
  return null;
exception when unique_violation then
  return 'Tu cuenta ya administra un negocio.';
end $$;

-- La cuenta deja de administrar su negocio. Una tienda del directorio vuelve a quedar sin dueño con sus datos
-- originales; un negocio que creó la persona desaparece. Los chats del negocio se borran.
create or replace function public.soltar_negocio() returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_neg public.negocios%rowtype;
  v_orig jsonb;
begin
  if v_uid is null then return 'No hay una sesión activa.'; end if;
  select * into v_neg from public.negocios where dueno_id = v_uid;
  if not found then return 'Tu cuenta no administra ningún negocio.'; end if;
  select original into v_orig from public.negocios_reclamo where negocio_id = v_neg.id;
  delete from public.conversaciones where negocio_id = v_neg.id;
  if v_orig is null then
    delete from public.negocios where id = v_neg.id;
  else
    delete from public.productos where negocio_id = v_neg.id;
    update public.negocios
    set dueno_id = null, nombre = v_orig ->> 'nombre', giro = v_orig ->> 'giro',
        descripcion = null, direccion = null, telefono = null, correo = null, horario = null, logo_uri = null,
        a_domicilio = false, zona_entrega = null, abierto = true,
        lat = (v_orig ->> 'lat')::double precision, lng = (v_orig ->> 'lng')::double precision,
        maps_url = v_orig ->> 'maps_url'
    where id = v_neg.id;
  end if;
  return null;
end $$;

-- Borra la cuenta en sesión (y todo lo suyo). La app cierra la sesión después.
create or replace function public.eliminar_mi_cuenta() returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'No hay una sesión activa.'; end if;
  perform public.soltar_negocio();
  delete from auth.users where id = v_uid;
end $$;

-- Chat: el cliente abre (o recupera) su conversación con un negocio. Devuelve el id de la conversación.
create or replace function public.abrir_conversacion(p_negocio text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_dueno uuid;
  v_nombre text;
  v_id uuid;
begin
  if v_uid is null then raise exception 'Inicia sesión para chatear.'; end if;
  select dueno_id into v_dueno from public.negocios where id = p_negocio;
  if not found then raise exception 'No encontramos ese negocio.'; end if;
  if v_dueno is null then
    raise exception 'Este negocio todavía no usa Mercaboot, así que no puede responder mensajes por aquí.';
  end if;
  if v_dueno = v_uid then raise exception 'No puedes escribirle a tu propio negocio.'; end if;
  select nombre into v_nombre from public.perfiles where id = v_uid;
  insert into public.conversaciones (negocio_id, cliente_id, cliente_nombre)
  values (p_negocio, v_uid, coalesce(v_nombre, 'Cliente'))
  on conflict (negocio_id, cliente_id) do nothing;
  select id into v_id from public.conversaciones where negocio_id = p_negocio and cliente_id = v_uid;
  return v_id;
end $$;

-- Marca como leída una conversación (para quien la llama: el cliente o el dueño del negocio).
create or replace function public.marcar_leida(p_conv uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then return; end if;
  update public.conversaciones set leido_cliente = greatest(leido_cliente, coalesce(ultimo_en, now()))
  where id = p_conv and cliente_id = v_uid;
  update public.conversaciones c set leido_negocio = greatest(c.leido_negocio, coalesce(c.ultimo_en, now()))
  where c.id = p_conv and exists (select 1 from public.negocios n where n.id = c.negocio_id and n.dueno_id = v_uid);
end $$;

-- ───────────────────────────── 5. SEGURIDAD (RLS) ─────────────────────────────

alter table public.perfiles enable row level security;
alter table public.negocios enable row level security;
alter table public.productos enable row level security;
alter table public.favoritos enable row level security;
alter table public.conversaciones enable row level security;
alter table public.mensajes enable row level security;
alter table public.negocios_reclamo enable row level security;
alter table public.intentos_reclamo enable row level security;

-- Se quita todo permiso y se dan solo los necesarios.
revoke all on table public.perfiles, public.negocios, public.productos, public.favoritos, public.conversaciones,
  public.mensajes, public.negocios_reclamo, public.intentos_reclamo from anon, authenticated;

grant select on public.perfiles to authenticated;
grant update (nombre, telefono, foto_uri) on public.perfiles to authenticated;

grant select on public.negocios to authenticated;
grant update (nombre, giro, descripcion, direccion, telefono, correo, horario, logo_uri, a_domicilio, zona_entrega,
              abierto, lat, lng, maps_url) on public.negocios to authenticated;

grant select, delete on public.productos to authenticated;
grant insert (negocio_id, nombre, precio, unidad, disponible, categoria, por_encargo) on public.productos to authenticated;
grant update (nombre, precio, unidad, disponible, categoria, por_encargo) on public.productos to authenticated;

grant select, delete on public.favoritos to authenticated;
grant insert (usuario_id, negocio_id) on public.favoritos to authenticated;

grant select on public.conversaciones to authenticated;

grant select on public.mensajes to authenticated;
grant insert (conversacion_id, autor_id, texto) on public.mensajes to authenticated;

-- perfiles: cada quien ve y edita solo el suyo.
drop policy if exists perfiles_ver on public.perfiles;
create policy perfiles_ver on public.perfiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists perfiles_editar on public.perfiles;
create policy perfiles_editar on public.perfiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- negocios: todos los ven; solo su dueño los edita (crear, reclamar y soltar se hacen con las funciones de arriba).
drop policy if exists negocios_ver on public.negocios;
create policy negocios_ver on public.negocios for select to authenticated using (true);
drop policy if exists negocios_editar on public.negocios;
create policy negocios_editar on public.negocios for update to authenticated
  using (dueno_id = (select auth.uid())) with check (dueno_id = (select auth.uid()));

-- productos: todos los ven; solo el dueño del negocio los agrega, cambia o borra.
drop policy if exists productos_ver on public.productos;
create policy productos_ver on public.productos for select to authenticated using (true);
drop policy if exists productos_agregar on public.productos;
create policy productos_agregar on public.productos for insert to authenticated
  with check (exists (select 1 from public.negocios n where n.id = negocio_id and n.dueno_id = (select auth.uid())));
drop policy if exists productos_cambiar on public.productos;
create policy productos_cambiar on public.productos for update to authenticated
  using (exists (select 1 from public.negocios n where n.id = negocio_id and n.dueno_id = (select auth.uid())))
  with check (exists (select 1 from public.negocios n where n.id = negocio_id and n.dueno_id = (select auth.uid())));
drop policy if exists productos_borrar on public.productos;
create policy productos_borrar on public.productos for delete to authenticated
  using (exists (select 1 from public.negocios n where n.id = negocio_id and n.dueno_id = (select auth.uid())));

-- favoritos: cada quien los suyos; el dueño del negocio ve quién lo tiene como favorito (para contarlos).
drop policy if exists favoritos_ver on public.favoritos;
create policy favoritos_ver on public.favoritos for select to authenticated
  using (usuario_id = (select auth.uid())
         or exists (select 1 from public.negocios n where n.id = negocio_id and n.dueno_id = (select auth.uid())));
drop policy if exists favoritos_agregar on public.favoritos;
create policy favoritos_agregar on public.favoritos for insert to authenticated
  with check (usuario_id = (select auth.uid())
              and not exists (select 1 from public.negocios n where n.id = negocio_id and n.dueno_id = (select auth.uid())));
drop policy if exists favoritos_borrar on public.favoritos;
create policy favoritos_borrar on public.favoritos for delete to authenticated using (usuario_id = (select auth.uid()));

-- chat: solo lo ven (y escriben) el cliente y el dueño del negocio.
drop policy if exists conversaciones_ver on public.conversaciones;
create policy conversaciones_ver on public.conversaciones for select to authenticated
  using (cliente_id = (select auth.uid())
         or exists (select 1 from public.negocios n where n.id = negocio_id and n.dueno_id = (select auth.uid())));
drop policy if exists mensajes_ver on public.mensajes;
create policy mensajes_ver on public.mensajes for select to authenticated using (public.soy_participante(conversacion_id));
drop policy if exists mensajes_enviar on public.mensajes;
create policy mensajes_enviar on public.mensajes for insert to authenticated
  with check (autor_id = (select auth.uid()) and public.soy_participante(conversacion_id));

-- Funciones: nadie las llama sin permiso explícito (las de los disparadores no se llaman desde la app).
revoke all on function public.nueva_cuenta(), public.perfil_cambio(), public.negocio_nombre_ok(),
  public.reclamo_marca(), public.producto_actualizado(), public.mensaje_nuevo() from public, anon, authenticated;
revoke all on function public.clave_nombre(text), public._texto_espera(integer), public._fallo_reclamo(text),
  public.soy_participante(uuid), public.comprobar_reclamo(text, text), public.reclamar_negocio(text, text),
  public.crear_negocio(text, text, text, double precision, double precision, text), public.soltar_negocio(),
  public.eliminar_mi_cuenta(), public.abrir_conversacion(text), public.marcar_leida(uuid),
  public.nombre_disponible(text), public.negocios_libres()
  from public, anon, authenticated;

grant execute on function public.soy_participante(uuid) to authenticated;
grant execute on function public.comprobar_reclamo(text, text) to anon, authenticated;
grant execute on function public.nombre_disponible(text) to anon, authenticated;
grant execute on function public.negocios_libres() to anon, authenticated;
grant execute on function public.reclamar_negocio(text, text) to authenticated;
grant execute on function public.crear_negocio(text, text, text, double precision, double precision, text) to authenticated;
grant execute on function public.soltar_negocio() to authenticated;
grant execute on function public.eliminar_mi_cuenta() to authenticated;
grant execute on function public.abrir_conversacion(text) to authenticated;
grant execute on function public.marcar_leida(uuid) to authenticated;

-- ───────────────────────────── 6. TIEMPO REAL ─────────────────────────────
-- Estas tablas avisan a las apps cuando algo cambia (producto nuevo, mensaje, tienda abierta/cerrada…).

do $$
declare
  t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array array['negocios', 'productos', 'favoritos', 'conversaciones', 'mensajes'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ───────────────────────────── 7. TIENDAS DEL DIRECTORIO ─────────────────────────────
-- Tiendas reales que ya aparecen sin dueño. Cada una solo se reclama con su código secreto
-- (aquí solo está la huella del código). Para agregar otra: node scripts/codigo-reclamo.mjs <id>
-- Cuando se tengan las coordenadas reales: update public.negocios set lat = …, lng = … where id = '…';
-- (y lo mismo dentro de «original» en negocios_reclamo, para que no se pierdan si el dueño suelta la tienda).

insert into public.negocios (id, nombre, giro, a_domicilio, abierto) values
  ('carniceria-san-javier', 'Carnicería San Javier', 'Carnicería', false, true),
  ('tortilleria-el-maizito', 'Tortillería El Maizito', 'Tortillería', false, true),
  ('carniceria-keren', 'Carnicería Keren', 'Carnicería', false, true)
on conflict (id) do nothing;

insert into public.negocios_reclamo (negocio_id, huella, original) values
  ('carniceria-san-javier', '53d800e2eb3d91be37f691e4b61f500be7710c2280b2b0b2efdf1fcfb8cef4c9',
   '{"nombre": "Carnicería San Javier", "giro": "Carnicería"}'),
  ('tortilleria-el-maizito', '21d67d0f16bea04c72a52be199fd5398415c1b5f7bbc91a539f49172290992b6',
   '{"nombre": "Tortillería El Maizito", "giro": "Tortillería"}'),
  ('carniceria-keren', 'ff360245ddcbce478cbeb1fc2097f9d6c6dd6013a9fc656fc38af4ef0d924d92',
   '{"nombre": "Carnicería Keren", "giro": "Carnicería"}')
on conflict (negocio_id) do nothing;

-- Por si el esquema ya estaba instalado: las tiendas con código de reclamo quedan marcadas como del directorio.
update public.negocios n set del_directorio = true
where exists (select 1 from public.negocios_reclamo r where r.negocio_id = n.id) and not n.del_directorio;

-- ───────────────────────────── 8. AVISAR A LA API ─────────────────────────────
-- Supabase ya recarga su API solo después de cada cambio; esto lo pide de nuevo por si acaso.
notify pgrst, 'reload schema';
