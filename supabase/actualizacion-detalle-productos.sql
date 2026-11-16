-- ─────────────────────────────────────────────────────────────────────────────
-- ACTUALIZACIÓN: DETALLE DE PRODUCTO
-- Para bases que ya estaban instaladas antes de esta mejora. Las instalaciones
-- nuevas no necesitan correr esto: ya viene incluido en esquema.sql (sección L).
-- Se puede correr varias veces sin problema.
--
-- Qué agrega a cada producto:
--   · descripcion ....... texto corto que el cliente ve al tocar el producto
--   · caracteristicas ... hasta 6 puntos, como «Ideal para caldos» (máx. 60 letras)
--   · foto_uri .......... foto opcional, guardada como imagen dentro del texto
--   · medios ............ si se puede pedir en medios (½, 1 ½, 2 ½…); si queda
--                         vacío, la app decide: kilos y litros sí, lo demás no
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.productos
  add column if not exists descripcion text,
  add column if not exists caracteristicas text[],
  add column if not exists foto_uri text,
  add column if not exists medios boolean;

-- ¿La lista trae pocos textos y todos cortos? (así se revisan las características)
create or replace function public.lista_de_textos_cortos(textos text[], cuantos integer, largo integer)
returns boolean
language sql immutable
as $$
  select textos is null
      or (cardinality(textos) <= cuantos
          and not exists (select 1 from unnest(textos) as t where t is null or btrim(t) = '' or char_length(t) > largo));
$$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'productos_descripcion_corta') then
    alter table public.productos add constraint productos_descripcion_corta
      check (descripcion is null or char_length(descripcion) <= 500);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'productos_caracteristicas_cortas') then
    alter table public.productos add constraint productos_caracteristicas_cortas
      check (public.lista_de_textos_cortos(caracteristicas, 6, 60));
  end if;
  -- Igual que el logo del negocio: solo imágenes guardadas dentro del texto, con tope de tamaño.
  if not exists (select 1 from pg_constraint where conname = 'productos_foto_es_imagen') then
    alter table public.productos add constraint productos_foto_es_imagen
      check (foto_uri is null or (char_length(foto_uri) <= 200000 and foto_uri ~ '^data:image/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$'));
  end if;
end $$;

-- La función es interna: la app no la llama directamente.
revoke all on function public.lista_de_textos_cortos(text[], integer, integer) from public, anon, authenticated;

-- El comerciante puede guardar estos campos desde la app (solo en sus productos, por las políticas de siempre).
grant insert (descripcion, caracteristicas, foto_uri, medios) on public.productos to authenticated;
grant update (descripcion, caracteristicas, foto_uri, medios) on public.productos to authenticated;
