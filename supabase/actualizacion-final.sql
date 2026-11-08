-- =====================================================================================
-- Mercaboot · Versión final (4.0) · Actualización de la base de datos
--   reseñas con estrellas, avisos del comerciante y datos del asistente «Ideas para cocinar»
--
-- Para quien YA tiene instalado el Avance 2.1: Supabase → SQL Editor → New query → pegar TODO → Run.
-- (Si venías del Avance 2, corre primero actualizacion-2-1.sql. Para instalar desde cero se usa esquema.sql,
--  que ya trae todo esto incluido.)
-- Se puede ejecutar más de una vez sin problema. No borra datos y la app del Avance 2.1 sigue funcionando igual.
--
-- Qué agrega:
--   resenas ............................ reseñas con estrellas (una por persona y negocio)
--   avisos ............................. lo que publica el comerciante: se acabó, ya hay, promoción, regalo, cerrado hoy…
--   productos.tipo/etiquetas/ingrediente  lo que lee el asistente «Ideas para cocinar»
--   funciones: guardar_resena, borrar_resena, publicar_aviso, quitar_aviso
--   (y dos funciones que ya existían aprenden lo nuevo: perfil_cambio y soltar_negocio)
-- =====================================================================================

-- ───────────────────────────── 0. FUNCIONES QUE YA EXISTÍAN Y APRENDEN LO NUEVO ─────────────────────────────

-- Si la persona cambia su nombre, sus conversaciones, pedidos, clientes frecuentes y reseñas lo muestran actualizado.
create or replace function public.perfil_cambio() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.nombre is distinct from old.nombre then
    update public.conversaciones set cliente_nombre = new.nombre where cliente_id = new.id;
    update public.clientes_frecuentes set cliente_nombre = new.nombre where cliente_id = new.id;
    update public.pedidos set cliente_nombre = new.nombre where cliente_id = new.id;
    update public.resenas set autor_nombre = new.nombre where autor_id = new.id;
  end if;
  return new;
end $$;

-- La cuenta deja de administrar su negocio. Una tienda del directorio vuelve a quedar sin dueño con sus datos
-- originales; un negocio que creó la persona desaparece. Los chats, pedidos, clientes frecuentes y avisos del negocio se borran
-- (las reseñas se quedan con la tienda del directorio; en un negocio que desaparece se van con él).
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
  delete from public.avisos where negocio_id = v_neg.id;
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

-- ═════════════════════════════ LO NUEVO (secciones H a K) ═════════════════════════════

-- ───────────────────────────── H. PRODUCTOS: LO QUE LEE EL ASISTENTE DE COCINA ─────────────────────────────

-- «tipo»: para cocinar en casa («ingrediente») o ya preparado («preparado»). Vacío = la app lo deduce del nombre.
-- «etiquetas»: sabor, momento del día, si lleva carne, si va caliente… Vacío = la app las deduce del nombre.
-- «ingrediente»: el ingrediente de receta que reconoció la app a partir del nombre (para sugerirlo y comparar precios).
alter table public.productos add column if not exists tipo text
  check (tipo is null or tipo in ('ingrediente', 'preparado'));
alter table public.productos add column if not exists etiquetas text[] not null default '{}'
  check (etiquetas <@ array['dulce', 'salado', 'picante', 'acido', 'amargo', 'desayuno', 'comida', 'cena', 'botana',
                            'postre', 'bebida', 'carne', 'proteina', 'sinCarne', 'caliente']::text[]);
alter table public.productos add column if not exists ingrediente text
  check (ingrediente is null or char_length(ingrediente) <= 60);

-- ───────────────────────────── I. TABLAS NUEVAS: RESEÑAS Y AVISOS ─────────────────────────────

-- Reseñas con estrellas: una por persona y por negocio (si vuelve a opinar, se cambia la anterior).
-- Las ve cualquier cuenta; solo se escriben con guardar_resena / borrar_resena.
create table if not exists public.resenas (
  id uuid primary key default gen_random_uuid(),
  negocio_id text not null references public.negocios (id) on delete cascade,
  autor_id uuid not null references auth.users (id) on delete cascade,
  autor_nombre text not null,
  estrellas integer not null check (estrellas between 1 and 5),
  etiquetas text[] not null default '{}' check (cardinality(etiquetas) <= 5),
  comentario text not null default '' check (char_length(comentario) <= 600),
  creado timestamptz not null default now(),
  unique (negocio_id, autor_id)
);
create index if not exists resenas_por_autor on public.resenas (autor_id);

-- Avisos del comerciante: se acabó algo, ya hay, promoción, regalo, cerrado hoy u otro aviso.
-- «hasta»: después de ese momento el aviso deja de mostrarse (vacío = hasta que el comerciante lo quite).
create table if not exists public.avisos (
  id uuid primary key default gen_random_uuid(),
  negocio_id text not null references public.negocios (id) on delete cascade,
  tipo text not null check (tipo in ('agotado', 'hay', 'promo', 'regalo', 'cerrado', 'general')),
  texto text not null check (char_length(btrim(texto)) between 1 and 300),
  producto_id uuid references public.productos (id) on delete set null,
  festividad text check (festividad is null or char_length(festividad) <= 40),
  creado timestamptz not null default now(),
  hasta timestamptz
);
create index if not exists avisos_por_negocio on public.avisos (negocio_id, creado desc);
create index if not exists avisos_por_vencer on public.avisos (hasta) where hasta is not null;

-- ───────────────────────────── J. RESEÑAS Y AVISOS: FUNCIONES QUE USA LA APP (RPC) ─────────────────────────────

-- La cuenta en sesión deja (o cambia) su reseña de un negocio. NULL = listo; si no, el mensaje de error.
-- Las etiquetas que no estén en la lista de Mercaboot se ignoran.
create or replace function public.guardar_resena(
  p_negocio text, p_estrellas integer, p_etiquetas text[] default '{}', p_comentario text default ''
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_dueno uuid;
  v_nombre text;
  v_et text[];
  v_coment text := btrim(coalesce(p_comentario, ''));
begin
  if v_uid is null then return 'No hay una sesión activa.'; end if;
  select dueno_id into v_dueno from public.negocios where id = p_negocio;
  if not found then return 'Este negocio ya no está disponible.'; end if;
  if v_dueno = v_uid then return 'No puedes calificar tu propio negocio.'; end if;
  if p_estrellas is null or p_estrellas not between 1 and 5 then return 'Elige de 1 a 5 estrellas.'; end if;
  if char_length(v_coment) > 600 then return 'Tu comentario es muy largo (máximo 600 letras).'; end if;
  select coalesce(array_agg(l.e order by l.o), '{}'::text[]) into v_et
  from unnest(array['Producto fresco', 'Buen trato', 'Entrega rápida', 'Buen precio', 'Info actualizada'])
       with ordinality as l (e, o)
  where l.e = any (coalesce(p_etiquetas, '{}'::text[]));
  select nombre into v_nombre from public.perfiles where id = v_uid;
  insert into public.resenas (negocio_id, autor_id, autor_nombre, estrellas, etiquetas, comentario)
  values (p_negocio, v_uid, coalesce(v_nombre, 'Cliente'), p_estrellas, v_et, v_coment)
  on conflict (negocio_id, autor_id)
  do update set estrellas = excluded.estrellas, etiquetas = excluded.etiquetas, comentario = excluded.comentario,
                autor_nombre = excluded.autor_nombre, creado = now();
  return null;
end $$;

-- La cuenta en sesión quita su reseña de un negocio.
create or replace function public.borrar_resena(p_negocio text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Inicia sesión para continuar.'; end if;
  delete from public.resenas where negocio_id = p_negocio and autor_id = v_uid;
end $$;

-- El comerciante publica un aviso en su negocio. NULL = listo; si no, el mensaje de error.
--   · «Ya no hay» / «Ya hay» con un producto lo marca agotado / disponible en el mismo momento.
--   · «Ya no hay», «Ya hay» y «Cerrado hoy» duran hasta el fin del día (hora de Oaxaca) si no se indica otra fecha.
create or replace function public.publicar_aviso(
  p_tipo text, p_texto text, p_producto uuid default null, p_hasta timestamptz default null, p_festividad text default null
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_neg public.negocios%rowtype;
  v_prod public.productos%rowtype;
  v_texto text := btrim(coalesce(p_texto, ''));
  v_fiesta text := nullif(btrim(coalesce(p_festividad, '')), '');
  v_hasta timestamptz := p_hasta;
begin
  if v_uid is null then return 'No hay una sesión activa.'; end if;
  select * into v_neg from public.negocios where dueno_id = v_uid;
  if not found then return 'Tu cuenta no administra ningún negocio.'; end if;
  if p_tipo is null or p_tipo not in ('agotado', 'hay', 'promo', 'regalo', 'cerrado', 'general') then
    return 'Elige qué tipo de aviso quieres publicar.';
  end if;
  if v_texto = '' then return 'Escribe el aviso.'; end if;
  if char_length(v_texto) > 300 then return 'Tu aviso es muy largo (máximo 300 letras).'; end if;
  if v_fiesta is not null and char_length(v_fiesta) > 40 then return 'Esa festividad no es válida.'; end if;
  if p_producto is not null then
    select * into v_prod from public.productos where id = p_producto and negocio_id = v_neg.id;
    if not found then return 'Ese producto no es de tu negocio.'; end if;
    if p_tipo = 'hay' and v_prod.cantidad is not null and v_prod.cantidad <= 0 then
      return format('«%s» tiene 0 existencias. Súbelas en «Productos» para marcarlo como disponible.', v_prod.nombre);
    end if;
  end if;
  if v_hasta is null and p_tipo in ('agotado', 'hay', 'cerrado') then
    v_hasta := ((date_trunc('day', now() at time zone 'America/Mexico_City') + interval '1 day')
                at time zone 'America/Mexico_City') - interval '1 millisecond';
  end if;
  if v_hasta is not null and v_hasta <= now() then return 'La fecha final del aviso ya pasó.'; end if;
  if v_hasta is not null and v_hasta > now() + interval '1 year' then return 'Un aviso puede durar como máximo un año.'; end if;

  -- De paso se limpian los avisos de este negocio que ya vencieron hace más de dos días.
  delete from public.avisos where negocio_id = v_neg.id and hasta is not null and hasta < now() - interval '2 days';
  insert into public.avisos (negocio_id, tipo, texto, producto_id, festividad, hasta)
  values (v_neg.id, p_tipo, v_texto, p_producto, v_fiesta, v_hasta);
  if p_producto is not null and p_tipo in ('agotado', 'hay') then
    update public.productos set disponible = (p_tipo = 'hay') where id = p_producto;
  end if;
  return null;
end $$;

-- El comerciante quita uno de sus avisos.
create or replace function public.quitar_aviso(p_aviso uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Inicia sesión para continuar.'; end if;
  delete from public.avisos a
  where a.id = p_aviso and a.negocio_id = (select n.id from public.negocios n where n.dueno_id = v_uid);
end $$;

-- ───────────────────────────── K. SEGURIDAD (RLS) Y TIEMPO REAL DE LO NUEVO ─────────────────────────────

alter table public.resenas enable row level security;
alter table public.avisos enable row level security;

revoke all on table public.resenas, public.avisos from anon, authenticated;

-- Reseñas y avisos: la app solo los LEE (se escriben con las funciones de arriba).
grant select on public.resenas, public.avisos to authenticated;
-- Productos: el dueño también escribe lo que lee el asistente.
grant insert (tipo, etiquetas, ingrediente) on public.productos to authenticated;
grant update (tipo, etiquetas, ingrediente) on public.productos to authenticated;

-- Las reseñas y los avisos de un negocio los ve cualquier cuenta con sesión (son públicos, como el negocio).
drop policy if exists resenas_ver on public.resenas;
create policy resenas_ver on public.resenas for select to authenticated using (true);
drop policy if exists avisos_ver on public.avisos;
create policy avisos_ver on public.avisos for select to authenticated using (true);

revoke all on function public.guardar_resena(text, integer, text[], text), public.borrar_resena(text),
  public.publicar_aviso(text, text, uuid, timestamptz, text), public.quitar_aviso(uuid)
  from public, anon, authenticated;

grant execute on function public.guardar_resena(text, integer, text[], text) to authenticated;
grant execute on function public.borrar_resena(text) to authenticated;
grant execute on function public.publicar_aviso(text, text, uuid, timestamptz, text) to authenticated;
grant execute on function public.quitar_aviso(uuid) to authenticated;

-- Las reseñas y los avisos también llegan en tiempo real (una promoción nueva aparece al instante en los clientes).
do $$
declare
  t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array array['resenas', 'avisos'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Cada madrugada, pg_cron borra los avisos que vencieron hace más de dos días. Si esta base no tiene pg_cron,
-- no pasa nada: publicar_aviso también limpia los del propio negocio y los vencidos nunca se muestran.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    begin
      create extension if not exists pg_cron;
      perform cron.schedule('mercaboot-limpiar-avisos', '17 9 * * *',
        $cron$delete from public.avisos where hasta is not null and hasta < now() - interval '2 days'$cron$);
    exception when others then
      raise notice 'pg_cron no se pudo activar (%). Los avisos vencidos simplemente no se muestran.', sqlerrm;
    end;
  else
    raise notice 'Esta base no tiene pg_cron: los avisos vencidos simplemente no se muestran.';
  end if;
end $$;

-- ───────────────────────────── AVISAR A LA API ─────────────────────────────
notify pgrst, 'reload schema';
