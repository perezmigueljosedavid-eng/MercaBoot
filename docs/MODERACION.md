# Mercaboot · Cómo se revisan los reportes y los bloqueos

| | |
|---|---|
| **Proyecto** | Mercaboot |
| **Autor principal** | José David Pérez Miguel |
| **Segunda autora** | Izebel Altamirano Carreño |
| **Rama** | `version-2` |

© 2026 José David Pérez Miguel. Todos los derechos reservados (ver [LICENSE](../LICENSE)).

Este documento explica, con palabras sencillas, qué hace la app cuando alguien **reporta** o **bloquea**, y cómo revisa los reportes
quien administra Mercaboot. Sirve también como respuesta cuando la tienda de aplicaciones (Google Play) pregunta cómo se cuida el
contenido que escribe la gente.

## 1. Qué puede hacer una persona dentro de la app

| Quiere… | Cómo lo hace |
|---|---|
| Avisar que un **mensaje** es ofensivo o engañoso | En el chat, mantiene el dedo sobre el mensaje de la otra persona y elige el motivo |
| Avisar sobre **una persona** (por cómo escribió o trató) | En el chat, toca los tres puntos de arriba (⋮) → «Reportar al dueño» o «Reportar a este cliente» |
| Avisar sobre **un negocio** (datos o productos falsos, engaños) | En la pantalla del negocio, al final: «Reportar este negocio». También en el menú ⋮ del chat |
| Avisar sobre **una reseña** | En la pestaña Reseñas, debajo de cada reseña ajena: «Reportar» |
| **Dejar de recibir** cosas de alguien | En el chat, ⋮ → «Bloquear». Se desbloquea con el mismo menú o en Perfil → «Personas bloqueadas» |

Los motivos que se ofrecen son: insultos o malos tratos, propaganda o spam, fraude o engaño, contenido inapropiado y otro motivo
(con un espacio de hasta 300 letras para contar qué pasó).

## 2. Qué pasa cuando alguien bloquea

- La persona bloqueada **ya no puede** escribirle mensajes de texto, abrirle un chat ni hacerle pedidos nuevos. Quien bloqueó tampoco
  puede escribirle hasta que la desbloquee.
- **No se le avisa** a la persona bloqueada. Si intenta escribir, le sale un mensaje neutral: «No puedes enviar mensajes en esta conversación».
- Si un cliente bloquea a un negocio, **deja de seguirlo** (sus avisos ya no le llegan).
- Los **pedidos que ya estaban en marcha** se pueden terminar con normalidad: las tarjetas y avisos automáticos de un pedido no se bloquean,
  para que nadie se quede con dinero o producto a medias por un bloqueo.
- Cada persona puede bloquear hasta 200 personas y hasta 30 bloqueos por hora.

Todo esto lo hace la base de datos (no solo la pantalla), así que no se puede saltar con una versión modificada de la app.

## 3. Qué se guarda de un reporte

Cada reporte es una fila de la tabla `reportes` con: quién reportó, qué tipo de cosa es (mensaje, reseña, negocio, producto, aviso o
persona), el motivo, lo que contó la persona, **una copia del texto reportado** (por si después lo borran), de quién es lo reportado, el
estado (`nuevo`, `revisado`, `atendido` o `descartado`) y la fecha.

- Nadie puede leer esa tabla desde la app: **solo quien administra la base de datos** (Supabase). La persona reportada nunca la ve.
- Una persona solo puede reportar una vez la misma cosa, y hasta 20 reportes por hora (así nadie inunda de reportes falsos).
- Solo se puede reportar un mensaje de una conversación en la que se participa, y a una persona con quien se tiene (o se tuvo) un chat.
- Si quien reportó borra su cuenta, el reporte se conserva sin su nombre.

## 4. Cómo revisar los reportes (para quien administra)

Se hace en **Supabase → SQL Editor** (el sitio donde está la base de datos). Se pega la consulta y se toca «Run».

### 4.1 Ver los reportes nuevos

```sql
select r.creado,
       r.tipo,
       r.motivo,
       r.detalle,
       r.contenido                              as texto_reportado,
       coalesce(pa.nombre, '(cuenta borrada)')  as de_quien,
       coalesce(pr.nombre, '(cuenta borrada)')  as reportado_por,
       r.objeto_id,
       r.id                                     as id_del_reporte
  from public.reportes r
  left join public.perfiles pa on pa.id = r.autor_id
  left join public.perfiles pr on pr.id = r.reportante_id
 where r.estado = 'nuevo'
 order by r.creado desc;
```

### 4.2 Ver quién acumula más reportes

```sql
select coalesce(p.nombre, '(cuenta borrada)') as persona,
       r.autor_id,
       count(*)                                as reportes,
       count(distinct r.reportante_id)         as personas_distintas
  from public.reportes r
  left join public.perfiles p on p.id = r.autor_id
 where r.autor_id is not null
 group by r.autor_id, p.nombre
 order by reportes desc
 limit 20;
```

Varios reportes de **personas distintas** sobre la misma cuenta pesan más que muchos reportes de una sola persona.

### 4.3 Qué hacer según lo que se encuentre

Siempre se empieza **leyendo el texto reportado** y, si hace falta, la conversación completa. Después se elige lo más suave que resuelva el problema:

| Situación | Qué hacer |
|---|---|
| El reporte no tiene razón | Marcarlo como `descartado` |
| Mensaje ofensivo aislado | Marcarlo como `atendido` (la persona que reportó ya puede bloquear) |
| Reseña abusiva | Borrar la reseña (abajo) y marcar el reporte |
| Aviso o producto falso | Borrarlo (abajo) y marcar el reporte |
| Negocio que engaña | Hablar con el dueño; si sigue, cerrarlo o borrarlo (abajo) |
| Cuenta que acosa o estafa, varias personas distintas | Suspender la cuenta (abajo) |

Marcar un reporte (cambia solo el estado; pon el id del reporte entre las comillas):

```sql
update public.reportes set estado = 'atendido' where id = 'PEGA-AQUI-EL-ID-DEL-REPORTE';
-- otros estados: 'revisado' (ya lo vi) · 'descartado' (no procede)
```

Borrar lo reportado (usa el `objeto_id` que salió en la consulta 4.1; **borrar no se puede deshacer**):

```sql
delete from public.resenas   where id = 'PEGA-AQUI-EL-OBJETO_ID';   -- reseña
delete from public.mensajes  where id = 'PEGA-AQUI-EL-OBJETO_ID';   -- mensaje
delete from public.avisos    where id = 'PEGA-AQUI-EL-OBJETO_ID';   -- aviso de un negocio
delete from public.productos where id = 'PEGA-AQUI-EL-OBJETO_ID';   -- producto
```

Cerrar un negocio sin borrarlo (el dueño puede volver a abrirlo; sirve como llamada de atención):

```sql
update public.negocios set abierto = false where id = 'PEGA-AQUI-EL-OBJETO_ID';
```

Suspender una cuenta: en **Supabase → Authentication → Users** se busca la cuenta por correo y, en el menú de esa cuenta, hay opciones para
bloquearla (*Ban user*) o eliminarla. Los nombres de los botones pueden cambiar un poco con el tiempo. Suspender es mejor que eliminar:
conserva las pruebas y se puede revertir si hubo un error.

### 4.4 Cuánto tardar y cuánto guardar

- Meta sugerida: revisar los reportes `nuevo` **dentro de 48 horas**. Un reporte de acoso, amenazas o contenido sexual con menores se atiende el mismo día.
- Si hay una amenaza real contra alguien o contenido ilegal, no basta con borrarlo: guarda la evidencia y avisa a las autoridades correspondientes.
- Los reportes ya resueltos contienen copias de mensajes de otras personas: no hay que guardarlos para siempre. Esta consulta borra los de más de 12 meses ya resueltos:

```sql
delete from public.reportes
 where estado in ('atendido', 'descartado')
   and creado < now() - interval '12 months';
```

## 5. Reglas de la comunidad (para mostrar en la app y en la ficha de la tienda)

Mercaboot es para que los vecinos encuentren lo que necesitan en los negocios de su zona. Dentro de la app **no se permite**:

1. Insultar, amenazar, acosar o discriminar a otra persona.
2. Mandar propaganda o mensajes repetidos que no tienen que ver con comprar o vender.
3. Engañar: publicar productos, precios o negocios falsos, pedir dinero de forma rara o hacerse pasar por otra persona.
4. Publicar contenido sexual, violento o ilegal, o vender cosas prohibidas por la ley.
5. Escribir reseñas falsas, ya sea para subir o para bajar la calificación de un negocio.

Quien rompa estas reglas puede ser bloqueado por otras personas, tener su contenido borrado o su cuenta suspendida.

## 6. Cómo se instala en la base de datos

El archivo [`supabase/actualizacion-v2-reportes.sql`](../supabase/actualizacion-v2-reportes.sql) crea las dos tablas (`bloqueos` y
`reportes`), las funciones que usa la app y tres revisiones automáticas (en mensajes, chats y pedidos). **Solo agrega**: no cambia nada de lo
que ya existe, así que las versiones anteriores de la app siguen funcionando igual, y se puede ejecutar más de una vez sin problema.
Antes de dejarlo así se probó con 117 comprobaciones automáticas (bloqueos en los dos sentidos, reportes, límites, tablas cerradas).

Si la base de datos todavía no tiene este archivo, la app sigue funcionando y, al intentar reportar o bloquear, avisa con un texto amable
que la opción aún no está disponible.
