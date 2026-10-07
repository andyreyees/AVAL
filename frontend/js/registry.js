import { $, esc, short, fmtDate, linkFor, copy, toast, errMsg } from "./utils.js";
import { state, reader, writer, connect } from "./chain.js";

export async function render(el) {
  if (!state.active) {
    el.innerHTML = `<h1>Mis emisiones</h1><div class="empty"><p>Conecte una billetera autorizada para ver sus documentos emitidos.</p>${state.address ? "" : '<button class="btn" id="c">Conectar billetera</button>'}</div>`;
    return $("#c", el)?.addEventListener("click", () => connect().catch(e => toast(errMsg(e), "err")));
  }
  el.innerHTML = `<h1>Mis emisiones</h1><p class="sub">Todo lo que ${esc(state.name)} ha registrado.</p><div id="list" class="empty"><p>Cargando…</p></div>`;
  try {
    const c = reader();
    const evs = await c.queryFilter(c.filters.Issued(null, state.address), 0);
    const rows = await Promise.all(evs.reverse().map(async e => ({ h: e.args.docHash, r: await c.verify(e.args.docHash) })));
    const box = $("#list", el);
    box.className = "";
    if (!rows.length) { box.className = "empty"; box.innerHTML = "<p>Aún no ha emitido documentos.</p>"; return; }
    box.innerHTML = `<input id="q" class="search" placeholder="Buscar por tipo de documento">` + rows.map(({ h, r }) => `
      <div class="item" data-k="${esc(r.kind.toLowerCase())}">
        <div><strong>${esc(r.kind)}</strong><br><span class="muted">${fmtDate(r.issuedAt)} · <code>${short(h)}</code></span></div>
        <div class="acts"><span class="pill ${r.revoked ? "warn" : "ok"}">${r.revoked ? "Revocado" : "Válido"}</span>
          <button class="link" data-copy="${h}">Enlace</button>
          ${r.revoked ? "" : `<button class="link danger" data-rev="${h}">Revocar</button>`}</div></div>`).join("");
    $("#q", el).oninput = e => el.querySelectorAll(".item").forEach(i => i.hidden = !i.dataset.k.includes(e.target.value.toLowerCase()));
    box.onclick = async e => {
      const { copy: cp, rev } = e.target.dataset;
      if (cp) return copy(linkFor(cp));
      if (rev && confirm("¿Revocar este documento? No se puede deshacer.")) {
        try { await (await writer().revoke(rev)).wait(); toast("Documento revocado"); render(el); } catch (err) { toast(errMsg(err), "err"); }
      }
    };
  } catch (e) { $("#list", el).innerHTML = `<p>${esc(errMsg(e))}</p>`; }
}
