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
  public.guardar_preferencias_notificacion(boolean, boolean, boolean, boolean) from public, anon;
grant execute on function public.registrar_dispositivo(text, text) to authenticated;
grant execute on function public.quitar_dispositivo(text) to authenticated;
grant execute on function public.guardar_preferencias_notificacion(boolean, boolean, boolean, boolean) to authenticated;

revoke all on function public._texto_simple(text), public._alerta_coincide(text, text),
  public.crear_alerta_producto(text), public.quitar_alerta_producto(text) from public, anon;
grant execute on function public.crear_alerta_producto(text) to authenticated;
grant execute on function public.quitar_alerta_producto(text) to authenticated;

notify pgrst, 'reload schema';
