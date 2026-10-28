# FRÜTOS Chávez · Sistema de ejecución EOS

Tablero público: **https://robchvz97.github.io/vto-frutos-chavez/**

Sistema de planeación y ejecución basado en EOS®: el **V/TO™** fija las metas de la empresa, que se desglosan en **Rocas** (90 días) y éstas en **To-Dos** (7 días). Los **Temas** se resuelven con **IDS** y generan To-Dos. Todo se revisa cada semana en la junta **Level 10™**.

```
Meta a 10 años → Imagen a 3 años → Plan a 1 año (metas) → Rocas (90 días) → To-Dos (7 días)
                                                     Temas (IDS) ──────────→ To-Dos
Scorecard: 5–15 medibles semanales, 13 semanas, rojo/verde
```

## Vistas
| Pestaña | Para qué |
|---|---|
| **Mis To-Dos** (inicio) | Escoge tu nombre (se recuerda). Tus To-Dos: Vencidos / Esta semana / Hecho, con la Roca y la Meta a la que sirven. % de To-Dos hechos en la semana (meta EOS: 90%), tus Rocas y tus medibles. |
| **Rocas** | Rocas del trimestre por dueño, con estado (en camino / fuera / hecha), meta anual y sus To-Dos. |
| **Temas (IDS)** | Lista de temas, Top 3 por prioridad, estado Identificado → Discutiendo → Resuelto. “Solucionar → To-Do” guarda la solución y crea el To-Do. |
| **Level 10** | La junta semanal con la agenda oficial y relojes: Segue 5′, Scorecard 5′, Rocas 5′, Titulares 5′, To-Dos 5′, IDS 60′, Conclusión 5′ (calificación 1–10). |
| **V/TO** | La visión en una página y la cascada Meta → Rocas → To-Dos con avance. |

## Cómo se guardan los cambios
- **La fuente de verdad es `data.json`** en este repositorio.
- En el navegador puedes palomear To-Dos, agregar To-Dos y Temas, cambiar estados, capturar el Scorecard y calificar la junta. Se guardan en ese navegador y aparece la barra **“Cambios sin publicar”**.
- **Publicar**:
  - *Con token* (⚙︎ Ajustes): guarda `data.json` directo en GitHub; el otro socio lo ve en 1–2 min. Cada quien necesita su propio token *fine-grained* con acceso sólo a este repositorio y permiso **Contents: Read and write** (el socio debe ser colaborador del repo). El token vive sólo en el navegador (localStorage); **nunca** se sube al repositorio.
  - *Sin token*: descarga `data.json` para subirlo al repositorio (o mandárselo al asistente).
- Si alguien publicó mientras tú tenías cambios, el tablero avisa y te deja recuperar o descartar tus cambios.

## Junta Level 10 semanal (resumen)
1. Antes: cada quien palomea sus To-Dos y captura sus números del Scorecard de la semana pasada.
2. En la junta: abrir la pestaña **Level 10** e “Iniciar junta”. Lo que esté fuera (medible, Roca, titular) se baja a Temas con “→ Tema”.
3. IDS: prioridad 1, 2, 3 y resolver en orden. Cada solución = To-Do con dueño y fecha (7 días).
4. Conclusión: repasar To-Dos nuevos, mensajes a comunicar, calificar 1–10. **Publicar**.
5. Cada trimestre: nuevas Rocas (3–7 por empresa, cada una ligada a una meta anual). Cada año: revisar el V/TO.

## Modelo de datos (`data.json`)
| Campo | Qué es |
|---|---|
| `ejemplo` | `true` muestra el aviso “Datos de ejemplo”. Cambiar a `false` con datos reales. |
| `empresa`, `actualizado` | Nombre y fecha de última publicación (AAAA-MM-DD). |
| `personas[]` | `{id, nombre}`. Los `id` (`roberto`, `socio`) se usan en todo el archivo; para cambiar el nombre del socio sólo se edita `nombre`. |
| `github` | Repositorio donde publica el botón (no contiene secretos). |
| `trimestre` | `{nombre, inicio, fin}` del trimestre actual. |
| `vto.valores[]` | Valores centrales `{nombre, descripcion}`. |
| `vto.enfoque` | `{proposito, nicho}`. |
| `vto.meta10` | `{fecha, texto}`. |
| `vto.marketing` | `{mercado, unicos[3], proceso, garantia}`. |
| `vto.imagen3` | `{fecha, ingresos, utilidad, medibles[], comoSeVe[]}`. |
| `vto.plan1` | `{fecha, ingresos, utilidad, medibles[]}`. |
| `metas[]` | Metas del plan a 1 año (1–7): `{id, texto, dueno}`. |
| `rocas[]` | `{id, texto, dueno, metaId, estado: en_camino \| fuera \| hecha, fecha}`. |
| `todos[]` | `{id, texto, dueno, fecha, hecho, hechoEl, rocaId \| null, temaId \| null, creado}`. |
| `temas[]` | `{id, texto, dueno, prioridad: 1 \| 2 \| 3 \| null, estado: identificado \| discutiendo \| resuelto, solucion, creado}`. |
| `scorecard[]` | `{id, nombre, dueno, operador: ">=" \| "<=", meta, unidad: "$" \| "%" \| "", valores: {"AAAA-MM-DD (lunes)": número}}`. |
| `juntas[]` | `{fecha, calificaciones: {persona: 1–10}, titulares[], mensajes[]}`. |
| `responsabilidades[]` | Gráfica de responsabilidades: `{asiento, persona, roles[]}`. |

Sitio estático sin compilación: `index.html`, `styles.css`, `app.js`, `data.json`. Metodología: [EOS Worldwide](https://www.eosworldwide.com/blog/whats-in-your-v-to).
