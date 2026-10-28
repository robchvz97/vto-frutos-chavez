# V/TO · FRÜTOS Chávez

Tablero del **Organizador de Visión y Tracción (V/TO™)** de EOS® para FRÜTOS Chávez.

## ¿Cómo actualizarlo?
Todo el contenido vive en [`data.json`](./data.json).

1. Abre el sitio y presiona **✏️ Editar**.
2. Cambia lo que necesites (formulario o JSON) y presiona **👀 Aplicar vista previa** para verlo.
3. Presiona **⬇️ Descargar data.json** y reemplaza el archivo en este repositorio (`git commit` + `git push`, o súbelo desde GitHub).
4. GitHub Pages se actualiza solo en 1–2 minutos.

Cuando los datos sean reales, cambia `"ejemplo": true` a `false` para quitar el aviso.

### Campos clave
- `traccion.rocas.lista[].estado`: `en curso` · `atrasada` · `completada` (100 % = completada).
- `traccion.temas[].prioridad`: `alta` · `media` · `baja`.
- `traccion.financieros`: cifras mensuales en MXN; deja `null` en los meses sin dato.
