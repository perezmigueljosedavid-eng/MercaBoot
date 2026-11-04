-- =====================================================================================
-- Mercaboot · Avance 2.1 · Actualización de la base de datos
--   carrito, pedidos con apartado por tiempo, clientes frecuentes elegidos por el comerciante
--
-- Para quien YA tiene instalado el Avance 2: Supabase → SQL Editor → New query → pegar TODO → Run.
-- (Para instalar desde cero se usa esquema.sql, que ya trae todo esto incluido.)
-- Se puede ejecutar más de una vez sin problema. No borra datos.
--
-- Qué agrega:
--   pedidos / detalle_pedido ... el pedido apartado (estado, pago, entrega, tiempo límite) y sus productos
--   clientes_frecuentes ........ quién es cliente frecuente de cada negocio (lo decide el comerciante)
--   negocios_privado ........... datos para recibir transferencias (solo los ve el dueño)
--   productos.cantidad/apartado  existencias opcionales y cuánto está apartado
--   negocios.apartado_minutos .. cuánto tiempo guarda el negocio un pedido
--   mensajes.tipo/pedido_id .... las tarjetas y avisos de pedidos dentro del chat
--   funciones: crear_pedido, pedido_accion, vencer_pedidos, marcar_frecuente, quitar_frecuente, datos_pago_pedido
-- =====================================================================================

-- ───────────────────────────── A. COLUMNAS NUEVAS EN TABLAS QUE YA EXISTÍAN ─────────────────────────────

-- Productos: existencias (opcional; vacío = no se lleva la cuenta) y cuánto está apartado en pedidos activos.
-- «apartado» lo calcula la base de datos sola (la app no puede escribirlo).
alter table public.productos add column if not exists cantidad numeric(10, 2) check (cantidad is null or cantidad >= 0);
alter table public.productos add column if not exists apartado numeric(10, 2) not null default 0 check (apartado >= 0);

-- Negocios: cuánto tiempo se aparta un pedido y qué formas de pago acepta el comerciante.
alter table public.negocios add column if not exists apartado_minutos integer not null default 60
  check (apartado_minutos between 15 and 1440);
alter table public.negocios add column if not exists acepta_pedidos boolean not null default true;
alter table public.negocios add column if not exists acepta_transferencia boolean not null default false;

-- Mensajes: además de texto normal, pueden ser la tarjeta de un pedido o un aviso de su estado.
alter table public.mensajes add column if not exists tipo text not null default 'texto'
  check (tipo in ('texto', 'pedido', 'aviso'));
alter table public.mensajes add column if not exists pedido_id uuid;

-- ───────────────────────────── B. TABLAS NUEVAS ─────────────────────────────

-- Datos privados del negocio (hoy: cómo recibir transferencias). Solo los ve su dueño; el cliente los recibe
-- únicamente cuando el comerciante acepta su pedido (función datos_pago_pedido).
create table if not exists public.negocios_privado (
  negocio_id text primary key references public.negocios (id) on delete cascade,
  datos_pago text check (datos_pago is null or char_length(datos_pago) <= 500)
);

-- Clientes frecuentes: los elige EL COMERCIANTE (con descuento y/o un beneficio de texto: regalo, cupón…).
-- Nadie escribe aquí directo: se usa marcar_frecuente() / quitar_frecuente().
create table if not exists public.clientes_frecuentes (
  id uuid primary key default gen_random_uuid(),
  negocio_id text not null references public.negocios (id) on delete cascade,
  cliente_id uuid not null references auth.users (id) on delete cascade,
  cliente_nombre text not null,
  descuento_pct integer not null default 0 check (descuento_pct between 0 and 50),
  beneficio text check (beneficio is null or char_length(beneficio) <= 200),
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now(),
  unique (negocio_id, cliente_id)
);
create index if not exists clientes_frecuentes_por_cliente on public.clientes_frecuentes (cliente_id);

-- Pedidos (el «apartado»): el cliente arma su carrito y lo aparta en UN negocio.
--   estado:  pendiente → aceptado → listo → completado   (o cancelado / vencido / no_se_presento)
--   pago:    en_persona (al recibir) o transferencia; pago_estado: por_pagar → reportado → confirmado
--   vence_en: hasta cuándo se guarda el producto. Vacío = ya no vence (pagado, a domicilio aceptado o terminado).
-- Nadie escribe aquí directo: se usa crear_pedido() y pedido_accion().
create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  negocio_id text not null references public.negocios (id) on delete cascade,
  cliente_id uuid not null references auth.users (id) on delete cascade,
  cliente_nombre text not null,
  cliente_telefono text not null default '',
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'aceptado', 'listo', 'completado', 'cancelado', 'vencido', 'no_se_presento')),
  motivo text check (motivo is null or char_length(motivo) <= 300),
  entrega text not null default 'recoger' check (entrega in ('recoger', 'domicilio')),
  direccion text check (direccion is null or char_length(direccion) <= 300),
  pago text not null default 'en_persona' check (pago in ('en_persona', 'transferencia')),
  pago_estado text not null default 'por_pagar' check (pago_estado in ('por_pagar', 'reportado', 'confirmado')),
  referencia_pago text check (referencia_pago is null or char_length(referencia_pago) <= 100),
  nota text check (nota is null or char_length(nota) <= 500),
  items integer not null default 0 check (items >= 0),
  subtotal numeric(10, 2) not null default 0 check (subtotal >= 0),
  descuento_pct integer not null default 0 check (descuento_pct between 0 and 50),
  descuento numeric(10, 2) not null default 0 check (descuento >= 0),
  total numeric(10, 2) not null default 0 check (total >= 0),
  beneficio text check (beneficio is null or char_length(beneficio) <= 200),
  vence_en timestamptz,
  aceptado_en timestamptz,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now(),
  -- Código corto para decirlo en voz alta en el mostrador: P-3F9A2
  codigo text generated always as ('P-' || upper(substr(replace(id::text, '-', ''), 1, 5))) stored,
  check (entrega <> 'domicilio' or nullif(btrim(coalesce(direccion, '')), '') is not null)
);
create index if not exists pedidos_por_cliente on public.pedidos (cliente_id, creado desc);
create index if not exists pedidos_por_negocio on public.pedidos (negocio_id, estado, creado desc);
create index if not exists pedidos_por_vencer on public.pedidos (vence_en) where vence_en is not null;

-- Las líneas de cada pedido. Guardan nombre, unidad y precio tal como estaban al apartar
-- (si el comerciante cambia el precio después, el pedido ya hecho no cambia).
create table if not exists public.detalle_pedido (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  producto_id uuid references public.productos (id) on delete set null,
  nombre text not null,
  unidad text not null,
  precio numeric(10, 2) not null check (precio >= 0),
  cantidad numeric(10, 2) not null check (cantidad > 0 and cantidad <= 100),
  importe numeric(10, 2) generated always as (round(precio * cantidad, 2)) stored
);
create index if not exists detalle_por_pedido on public.detalle_pedido (pedido_id);
create index if not exists detalle_por_producto on public.detalle_pedido (producto_id);

-- Un mensaje de tipo «pedido» o «aviso» apunta a su pedido.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'mensajes_pedido_fk') then
    alter table public.mensajes add constraint mensajes_pedido_fk
      foreign key (pedido_id) references public.pedidos (id) on delete set null;
  end if;
end $$;
-- ───────────────────────────── C. FUNCIONES DE APOYO (pedidos) ─────────────────────────────

-- ¿Puedo ver este pedido? (soy el cliente, o el dueño del negocio)
create or replace function public.veo_pedido(p_pedido uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.pedidos o
    join public.negocios n on n.id = o.negocio_id
    where o.id = p_pedido and (o.cliente_id = auth.uid() or n.dueno_id = auth.uid())
  )
$$;

-- Pedidos que esta persona dejó sin recoger en este negocio en los últimos 30 días:
-- «no se presentó», o venció después de que el negocio ya lo había aceptado.
-- (Si el negocio nunca respondió, no cuenta en contra del cliente.)
create or replace function public._ausencias(p_negocio text, p_cliente uuid) returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::integer
  from public.pedidos o
  where o.negocio_id = p_negocio and o.cliente_id = p_cliente
    and o.creado > now() - interval '30 days'
    and (o.estado = 'no_se_presento' or (o.estado = 'vencido' and o.aceptado_en is not null))
$$;

-- Vuelve a calcular cuánto está apartado de cada producto: la suma de sus pedidos activos.
create or replace function public._recalcular_apartado(p_ids uuid[]) returns void
language sql security definer set search_path = public as $$
  with calculo as (
    select p.id,
           coalesce(sum(d.cantidad) filter (where o.estado in ('pendiente', 'aceptado', 'listo')), 0) as total
    from public.productos p
    left join public.detalle_pedido d on d.producto_id = p.id
    left join public.pedidos o on o.id = d.pedido_id
    where p.id = any (p_ids)
    group by p.id
  )
  update public.productos p set apartado = c.total
  from calculo c
  where p.id = c.id and p.apartado is distinct from c.total
$$;

-- Al agregar o quitar líneas de un pedido se recalcula el apartado de ese producto.
create or replace function public.detalle_apartado() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    perform public._recalcular_apartado(array[old.producto_id]);
  else
    perform public._recalcular_apartado(array[new.producto_id]);
  end if;
  return null;
end $$;

drop trigger if exists mercaboot_detalle_apartado on public.detalle_pedido;
create trigger mercaboot_detalle_apartado after insert or delete on public.detalle_pedido
  for each row execute function public.detalle_apartado();

-- Cuando un pedido cambia de estado (se completa, se cancela, vence…) se liberan o se guardan sus productos.
create or replace function public.pedido_apartado() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.estado is distinct from old.estado then
    perform public._recalcular_apartado(
      array(select d.producto_id from public.detalle_pedido d where d.pedido_id = new.id and d.producto_id is not null)
    );
  end if;
  return null;
end $$;

drop trigger if exists mercaboot_pedido_apartado on public.pedidos;
create trigger mercaboot_pedido_apartado after update of estado on public.pedidos
  for each row execute function public.pedido_apartado();

-- Escribe un aviso (o la tarjeta de un pedido) dentro del chat entre un negocio y un cliente.
-- Si todavía no tenían conversación, la abre. Solo la usan las funciones de pedidos y de clientes frecuentes.
create or replace function public._aviso_chat(
  p_negocio text, p_cliente uuid, p_autor uuid, p_texto text, p_tipo text default 'aviso', p_pedido uuid default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_conv uuid;
  v_nombre text;
begin
  select id into v_conv from public.conversaciones where negocio_id = p_negocio and cliente_id = p_cliente;
  if v_conv is null then
    select nombre into v_nombre from public.perfiles where id = p_cliente;
    insert into public.conversaciones (negocio_id, cliente_id, cliente_nombre)
    values (p_negocio, p_cliente, coalesce(v_nombre, 'Cliente'))
    on conflict (negocio_id, cliente_id) do nothing;
    select id into v_conv from public.conversaciones where negocio_id = p_negocio and cliente_id = p_cliente;
  end if;
  insert into public.mensajes (conversacion_id, autor_id, texto, tipo, pedido_id)
  values (v_conv, p_autor, left(p_texto, 2000), p_tipo, p_pedido);
end $$;
-- ───────────────────────────── D. PEDIDOS: FUNCIONES QUE USA LA APP (RPC) ─────────────────────────────

-- Textos para los avisos del chat.
create or replace function public._dinero(p numeric) returns text
language sql immutable set search_path = public as $$
  select '$' || to_char(coalesce(p, 0), 'FM999,999,990.00')
$$;

create or replace function public._duracion(p_minutos integer) returns text
language sql immutable set search_path = public as $$
  select case
    when p_minutos % 60 = 0 and p_minutos >= 60 then (p_minutos / 60)::text || case when p_minutos = 60 then ' hora' else ' horas' end
    else p_minutos::text || ' minutos'
  end
$$;

-- Libera los pedidos que se pasaron de tiempo. Lo ejecuta pg_cron cada minuto (si está activo) y, por si acaso,
-- también se ejecuta solo al hacer o cambiar un pedido y cuando la app se actualiza.
--   · pedido pendiente que el negocio no alcanzó a responder → vence sin culpa del cliente
--   · pedido aceptado/listo para recoger, sin pagar, que no se recogió → vence y cuenta como ausencia
create or replace function public.vencer_pedidos() returns integer
language plpgsql security definer set search_path = public as $$
declare
  r record;
  v_n integer := 0;
  v_dueno uuid;
begin
  for r in
    select o.id, o.negocio_id, o.cliente_id, o.codigo, o.aceptado_en
    from public.pedidos o
    where o.vence_en is not null and o.vence_en <= now() and o.estado in ('pendiente', 'aceptado', 'listo')
    order by o.vence_en
    limit 200
    for update skip locked
  loop
    update public.pedidos
    set estado = 'vencido',
        motivo = case when r.aceptado_en is null then 'El negocio no alcanzó a responder a tiempo.'
                      else 'Se acabó el tiempo de apartado y no se recogió.' end,
        vence_en = null, actualizado = now()
    where id = r.id;
    select dueno_id into v_dueno from public.negocios where id = r.negocio_id;
    if v_dueno is not null then
      perform public._aviso_chat(
        r.negocio_id, r.cliente_id, v_dueno,
        case when r.aceptado_en is null
             then format('⌛ El pedido %s venció: el negocio no alcanzó a responder a tiempo. Los productos quedaron libres.', r.codigo)
             else format('⌛ El pedido %s venció: se acabó el tiempo de apartado. Los productos quedaron libres.', r.codigo) end,
        'aviso', r.id);
    end if;
    v_n := v_n + 1;
  end loop;
  return v_n;
end $$;

-- El cliente aparta un pedido en UN negocio. p_items = [{"producto_id": "…", "cantidad": 2}, …].
-- Revisa todo en la base de datos (la app solo muestra los errores): negocio abierto, productos disponibles,
-- existencias, límites por cliente, ausencias, pago y entrega. Devuelve el pedido creado.
create or replace function public.crear_pedido(
  p_negocio text, p_items jsonb, p_entrega text default 'recoger', p_direccion text default null,
  p_pago text default 'en_persona', p_nota text default null
) returns public.pedidos
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_neg public.negocios%rowtype;
  v_perfil public.perfiles%rowtype;
  v_datos text;
  v_ausencias integer;
  v_en_negocio integer;
  v_en_total integer;
  v_orden record;
  v_prod public.productos%rowtype;
  v_lineas jsonb := '[]'::jsonb;
  v_subtotal numeric(10, 2) := 0;
  v_pct integer := 0;
  v_benef text;
  v_desc numeric(10, 2);
  v_dir text := nullif(btrim(coalesce(p_direccion, '')), '');
  v_nota text := nullif(btrim(coalesce(p_nota, '')), '');
  v_id uuid := gen_random_uuid();
  v_ped public.pedidos%rowtype;
begin
  if v_uid is null then raise exception 'Inicia sesión para hacer un pedido.'; end if;
  select * into v_neg from public.negocios where id = p_negocio;
  if not found then raise exception 'No encontramos ese negocio.'; end if;
  if v_neg.dueno_id is null then
    raise exception 'Este negocio todavía no usa Mercaboot, así que no recibe pedidos por aquí.';
  end if;
  if v_neg.dueno_id = v_uid then raise exception 'No puedes hacer pedidos en tu propio negocio.'; end if;
  if not v_neg.abierto then raise exception '«%» está cerrado por ahora.', v_neg.nombre; end if;
  if not v_neg.acepta_pedidos then
    raise exception '«%» no está recibiendo pedidos por ahora. Escríbele por el chat.', v_neg.nombre;
  end if;

  if p_entrega not in ('recoger', 'domicilio') then raise exception 'Elige cómo quieres recibir tu pedido.'; end if;
  if p_pago not in ('en_persona', 'transferencia') then raise exception 'Elige cómo quieres pagar.'; end if;
  if char_length(coalesce(v_nota, '')) > 500 then raise exception 'La nota es muy larga (máximo 500 letras).'; end if;
  if p_entrega = 'domicilio' then
    if not v_neg.a_domicilio then raise exception '«%» no hace entregas a domicilio.', v_neg.nombre; end if;
    if v_dir is null then raise exception 'Escribe la dirección de entrega.'; end if;
    if char_length(v_dir) > 300 then raise exception 'La dirección es muy larga (máximo 300 letras).'; end if;
  else
    v_dir := null;
  end if;
  if p_pago = 'transferencia' then
    if not v_neg.acepta_transferencia then raise exception '«%» no acepta pago por transferencia.', v_neg.nombre; end if;
    select datos_pago into v_datos from public.negocios_privado where negocio_id = p_negocio;
    if nullif(btrim(coalesce(v_datos, '')), '') is null then
      raise exception '«%» todavía no puso sus datos para recibir transferencias. Escríbele por el chat.', v_neg.nombre;
    end if;
  end if;

  -- Primero se liberan los pedidos que ya se pasaron de tiempo (así se cuentan bien los límites y las existencias).
  perform public.vencer_pedidos();

  -- Quien dejó pedidos sin recoger: con 2 ausencias solo puede apartar pagando antes; con 3 se bloquea en este negocio.
  v_ausencias := public._ausencias(p_negocio, v_uid);
  if v_ausencias >= 3 or (v_ausencias >= 2 and not v_neg.acepta_transferencia) then
    raise exception 'Por ahora «%» no te permite apartar pedidos porque no recogiste los últimos. Escríbele por el chat para arreglarlo.', v_neg.nombre;
  end if;
  if v_ausencias >= 2 and p_pago <> 'transferencia' then
    raise exception 'Como no recogiste tus últimos pedidos, en «%» ahora solo puedes apartar pagando por transferencia.', v_neg.nombre;
  end if;

  select count(*) filter (where negocio_id = p_negocio), count(*) into v_en_negocio, v_en_total
  from public.pedidos where cliente_id = v_uid and estado in ('pendiente', 'aceptado', 'listo');
  if v_en_negocio >= 2 then
    raise exception 'Ya tienes 2 pedidos activos en «%». Recoge o cancela uno antes de hacer otro.', v_neg.nombre;
  end if;
  if v_en_total >= 4 then
    raise exception 'Ya tienes 4 pedidos activos. Recoge o cancela alguno antes de hacer otro.';
  end if;

  -- El carrito.
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Tu carrito está vacío.';
  end if;
  if jsonb_array_length(p_items) > 30 then raise exception 'Un pedido puede llevar hasta 30 productos distintos.'; end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) e
    where jsonb_typeof(e) <> 'object'
       or coalesce(e ->> 'producto_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       or coalesce(e ->> 'cantidad', '') !~ '^[0-9]{1,5}(\.[0-9]{1,2})?$'
  ) then
    raise exception 'Tu carrito tiene datos que no entendimos. Vuelve a armarlo.';
  end if;

  -- Cada producto se bloquea (en orden, para que dos pedidos a la vez no se traben) y se revisa.
  for v_orden in
    select (e ->> 'producto_id')::uuid as producto_id, sum((e ->> 'cantidad')::numeric) as cantidad
    from jsonb_array_elements(p_items) e
    group by 1
    order by 1
  loop
    select * into v_prod from public.productos where id = v_orden.producto_id and negocio_id = p_negocio for update;
    if not found then
      raise exception 'Uno de los productos de tu carrito ya no está en «%». Revisa tu carrito.', v_neg.nombre;
    end if;
    if v_orden.cantidad <= 0 or v_orden.cantidad > 100 then
      raise exception 'La cantidad de «%» no es válida (puede ser de 0.01 a 100).', v_prod.nombre;
    end if;
    if not v_prod.disponible then raise exception '«%» está agotado.', v_prod.nombre; end if;
    if v_prod.precio is null then
      raise exception '«%» no tiene precio puesto. Pregúntalo por el chat.', v_prod.nombre;
    end if;
    if v_prod.cantidad is not null and v_prod.cantidad - v_prod.apartado < v_orden.cantidad then
      raise exception 'De «%» solo quedan % %. Baja la cantidad en tu carrito.',
        v_prod.nombre, trim_scale(greatest(v_prod.cantidad - v_prod.apartado, 0)), v_prod.unidad;
    end if;
    v_subtotal := v_subtotal + round(v_prod.precio * v_orden.cantidad, 2);
    v_lineas := v_lineas || jsonb_build_object(
      'producto_id', v_prod.id, 'nombre', v_prod.nombre, 'unidad', v_prod.unidad,
      'precio', v_prod.precio, 'cantidad', v_orden.cantidad);
  end loop;

  -- Descuento y beneficio de cliente frecuente (lo decide el comerciante).
  select f.descuento_pct, f.beneficio into v_pct, v_benef
  from public.clientes_frecuentes f where f.negocio_id = p_negocio and f.cliente_id = v_uid;
  v_pct := coalesce(v_pct, 0);
  v_desc := round(v_subtotal * v_pct / 100.0, 2);

  select * into v_perfil from public.perfiles where id = v_uid;
  insert into public.pedidos (
    id, negocio_id, cliente_id, cliente_nombre, cliente_telefono, entrega, direccion, pago, nota,
    items, subtotal, descuento_pct, descuento, total, beneficio, vence_en
  ) values (
    v_id, p_negocio, v_uid, coalesce(v_perfil.nombre, 'Cliente'), coalesce(v_perfil.telefono, ''), p_entrega, v_dir, p_pago, v_nota,
    jsonb_array_length(v_lineas), v_subtotal, v_pct, v_desc, v_subtotal - v_desc, v_benef,
    now() + make_interval(mins => v_neg.apartado_minutos)
  );
  insert into public.detalle_pedido (pedido_id, producto_id, nombre, unidad, precio, cantidad)
  select v_id, l.producto_id, l.nombre, l.unidad, l.precio, l.cantidad
  from jsonb_to_recordset(v_lineas) as l (producto_id uuid, nombre text, unidad text, precio numeric, cantidad numeric);

  select * into v_ped from public.pedidos where id = v_id;
  perform public._aviso_chat(
    p_negocio, v_uid, v_uid,
    format('🛒 Pedido %s · %s %s · %s', v_ped.codigo, v_ped.items,
           case when v_ped.items = 1 then 'producto' else 'productos' end, public._dinero(v_ped.total)),
    'pedido', v_id);
  return v_ped;
end $$;

-- Cambia el estado de un pedido. El cliente: cancelar, reportar_pago.
-- El comerciante: aceptar, listo, completar, cancelar, no_se_presento, extender, confirmar_pago, rechazar_pago.
-- Cada cambio deja un aviso en el chat de los dos. Devuelve el pedido ya actualizado.
create or replace function public.pedido_accion(p_pedido uuid, p_accion text, p_texto text default null)
returns public.pedidos
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_o public.pedidos%rowtype;
  v_neg public.negocios%rowtype;
  v_cli boolean;
  v_com boolean;
  v_txt text := nullif(btrim(coalesce(p_texto, '')), '');
  v_aviso text;
begin
  if v_uid is null then raise exception 'Inicia sesión para continuar.'; end if;
  if char_length(coalesce(v_txt, '')) > 200 then raise exception 'El texto es muy largo (máximo 200 letras).'; end if;
  perform public.vencer_pedidos();
  select * into v_o from public.pedidos where id = p_pedido for update;
  if not found then raise exception 'No encontramos ese pedido.'; end if;
  select * into v_neg from public.negocios where id = v_o.negocio_id;
  v_cli := v_o.cliente_id = v_uid;
  v_com := v_neg.dueno_id = v_uid;
  if not (v_cli or v_com) then raise exception 'No encontramos ese pedido.'; end if;
  if v_o.estado in ('completado', 'cancelado', 'vencido', 'no_se_presento') then
    raise exception 'Este pedido ya terminó (%).',
      case v_o.estado when 'completado' then 'completado' when 'cancelado' then 'cancelado'
                      when 'vencido' then 'se acabó su tiempo' else 'no se presentó' end;
  end if;

  if v_cli and p_accion = 'cancelar' then
    if v_o.pago_estado <> 'por_pagar' then
      raise exception 'Este pedido ya tiene un pago registrado. Pídele al negocio que lo cancele por el chat.';
    end if;
    if v_o.estado = 'listo' then
      update public.pedidos set estado = 'no_se_presento', motivo = 'Se canceló cuando el pedido ya estaba listo.',
        vence_en = null, actualizado = now() where id = v_o.id;
      v_aviso := format('❌ %s canceló el pedido %s cuando ya estaba listo. Cuenta como pedido no recogido.', v_o.cliente_nombre, v_o.codigo);
    else
      update public.pedidos set estado = 'cancelado', motivo = 'Lo canceló el cliente.',
        vence_en = null, actualizado = now() where id = v_o.id;
      v_aviso := format('❌ %s canceló el pedido %s.', v_o.cliente_nombre, v_o.codigo);
    end if;

  elsif v_cli and p_accion = 'reportar_pago' then
    if v_o.pago <> 'transferencia' then raise exception 'Este pedido se paga en persona.'; end if;
    if v_o.estado not in ('aceptado', 'listo') then
      raise exception 'Podrás avisar tu pago cuando el negocio acepte el pedido.';
    end if;
    if v_o.pago_estado <> 'por_pagar' then raise exception 'Ya avisaste de este pago.'; end if;
    update public.pedidos set pago_estado = 'reportado', referencia_pago = left(v_txt, 100),
      vence_en = null, actualizado = now() where id = v_o.id;
    v_aviso := format('💸 %s avisó que ya pagó el pedido %s por transferencia%s. Revisa tu cuenta y confirma el pago.',
                      v_o.cliente_nombre, v_o.codigo, case when v_txt is not null then ' (ref.: ' || left(v_txt, 100) || ')' else '' end);

  elsif v_com and p_accion = 'aceptar' then
    if v_o.estado <> 'pendiente' then raise exception 'Este pedido ya fue atendido.'; end if;
    update public.pedidos set estado = 'aceptado', aceptado_en = now(),
      vence_en = case when entrega = 'recoger' then now() + make_interval(mins => v_neg.apartado_minutos) else null end,
      actualizado = now() where id = v_o.id;
    v_aviso := format('✅ %s aceptó tu pedido %s.%s%s', v_neg.nombre, v_o.codigo,
      case when v_o.entrega = 'recoger' then ' Te lo guarda ' || public._duracion(v_neg.apartado_minutos) || '.' else '' end,
      case when v_o.pago = 'transferencia' then ' Ya puedes ver los datos para pagar dentro del pedido.' else '' end);

  elsif v_com and p_accion = 'listo' then
    if v_o.estado <> 'aceptado' then raise exception 'Primero acepta el pedido.'; end if;
    update public.pedidos set estado = 'listo', actualizado = now() where id = v_o.id;
    v_aviso := case when v_o.entrega = 'recoger'
                    then format('📦 Tu pedido %s está listo para recoger.', v_o.codigo)
                    else format('🛵 Tu pedido %s ya va en camino.', v_o.codigo) end;

  elsif v_com and p_accion = 'completar' then
    if v_o.estado not in ('aceptado', 'listo') then raise exception 'Primero acepta el pedido.'; end if;
    if v_o.pago = 'transferencia' and v_o.pago_estado <> 'confirmado' then
      raise exception 'Este pedido es con transferencia: primero confirma que ya te pagaron.';
    end if;
    -- Se descuentan las existencias de los productos que llevan la cuenta.
    update public.productos p set cantidad = greatest(p.cantidad - d.cantidad, 0)
    from public.detalle_pedido d
    where d.pedido_id = v_o.id and d.producto_id = p.id and p.cantidad is not null;
    update public.pedidos set estado = 'completado', pago_estado = 'confirmado', vence_en = null, actualizado = now()
    where id = v_o.id;
    v_aviso := format('🎉 Pedido %s entregado. ¡Gracias por tu compra en %s!', v_o.codigo, v_neg.nombre);

  elsif v_com and p_accion = 'cancelar' then
    update public.pedidos set estado = 'cancelado',
      motivo = left('Lo canceló el negocio' || case when v_txt is not null then ': ' || v_txt else '.' end, 300),
      vence_en = null, actualizado = now() where id = v_o.id;
    v_aviso := format('❌ %s canceló el pedido %s%s.%s', v_neg.nombre, v_o.codigo,
      case when v_txt is not null then ': ' || v_txt else '' end,
      case when v_o.pago_estado <> 'por_pagar' then ' Como ya había un pago, pónganse de acuerdo aquí para devolverlo.' else '' end);

  elsif v_com and p_accion = 'no_se_presento' then
    if v_o.estado not in ('aceptado', 'listo') then
      raise exception 'Solo puedes marcar «no se presentó» en un pedido aceptado o listo.';
    end if;
    update public.pedidos set estado = 'no_se_presento', motivo = 'El cliente no se presentó.',
      vence_en = null, actualizado = now() where id = v_o.id;
    v_aviso := format('🚫 %s marcó el pedido %s como no recogido. Los productos quedaron libres.', v_neg.nombre, v_o.codigo);

  elsif v_com and p_accion = 'extender' then
    if v_o.vence_en is null then raise exception 'Este pedido ya no tiene tiempo límite.'; end if;
    update public.pedidos set vence_en = greatest(vence_en, now()) + interval '30 minutes', actualizado = now()
    where id = v_o.id;
    v_aviso := format('⏰ %s te dio 30 minutos más para el pedido %s.', v_neg.nombre, v_o.codigo);

  elsif v_com and p_accion = 'confirmar_pago' then
    if v_o.pago <> 'transferencia' then raise exception 'Este pedido se paga en persona.'; end if;
    if v_o.estado not in ('aceptado', 'listo') then raise exception 'Primero acepta el pedido.'; end if;
    if v_o.pago_estado = 'confirmado' then raise exception 'El pago ya estaba confirmado.'; end if;
    update public.pedidos set pago_estado = 'confirmado', vence_en = null, actualizado = now() where id = v_o.id;
    v_aviso := format('💚 %s confirmó tu pago del pedido %s.', v_neg.nombre, v_o.codigo);

  elsif v_com and p_accion = 'rechazar_pago' then
    if v_o.pago_estado <> 'reportado' then raise exception 'No hay un pago avisado que revisar.'; end if;
    update public.pedidos set pago_estado = 'por_pagar', referencia_pago = null,
      vence_en = case when entrega = 'recoger' then now() + interval '30 minutes' else null end, actualizado = now()
    where id = v_o.id;
    v_aviso := format('⚠️ %s no encontró tu pago del pedido %s%s. Revisa los datos y vuelve a avisar.',
                      v_neg.nombre, v_o.codigo, case when v_txt is not null then ' (' || v_txt || ')' else '' end);

  else
    raise exception 'Esa acción no está disponible para este pedido.';
  end if;

  perform public._aviso_chat(v_o.negocio_id, v_o.cliente_id, v_uid, v_aviso, 'aviso', v_o.id);
  select * into v_o from public.pedidos where id = p_pedido;
  return v_o;
end $$;

-- Los datos para pagar por transferencia: solo los recibe el cliente de ESE pedido, y solo después de que el
-- comerciante lo aceptó. (El dueño los ve directo en su tabla negocios_privado.)
create or replace function public.datos_pago_pedido(p_pedido uuid) returns text
language sql stable security definer set search_path = public as $$
  select pr.datos_pago
  from public.pedidos o
  join public.negocios_privado pr on pr.negocio_id = o.negocio_id
  where o.id = p_pedido and o.cliente_id = auth.uid() and o.pago = 'transferencia' and o.estado in ('aceptado', 'listo')
$$;
-- ───────────────────────────── E. CLIENTES FRECUENTES (los elige el comerciante) ─────────────────────────────

-- El comerciante nombra (o actualiza) a un cliente frecuente: descuento de 0 a 50 % y/o un beneficio en texto
-- (un regalo, un cupón…). Solo puede elegir a personas que ya tuvieron trato con su negocio (chat o pedido).
-- Le llega un aviso al chat y el descuento se aplica solo en sus pedidos siguientes.
create or replace function public.marcar_frecuente(p_cliente uuid, p_descuento integer default 0, p_beneficio text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_neg public.negocios%rowtype;
  v_nombre text;
  v_pct integer := coalesce(p_descuento, 0);
  v_ben text := nullif(btrim(coalesce(p_beneficio, '')), '');
begin
  if v_uid is null then raise exception 'Inicia sesión para continuar.'; end if;
  select * into v_neg from public.negocios where dueno_id = v_uid;
  if not found then raise exception 'Tu cuenta no administra ningún negocio.'; end if;
  if v_pct not between 0 and 50 then raise exception 'El descuento debe ser de 0 a 50 por ciento.'; end if;
  if char_length(coalesce(v_ben, '')) > 200 then raise exception 'El beneficio es muy largo (máximo 200 letras).'; end if;
  if v_pct = 0 and v_ben is null then
    raise exception 'Ponle un descuento o escribe el beneficio que le das (por ejemplo, un regalo o un cupón).';
  end if;
  if not exists (select 1 from public.conversaciones where negocio_id = v_neg.id and cliente_id = p_cliente)
     and not exists (select 1 from public.pedidos where negocio_id = v_neg.id and cliente_id = p_cliente)
     and not exists (select 1 from public.clientes_frecuentes where negocio_id = v_neg.id and cliente_id = p_cliente) then
    raise exception 'Esa persona todavía no ha tenido trato con tu negocio.';
  end if;
  select nombre into v_nombre from public.perfiles where id = p_cliente;
  insert into public.clientes_frecuentes (negocio_id, cliente_id, cliente_nombre, descuento_pct, beneficio)
  values (v_neg.id, p_cliente, coalesce(v_nombre, 'Cliente'), v_pct, v_ben)
  on conflict (negocio_id, cliente_id)
  do update set descuento_pct = excluded.descuento_pct, beneficio = excluded.beneficio, actualizado = now();
  perform public._aviso_chat(
    v_neg.id, p_cliente, v_uid,
    '⭐ ' || v_neg.nombre || ' te nombró cliente frecuente'
      || case when v_pct > 0 then ': ' || v_pct || '% de descuento en tus pedidos' else '' end
      || case when v_ben is not null then case when v_pct > 0 then ' · ' else ': ' end || v_ben else '' end
      || '.',
    'aviso', null);
end $$;

-- El comerciante le quita a alguien el trato de cliente frecuente (no se le avisa).
create or replace function public.quitar_frecuente(p_cliente uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Inicia sesión para continuar.'; end if;
  delete from public.clientes_frecuentes f
  where f.cliente_id = p_cliente
    and f.negocio_id = (select n.id from public.negocios n where n.dueno_id = v_uid);
end $$;
-- ───────────────────────────── H. CAMBIOS A COSAS QUE YA EXISTÍAN ─────────────────────────────
-- (En esquema.sql estas mismas versiones ya están en su lugar original; aquí se reemplazan las anteriores.)

-- Productos: si las existencias llegan a 0 queda «agotado»; si vuelven a subir, vuelve a estar disponible.
-- «actualizado» solo se mueve cuando cambia algo que el cliente ve (no cuando solo cambia lo apartado).
create or replace function public.producto_actualizado() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.cantidad is not null and new.cantidad <= 0 then new.disponible := false; end if;
    return new;
  end if;
  if new.cantidad is distinct from old.cantidad then
    if new.cantidad is not null and new.cantidad <= 0 then
      new.disponible := false;
    elsif coalesce(old.cantidad, 0) <= 0 and new.disponible is not distinct from old.disponible then
      new.disponible := true;
    end if;
  end if;
  if (to_jsonb(new) - 'apartado' - 'actualizado') is distinct from (to_jsonb(old) - 'apartado' - 'actualizado') then
    new.actualizado := now();
  end if;
  return new;
end $$;

drop trigger if exists mercaboot_producto_actualizado on public.productos;
create trigger mercaboot_producto_actualizado before insert or update on public.productos
  for each row execute function public.producto_actualizado();

-- Si la persona cambia su nombre, sus conversaciones, pedidos y clientes frecuentes lo muestran actualizado.
create or replace function public.perfil_cambio() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.nombre is distinct from old.nombre then
    update public.conversaciones set cliente_nombre = new.nombre where cliente_id = new.id;
    update public.clientes_frecuentes set cliente_nombre = new.nombre where cliente_id = new.id;
    update public.pedidos set cliente_nombre = new.nombre where cliente_id = new.id;
  end if;
  return new;
end $$;

-- La cuenta deja de administrar su negocio. Una tienda del directorio vuelve a quedar sin dueño con sus datos
-- originales; un negocio que creó la persona desaparece. Los chats, pedidos y clientes frecuentes del negocio se borran.
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
  delete from public.pedidos where negocio_id = v_neg.id;
  delete from public.clientes_frecuentes where negocio_id = v_neg.id;
  delete from public.negocios_privado where negocio_id = v_neg.id;
  if v_orig is null then
    delete from public.negocios where id = v_neg.id;
  else
    delete from public.productos where negocio_id = v_neg.id;
    update public.negocios
    set dueno_id = null, nombre = v_orig ->> 'nombre', giro = v_orig ->> 'giro',
        descripcion = null, direccion = null, telefono = null, correo = null, horario = null, logo_uri = null,
        a_domicilio = false, zona_entrega = null, abierto = true,
        apartado_minutos = 60, acepta_pedidos = true, acepta_transferencia = false,
        lat = (v_orig ->> 'lat')::double precision, lng = (v_orig ->> 'lng')::double precision,
        maps_url = v_orig ->> 'maps_url'
    where id = v_neg.id;
  end if;
  return null;
end $$;

-- «Cliente frecuente» ya no es un botón del cliente: lo decide el comerciante (tabla clientes_frecuentes).
-- Los favoritos pasan a ser PRIVADOS: solo los ve quien los marcó (el comerciante ya no los ve).
drop policy if exists favoritos_ver on public.favoritos;
create policy favoritos_ver on public.favoritos for select to authenticated using (usuario_id = (select auth.uid()));
-- ───────────────────────────── F. SEGURIDAD (RLS) DE LAS TABLAS NUEVAS ─────────────────────────────

alter table public.negocios_privado enable row level security;
alter table public.clientes_frecuentes enable row level security;
alter table public.pedidos enable row level security;
alter table public.detalle_pedido enable row level security;

revoke all on table public.negocios_privado, public.clientes_frecuentes, public.pedidos, public.detalle_pedido
  from anon, authenticated;

-- Pedidos, líneas y clientes frecuentes: la app solo los LEE (se escriben con las funciones de arriba).
grant select on public.pedidos, public.detalle_pedido, public.clientes_frecuentes to authenticated;
-- Datos de pago: solo el dueño los lee y los edita.
grant select on public.negocios_privado to authenticated;
grant insert (negocio_id, datos_pago) on public.negocios_privado to authenticated;
grant update (datos_pago) on public.negocios_privado to authenticated;

-- Columnas nuevas de tablas que ya existían: el dueño pone las existencias y sus reglas de apartado.
-- («apartado» no se concede: lo calcula la base de datos.)
grant insert (cantidad) on public.productos to authenticated;
grant update (cantidad) on public.productos to authenticated;
grant update (apartado_minutos, acepta_pedidos, acepta_transferencia) on public.negocios to authenticated;

-- pedidos: los ven el cliente y el dueño del negocio, nadie más.
drop policy if exists pedidos_ver on public.pedidos;
create policy pedidos_ver on public.pedidos for select to authenticated
  using (cliente_id = (select auth.uid())
         or exists (select 1 from public.negocios n where n.id = negocio_id and n.dueno_id = (select auth.uid())));

drop policy if exists detalle_ver on public.detalle_pedido;
create policy detalle_ver on public.detalle_pedido for select to authenticated using (public.veo_pedido(pedido_id));

-- clientes frecuentes: los ve el comerciante que los eligió y el propio cliente (para saber su beneficio).
drop policy if exists frecuentes_ver on public.clientes_frecuentes;
create policy frecuentes_ver on public.clientes_frecuentes for select to authenticated
  using (cliente_id = (select auth.uid())
         or exists (select 1 from public.negocios n where n.id = negocio_id and n.dueno_id = (select auth.uid())));

-- datos de pago: solo su dueño.
drop policy if exists privado_ver on public.negocios_privado;
create policy privado_ver on public.negocios_privado for select to authenticated
  using (exists (select 1 from public.negocios n where n.id = negocio_id and n.dueno_id = (select auth.uid())));
drop policy if exists privado_agregar on public.negocios_privado;
create policy privado_agregar on public.negocios_privado for insert to authenticated
  with check (exists (select 1 from public.negocios n where n.id = negocio_id and n.dueno_id = (select auth.uid())));
drop policy if exists privado_cambiar on public.negocios_privado;
create policy privado_cambiar on public.negocios_privado for update to authenticated
  using (exists (select 1 from public.negocios n where n.id = negocio_id and n.dueno_id = (select auth.uid())))
  with check (exists (select 1 from public.negocios n where n.id = negocio_id and n.dueno_id = (select auth.uid())));

-- Funciones: las internas no se llaman desde la app; las de pedidos solo con sesión iniciada.
revoke all on function public._ausencias(text, uuid), public._recalcular_apartado(uuid[]), public.detalle_apartado(),
  public.pedido_apartado(), public._aviso_chat(text, uuid, uuid, text, text, uuid), public._dinero(numeric),
  public._duracion(integer), public.veo_pedido(uuid), public.vencer_pedidos(),
  public.crear_pedido(text, jsonb, text, text, text, text), public.pedido_accion(uuid, text, text),
  public.datos_pago_pedido(uuid), public.marcar_frecuente(uuid, integer, text), public.quitar_frecuente(uuid)
  from public, anon, authenticated;

grant execute on function public.veo_pedido(uuid) to authenticated;
grant execute on function public.vencer_pedidos() to authenticated;
grant execute on function public.crear_pedido(text, jsonb, text, text, text, text) to authenticated;
grant execute on function public.pedido_accion(uuid, text, text) to authenticated;
grant execute on function public.datos_pago_pedido(uuid) to authenticated;
grant execute on function public.marcar_frecuente(uuid, integer, text) to authenticated;
grant execute on function public.quitar_frecuente(uuid) to authenticated;

-- ───────────────────────────── G. TIEMPO REAL Y VENCIMIENTO AUTOMÁTICO ─────────────────────────────
-- Los pedidos y los clientes frecuentes también avisan a las apps cuando cambian.
-- (Las líneas de un pedido no cambian nunca después de crearse, así que no hace falta avisar de ellas.)

do $$
declare
  t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array array['pedidos', 'clientes_frecuentes'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Cada minuto, pg_cron libera los pedidos que se pasaron de tiempo. Si esta base no tiene pg_cron, no pasa nada:
-- los pedidos vencen igual en cuanto alguien hace o cambia un pedido o abre la app (ver vencer_pedidos).
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    begin
      create extension if not exists pg_cron;
      perform cron.schedule('mercaboot-vencer-pedidos', '* * * * *', 'select public.vencer_pedidos()');
    exception when others then
      raise notice 'pg_cron no se pudo activar (%). Los pedidos vencen igual cuando alguien usa la app.', sqlerrm;
    end;
  else
    raise notice 'Esta base no tiene pg_cron: los pedidos vencen cuando alguien usa la app.';
  end if;
end $$;

-- ───────────────────────────── AVISAR A LA API ─────────────────────────────
notify pgrst, 'reload schema';
