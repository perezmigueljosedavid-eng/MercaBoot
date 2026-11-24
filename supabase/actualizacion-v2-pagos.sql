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

notify pgrst, 'reload schema';
