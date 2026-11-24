-- ============================================================================
-- Mercaboot · versión 2 · eliminar mi cuenta
-- Autor: José David Pérez Miguel
--
-- Solo AGREGA una función: no cambia nada de lo que ya existe, así que las apps anteriores siguen funcionando igual.
-- Se puede correr varias veces sin problema.
--
--   borrar_mi_cuenta(p_confirmacion)     Borra la cuenta de quien la llama y todo lo suyo. Devuelve null si se borró y un
--                                        texto en español si no se pudo (por ejemplo, si tiene pedidos en curso).
--                                        La usa el botón «Eliminar mi cuenta» de la versión 2.
--
-- La función antigua eliminar_mi_cuenta() (sin confirmación) NO se toca: el registro la usa para deshacer una cuenta que quedó
-- a medias, y las apps anteriores dependen de ella. Por eso la nueva tiene otro nombre.
--
-- Qué se borra:  el perfil, favoritos, pedidos, chats y mensajes, reseñas, bloqueos, avisos al teléfono (dispositivos y
--                preferencias) y alertas de productos. Si la persona administra un negocio, se hace lo mismo que con el botón
--                «Dejar de administrar mi negocio» (soltar_negocio): un negocio que ella creó desaparece con sus productos,
--                avisos, chats, pedidos y datos privados de pago; una tienda del directorio de Mercaboot que reclamó vuelve a
--                quedar libre con sus datos originales, para que otra persona pueda reclamarla.
-- Qué se conserva, ya sin nombre ni cuenta:  los reportes que hubo sobre algo que escribió (sin autor), el registro de
--                seguridad (solo «qué pasó y cuándo», sin cuenta ni detalles) y los códigos de barras que ayudó a juntar.
--
-- Cómo se cuida:
--  · Solo borra la cuenta de quien llama (auth.uid()). No recibe ningún identificador: nadie puede borrar la cuenta de otra persona.
--  · Hay que escribir ELIMINAR para confirmar (así no se borra por un toque equivocado).
--  · No deja borrar mientras haya pedidos en curso (pendientes, aceptados o listos), para no dejar a otra persona esperando.
--  · Todo ocurre en una sola operación: si algo falla a la mitad, no se borra nada.
--  · Hay un tope de 5 intentos por hora.
-- ============================================================================

create or replace function public.borrar_mi_cuenta(p_confirmacion text) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_en_curso integer;
  v_motivo text;
begin
  if v_uid is null then return 'Inicia sesión para eliminar tu cuenta.'; end if;
  perform public._limite('cuenta_eliminar', 5, 3600);
  if btrim(coalesce(p_confirmacion, '')) <> 'ELIMINAR' then
    return 'Escribe ELIMINAR (en mayúsculas) para confirmar.';
  end if;

  -- Pedidos que otra persona todavía está esperando (como cliente o como dueño de un negocio)
  select count(*) into v_en_curso
  from public.pedidos p
  where p.estado in ('pendiente', 'aceptado', 'listo')
    and (p.cliente_id = v_uid or exists (select 1 from public.negocios n where n.id = p.negocio_id and n.dueno_id = v_uid));
  if v_en_curso > 0 then
    return 'Tienes pedidos en curso. Termínalos o cancélalos antes de eliminar tu cuenta.';
  end if;

  -- Su negocio, con la misma regla de siempre: lo que ella creó se borra; una tienda del directorio vuelve a quedar libre
  if exists (select 1 from public.negocios n where n.dueno_id = v_uid) then
    v_motivo := public.soltar_negocio();
    if v_motivo is not null then return v_motivo; end if;
  end if;

  -- Rastros que no están atados a la cuenta con llave foránea
  delete from public.limites_uso where usuario_id = v_uid;
  delete from public.intentos_reclamo where clave = 'u:' || v_uid::text;
  update public.reportes set autor_id = null where autor_id = v_uid;

  -- La cuenta. Todo lo demás de la persona (perfil, favoritos, pedidos, mensajes, reseñas, bloqueos, dispositivos, alertas…)
  -- se borra solo porque está atado a la cuenta con «on delete cascade».
  delete from auth.users where id = v_uid;

  -- El registro de seguridad conserva «qué pasó y cuándo», pero ya sin cuenta y sin nombres (también lo que anotó el borrado).
  update public.registro_seguridad set usuario_id = null, detalle = '{}'::jsonb where usuario_id = v_uid;
  return null;
end $$;

revoke all on function public.borrar_mi_cuenta(text) from public, anon;
grant execute on function public.borrar_mi_cuenta(text) to authenticated;

notify pgrst, 'reload schema';
