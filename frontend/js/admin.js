import { $, esc, short, toast, errMsg } from "./utils.js";
import { state, reader, writer, connect } from "./chain.js";
import { domainOk, DEMO } from "./dns.js";

export async function render(el) {
  if (!state.isOwner) {
    el.innerHTML = `<h1>Administración</h1><div class="empty"><p>Solo el administrador de Aval revisa instituciones.</p>${state.address ? "" : '<button class="btn" id="c">Conectar billetera</button>'}</div>`;
    return $("#c", el)?.addEventListener("click", () => connect().catch(e => toast(errMsg(e), "err")));
  }
  el.innerHTML = `<h1>Administración</h1><p class="sub">Apruebe solo instituciones que pueda comprobar: dominio con registro DNS válido y datos que coincidan con una fuente oficial.</p><div id="list" class="empty"><p>Cargando…</p></div>`;
  const c = reader(), n = Number(await c.institutionCount()), items = [];
  for (let i = 0; i < n; i++) { const w = await c.institutionList(i); items.push({ w, i: await c.getInstitution(w) }); }
  const box = $("#list", el); box.className = "";
  if (!items.length) { box.className = "empty"; box.innerHTML = "<p>Aún no hay solicitudes.</p>"; return; }
  const label = ["", "Pendiente", "Activa", "Rechazada"];
  box.innerHTML = items.map(({ w, i }) => `<div class="item"><div><strong>${esc(i.name)}</strong> <span class="pill ${i.status == 2 ? "ok" : "warn"}">${label[i.status]}</span><br><span class="muted">${esc(i.domain)} · <code>${short(w)}</code></span> <span class="dns" data-w="${w}" data-d="${esc(i.domain)}"></span></div>
    <div class="acts">${i.status == 1 ? `<button class="link" data-a="ok" data-w="${w}">Aprobar</button><button class="link danger" data-a="no" data-w="${w}">Rechazar</button>` : ""}${i.status == 2 ? `<button class="link danger" data-a="sus" data-w="${w}">Suspender</button>` : ""}</div></div>`).join("");
  el.querySelectorAll(".dns").forEach(async s => { const ok = await domainOk(s.dataset.d, s.dataset.w); s.innerHTML = `<span class="pill ${ok ? "ok" : "warn"}">DNS ${ok ? "comprobado" + (DEMO ? " (demo)" : "") : "sin comprobar"}</span>`; });
  box.onclick = async e => {
    const { a, w } = e.target.dataset; if (!a) return;
    try {
      const k = writer(); await (await (a === "ok" ? k.review(w, true) : a === "no" ? k.review(w, false) : k.suspend(w))).wait();
      toast("Listo"); render(el);
    } catch (err) { toast(errMsg(err), "err"); }
  };
}
