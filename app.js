/* V/TO FRÜTOS Chávez — todo el contenido viene de data.json */
(() => {
  "use strict";
  const LS_KEY = "vto-frutos-borrador";
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const mxn = (n) => (n == null || n === "" || isNaN(n)) ? "—" : new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
  const mxnCorto = (n) => {
    if (n == null || isNaN(n)) return "—";
    if (Math.abs(n) >= 1e6) return "$" + (n / 1e6).toLocaleString("es-MX", { maximumFractionDigits: 1 }) + " M";
    if (Math.abs(n) >= 1e3) return "$" + (n / 1e3).toLocaleString("es-MX", { maximumFractionDigits: 0 }) + " mil";
    return "$" + n;
  };
  const parseFecha = (f) => { if (!f) return null; const [y, m, d] = String(f).split("-").map(Number); return new Date(y, (m || 1) - 1, d || 1); };
  const fFecha = (f) => { const d = parseFecha(f); return d ? d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }) : "—"; };
  const fCorta = (f) => { const d = parseFecha(f); return d ? d.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }) : "—"; };
  const diasA = (f) => { const d = parseFecha(f); if (!d) return null; const hoy = new Date(); hoy.setHours(0, 0, 0, 0); return Math.round((d - hoy) / 864e5); };
  const clamp = (n) => Math.max(0, Math.min(100, Number(n) || 0));
  const COLORES = ["#ff7a1a", "#ff4d6d", "#8b5cf6", "#2fbf71", "#ffb020", "#3b82f6"];
  const colorDe = (nombre, lista) => COLORES[Math.max(0, (lista || []).indexOf(nombre)) % COLORES.length];

  let original = null, data = null, charts = [];
  const filtros = { owner: "Todos", prio: "todas" };

  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 2600); }

  /* ---------- Tema ---------- */
  function initTema() {
    const pref = localStorage.getItem("vto-tema") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTema(pref);
    $("#btn-tema").addEventListener("click", () => setTema(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
  }
  function setTema(t) {
    document.documentElement.dataset.theme = t; localStorage.setItem("vto-tema", t);
    $("#btn-tema").textContent = t === "dark" ? "☀️" : "🌙";
    if (data) renderCharts();
  }

  /* ---------- Estado de rocas ---------- */
  function estadoRoca(r) {
    const p = clamp(r.progreso), e = String(r.estado || "").toLowerCase();
    if (p >= 100 || e.startsWith("complet")) return { k: "done", t: "✅ Completada" };
    if (e.includes("atras") || e.includes("fuera")) return { k: "off", t: "⚠️ Fuera de camino" };
    return { k: "on", t: "🟢 En camino" };
  }

  const ring = (p, c, size = 64) => `<div class="ring" style="--c:${c};width:${size}px;height:${size}px" data-p="${clamp(p)}" data-v="${clamp(p)}%"></div>`;
  function animarRings(root = document) {
    requestAnimationFrame(() => root.querySelectorAll(".ring[data-p]").forEach((el) => el.style.setProperty("--p", el.dataset.p)));
    requestAnimationFrame(() => root.querySelectorAll(".bar i[data-w]").forEach((el) => (el.style.width = el.dataset.w + "%")));
  }

  /* ---------- Render ---------- */
  function render() {
    const d = data, v = d.vision || {}, t = d.traccion || {};
    document.title = `V/TO · ${d.empresa || "FRÜTOS Chávez"}`;
    $("#banner-ejemplo").hidden = !d.ejemplo;
    $("#empresa").textContent = d.empresa || "";
    $("#subtitulo").textContent = d.subtitulo || "";
    $("#actualizado").textContent = "Última actualización: " + fCorta(d.ultimaActualizacion);

    const ec = v.enfoqueCentral || {};
    $("#hero-proposito").textContent = ec.proposito || "";
    $("#hero-nicho").textContent = ec.nicho || "";
    const cd = (id, f, sufijo) => { const n = diasA(f); $("#" + id).textContent = n == null ? "—" : (n >= 0 ? n.toLocaleString("es-MX") + " días" : "Vencido"); $("#" + id + "-f").textContent = fFecha(f); };
    cd("cd-rocas", t.rocas?.fechaLimite); cd("cd-1", t.plan1Ano?.fecha); cd("cd-3", v.imagen3Anos?.fecha); cd("cd-10", v.meta10Anos?.fecha);

    // Visión
    $("#valores").innerHTML = (v.valoresCentrales || []).map((x, i) => `<div class="value" style="--c:${COLORES[i % COLORES.length]}"><b>${esc(x.nombre)}</b><p>${esc(x.descripcion)}</p></div>`).join("");
    $("#ec-proposito").textContent = ec.proposito || "";
    $("#ec-nicho").textContent = ec.nicho || "";
    $("#m10-meta").textContent = v.meta10Anos?.meta || "";
    $("#m10-fecha").textContent = "🎯 " + fFecha(v.meta10Anos?.fecha);
    const mk = v.estrategiaMarketing || {};
    $("#mk-mercado").textContent = mk.mercadoObjetivo || "";
    $("#mk-garantia").textContent = mk.garantia || "";
    $("#mk-unicos").innerHTML = (mk.tresUnicos || []).map((u) => `<li>${esc(u)}</li>`).join("");
    $("#mk-proceso").innerHTML = (mk.procesoProbado || []).map((s, i) => `${i ? '<span class="arrow">→</span>' : ""}<span class="step">${esc(s)}</span>`).join("");
    const i3 = v.imagen3Anos || {};
    $("#i3-fecha").textContent = fCorta(i3.fecha); $("#i3-ingresos").textContent = mxn(i3.ingresos); $("#i3-utilidad").textContent = mxn(i3.utilidad);
    $("#i3-medibles").innerHTML = (i3.medibles || []).map((x) => `<li>${esc(x)}</li>`).join("");
    $("#i3-como").innerHTML = (i3.comoSeVe || []).map((x) => `<li>${esc(x)}</li>`).join("");

    // Tracción
    const p1 = t.plan1Ano || {};
    $("#p1-fecha").textContent = fCorta(p1.fecha); $("#p1-ingresos").textContent = mxn(p1.ingresos); $("#p1-utilidad").textContent = mxn(p1.utilidad);
    $("#p1-medibles").innerHTML = (p1.medibles || []).map((x) => `<li>${esc(x)}</li>`).join("");
    $("#p1-metas").innerHTML = (p1.metas || []).map((g, i) => `<div class="goal">${ring(g.progreso, COLORES[i % COLORES.length])}<div><p>${esc(g.meta)}</p><small>👤 ${esc(g.responsable || "—")}</small></div></div>`).join("") || '<p class="empty">Sin metas</p>';
    $("#fin-nota").textContent = t.financieros?.nota || "";

    renderKPIs(); renderRocas(); renderTemas(); renderCharts(); animarRings();
  }

  function sumar(arr) { return (arr || []).reduce((a, b) => a + (b == null || isNaN(b) ? 0 : Number(b)), 0); }
  function renderKPIs() {
    const t = data.traccion || {}, f = t.financieros || {}, rocas = t.rocas?.lista || [], metas = t.plan1Ano?.metas || [];
    const ingReal = sumar(f.ingresosReal), utiReal = sumar(f.utilidadReal);
    const ingMetaAnual = t.plan1Ano?.ingresos || sumar(f.ingresosMeta), utiMetaAnual = t.plan1Ano?.utilidad || sumar(f.utilidadMeta);
    const pIng = ingMetaAnual ? Math.round((ingReal / ingMetaAnual) * 100) : 0;
    const pUti = utiMetaAnual ? Math.round((utiReal / utiMetaAnual) * 100) : 0;
    const pMetas = metas.length ? Math.round(sumar(metas.map((m) => clamp(m.progreso))) / metas.length) : 0;
    const enCamino = rocas.filter((r) => estadoRoca(r).k !== "off").length;
    const pRocas = rocas.length ? Math.round((enCamino / rocas.length) * 100) : 0;
    const kpi = (p, c, titulo, sub) => `<div class="card kpi">${ring(p, c, 70)}<div><b>${titulo}</b><span>${sub}</span></div></div>`;
    $("#kpis").innerHTML =
      kpi(pIng, "#ff7a1a", mxnCorto(ingReal), `Ingresos acumulados vs. meta anual ${mxnCorto(ingMetaAnual)}`) +
      kpi(pUti, "#2fbf71", mxnCorto(utiReal), `Utilidad acumulada vs. meta anual ${mxnCorto(utiMetaAnual)}`) +
      kpi(pMetas, "#8b5cf6", pMetas + "%", `Avance promedio de ${metas.length} metas del año`) +
      kpi(pRocas, "#ff4d6d", `${enCamino}/${rocas.length}`, "Rocas en camino este trimestre");
  }

  function renderRocas() {
    const r = data.traccion?.rocas || {}, lista = r.lista || [], socios = data.socios || [];
    $("#rocas-trim").textContent = r.trimestre ? `· ${r.trimestre}` : "";
    const owners = ["Todos", ...new Set([...socios, ...lista.map((x) => x.responsable).filter(Boolean)])];
    if (!owners.includes(filtros.owner)) filtros.owner = "Todos";
    $("#filtro-rocas").innerHTML = owners.map((o) => `<button class="chip ${o === filtros.owner ? "on" : ""}" data-o="${esc(o)}">${o === "Todos" ? "👥 Todos" : "👤 " + esc(o)}</button>`).join("");
    $("#filtro-rocas").querySelectorAll(".chip").forEach((b) => b.addEventListener("click", () => { filtros.owner = b.dataset.o; renderRocas(); }));
    const vis = lista.filter((x) => filtros.owner === "Todos" || x.responsable === filtros.owner);
    const cuenta = { on: 0, off: 0, done: 0 }; vis.forEach((x) => cuenta[estadoRoca(x).k]++);
    $("#rocas-resumen").innerHTML = `<span class="status st-on">${cuenta.on} en camino</span><span class="status st-off">${cuenta.off} fuera</span><span class="status st-done">${cuenta.done} completadas</span>`;
    $("#lista-rocas").innerHTML = vis.map((x, i) => {
      const e = estadoRoca(x), dd = diasA(x.fecha), p = clamp(x.progreso);
      return `<div class="rock" style="animation-delay:${i * 60}ms">
        <div><h4>${esc(x.roca)}</h4><div class="meta"><span class="avatar" style="background:${colorDe(x.responsable, owners)}">${esc((x.responsable || "?")[0])}</span>${esc(x.responsable || "—")} · 📅 ${fCorta(x.fecha)}${dd != null && e.k !== "done" ? ` · ${dd >= 0 ? dd + " días restantes" : "vencida hace " + -dd + " días"}` : ""}</div></div>
        <div style="text-align:right"><span class="status st-${e.k}">${e.t}</span><div style="font-weight:800;font-size:1.2rem;margin-top:4px">${p}%</div></div>
        <div class="bar ${e.k}"><i data-w="${p}"></i></div></div>`;
    }).join("") || '<p class="empty">No hay rocas para este filtro</p>';
    animarRings($("#lista-rocas"));
  }

  function renderTemas() {
    const lista = data.traccion?.temas || [];
    const prios = ["todas", "alta", "media", "baja"];
    $("#filtro-prioridad").innerHTML = prios.map((p) => `<button class="chip ${p === filtros.prio ? "on" : ""}" data-p="${p}">${{ todas: "Todas", alta: "🔴 Alta", media: "🟡 Media", baja: "🟢 Baja" }[p]} <small>(${p === "todas" ? lista.length : lista.filter((x) => x.prioridad === p).length})</small></button>`).join("");
    $("#filtro-prioridad").querySelectorAll(".chip").forEach((b) => b.addEventListener("click", () => { filtros.prio = b.dataset.p; renderTemas(); }));
    const verRes = $("#ver-resueltos").checked, orden = { alta: 0, media: 1, baja: 2 };
    const vis = lista.map((x, idx) => ({ ...x, idx }))
      .filter((x) => (filtros.prio === "todas" || x.prioridad === filtros.prio) && (verRes || !x.resuelto))
      .sort((a, b) => (a.resuelto - b.resuelto) || ((orden[a.prioridad] ?? 3) - (orden[b.prioridad] ?? 3)));
    $("#lista-temas").innerHTML = vis.map((x, i) => `<div class="issue ${x.resuelto ? "resuelto" : ""}" style="animation-delay:${i * 50}ms"><span class="prio p-${esc(x.prioridad)}"></span><p>${esc(x.tema)}</p><span class="tag">${esc(x.tipo || "")}</span>${x.resuelto ? '<span class="tag">✔ resuelto</span>' : ""}</div>`).join("") || '<p class="empty">Sin temas pendientes 🎉</p>';
  }

  function renderCharts() {
    if (!window.Chart) return;
    charts.forEach((c) => c.destroy()); charts = [];
    const f = data.traccion?.financieros || {}, oscuro = document.documentElement.dataset.theme === "dark";
    const txt = oscuro ? "#c9c7d4" : "#4a4757", grid = oscuro ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.06)";
    Chart.defaults.font.family = "'Plus Jakarta Sans', system-ui, sans-serif"; Chart.defaults.color = txt;
    const tooltip = { callbacks: { label: (c) => `${c.dataset.label}: ${mxn(c.parsed.y)}` } };
    const ctx = $("#chart-fin").getContext("2d");
    const g1 = ctx.createLinearGradient(0, 0, 0, 280); g1.addColorStop(0, "rgba(255,122,26,.9)"); g1.addColorStop(1, "rgba(255,77,109,.6)");
    const g2 = ctx.createLinearGradient(0, 0, 0, 280); g2.addColorStop(0, "rgba(126,217,87,.95)"); g2.addColorStop(1, "rgba(47,191,113,.6)");
    charts.push(new Chart(ctx, {
      data: { labels: f.meses || [], datasets: [
        { type: "bar", label: "Ingresos real", data: f.ingresosReal || [], backgroundColor: g1, borderRadius: 8, order: 2 },
        { type: "line", label: "Ingresos meta", data: f.ingresosMeta || [], borderColor: "#8b5cf6", borderDash: [6, 5], pointRadius: 3, tension: .35, order: 1 },
        { type: "bar", label: "Utilidad real", data: f.utilidadReal || [], backgroundColor: g2, borderRadius: 8, order: 2 },
        { type: "line", label: "Utilidad meta", data: f.utilidadMeta || [], borderColor: "#ffb020", borderDash: [6, 5], pointRadius: 3, tension: .35, order: 1 }
      ] },
      options: { responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false }, animation: { duration: 1200, easing: "easeOutQuart" },
        plugins: { tooltip, legend: { labels: { usePointStyle: true, boxWidth: 8 } } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: grid }, ticks: { callback: (v) => mxnCorto(v) } } } }
    }));
    const acum = (a) => { let s = 0; return (a || []).map((v) => (v == null ? null : (s += Number(v)))); };
    const ctx2 = $("#chart-acum").getContext("2d");
    const g3 = ctx2.createLinearGradient(0, 0, 0, 200); g3.addColorStop(0, "rgba(255,122,26,.35)"); g3.addColorStop(1, "rgba(255,122,26,0)");
    charts.push(new Chart(ctx2, {
      type: "line",
      data: { labels: f.meses || [], datasets: [
        { label: "Ingresos acumulados real", data: acum(f.ingresosReal), borderColor: "#ff7a1a", backgroundColor: g3, fill: true, tension: .35, pointRadius: 2 },
        { label: "Ingresos acumulados meta", data: acum(f.ingresosMeta), borderColor: "#8b5cf6", borderDash: [6, 5], tension: .35, pointRadius: 0 }
      ] },
      options: { responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false }, animation: { duration: 1400 },
        plugins: { tooltip, legend: { labels: { usePointStyle: true, boxWidth: 8 } } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: grid }, ticks: { callback: (v) => mxnCorto(v) } } } }
    }));
  }

  /* ---------- Animaciones de entrada ---------- */
  function initReveal() {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .08 });
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  }

  /* ---------- Editor ---------- */
  const ETIQUETAS = {
    ejemplo: "¿Datos de ejemplo? (muestra el aviso)", empresa: "Empresa", subtitulo: "Subtítulo", ultimaActualizacion: "Última actualización (AAAA-MM-DD)", socios: "Socios",
    vision: "Visión", valoresCentrales: "Valores centrales", nombre: "Nombre", descripcion: "Descripción", enfoqueCentral: "Enfoque central", proposito: "Propósito / Causa / Pasión", nicho: "Nicho",
    meta10Anos: "Meta a 10 años", fecha: "Fecha (AAAA-MM-DD)", meta: "Meta", estrategiaMarketing: "Estrategia de marketing", mercadoObjetivo: "Mercado objetivo / La Lista", tresUnicos: "3 únicos",
    procesoProbado: "Proceso probado (pasos)", garantia: "Garantía", imagen3Anos: "Imagen a 3 años", ingresos: "Ingresos (MXN)", utilidad: "Utilidad (MXN)", medibles: "Medibles", comoSeVe: "¿Cómo se ve?",
    traccion: "Tracción", plan1Ano: "Plan a 1 año", metas: "Metas", progreso: "Progreso (%)", responsable: "Responsable", financieros: "Financieros mensuales", nota: "Nota", meses: "Meses",
    ingresosMeta: "Ingresos meta por mes", ingresosReal: "Ingresos real por mes (vacío = sin dato)", utilidadMeta: "Utilidad meta por mes", utilidadReal: "Utilidad real por mes (vacío = sin dato)",
    rocas: "Rocas (90 días)", trimestre: "Trimestre", fechaLimite: "Fecha límite del trimestre", lista: "Lista", roca: "Roca", estado: "Estado", temas: "Lista de temas", tema: "Tema", prioridad: "Prioridad", tipo: "Tipo", resuelto: "Resuelto"
  };
  const OPCIONES = { prioridad: ["alta", "media", "baja"], estado: ["en curso", "atrasada", "completada"], tipo: ["problema", "obstáculo", "reto", "oportunidad", "idea"] };
  let borrador = null;

  function vacioComo(x) {
    if (Array.isArray(x)) return [];
    if (x && typeof x === "object") return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, vacioComo(v)]));
    if (typeof x === "number") return 0; if (typeof x === "boolean") return false; return "";
  }
  function campo(obj, key, ruta) {
    const val = obj[key], et = ETIQUETAS[key] ?? (typeof key === "number" ? "#" + (key + 1) : key);
    if (Array.isArray(val)) {
      const fs = document.createElement("fieldset"); fs.innerHTML = `<legend>${esc(et)}</legend>`;
      val.forEach((_, i) => { const w = document.createElement("div"); w.className = "arr-item"; w.appendChild(campo(val, i, ruta + "." + i));
        const del = document.createElement("button"); del.className = "arr-del"; del.title = "Eliminar"; del.textContent = "✕";
        del.onclick = () => { val.splice(i, 1); construirForm(); }; w.appendChild(del); fs.appendChild(w); });
      const add = document.createElement("button"); add.className = "btn sm arr-add"; add.textContent = "＋ Agregar";
      add.onclick = () => { val.push(val.length ? vacioComo(val[val.length - 1]) : ""); construirForm(); }; fs.appendChild(add);
      return fs;
    }
    if (val && typeof val === "object") {
      const fs = document.createElement("fieldset"); fs.innerHTML = `<legend>${esc(et)}</legend>`;
      Object.keys(val).forEach((k) => fs.appendChild(campo(val, k, ruta + "." + k))); return fs;
    }
    const row = document.createElement("div"); row.className = "f-row";
    const id = "f" + ruta.replace(/\W/g, "_"); row.innerHTML = `<label for="${id}">${esc(et)}</label>`;
    let inp;
    if (typeof val === "boolean") { inp = document.createElement("select"); inp.innerHTML = '<option value="true">Sí</option><option value="false">No</option>'; inp.value = String(val); inp.onchange = () => (obj[key] = inp.value === "true"); }
    else if (OPCIONES[key]) { inp = document.createElement("select"); inp.innerHTML = OPCIONES[key].map((o) => `<option>${o}</option>`).join(""); if (!OPCIONES[key].includes(val)) inp.insertAdjacentHTML("afterbegin", `<option>${esc(val)}</option>`); inp.value = val; inp.onchange = () => (obj[key] = inp.value); }
    else if (typeof val === "number" || val === null) { inp = document.createElement("input"); inp.type = "number"; inp.value = val ?? ""; inp.oninput = () => (obj[key] = inp.value === "" ? null : Number(inp.value)); }
    else if (String(val).length > 60) { inp = document.createElement("textarea"); inp.value = val; inp.oninput = () => (obj[key] = inp.value); }
    else { inp = document.createElement("input"); inp.type = /fecha|ultimaActualizacion/i.test(key) ? "date" : "text"; inp.value = val; inp.oninput = () => (obj[key] = inp.value); }
    inp.id = id; row.appendChild(inp); return row;
  }
  function construirForm() { const f = $("#ed-form"); f.innerHTML = ""; const raiz = { raiz: borrador }; Object.keys(borrador).forEach((k) => f.appendChild(campo(borrador, k, k))); }
  let modo = "form";
  function setModo(m) {
    if (m === "form" && modo === "json") { try { borrador = JSON.parse($("#ed-json").value); $("#ed-error").textContent = ""; } catch (e) { $("#ed-error").textContent = "JSON inválido: " + e.message; return; } }
    modo = m; document.querySelectorAll(".ed-tabs .btn").forEach((b) => b.classList.toggle("active", b.dataset.modo === m));
    $("#ed-form").hidden = m !== "form"; $("#ed-json").hidden = m !== "json";
    if (m === "form") construirForm(); else $("#ed-json").value = JSON.stringify(borrador, null, 2);
  }
  function leerBorrador() {
    if (modo === "json") { try { borrador = JSON.parse($("#ed-json").value); } catch (e) { $("#ed-error").textContent = "JSON inválido: " + e.message; return null; } }
    $("#ed-error").textContent = ""; return borrador;
  }
  function initEditor() {
    $("#btn-editar").onclick = () => { borrador = JSON.parse(JSON.stringify(data)); $("#editor").hidden = false; setModo("form"); };
    $("#ed-cerrar").onclick = () => ($("#editor").hidden = true);
    $("#editor").addEventListener("click", (e) => { if (e.target.id === "editor") $("#editor").hidden = true; });
    document.querySelectorAll(".ed-tabs .btn").forEach((b) => (b.onclick = () => setModo(b.dataset.modo)));
    $("#ed-aplicar").onclick = () => { const b = leerBorrador(); if (!b) return; data = JSON.parse(JSON.stringify(b)); localStorage.setItem(LS_KEY, JSON.stringify(data)); render(); toast("Vista previa aplicada (sólo en este navegador)"); };
    $("#ed-descargar").onclick = () => {
      const b = leerBorrador(); if (!b) return;
      b.ultimaActualizacion = new Date().toLocaleDateString("en-CA");
      const blob = new Blob([JSON.stringify(b, null, 2) + "\n"], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "data.json"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast("data.json descargado — súbelo al repositorio para publicarlo");
    };
    $("#ed-reset").onclick = () => { if (!confirm("¿Descartar los cambios locales y volver al data.json publicado?")) return; localStorage.removeItem(LS_KEY); data = JSON.parse(JSON.stringify(original)); borrador = JSON.parse(JSON.stringify(data)); setModo(modo); render(); toast("Restablecido al data.json publicado"); };
    $("#ver-resueltos").onchange = renderTemas;
  }

  /* ---------- Inicio ---------- */
  async function init() {
    initTema(); initEditor();
    try {
      const r = await fetch("./data.json?v=" + Date.now(), { cache: "no-store" });
      if (!r.ok) throw new Error("HTTP " + r.status);
      original = await r.json();
    } catch (e) {
      document.querySelector("main").insertAdjacentHTML("afterbegin", `<div class="card" style="border-color:var(--fresa)">No se pudo cargar <code>data.json</code>: ${esc(e.message)}</div>`);
      return;
    }
    data = JSON.parse(JSON.stringify(original));
    const local = localStorage.getItem(LS_KEY);
    if (local) { try { data = JSON.parse(local); setTimeout(() => toast("Mostrando cambios locales sin publicar (Editar → Restablecer para descartar)"), 600); } catch { localStorage.removeItem(LS_KEY); } }
    render(); initReveal();
    setInterval(() => { // refresca contadores a medianoche
      const t = data.traccion || {}, v = data.vision || {};
      [["cd-rocas", t.rocas?.fechaLimite], ["cd-1", t.plan1Ano?.fecha], ["cd-3", v.imagen3Anos?.fecha], ["cd-10", v.meta10Anos?.fecha]].forEach(([id, f]) => { const n = diasA(f); if (n != null) $("#" + id).textContent = n >= 0 ? n.toLocaleString("es-MX") + " días" : "Vencido"; });
    }, 60000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
