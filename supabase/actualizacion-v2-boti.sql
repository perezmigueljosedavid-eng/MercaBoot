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

notify pgrst, 'reload schema';
