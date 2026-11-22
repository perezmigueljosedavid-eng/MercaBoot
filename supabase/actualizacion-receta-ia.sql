-- ============================================================================
-- Mercaboot · versión 2 · Recetas con IA («Ideas para cocinar»)
-- Autor: José David Pérez Miguel
--
-- Esta actualización SOLO AGREGA cosas nuevas. No cambia ni borra nada de lo que ya existe,
-- así que la app de la versión final y la de Boti con voz siguen funcionando igual.
--
-- Qué agrega:
--   1) recetas_ia            Una receta guardada por cada cosa que se pidió (caché). Si dos personas piden lo mismo,
--                            la segunda vez sale de aquí y no se vuelve a pagar a la IA.
--                            No guarda quién la pidió: solo el texto del platillo y la receta.
--   2) ia_limite()           Contador de uso por persona y global (reutiliza la tabla limites_uso).
--   3) receta_ia_tocar()     Busca una receta guardada y suma una vista.
--
-- Todo queda cerrado: solo la función «receta-ia» (Edge Function de Supabase) puede leerlo o escribirlo.
-- Las cuentas de la app no tienen permiso directo.
-- ============================================================================

-- 1) Caché de recetas escritas por la IA ------------------------------------
create table if not exists public.recetas_ia (
  id              uuid primary key default gen_random_uuid(),
  clave           text not null,          -- lo que se pidió, en minúsculas y sin acentos
  consulta        text not null,          -- lo que se pidió, ya limpio
  receta          jsonb,                  -- la receta; vacío si lo pedido no era comida
  rechazada       boolean not null default false,
  modelo          text,
  tokens_entrada  integer,
  tokens_salida   integer,
  costo_usd       numeric(10, 6),         -- costo estimado de escribirla (para llevar la cuenta del gasto)
  usos            integer not null default 1,
  creada          timestamptz not null default now(),
  ultimo_uso      timestamptz not null default now(),
  constraint recetas_ia_clave_unica unique (clave),
  constraint recetas_ia_clave_largo check (char_length(clave) between 2 and 120),
  constraint recetas_ia_consulta_largo check (char_length(consulta) between 2 and 120),
  constraint recetas_ia_coherente check (rechazada or receta is not null)
);

comment on table public.recetas_ia is
  'Recetas escritas por la IA (caché). Solo la función receta-ia la lee y la escribe. No guarda quién la pidió.';

alter table public.recetas_ia enable row level security;
revoke all on table public.recetas_ia from public, anon, authenticated;
grant select, insert, update, delete on table public.recetas_ia to service_role;

-- 2) Límite de uso: devuelve true si todavía puede, false si ya se pasó -----------------------------
-- Para una persona se pasa su id; para el tope de todos juntos se usa el id vacío 000…000.
-- Es una sola instrucción atómica: dos peticiones al mismo tiempo no se saltan el límite.
create or replace function public.ia_limite(p_usuario uuid, p_clave text, p_tope integer, p_segundos integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ok boolean;
begin
  if p_usuario is null or coalesce(p_tope, 0) < 1 or coalesce(p_segundos, 0) < 1 then
    return false;
  end if;

  insert into public.limites_uso as l (usuario_id, clave, inicio, cuenta, tope, segundos)
  values (p_usuario, left(p_clave, 60), now(), 1, p_tope, p_segundos)
  on conflict (usuario_id, clave) do update set
    inicio   = case when l.inicio + make_interval(secs => l.segundos) <= now() then now() else l.inicio end,
    cuenta   = case when l.inicio + make_interval(secs => l.segundos) <= now() then 1 else l.cuenta + 1 end,
    tope     = excluded.tope,
    segundos = excluded.segundos
  returning (l.cuenta <= l.tope) into v_ok;

  return coalesce(v_ok, false);
end $$;

revoke execute on function public.ia_limite(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.ia_limite(uuid, text, integer, integer) to service_role;

-- 3) Buscar una receta guardada y sumar una vista --------------------------------------------------
create or replace function public.receta_ia_tocar(p_clave text)
returns table (receta jsonb, rechazada boolean)
language sql
security definer
set search_path = public
as $$
  update public.recetas_ia
     set usos = usos + 1, ultimo_uso = now()
   where clave = p_clave
  returning recetas_ia.receta, recetas_ia.rechazada;
$$;

revoke execute on function public.receta_ia_tocar(text) from public, anon, authenticated;
grant execute on function public.receta_ia_tocar(text) to service_role;

-- ----------------------------------------------------------------------------
-- Para ver cuánto se ha gastado y qué piden más (se corre a mano en el editor SQL de Supabase):
--
--   select count(*) as recetas_nuevas, sum(costo_usd) as gasto_usd, sum(usos) as veces_pedidas
--   from public.recetas_ia where creada > now() - interval '30 days';
--
--   select consulta, usos from public.recetas_ia where not rechazada order by usos desc limit 30;
-- ----------------------------------------------------------------------------
