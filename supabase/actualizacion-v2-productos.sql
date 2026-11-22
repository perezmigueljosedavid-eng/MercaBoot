-- ============================================================================
-- Mercaboot · versión 2 · Tiendas con muchos productos
-- Autor: José David Pérez Miguel
--
-- Esta actualización SOLO AGREGA cosas nuevas. Lo único que ya existía y se vuelve a escribir es el disparador de límites
-- (limite_escritura), y nada más para dos cosas: dejar pasar los cambios por lote (que ya traen su propio límite) y subir
-- de 500 a 1,500 los productos que puede tener un negocio. La app de la versión final y la de Boti con voz siguen
-- funcionando igual: nada de lo que usan se quita ni se renombra.
--
-- Qué agrega:
--   1) productos.foto_huella       Una «huella» corta de la foto. Con ella la app sabe si un producto tiene foto (y si
--                                  cambió) sin bajar la foto, que pesa unos 22 KB, hasta que de verdad se vaya a ver.
--   2) productos_actualizar_lote   Cambia precios y existencia de muchos productos de golpe («Precios de hoy»).
--   3) productos_agregar_lote      Agrega muchos productos de golpe (catálogo Mercaboot, importar desde Excel).
--   4) Horario automático          El negocio guarda su horario de la semana y la base abre y cierra la tienda sola.
--                                  negocios.horario_auto / horario_semana / horario_ultimo, guardar_horario(),
--                                  actualizar_horarios() (cada minuto, con pg_cron).
--
-- Se puede correr varias veces sin problema.
-- ============================================================================

-- 1) Huella de la foto -------------------------------------------------------------------------------------------------
-- Se calcula sola cada vez que cambia la foto. Vacía = el producto no tiene foto.
-- Nota: Postgres no manda las columnas calculadas en los avisos en tiempo real; esos avisos sí traen la foto completa.
alter table public.productos
  add column if not exists foto_huella text
  generated always as (case when foto_uri is null then null else left(md5(foto_uri), 10) end) stored;

comment on column public.productos.foto_huella is
  'Huella corta de foto_uri (vacía si no hay foto). La app la usa para bajar la foto solo cuando se va a ver y saber si cambió.';

-- 2) Límites: los cambios por lote llevan su propio límite ---------------------------------------------------------------
-- >>> limite_escritura (igual que en esquema.sql, sección K.2) >>>
-- Cambios respecto a la versión anterior:
--   · Si la transacción trae la marca «mercaboot.lote» (la ponen solo las funciones de lote de abajo, y vale solo para esa
--     transacción), no se cuenta fila por fila: el lote ya pagó su propio límite (30 lotes por hora, 600 filas cada uno).
--   · Un negocio puede tener hasta 1,500 productos (antes 500).
create or replace function public.limite_escritura() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or pg_trigger_depth() <> 1 then return new; end if;
  if current_setting('mercaboot.lote', true) is not distinct from txid_current()::text then return new; end if;

  if tg_table_name = 'mensajes' then
    -- Solo lo que escribe la persona; las tarjetas y avisos de pedidos los pone el sistema.
    if new.tipo = 'texto' and new.autor_id = v_uid then
      perform public._limite('mensajes_por_minuto', 30, 60);
      perform public._limite('mensajes_por_dia', 1500, 86400);
    end if;

  elsif tg_table_name = 'productos' then
    if tg_op = 'INSERT' then
      if (select count(*) from public.productos p where p.negocio_id = new.negocio_id) >= 1500 then
        raise exception 'Un negocio puede tener hasta 1,500 productos. Quita alguno que ya no vendas para agregar otro.';
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

revoke all on function public.limite_escritura() from public, anon, authenticated;
-- <<< limite_escritura <<<

-- 3) Cambiar precios y existencia de muchos productos de golpe -----------------------------------------------------------
-- p_cambios = [{"id": "…", "precio": 12.5, "disponible": true}, …]. De cada producto solo se cambia lo que venga:
--   · «precio»      número (o null para quitarlo). Si no viene, se queda el precio de antes.
--   · «disponible»  true o false. Si no viene, se queda como estaba.
-- Solo el dueño del negocio puede usarla, solo toca productos de ese negocio y solo guarda lo que de verdad cambió
-- (así los demás teléfonos no reciben avisos de más). Devuelve cuántos productos cambiaron.
create or replace function public.productos_actualizar_lote(p_negocio text, p_cambios jsonb)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_n integer;
begin
  if v_uid is null then raise exception 'Inicia sesión para continuar.'; end if;
  if not exists (select 1 from public.negocios n where n.id = p_negocio and n.dueno_id = v_uid) then
    raise exception 'Ese negocio no es tuyo.';
  end if;
  if p_cambios is null or jsonb_typeof(p_cambios) <> 'array' then
    raise exception 'La lista de cambios no es válida.';
  end if;
  if jsonb_array_length(p_cambios) > 600 then
    raise exception 'Son demasiados cambios juntos (máximo 600). Hazlos en partes.';
  end if;

  perform public._limite('productos_lotes', 30, 3600);
  perform set_config('mercaboot.lote', txid_current()::text, true);

  with e as (
    select
      case when jsonb_typeof(x -> 'id') = 'string'
                and (x ->> 'id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
           then (x ->> 'id')::uuid end as id,
      case jsonb_typeof(x -> 'precio')
        when 'null' then true
        when 'number' then (x ->> 'precio')::numeric between 0 and 99999999.99
        else false end as hay_precio,
      case when jsonb_typeof(x -> 'precio') = 'number' then round((x ->> 'precio')::numeric, 2) end as precio,
      (jsonb_typeof(x -> 'disponible') = 'boolean') as hay_disp,
      case when jsonb_typeof(x -> 'disponible') = 'boolean' then (x ->> 'disponible')::boolean end as disponible
    from jsonb_array_elements(p_cambios) x
    where jsonb_typeof(x) = 'object'
  ), d as (
    select distinct on (id) id, hay_precio, precio, hay_disp, disponible
    from e where id is not null
    order by id
  ), c as (
    select p.id,
           case when d.hay_precio then d.precio else p.precio end as precio,
           case when d.hay_disp then d.disponible else p.disponible end as disponible
    from d join public.productos p on p.id = d.id and p.negocio_id = p_negocio
  )
  update public.productos p
     set precio = c.precio, disponible = c.disponible
    from c
   where p.id = c.id
     and (p.precio is distinct from c.precio or p.disponible is distinct from c.disponible);

  get diagnostics v_n = row_count;
  return v_n;
end $$;

-- 4) Agregar muchos productos de golpe -----------------------------------------------------------------------------------
-- p_productos = [{"nombre": "Tomate", "precio": 28, "unidad": "kilo", "categoria": "verduras", …}, …]
-- Cada producto se revisa por separado: si no tiene nombre válido se cuenta como «invalido»; si ya existe uno con el mismo
-- nombre (sin importar mayúsculas ni espacios) se cuenta como «repetido». Nada de eso detiene a los demás.
-- Devuelve {"agregados": n, "repetidos": n, "invalidos": n}.
create or replace function public.productos_agregar_lote(p_negocio text, p_productos jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_total integer;
  v_validos integer;
  v_agregados integer;
begin
  if v_uid is null then raise exception 'Inicia sesión para continuar.'; end if;
  if not exists (select 1 from public.negocios n where n.id = p_negocio and n.dueno_id = v_uid) then
    raise exception 'Ese negocio no es tuyo.';
  end if;
  if p_productos is null or jsonb_typeof(p_productos) <> 'array' then
    raise exception 'La lista de productos no es válida.';
  end if;
  v_total := jsonb_array_length(p_productos);
  if v_total > 300 then
    raise exception 'Son demasiados productos juntos (máximo 300). Agrégalos en partes.';
  end if;

  perform public._limite('productos_lotes', 30, 3600);
  perform set_config('mercaboot.lote', txid_current()::text, true);

  with e as (
    select
      nullif(left(regexp_replace(btrim(x ->> 'nombre'), '\s+', ' ', 'g'), 120), '') as nombre,
      case when jsonb_typeof(x -> 'precio') = 'number' and (x ->> 'precio')::numeric between 0 and 99999999.99
           then round((x ->> 'precio')::numeric, 2) end as precio,
      coalesce(nullif(left(btrim(x ->> 'unidad'), 60), ''), 'pieza') as unidad,
      coalesce(nullif(left(btrim(x ->> 'categoria'), 30), ''), 'otro') as categoria,
      case when jsonb_typeof(x -> 'disponible') = 'boolean' then (x ->> 'disponible')::boolean else true end as disponible,
      case when jsonb_typeof(x -> 'por_encargo') = 'boolean' then (x ->> 'por_encargo')::boolean else false end as por_encargo,
      case when x ->> 'tipo' in ('ingrediente', 'preparado') then x ->> 'tipo' end as tipo,
      case when jsonb_typeof(x -> 'etiquetas') = 'array' then
        coalesce((select array_agg(distinct t) from jsonb_array_elements_text(x -> 'etiquetas') t
                  where t = any (array['dulce', 'salado', 'picante', 'acido', 'amargo', 'desayuno', 'comida', 'cena',
                                       'botana', 'postre', 'bebida', 'carne', 'proteina', 'sinCarne', 'caliente']::text[])),
                 '{}'::text[])
        else '{}'::text[] end as etiquetas,
      nullif(left(btrim(x ->> 'ingrediente'), 60), '') as ingrediente,
      nullif(left(btrim(x ->> 'descripcion'), 500), '') as descripcion
    from jsonb_array_elements(p_productos) x
    where jsonb_typeof(x) = 'object'
  ), v as (
    select * from e where nombre is not null
  ), ins as (
    insert into public.productos (negocio_id, nombre, precio, unidad, disponible, categoria, por_encargo,
                                  tipo, etiquetas, ingrediente, descripcion)
    select p_negocio, nombre, precio, unidad, disponible, categoria, por_encargo, tipo, etiquetas, ingrediente, descripcion
    from v
    on conflict do nothing
    returning 1
  )
  select (select count(*) from v), (select count(*) from ins) into v_validos, v_agregados;

  -- Si con esto se pasara del tope, no se agrega nada (todo o nada).
  if (select count(*) from public.productos p where p.negocio_id = p_negocio) > 1500 then
    raise exception 'Un negocio puede tener hasta 1,500 productos. Quita alguno que ya no vendas para agregar otros.';
  end if;

  return jsonb_build_object('agregados', v_agregados, 'repetidos', v_validos - v_agregados, 'invalidos', v_total - v_validos);
end $$;

-- 5) Horario automático --------------------------------------------------------------------------------------------------
-- horario_semana: 7 lugares, de domingo (0) a sábado (6). Cada uno es null (cerrado) o una lista de hasta 2 rangos
--   [["08:00","14:00"], ["16:00","20:00"]]. Si un rango termina «antes» de empezar (["19:00","02:00"]) pasa de medianoche.
--   «24:00» sirve como final del día.
-- horario_auto:   si es verdadero, la base abre y cierra el negocio sola según ese horario (hora de Oaxaca).
-- horario_ultimo: lo que decía el horario la última vez que se revisó. Solo cuando el horario CAMBIA (se abre o se cierra)
--                 se mueve «abierto»; así, si el comerciante abre o cierra a mano en medio, se respeta hasta el siguiente
--                 cambio del horario. Cada madrugada (4:00) se vuelve a alinear con el horario por si alguien dejó
--                 abierto sin querer.
alter table public.negocios
  add column if not exists horario_auto boolean not null default false,
  add column if not exists horario_semana jsonb,
  add column if not exists horario_ultimo boolean;

comment on column public.negocios.horario_auto is 'Si es verdadero, actualizar_horarios() abre y cierra el negocio según horario_semana.';
comment on column public.negocios.horario_semana is 'Horario de la semana (domingo a sábado): null = cerrado, o hasta 2 rangos [["08:00","14:00"]]. Solo se guarda con guardar_horario().';
comment on column public.negocios.horario_ultimo is 'Lo que decía el horario la última vez que se revisó (para respetar lo que el comerciante abre o cierra a mano).';

-- «HH:MM» → minutos desde la medianoche (null si no es una hora válida; «24:00» vale 1440).
create or replace function public._hhmm(p text) returns integer
language sql immutable set search_path = public as $$
  select case
    when p ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then substr(p, 1, 2)::integer * 60 + substr(p, 4, 2)::integer
    when p = '24:00' then 1440
  end;
$$;

-- ¿El horario de la semana tiene la forma correcta?
create or replace function public._horario_semana_ok(p jsonb) returns boolean
language plpgsql immutable set search_path = public as $$
declare
  v_dia jsonb;
  v_rango jsonb;
  v_a integer;
  v_b integer;
begin
  if p is null then return true; end if;
  if jsonb_typeof(p) <> 'array' or jsonb_array_length(p) <> 7 then return false; end if;
  for v_dia in select value from jsonb_array_elements(p) loop
    if jsonb_typeof(v_dia) = 'null' then continue; end if;
    if jsonb_typeof(v_dia) <> 'array' or jsonb_array_length(v_dia) > 2 then return false; end if;
    for v_rango in select value from jsonb_array_elements(v_dia) loop
      if jsonb_typeof(v_rango) <> 'array' or jsonb_array_length(v_rango) <> 2
         or jsonb_typeof(v_rango -> 0) <> 'string' or jsonb_typeof(v_rango -> 1) <> 'string' then
        return false;
      end if;
      v_a := public._hhmm(v_rango ->> 0);
      v_b := public._hhmm(v_rango ->> 1);
      if v_a is null or v_b is null or v_a = v_b or v_a = 1440 then return false; end if;
    end loop;
  end loop;
  return true;
end $$;

-- ¿A esta hora (hora de Oaxaca) el horario dice que está abierto? null si el horario no sirve.
create or replace function public._horario_abierto(p_semana jsonb, p_ahora timestamptz) returns boolean
language plpgsql stable set search_path = public as $$
declare
  v_local timestamp := p_ahora at time zone 'America/Mexico_City';
  v_dia integer := extract(dow from v_local)::integer;          -- 0 = domingo … 6 = sábado
  v_ayer integer := (extract(dow from v_local)::integer + 6) % 7;
  v_min integer := extract(hour from v_local)::integer * 60 + extract(minute from v_local)::integer;
  v_rango jsonb;
  v_a integer;
  v_b integer;
begin
  if p_semana is null or jsonb_typeof(p_semana) <> 'array' or jsonb_array_length(p_semana) <> 7 then return null; end if;

  -- Los rangos de hoy. Si un rango termina «antes» de empezar, pasa de medianoche: hoy cuenta desde que empieza.
  if jsonb_typeof(p_semana -> v_dia) = 'array' then
    for v_rango in select value from jsonb_array_elements(p_semana -> v_dia) loop
      v_a := public._hhmm(v_rango ->> 0);
      v_b := public._hhmm(v_rango ->> 1);
      if v_a is null or v_b is null then continue; end if;
      if v_b > v_a then
        if v_min >= v_a and v_min < v_b then return true; end if;
      elsif v_min >= v_a then
        return true;
      end if;
    end loop;
  end if;

  -- La parte de madrugada de los rangos de ayer que pasaron de medianoche.
  if jsonb_typeof(p_semana -> v_ayer) = 'array' then
    for v_rango in select value from jsonb_array_elements(p_semana -> v_ayer) loop
      v_a := public._hhmm(v_rango ->> 0);
      v_b := public._hhmm(v_rango ->> 1);
      if v_a is null or v_b is null then continue; end if;
      if v_b <= v_a and v_min < v_b then return true; end if;
    end loop;
  end if;

  return false;
end $$;

-- Pone «abierto» según el horario en UN negocio, solo si el horario cambió desde la última revisión
-- (o si p_forzar, que es la alineación de la madrugada). Devuelve verdadero si movió algo.
create or replace function public._sincronizar_horario(p_negocio text, p_ahora timestamptz default now(), p_forzar boolean default false)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  r record;
  v_nuevo boolean;
begin
  select id, horario_auto, horario_semana, horario_ultimo, abierto into r
  from public.negocios where id = p_negocio for update;
  if not found or not r.horario_auto or r.horario_semana is null then return false; end if;

  v_nuevo := public._horario_abierto(r.horario_semana, p_ahora);
  if v_nuevo is null then return false; end if;
  if v_nuevo is not distinct from r.horario_ultimo and not (p_forzar and r.abierto is distinct from v_nuevo) then
    return false;
  end if;

  perform set_config('mercaboot.lote', txid_current()::text, true);
  update public.negocios set abierto = v_nuevo, horario_ultimo = v_nuevo where id = p_negocio;
  return true;
end $$;

-- Lo ejecuta pg_cron cada minuto. Devuelve cuántos negocios abrió o cerró.
create or replace function public.actualizar_horarios(p_ahora timestamptz default now()) returns integer
language plpgsql security definer set search_path = public as $$
declare
  r record;
  v_n integer := 0;
  v_local timestamp := p_ahora at time zone 'America/Mexico_City';
  v_forzar boolean := extract(hour from v_local) = 4 and extract(minute from v_local) < 5;
begin
  for r in select id from public.negocios where horario_auto and horario_semana is not null loop
    if public._sincronizar_horario(r.id, p_ahora, v_forzar) then v_n := v_n + 1; end if;
  end loop;
  return v_n;
end $$;

-- El comerciante guarda su horario (y si quiere que sea automático). p_texto es la versión escrita del horario que ven los
-- clientes («Lun a Sáb 8:00 a 20:00»); la arma la app. Si es automático, el negocio se abre o se cierra desde ese momento.
create or replace function public.guardar_horario(p_auto boolean, p_semana jsonb, p_texto text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_negocio text;
begin
  if v_uid is null then raise exception 'Inicia sesión para continuar.'; end if;
  select n.id into v_negocio from public.negocios n where n.dueno_id = v_uid;
  if v_negocio is null then raise exception 'Primero registra tu negocio.'; end if;
  if not public._horario_semana_ok(p_semana) then raise exception 'El horario no es válido.'; end if;
  if coalesce(p_auto, false) and p_semana is null then
    raise exception 'Para que el horario sea automático, primero pon tu horario.';
  end if;

  update public.negocios
     set horario_auto = coalesce(p_auto, false),
         horario_semana = p_semana,
         horario_ultimo = null,
         horario = case when p_texto is null then horario else nullif(left(btrim(p_texto), 300), '') end
   where id = v_negocio;

  if coalesce(p_auto, false) then
    perform public._sincronizar_horario(v_negocio);
  end if;
end $$;

-- Cada minuto, pg_cron abre y cierra los negocios que tienen horario automático. Si esta base no tiene pg_cron, no pasa
-- nada grave: el horario se aplica en el momento en que el comerciante lo guarda, y el resto lo sigue manejando a mano.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    begin
      create extension if not exists pg_cron;
      perform cron.schedule('mercaboot-horarios', '* * * * *', 'select public.actualizar_horarios()');
    exception when others then
      raise notice 'pg_cron no se pudo activar (%). El horario automático solo se aplica al guardarlo.', sqlerrm;
    end;
  else
    raise notice 'Esta base no tiene pg_cron: el horario automático solo se aplica al guardarlo.';
  end if;
end $$;

-- 6) Permisos ------------------------------------------------------------------------------------------------------------
-- Las funciones internas no las puede llamar la app; las tres de uso del comerciante, sí (y revisan quién es).
revoke all on function public._hhmm(text), public._horario_semana_ok(jsonb), public._horario_abierto(jsonb, timestamptz),
  public._sincronizar_horario(text, timestamptz, boolean), public.actualizar_horarios(timestamptz)
  from public, anon, authenticated;

revoke all on function public.productos_actualizar_lote(text, jsonb), public.productos_agregar_lote(text, jsonb),
  public.guardar_horario(boolean, jsonb, text) from public, anon;
grant execute on function public.productos_actualizar_lote(text, jsonb) to authenticated;
grant execute on function public.productos_agregar_lote(text, jsonb) to authenticated;
grant execute on function public.guardar_horario(boolean, jsonb, text) to authenticated;

notify pgrst, 'reload schema';
