/* FRÜTOS Chávez · Sistema EOS — fuente de verdad: data.json del repositorio */
(() => {
"use strict";

/* ===== utilidades ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const aFecha = (s) => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, m - 1, d); };
const hoyISO = () => iso(new Date());
const sumarDias = (s, n) => { const d = aFecha(s); d.setDate(d.getDate() + n); return iso(d); };
const lunesDe = (s) => { const d = aFecha(s); const w = (d.getDay() + 6) % 7; d.setDate(d.getDate() - w); return iso(d); };
const diasEntre = (a, b) => Math.round((aFecha(b) - aFecha(a)) / 864e5);
const fCorta = (s) => s ? aFecha(s).toLocaleDateString("es-MX", { day: "numeric", month: "short" }).replace(".", "") : "";
const fLarga = (s) => s ? aFecha(s).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }) : "—";
const dinero = (n) => n == null || n === "" ? "—" : new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
const num = (n, u) => n == null || n === "" ? "" : u === "$" ? "$" + Number(n).toLocaleString("es-MX") : Number(n).toLocaleString("es-MX") + (u === "%" ? "%" : "");
const nuevoId = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const clon = (o) => JSON.parse(JSON.stringify(o));
const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
const b64aTexto = (b) => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\s/g, "")), (c) => c.charCodeAt(0)));
const textoAb64 = (t) => { const by = new TextEncoder().encode(t); let s = ""; for (let i = 0; i < by.length; i += 0x8000) s += String.fromCharCode.apply(null, by.subarray(i, i + 0x8000)); return btoa(s); };
function aviso(msg, ms = 2800) { const a = $("#aviso"); a.textContent = msg; a.classList.add("ver"); clearTimeout(a._t); a._t = setTimeout(() => a.classList.remove("ver"), ms); }

/* ===== estado ===== */
const LS = { local: "eos-local", persona: "eos-persona", tema: "eos-tema", token: "eos-gh-token", repo: "eos-gh-repo", l10: "eos-l10" };
let pub = null;      // data.json publicado
let base = "";       // hash del publicado sobre el que se hicieron los cambios
let D = null;        // datos de trabajo
let pendiente = null; // cambios locales basados en una versión anterior
let vista = "todos";

const canon = (o) => JSON.stringify(o);
const sucio = () => pub && canon(D) !== canon(pub);
function guardar() {
  localStorage.setItem(LS.local, JSON.stringify({ base, data: D, sucio: !!sucio() }));
  pintarBarra();
}
function cambiar(fn, msg) { fn(); guardar(); render(); if (msg) aviso(msg); }

/* ===== modelo ===== */
const personas = () => D.personas || [];
const nombre = (id) => (personas().find((p) => p.id === id) || {}).nombre || id || "—";
const persona = () => { const p = localStorage.getItem(LS.persona); return personas().some((x) => x.id === p) ? p : personas()[0]?.id; };
const roca = (id) => D.rocas.find((r) => r.id === id);
const meta = (id) => D.metas.find((m) => m.id === id);
const tema = (id) => D.temas.find((t) => t.id === id);
const todosDe = (k, id) => D.todos.filter((t) => t[k] === id);
const ESTADOS_ROCA = [["en_camino", "En camino"], ["fuera", "Fuera"], ["hecha", "Hecha"]];
const ESTADOS_TEMA = [["identificado", "Identificado"], ["discutiendo", "Discutiendo"], ["resuelto", "Resuelto"]];
const rocasTrim = () => D.rocas;

function semanaActual() { const l = lunesDe(hoyISO()); return [l, sumarDias(l, 6)]; }
function pctSemana(dueno) {
  const [l, dom] = semanaActual();
  const xs = D.todos.filter((t) => (!dueno || t.dueno === dueno) && t.fecha >= l && t.fecha <= dom);
  const vencidosAbiertos = D.todos.filter((t) => (!dueno || t.dueno === dueno) && !t.hecho && t.fecha < l);
  const total = xs.length + vencidosAbiertos.length, hechos = xs.filter((t) => t.hecho).length;
  return { total, hechos, pct: total ? Math.round((hechos / total) * 100) : null };
}
function semanas13() { const l = lunesDe(hoyISO()); return Array.from({ length: 13 }, (_, i) => sumarDias(l, (i - 12) * 7)); }
function colorMedible(m, v) { if (v == null || v === "") return ""; const ok = m.operador === "<=" ? Number(v) <= Number(m.meta) : Number(v) >= Number(m.meta); return ok ? "verde" : "rojo"; }
function progresoRoca(r) { if (r.estado === "hecha") return 100; const t = todosDe("rocaId", r.id); return t.length ? Math.round((t.filter((x) => x.hecho).length / t.length) * 90) : 0; }

/* ===== piezas de UI ===== */
function ligaTexto(t) {
  if (t.rocaId && roca(t.rocaId)) { const r = roca(t.rocaId), m = meta(r.metaId); return `<span class="liga">Roca: <b>${esc(r.texto)}</b>${m ? ` · Meta: ${esc(m.texto)}` : ""}</span>`; }
  if (t.temaId && tema(t.temaId)) return `<span class="liga">Tema: <b>${esc(tema(t.temaId).texto)}</b></span>`;
  return `<span class="liga">Sin ligar</span>`;
}
function itemTodo(t, opts = {}) {
  const hoy = hoyISO(), venc = !t.hecho && !!t.fecha && t.fecha < hoy;
  const fecha = t.hecho ? `Hecho ${fCorta(t.hechoEl)}` : venc ? `<span class="venc">Vencido ${fCorta(t.fecha)} (${diasEntre(t.fecha, hoy)} d)</span>` : `Para ${fCorta(t.fecha)}`;
  return `<li class="item ${t.hecho ? "hecho" : ""}">
    <input type="checkbox" class="check" data-act="toggle-todo" data-id="${t.id}" ${t.hecho ? "checked" : ""} aria-label="Marcar como hecho">
    <div class="cuerpo"><div class="tit">${esc(t.texto)}</div>
      <div class="sub">${opts.dueno ? esc(nombre(t.dueno)) + " · " : ""}${fecha}${opts.sinLiga ? "" : " · " + ligaTexto(t)}</div></div>
    <button class="x" data-act="borrar-todo" data-id="${t.id}" title="Borrar" aria-label="Borrar">✕</button></li>`;
}
function selPersonas(name, sel) { return `<select name="${name}">${personas().map((p) => `<option value="${p.id}" ${p.id === sel ? "selected" : ""}>${esc(p.nombre)}</option>`).join("")}</select>`; }
function selLiga(sel) {
  const rs = rocasTrim().filter((r) => r.estado !== "hecha"), ts = D.temas.filter((t) => t.estado !== "resuelto");
  return `<select name="liga" aria-label="Ligar a"><option value="">Sin ligar</option>
    <optgroup label="Rocas">${rs.map((r) => `<option value="r:${r.id}" ${sel === "r:" + r.id ? "selected" : ""}>${esc(r.texto)}</option>`).join("")}</optgroup>
    <optgroup label="Temas">${ts.map((t) => `<option value="t:${t.id}" ${sel === "t:" + t.id ? "selected" : ""}>${esc(t.texto)}</option>`).join("")}</optgroup></select>`;
}
function formTodo({ dueno, liga = "", placeholder = "Nuevo To-Do (7 días)…" } = {}) {
  return `<form class="agregar" data-form="todo">
    <div class="principal"><input name="texto" required placeholder="${placeholder}" aria-label="Nuevo To-Do"><button class="btn pri">Agregar</button></div>
    <div class="opciones">${selPersonas("dueno", dueno)}<input type="date" name="fecha" value="${sumarDias(hoyISO(), 7)}" aria-label="Fecha">${selLiga(liga)}</div></form>`;
}
const seg = (act, id, opciones, val) => `<div class="seg">${opciones.map(([v, t]) => `<button type="button" data-act="${act}" data-id="${id}" data-val="${v}" class="${v === val ? "on" : ""}">${t}</button>`).join("")}</div>`;

/* ===== vistas ===== */
function vTodos() {
  const p = persona(), hoy = hoyISO();
  const mios = D.todos.filter((t) => t.dueno === p);
  const venc = mios.filter((t) => !t.hecho && t.fecha < hoy).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const prox = mios.filter((t) => !t.hecho && t.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const hechos = mios.filter((t) => t.hecho && t.hechoEl && diasEntre(t.hechoEl, hoy) <= 7).sort((a, b) => b.hechoEl.localeCompare(a.hechoEl));
  const misRocas = rocasTrim().filter((r) => r.dueno === p);
  const s = pctSemana(p);
  const ultima = semanas13()[11];
  const meds = D.scorecard.filter((m) => m.dueno === p), verdes = meds.filter((m) => colorMedible(m, m.valores[ultima]) === "verde").length;
  const lista = (xs, vacio) => xs.length ? `<ul class="lista">${xs.map((t) => itemTodo(t)).join("")}</ul>` : `<div class="vacio">${vacio}</div>`;
  return `
  <div class="fila-entre"><div class="personas" role="tablist">${personas().map((x) => `<button data-act="persona" data-id="${x.id}" class="${x.id === p ? "on" : ""}">${esc(x.nombre)}</button>`).join("")}</div>
    <span class="tenue chico">Semana del ${fCorta(semanaActual()[0])} al ${fCorta(semanaActual()[1])}</span></div>
  <div class="tira">
    <div class="dato"><div class="num ${s.pct == null ? "" : s.pct >= 90 ? "verde" : "rojo"}">${s.pct == null ? "—" : s.pct + "%"}</div><div class="et">To-Dos hechos esta semana · meta 90%</div></div>
    <div class="dato"><div class="num">${misRocas.length ? misRocas.filter((r) => r.estado !== "fuera").length + "/" + misRocas.length : "—"}</div><div class="et">Mis Rocas en camino</div></div>
    <div class="dato"><div class="num ${!meds.length ? "" : verdes < meds.length ? "rojo" : "verde"}">${meds.length ? verdes + "/" + meds.length : "—"}</div><div class="et">Mis medibles en verde (sem. ${fCorta(ultima)})</div></div>
  </div>
  <div class="chico" style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:4px">${misRocas.map((r) => `<span style="display:inline-flex;gap:6px;align-items:center"><span class="punto p-${r.estado}"></span>${esc(r.texto)}</span>`).join("") || '<span class="tenue">Aún no tienes Rocas este trimestre.</span>'}</div>
  ${formTodo({ dueno: p })}
  <div class="grupo"><h2>Vencidos <span class="cuenta">${venc.length}</span></h2>${lista(venc, "Nada vencido.")}</div>
  <div class="grupo"><h2>Esta semana <span class="cuenta">${prox.length}</span></h2>${lista(prox, mios.length ? "Sin pendientes esta semana." : "Sin To-Dos. Agrega el primero arriba.")}</div>
  <div class="grupo"><h2>Hecho (últimos 7 días) <span class="cuenta">${hechos.length}</span></h2>${lista(hechos, "Aún nada hecho esta semana.")}</div>`;
}

function tarjetaRoca(r, conDueno) {
  const m = meta(r.metaId), ts = todosDe("rocaId", r.id), abiertos = ts.filter((t) => !t.hecho), hechos = ts.filter((t) => t.hecho);
  return `<div class="roca">
    <div class="cab"><div><div class="tit">${esc(r.texto)}</div>
      <div class="meta">${conDueno ? esc(nombre(r.dueno)) + " · " : ""}Meta anual: ${m ? esc(m.texto) : "<span class='rojo'>sin meta</span>"}${r.fecha ? " · Fecha " + fCorta(r.fecha) : ""}</div></div><button class="x" data-act="borrar-roca" data-id="${r.id}" title="Borrar Roca" aria-label="Borrar Roca">✕</button></div>
    ${seg("estado-roca", r.id, ESTADOS_ROCA, r.estado)}
    <div class="barra"><i style="width:${progresoRoca(r)}%"></i></div>
    <div class="tenue chico">To-Dos: ${hechos.length} hechos · ${abiertos.length} abiertos</div>
    <ul class="lista">${[...abiertos, ...hechos].map((t) => itemTodo(t, { sinLiga: true, dueno: t.dueno !== r.dueno })).join("")}</ul>
    <details><summary>+ To-Do para esta Roca</summary>${formTodo({ dueno: r.dueno, liga: "r:" + r.id })}</details>
  </div>`;
}
function formRoca() {
  return `<form class="agregar" data-form="roca"><div class="principal"><input name="texto" required placeholder="Nueva Roca (90 días)…" aria-label="Nueva Roca"><button class="btn pri">Agregar</button></div>
    <div class="opciones">${selPersonas("dueno", persona())}<input type="date" name="fecha" value="${D.trimestre?.fin || ""}" aria-label="Fecha">
    <select name="metaId" aria-label="Meta anual"><option value="">${D.metas.length ? "Meta anual…" : "Sin metas anuales aún (agrégalas en V/TO)"}</option>${D.metas.map((m) => `<option value="${m.id}">${esc(m.texto)}</option>`).join("")}</select></div></form>`;
}
function vRocas() {
  const t = D.trimestre || {}, rs = rocasTrim();
  const dias = t.fin ? diasEntre(hoyISO(), t.fin) : null;
  return `<div class="fila-entre"><h1>Rocas ${esc(t.nombre || "")}</h1><span class="tenue">${dias != null ? `Faltan ${dias} días · cierra ${fLarga(t.fin)}` : ""}</span></div>
  <p class="tenue">Prioridades de 90 días. Cada Roca tiene un solo dueño y sirve a una meta del plan anual. En el Level 10 sólo se dice: en camino o fuera.</p>
  <div class="tira">
    <div class="dato"><div class="num verde">${rs.filter((r) => r.estado === "en_camino").length}</div><div class="et">En camino</div></div>
    <div class="dato"><div class="num rojo">${rs.filter((r) => r.estado === "fuera").length}</div><div class="et">Fuera de camino</div></div>
    <div class="dato"><div class="num">${rs.filter((r) => r.estado === "hecha").length}</div><div class="et">Hechas</div></div>
  </div>
  ${formRoca()}
  ${rs.length ? "" : '<p class="vacio">Aún no hay Rocas este trimestre. Defínanlas en la junta trimestral (3 a 7, cada una con un dueño).</p>'}
  <div class="duenos">${personas().map((p) => `<div><h2>${esc(p.nombre)}</h2>${rs.filter((r) => r.dueno === p.id).map((r) => tarjetaRoca(r)).join("") || '<p class="tenue">Sin Rocas para ' + esc(p.nombre) + '.</p>'}</div>`).join("")}</div>`;
}

function itemTema(t) {
  const ts = todosDe("temaId", t.id);
  return `<li class="item"><div class="prio">${t.prioridad || "·"}</div><div class="cuerpo">
    <div class="tit">${esc(t.texto)}</div>
    <div class="sub">Lo trajo ${esc(nombre(t.dueno))} · desde ${fCorta(t.creado)}</div>
    ${t.solucion ? `<div class="sub"><b>Solución:</b> ${esc(t.solucion)}</div>` : ""}
    ${ts.length ? `<ul class="lista" style="border-top:0;margin-top:4px">${ts.map((x) => itemTodo(x, { sinLiga: true, dueno: true })).join("")}</ul>` : ""}
    <div class="tema-acc">${seg("estado-tema", t.id, ESTADOS_TEMA, t.estado)}
      <select data-act="prio-tema" data-id="${t.id}" aria-label="Prioridad"><option value="">Sin prioridad</option>${[1, 2, 3].map((n) => `<option value="${n}" ${t.prioridad === n ? "selected" : ""}>Prioridad ${n}</option>`).join("")}</select>
      ${t.estado !== "resuelto" ? `<button class="btn mini" data-act="abrir-solucion" data-id="${t.id}">Solucionar → To-Do</button>` : ""}
      <button class="x" data-act="borrar-tema" data-id="${t.id}" title="Borrar tema" aria-label="Borrar tema">✕</button></div>
    <div id="sol-${t.id}"></div></div></li>`;
}
function formSolucion(t) {
  return `<form class="solucion" data-form="solucion" data-id="${t.id}">
    <label class="campo">Solución acordada<textarea name="solucion" placeholder="¿Qué decidimos?">${esc(t.solucion || "")}</textarea></label>
    <label class="campo" style="margin-top:8px">To-Do que sale de aquí<input name="texto" placeholder="Acción concreta (7 días)"></label>
    <div class="fila" style="margin-top:8px">${selPersonas("dueno", t.dueno)}<input type="date" name="fecha" value="${sumarDias(hoyISO(), 7)}">
      <label class="chico" style="display:flex;gap:6px;align-items:center"><input type="checkbox" name="resolver" checked style="min-height:0"> Marcar resuelto</label>
      <button class="btn pri">Guardar</button></div></form>`;
}
function ordenTemas(xs) { return xs.slice().sort((a, b) => (a.prioridad || 99) - (b.prioridad || 99) || String(a.creado).localeCompare(String(b.creado))); }
function vTemas() {
  const abiertos = D.temas.filter((t) => t.estado !== "resuelto"), top = ordenTemas(abiertos.filter((t) => t.prioridad)), resto = ordenTemas(abiertos.filter((t) => !t.prioridad)), res = D.temas.filter((t) => t.estado === "resuelto");
  return `<h1>Temas (IDS)</h1>
  <p class="tenue">Problemas, obstáculos, ideas y oportunidades. En el Level 10 se escogen los 3 más importantes y se resuelven en orden: <b>Identificar</b> la causa raíz, <b>Discutir</b> una vez, <b>Solucionar</b> con un To-Do con dueño.</p>
  <form class="agregar" data-form="tema"><div class="principal"><input name="texto" required placeholder="Nuevo tema…" aria-label="Nuevo tema"><button class="btn pri">Agregar</button></div>
    <div class="opciones">${selPersonas("dueno", persona())}</div></form>
  <div class="grupo"><h2>Top 3 <span class="cuenta">${top.length}</span></h2>${top.length ? `<ul class="lista">${top.map(itemTema).join("")}</ul>` : '<div class="vacio">Asigna prioridad 1, 2 y 3 a los temas más importantes.</div>'}</div>
  <div class="grupo"><h2>Lista <span class="cuenta">${resto.length}</span></h2>${resto.length ? `<ul class="lista">${resto.map(itemTema).join("")}</ul>` : '<div class="vacio">Sin temas. Agrega el primero arriba.</div>'}</div>
  <details class="grupo"><summary>Resueltos (${res.length})</summary><ul class="lista">${res.map(itemTema).join("")}</ul></details>`;
}

/* ----- Level 10 ----- */
const SEGMENTOS = [
  { id: "segue", nombre: "Segue", min: 5, guia: "Cada quien comparte una buena noticia personal y una de negocio de la última semana." },
  { id: "scorecard", nombre: "Scorecard", min: 5, guia: "Cada dueño dice su número: en meta o fuera. Sin discusión. Lo que esté fuera, se baja a Temas." },
  { id: "rocas", nombre: "Rocas", min: 5, guia: "Cada dueño dice: en camino o fuera. Sin discusión. Lo que esté fuera, se baja a Temas." },
  { id: "titulares", nombre: "Titulares", min: 5, guia: "Noticias breves de clientes y empleados, buenas o malas. Las preocupaciones se bajan a Temas." },
  { id: "todos", nombre: "To-Dos", min: 5, guia: "Revisar los To-Dos de la semana: hecho o no hecho. Meta: 90% hechos. Ninguno debe pasar de 2 semanas." },
  { id: "ids", nombre: "IDS", min: 60, guia: "Escoger los 3 temas más importantes y resolverlos en orden. Identificar la causa raíz, Discutir (cada quien habla una vez), Solucionar con un To-Do." },
  { id: "cierre", nombre: "Conclusión", min: 5, guia: "Repasar los To-Dos nuevos, acordar mensajes a comunicar al equipo y calificar la junta del 1 al 10 (meta: 8+)." },
];
let L = (() => { try { return JSON.parse(localStorage.getItem(LS.l10)) || null; } catch { return null; } })() || { seg: 0, corriendo: false, inicioSeg: null, acum: Array(7).fill(0), inicioJunta: null };
const guardarL = () => localStorage.setItem(LS.l10, JSON.stringify(L));
const segTranscurrido = (i) => L.acum[i] + (L.corriendo && L.seg === i && L.inicioSeg ? (Date.now() - L.inicioSeg) / 1000 : 0);
const mmss = (s) => { const neg = s < 0; s = Math.abs(Math.round(s)); return (neg ? "-" : "") + Math.floor(s / 60) + ":" + pad(s % 60); };
function junta() { const f = hoyISO(); let j = D.juntas.find((x) => x.fecha === f); return j; }
function juntaOCrear() { let j = junta(); if (!j) { j = { fecha: hoyISO(), calificaciones: {}, titulares: [], mensajes: [] }; D.juntas.push(j); } return j; }

function formMedible() {
  return `<form class="agregar" data-form="medible"><div class="principal"><input name="nombre" required placeholder="Nuevo medible semanal…" aria-label="Nuevo medible"><button class="btn pri">Agregar</button></div>
    <div class="opciones">${selPersonas("dueno", persona())}<select name="operador" aria-label="Regla"><option value=">=">≥ (más es mejor)</option><option value="<=">≤ (menos es mejor)</option></select>
    <input name="meta" inputmode="decimal" required placeholder="Meta semanal" aria-label="Meta semanal"><select name="unidad" aria-label="Unidad"><option value="">Número</option><option value="$">$ MXN</option><option value="%">%</option></select></div></form>`;
}
function tablaScorecard() {
  const ws = semanas13(), revisar = ws[11];
  if (!D.scorecard.length) return `<p class="vacio">Aún no hay medibles. Agreguen de 5 a 15 números semanales, cada uno con dueño y meta.</p>${formMedible()}`;
  return `<div class="tabla-wrap"><table class="sc"><thead><tr><th class="nom">Medible</th><th>Dueño</th><th>Meta</th>${ws.map((w) => `<th>${fCorta(w)}</th>`).join("")}</tr></thead><tbody>
    ${D.scorecard.map((m) => `<tr><td class="nom">${esc(m.nombre)}${colorMedible(m, m.valores[revisar]) === "rojo" ? ` <button class="btn mini" data-act="bajar" data-texto="${esc("Scorecard fuera: " + m.nombre)}" data-dueno="${m.dueno}">→ Tema</button>` : ""}</td><td>${esc(nombre(m.dueno))}</td><td>${m.operador === "<=" ? "≤" : "≥"} ${num(m.meta, m.unidad)}</td>
      ${ws.map((w, i) => { const v = m.valores[w], c = colorMedible(m, v); return `<td class="${c ? "v-" + c : ""} ${i === 11 ? "actual" : ""}">${i >= 11 ? `<input inputmode="decimal" data-act="valor" data-id="${m.id}" data-sem="${w}" value="${v ?? ""}" aria-label="${esc(m.nombre)} semana ${w}">` : num(v, m.unidad)}</td>`; }).join("")}</tr>`).join("")}
  </tbody></table></div><p class="tenue chico">Semana a revisar: ${fCorta(revisar)} (recuadro). Verde = en meta, rojo = fuera. Últimas 13 semanas.</p>${formMedible()}`;
}
function contenidoSegmento(id) {
  const j = junta();
  switch (id) {
    case "segue": return `<ul class="lista">${personas().map((p) => `<li class="item"><div class="cuerpo"><div class="tit">${esc(p.nombre)}</div><div class="sub">Buena noticia personal · Buena noticia de negocio</div></div></li>`).join("")}</ul>`;
    case "scorecard": return tablaScorecard();
    case "rocas": return `<ul class="lista">${rocasTrim().map((r) => `<li class="item"><div class="cuerpo"><div class="tit">${esc(r.texto)}</div><div class="sub">${esc(nombre(r.dueno))} · Meta: ${esc(meta(r.metaId)?.texto || "—")}</div>
      <div class="tema-acc">${seg("estado-roca", r.id, ESTADOS_ROCA, r.estado)}${r.estado === "fuera" ? ` <button class="btn mini" data-act="bajar" data-texto="${esc("Roca fuera: " + r.texto)}" data-dueno="${r.dueno}">→ Tema</button>` : ""}</div></div></li>`).join("") || '<li class="vacio">Aún no hay Rocas este trimestre. Agréguenlas en la pestaña Rocas.</li>'}</ul>`;
    case "titulares": return `<form class="agregar" data-form="titular"><div class="principal"><input name="texto" required placeholder="Cliente / empleado: titular breve…"><button class="btn pri">Agregar</button></div></form>
      <ul class="lista">${(j?.titulares || []).map((t, i) => `<li class="item"><div class="cuerpo"><div class="tit">${esc(t)}</div></div><button class="btn mini" data-act="bajar" data-texto="${esc(t)}" data-dueno="${persona()}">→ Tema</button><button class="x" data-act="borrar-titular" data-i="${i}" aria-label="Borrar">✕</button></li>`).join("") || '<li class="vacio">Sin titulares todavía.</li>'}</ul>`;
    case "todos": {
      const [l, dom] = semanaActual();
      const xs = D.todos.filter((t) => (t.fecha <= dom && !t.hecho) || (t.hecho && t.hechoEl >= sumarDias(l, -7))).sort((a, b) => a.dueno.localeCompare(b.dueno) || a.fecha.localeCompare(b.fecha));
      return `<div class="tira">${personas().map((p) => { const s = pctSemana(p.id); return `<div class="dato"><div class="num ${s.pct == null ? "" : s.pct >= 90 ? "verde" : "rojo"}">${s.pct == null ? "—" : s.pct + "%"}</div><div class="et">${esc(p.nombre)} · ${s.hechos}/${s.total} hechos</div></div>`; }).join("")}</div>
        <ul class="lista">${xs.map((t) => itemTodo(t, { dueno: true })).join("") || '<li class="vacio">Sin To-Dos para revisar.</li>'}</ul>`;
    }
    case "ids": {
      const top = ordenTemas(D.temas.filter((t) => t.estado !== "resuelto" && t.prioridad)), resto = ordenTemas(D.temas.filter((t) => t.estado !== "resuelto" && !t.prioridad));
      return `<div class="grupo" style="margin-top:0"><h2>Top 3</h2>${top.length ? `<ul class="lista">${top.map(itemTema).join("")}</ul>` : (D.temas.some((t) => t.estado !== "resuelto") ? '<div class="vacio">Pongan prioridad 1, 2, 3 a los temas abajo.</div>' : '<div class="vacio">Sin temas por resolver. Agreguen uno abajo.</div>')}</div>
        <div class="grupo"><h2>Resto de la lista</h2><ul class="lista">${resto.map(itemTema).join("") || '<li class="vacio">Lista vacía.</li>'}</ul></div>
        <form class="agregar" data-form="tema"><div class="principal"><input name="texto" required placeholder="Nuevo tema…"><button class="btn pri">Agregar</button></div><div class="opciones">${selPersonas("dueno", persona())}</div></form>`;
    }
    case "cierre": {
      const nuevos = D.todos.filter((t) => t.creado === hoyISO());
      return `<h3>To-Dos nuevos de hoy (${nuevos.length})</h3><ul class="lista">${nuevos.map((t) => itemTodo(t, { dueno: true })).join("") || '<li class="vacio">Ninguno.</li>'}</ul>
        <h3>Mensajes a comunicar</h3><form class="agregar" data-form="mensaje"><div class="principal"><input name="texto" required placeholder="¿Qué hay que avisar al equipo y quién lo dice?"><button class="btn pri">Agregar</button></div></form>
        <ul class="lista">${(j?.mensajes || []).map((t, i) => `<li class="item"><div class="cuerpo">${esc(t)}</div><button class="x" data-act="borrar-mensaje" data-i="${i}" aria-label="Borrar">✕</button></li>`).join("")}</ul>
        <h3>Calificación de la junta (1–10)</h3>${personas().map((p) => `<div style="margin:8px 0"><div class="chico tenue" style="font-weight:700">${esc(p.nombre)}</div><div class="calif">${Array.from({ length: 10 }, (_, i) => i + 1).map((n) => `<button data-act="calif" data-id="${p.id}" data-val="${n}" class="${j?.calificaciones?.[p.id] === n ? "on" : ""}">${n}</button>`).join("")}</div></div>`).join("")}
        ${(() => { const vs = Object.values(j?.calificaciones || {}); if (!vs.length) return ""; const p = vs.reduce((a, b) => a + b, 0) / vs.length; return `<p>Promedio: <b class="${p >= 8 ? "verde" : "rojo"}">${p.toFixed(1)}</b>${p < 8 ? " — platiquen qué haría la próxima mejor." : ""}</p>`; })()}
        <p class="tenue chico">Al terminar, presiona <b>Publicar</b> arriba para que todo quede guardado en data.json.</p>`;
    }
  }
  return "";
}
function vL10() {
  const s = SEGMENTOS[L.seg], total = L.acum.reduce((a, b, i) => a + segTranscurrido(i) - (i === L.seg ? 0 : 0), 0);
  const previas = D.juntas.filter((x) => x.fecha !== hoyISO()).slice(-4).reverse();
  return `<div class="l10-cab">
    <div><div class="tenue chico">Level 10 · ${fLarga(hoyISO())}</div><div class="reloj" id="reloj-seg">${mmss(s.min * 60 - segTranscurrido(L.seg))}</div><div class="tenue chico">${esc(s.nombre)} · ${s.min} min · total <span id="reloj-total">${mmss(total)}</span> / 90:00</div></div>
    <div class="fila"><button class="btn pri" data-act="l10-play">${L.corriendo ? "Pausar" : L.inicioJunta ? "Continuar" : "Iniciar junta"}</button>
      <button class="btn" data-act="l10-sig">${L.seg < 6 ? "Siguiente →" : "Terminar"}</button><button class="btn suave" data-act="l10-reset">Reiniciar</button></div></div>
  <div class="agenda">${SEGMENTOS.map((x, i) => `<button data-act="l10-ir" data-i="${i}" class="${i === L.seg ? "on" : ""} ${L.acum[i] > 0 ? "listo" : ""}">${i + 1}. ${x.nombre} <small>${x.min}′</small></button>`).join("")}</div>
  <h1>${esc(s.nombre)}</h1><p class="guia">${esc(s.guia)}</p>
  ${contenidoSegmento(s.id)}
  ${previas.length ? `<details class="grupo"><summary>Juntas anteriores</summary><ul class="lista">${previas.map((x) => { const v = Object.values(x.calificaciones || {}); return `<li class="item"><div class="cuerpo"><div class="tit">${fLarga(x.fecha)}</div><div class="sub">Calificación ${v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : "—"}${(x.mensajes || []).length ? " · Mensajes: " + x.mensajes.map(esc).join("; ") : ""}</div></div></li>`; }).join("")}</ul></details>` : ""}`;
}
function tickL10() {
  if (vista !== "l10") return;
  const s = SEGMENTOS[L.seg], r = s.min * 60 - segTranscurrido(L.seg), el = $("#reloj-seg"), tot = $("#reloj-total");
  if (el) { el.textContent = mmss(r); el.classList.toggle("pasado", r < 0); }
  if (tot) tot.textContent = mmss(SEGMENTOS.reduce((a, _, i) => a + segTranscurrido(i), 0));
}
function pausarSeg() { if (L.corriendo && L.inicioSeg) { L.acum[L.seg] += (Date.now() - L.inicioSeg) / 1000; } L.inicioSeg = L.corriendo ? Date.now() : null; }

/* ----- V/TO ----- */
function vVTO() {
  const v = D.vto || {}, mk = v.marketing || {}, i3 = v.imagen3 || {}, p1 = v.plan1 || {};
  const PEND = '<p class="tenue">Pendiente de definir.</p>';
  const txt = (x) => x ? esc(x) : '<span class="tenue">pendiente</span>';
  const tf = (f) => f ? " · " + fLarga(f) : "";
  const lista = (xs) => (xs || []).length ? `<ul>${xs.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : '<p class="tenue">Pendiente.</p>';
  const cascada = D.metas.map((m) => {
    const rs = D.rocas.filter((r) => r.metaId === m.id), ts = D.todos.filter((t) => rs.some((r) => r.id === t.rocaId));
    const pr = rs.length ? Math.round(rs.reduce((a, r) => a + progresoRoca(r), 0) / rs.length) : 0;
    return `<div class="meta-c"><div class="fila-entre"><b>${esc(m.texto)}</b><span class="tenue chico">${esc(nombre(m.dueno))} <button class="x" data-act="borrar-meta" data-id="${m.id}" title="Borrar meta" aria-label="Borrar meta">✕</button></span></div>
      <div class="barra"><i style="width:${pr}%"></i></div><div class="tenue chico">${pr}% · Rocas ${rs.filter((r) => r.estado === "hecha").length}/${rs.length} hechas · To-Dos ${ts.filter((t) => t.hecho).length}/${ts.length}</div>
      <ul>${rs.map((r) => { const t = todosDe("rocaId", r.id); return `<li><span class="punto p-${r.estado}"></span>${esc(r.texto)}<span class="tenue chico">${esc(nombre(r.dueno))} · ${t.filter((x) => x.hecho).length}/${t.length} To-Dos</span></li>`; }).join("") || '<li class="tenue">Sin Rocas ligadas este trimestre</li>'}</ul></div>`;
  }).join("");
  const sinMeta = D.rocas.filter((r) => !meta(r.metaId));
  return `<h1>Visión / Tracción</h1><p class="tenue">Meta a 10 años → Imagen a 3 años → Plan a 1 año → Rocas (90 días) → To-Dos (7 días).</p>
  <div class="vto">
    <div>
      <section><h3>Valores centrales</h3>${(v.valores || []).map((x) => `<p><b>${esc(x.nombre)}</b>${x.descripcion ? ` — <span class="tenue">${esc(x.descripcion)}</span>` : ""}</p>`).join("") || PEND}</section>
      <section><h3>Enfoque central</h3><p><b>Propósito / causa / pasión:</b> ${txt(v.enfoque?.proposito)}</p><p><b>Nicho:</b> ${txt(v.enfoque?.nicho)}</p></section>
      <section><h3>Meta a 10 años${tf(v.meta10?.fecha)}</h3>${v.meta10?.texto ? `<p style="font-size:1.1rem;font-weight:700">${esc(v.meta10.texto)}</p>` : PEND}</section>
      <section><h3>Estrategia de marketing</h3><p><b>Mercado objetivo (“La Lista”):</b> ${txt(mk.mercado)}</p><p><b>3 únicos:</b></p>${(mk.unicos || []).length ? `<ol>${mk.unicos.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>` : '<p class="tenue">Pendiente.</p>'}<p><b>Proceso probado:</b> ${txt(mk.proceso)}</p><p><b>Garantía:</b> ${txt(mk.garantia)}</p></section>
      <section><h3>Imagen a 3 años${tf(i3.fecha)}</h3><div class="cifras"><div><span>Ingresos</span><b>${dinero(i3.ingresos)}</b></div><div><span>Utilidad</span><b>${dinero(i3.utilidad)}</b></div></div>
        <p><b>Medibles</b></p>${lista(i3.medibles)}<p><b>¿Cómo se ve?</b></p>${lista(i3.comoSeVe)}</section>
    </div>
    <div>
      <section><h3>Plan a 1 año${tf(p1.fecha)}</h3><div class="cifras"><div><span>Ingresos</span><b>${dinero(p1.ingresos)}</b></div><div><span>Utilidad</span><b>${dinero(p1.utilidad)}</b></div></div>
        <p><b>Medibles</b></p>${lista(p1.medibles)}</section>
      <section><h3>Metas del año → Rocas ${esc(D.trimestre?.nombre || "")} → To-Dos</h3><div class="cascada">${cascada || '<p class="tenue">Aún no hay metas del plan anual (1 a 7). Agrega la primera:</p>'}</div>
        <form class="agregar" data-form="meta"><div class="principal"><input name="texto" required placeholder="Nueva meta del año…" aria-label="Nueva meta del año"><button class="btn pri">Agregar</button></div><div class="opciones">${selPersonas("dueno", persona())}</div></form>
        ${sinMeta.length ? `<p class="rojo chico">Rocas sin meta anual: ${sinMeta.map((r) => esc(r.texto)).join(", ")}</p>` : ""}</section>
      <section><h3>Temas abiertos</h3><p>${D.temas.filter((t) => t.estado !== "resuelto").length} temas · <a href="#/temas">ver lista</a></p></section>
      <section><h3>Gráfica de responsabilidades</h3><div class="asientos">${(D.responsabilidades || []).map((a) => `<div class="asiento"><b>${esc(a.asiento)}</b><span class="tenue chico">${esc(nombre(a.persona))}</span><ul>${(a.roles || []).map((r) => `<li>${esc(r)}</li>`).join("")}</ul></div>`).join("") || '<p class="tenue">Pendiente de definir: quién ocupa cada asiento (Visionario, Integrador, Ventas, Operaciones, Finanzas).</p>'}</div></section>
    </div>
  </div>`;
}

/* ===== render ===== */
function render() {
  if (!D) return;
  document.documentElement.dataset.tema = localStorage.getItem(LS.tema) || "claro";
  $("#banner-ejemplo").hidden = !D.ejemplo;
  $("#empresa").textContent = D.empresa || "";
  $("#actualizado").textContent = "Actualizado " + fLarga(D.actualizado);
  $$("#tabs a").forEach((a) => a.classList.toggle("activo", a.dataset.v === vista));
  const v = { todos: vTodos, rocas: vRocas, temas: vTemas, l10: vL10, vto: vVTO }[vista] || vTodos;
  const y = scrollY; $("#vista").innerHTML = v(); scrollTo(0, y);
  pintarBarra();
}
function pintarBarra() {
  const b = $("#barra-cambios");
  if (pendiente) { b.hidden = false; b.innerHTML = `Hay una versión publicada más nueva. Tienes cambios sin publicar de antes. <button class="btn" data-act="recuperar">Recuperar mis cambios</button><button class="btn suave" data-act="descartar-pendiente">Descartarlos</button>`; return; }
  if (sucio()) { b.hidden = false; b.innerHTML = `● Cambios sin publicar <button class="btn" data-act="publicar">${localStorage.getItem(LS.token) ? "Publicar" : "Publicar (descargar)"}</button><button class="btn suave" data-act="descargar">Descargar data.json</button>`; }
  else { b.hidden = true; b.innerHTML = ""; }
}

/* ===== GitHub ===== */
function repoCfg() { const g = { owner: "robchvz97", repo: "vto-frutos-chavez", rama: "main", ruta: "data.json", ...(D?.github || {}) }; let o = {}; try { o = JSON.parse(localStorage.getItem(LS.repo)) || {}; } catch {} return { owner: o.owner || g.owner, repo: o.repo || g.repo, rama: o.rama || g.rama || "main", ruta: g.ruta || "data.json" }; }
async function gh(metodo, cuerpo) {
  const c = repoCfg(), t = localStorage.getItem(LS.token);
  const url = `https://api.github.com/repos/${c.owner}/${c.repo}/contents/${c.ruta}` + (metodo === "GET" ? `?ref=${encodeURIComponent(c.rama)}&t=${Date.now()}` : "");
  const r = await fetch(url, { method: metodo, headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${t}`, "X-GitHub-Api-Version": "2022-11-28" }, body: cuerpo ? JSON.stringify(cuerpo) : undefined, cache: "no-store" });
  if (!r.ok) { let m = ""; try { m = (await r.json()).message; } catch {} throw new Error(`GitHub ${r.status}${m ? ": " + m : ""}`); }
  return r.json();
}
function texto(d) { return JSON.stringify(d, null, 2) + "\n"; }
function descargar() {
  const d = clon(D); d.actualizado = hoyISO();
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([texto(d)], { type: "application/json" })); a.download = "data.json"; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  aviso("data.json descargado. Súbelo al repositorio para publicarlo.", 4000);
}
async function publicar() {
  if (!localStorage.getItem(LS.token)) { descargar(); return; }
  try {
    aviso("Publicando…", 10000);
    const actual = await gh("GET"), remoto = JSON.parse(b64aTexto(actual.content));
    if (hash(canon(remoto)) !== base && !confirm("Alguien publicó cambios después de que empezaste a editar. Si publicas, se reemplazan con tu versión. ¿Continuar?")) { aviso("No se publicó."); return; }
    D.actualizado = hoyISO();
    const quien = nombre(persona());
    await gh("PUT", { message: `Actualización desde el tablero (${quien}, ${hoyISO()})`, content: textoAb64(texto(D)), sha: actual.sha, branch: repoCfg().rama });
    pub = clon(D); base = hash(canon(pub)); guardar(); render();
    aviso("Publicado ✓ Tu socio lo verá en 1–2 minutos.", 4000);
  } catch (e) { aviso("No se pudo publicar: " + e.message, 6000); }
}

/* ===== eventos ===== */
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]"); if (!el) return;
  const { act, id, val } = el.dataset;
  if (el.type === "checkbox" && act !== "toggle-todo") return;
  switch (act) {
    case "persona": localStorage.setItem(LS.persona, id); render(); break;
    case "toggle-todo": cambiar(() => { const t = D.todos.find((x) => x.id === id); t.hecho = !t.hecho; t.hechoEl = t.hecho ? hoyISO() : null; }); break;
    case "borrar-todo": if (confirm("¿Borrar este To-Do?")) cambiar(() => { D.todos = D.todos.filter((x) => x.id !== id); }); break;
    case "estado-roca": cambiar(() => { roca(id).estado = val; }); break;
    case "estado-tema": cambiar(() => { tema(id).estado = val; }); break;
    case "borrar-tema": if (confirm("¿Borrar este tema? Sus To-Dos se quedan sin ligar.")) cambiar(() => { D.temas = D.temas.filter((x) => x.id !== id); D.todos.forEach((t) => { if (t.temaId === id) t.temaId = null; }); }); break;
    case "abrir-solucion": { const c = $("#sol-" + id); c.innerHTML = c.innerHTML ? "" : formSolucion(tema(id)); c.querySelector("textarea")?.focus(); break; }
    case "bajar": cambiar(() => { D.temas.push({ id: nuevoId("t"), texto: el.dataset.texto, dueno: el.dataset.dueno, prioridad: null, estado: "identificado", solucion: "", creado: hoyISO() }); }, "Se bajó a Temas"); break;
    case "borrar-titular": cambiar(() => { junta().titulares.splice(+el.dataset.i, 1); }); break;
    case "borrar-mensaje": cambiar(() => { junta().mensajes.splice(+el.dataset.i, 1); }); break;
    case "calif": cambiar(() => { juntaOCrear().calificaciones[id] = +val; }); break;
    case "l10-play": pausarSeg(); L.corriendo = !L.corriendo; L.inicioSeg = L.corriendo ? Date.now() : null; if (!L.inicioJunta) L.inicioJunta = Date.now(); guardarL(); render(); break;
    case "l10-sig": if (L.seg >= 6) { pausarSeg(); L.corriendo = false; L.inicioSeg = null; guardarL(); render(); aviso("Junta terminada. No olviden Publicar."); break; }
      pausarSeg(); L.seg++; L.inicioSeg = L.corriendo ? Date.now() : null; guardarL(); render(); scrollTo(0, 0); break;
    case "l10-ir": pausarSeg(); L.seg = +el.dataset.i; L.inicioSeg = L.corriendo ? Date.now() : null; guardarL(); render(); break;
    case "l10-reset": if (confirm("¿Reiniciar los relojes de la junta?")) { L = { seg: 0, corriendo: false, inicioSeg: null, acum: Array(7).fill(0), inicioJunta: null }; guardarL(); render(); } break;
    case "borrar-roca": if (confirm("¿Borrar esta Roca? Sus To-Dos se quedan sin ligar.")) cambiar(() => { D.rocas = D.rocas.filter((x) => x.id !== id); D.todos.forEach((t) => { if (t.rocaId === id) t.rocaId = null; }); }); break;
    case "borrar-meta": if (confirm("¿Borrar esta meta anual? Sus Rocas quedan sin meta.")) cambiar(() => { D.metas = D.metas.filter((x) => x.id !== id); D.rocas.forEach((r) => { if (r.metaId === id) r.metaId = null; }); }); break;
    case "publicar": publicar(); break;
    case "descargar": descargar(); break;
    case "recuperar": D = pendiente.data; pendiente = null; guardar(); render(); aviso("Cambios recuperados. Revísalos y publica."); break;
    case "descartar-pendiente": pendiente = null; guardar(); render(); break;
  }
});
document.addEventListener("change", (e) => {
  const el = e.target;
  if (el.dataset.act === "prio-tema") { const v = el.value ? +el.value : null; cambiar(() => { if (v) D.temas.forEach((t) => { if (t.prioridad === v && t.estado !== "resuelto") t.prioridad = null; }); tema(el.dataset.id).prioridad = v; }); }
  if (el.dataset.act === "valor") { const m = D.scorecard.find((x) => x.id === el.dataset.id); cambiar(() => { const v = el.value.trim().replace(/[$,%\s]/g, ""); if (v === "") delete m.valores[el.dataset.sem]; else m.valores[el.dataset.sem] = Number(v); }); }
});
document.addEventListener("submit", (e) => {
  const f = e.target.closest("form[data-form]"); if (!f) return; e.preventDefault();
  const fd = Object.fromEntries(new FormData(f)), tipo = f.dataset.form, txt = (fd.texto || "").trim();
  if (tipo === "todo" && txt) { const [k, idl] = (fd.liga || "").split(":"); cambiar(() => D.todos.push({ id: nuevoId("d"), texto: txt, dueno: fd.dueno, fecha: fd.fecha || sumarDias(hoyISO(), 7), hecho: false, hechoEl: null, rocaId: k === "r" ? idl : null, temaId: k === "t" ? idl : null, creado: hoyISO() }), "To-Do agregado"); }
  if (tipo === "tema" && txt) cambiar(() => D.temas.push({ id: nuevoId("t"), texto: txt, dueno: fd.dueno, prioridad: null, estado: "identificado", solucion: "", creado: hoyISO() }), "Tema agregado");
  if (tipo === "roca" && txt) cambiar(() => D.rocas.push({ id: nuevoId("r"), texto: txt, dueno: fd.dueno, metaId: fd.metaId || null, estado: "en_camino", fecha: fd.fecha || D.trimestre?.fin || "" }), "Roca agregada");
  if (tipo === "meta" && txt) cambiar(() => D.metas.push({ id: nuevoId("m"), texto: txt, dueno: fd.dueno }), "Meta agregada");
  if (tipo === "medible" && (fd.nombre || "").trim()) { const mv = Number(String(fd.meta).replace(/[$,%\s]/g, "")); if (isNaN(mv)) { aviso("La meta debe ser un número"); return; } cambiar(() => D.scorecard.push({ id: nuevoId("s"), nombre: fd.nombre.trim(), dueno: fd.dueno, operador: fd.operador, meta: mv, unidad: fd.unidad, valores: {} }), "Medible agregado"); }
  if (tipo === "titular" && txt) cambiar(() => juntaOCrear().titulares.push(txt));
  if (tipo === "mensaje" && txt) cambiar(() => juntaOCrear().mensajes.push(txt));
  if (tipo === "solucion") { const t = tema(f.dataset.id); cambiar(() => { t.solucion = (fd.solucion || "").trim(); if (txt) D.todos.push({ id: nuevoId("d"), texto: txt, dueno: fd.dueno, fecha: fd.fecha, hecho: false, hechoEl: null, rocaId: null, temaId: t.id, creado: hoyISO() }); if (fd.resolver) t.estado = "resuelto"; else if (t.estado === "identificado") t.estado = "discutiendo"; }, txt ? "To-Do creado desde el tema" : "Guardado"); }
});
addEventListener("hashchange", () => { vista = (location.hash.match(/#\/(\w+)/) || [])[1] || "todos"; render(); scrollTo(0, 0); });

/* ----- ajustes ----- */
function abrirAjustes() {
  const c = repoCfg();
  $("#aj-token").value = localStorage.getItem(LS.token) || ""; $("#aj-owner").value = c.owner || ""; $("#aj-repo").value = c.repo || ""; $("#aj-rama").value = c.rama || "main";
  $("#aj-repo-nombre").textContent = c.repo || "";
  $("#aj-personas").innerHTML = personas().map((p) => `<label class="campo">Nombre (${esc(p.id)})<input data-persona="${p.id}" value="${esc(p.nombre)}"></label>`).join("");
  $("#aj-estado").textContent = localStorage.getItem(LS.token) ? "Token guardado en este navegador." : "Sin token: Publicar descargará el archivo.";
  $("#ajustes").showModal();
}
function guardarAjustes() {
  const t = $("#aj-token").value.trim(); if (t) localStorage.setItem(LS.token, t); else localStorage.removeItem(LS.token);
  localStorage.setItem(LS.repo, JSON.stringify({ owner: $("#aj-owner").value.trim(), repo: $("#aj-repo").value.trim(), rama: $("#aj-rama").value.trim() || "main" }));
  let cambio = false; $$("[data-persona]").forEach((i) => { const p = personas().find((x) => x.id === i.dataset.persona); const v = i.value.trim(); if (p && v && v !== p.nombre) { p.nombre = v; cambio = true; } });
  if (cambio) guardar();
  render(); $("#aj-estado").textContent = "Guardado."; 
}
function init() {
  $("#btn-tema").onclick = () => { localStorage.setItem(LS.tema, (localStorage.getItem(LS.tema) || "claro") === "claro" ? "oscuro" : "claro"); render(); };
  $("#btn-ajustes").onclick = abrirAjustes;
  $("#aj-guardar").onclick = guardarAjustes;
  $("#aj-borrar").onclick = () => { localStorage.removeItem(LS.token); $("#aj-token").value = ""; $("#aj-estado").textContent = "Token borrado de este navegador."; pintarBarra(); };
  $("#aj-probar").onclick = async () => { guardarAjustes(); $("#aj-estado").textContent = "Probando…"; try { const r = await gh("GET"); $("#aj-estado").textContent = `Conexión correcta ✓ (${repoCfg().owner}/${repoCfg().repo}, ${r.size} bytes)`; } catch (e) { $("#aj-estado").textContent = "Error: " + e.message; } };
  $("#aj-descargar").onclick = descargar;
  $("#aj-descartar").onclick = () => { if (!confirm("¿Descartar todos los cambios sin publicar de este navegador?")) return; D = clon(pub); pendiente = null; localStorage.removeItem(LS.local); render(); aviso("Cambios descartados."); };
  setInterval(tickL10, 500);
}

async function cargar() {
  vista = (location.hash.match(/#\/(\w+)/) || [])[1] || "todos";
  let remoto = null;
  if (localStorage.getItem(LS.token)) { try { const r = await gh("GET"); remoto = JSON.parse(b64aTexto(r.content)); } catch (e) { console.warn("API GitHub no disponible, uso data.json", e); } }
  if (!remoto) { const r = await fetch("./data.json?v=" + Date.now(), { cache: "no-store" }); if (!r.ok) throw new Error("data.json HTTP " + r.status); remoto = await r.json(); }
  for (const k of ["metas", "rocas", "todos", "temas", "scorecard", "juntas", "personas", "responsabilidades"]) remoto[k] = remoto[k] || [];
  remoto.vto = remoto.vto || {};
  pub = remoto; base = hash(canon(pub)); D = clon(pub);
  let local = null; try { local = JSON.parse(localStorage.getItem(LS.local)); } catch {}
  if (local?.data) {
    if (local.base === base) D = local.data;
    else if (local.sucio && canon(local.data) !== canon(pub)) pendiente = local;
    else localStorage.removeItem(LS.local);
  }
  render();
}
init();
cargar().catch((e) => { $("#vista").innerHTML = `<p class="rojo">No se pudo cargar data.json: ${esc(e.message)}</p>`; console.error(e); });
})();
