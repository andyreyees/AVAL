import { $, esc, short, fmtDate, linkFor, copy, toast, errMsg } from "./utils.js";
import { state, readAccount, send, S, connect } from "./chain.js";

export async function render(el) {
  if (!state.active) {
    el.innerHTML = `<h1>Mis emisiones</h1><div class="empty"><p>Conecte una cuenta aprobada para ver sus documentos.</p>${state.address ? "" : '<button class="btn" id="c">Conectar Freighter</button>'}</div>`;
    return $("#c", el)?.addEventListener("click", () => connect().catch(e => toast(errMsg(e), "err")));
  }
  el.innerHTML = `<h1>Mis emisiones</h1><p class="sub">Todo lo que ${esc(state.name)} ha registrado.</p><div id="list" class="empty"><p>Cargando…</p></div>`;
  try {
    const { data } = await readAccount(state.address);
    const rows = Object.entries(data).filter(([k]) => k.startsWith("c:")).map(([k, v]) => {
      const [ts, ...kd] = v.replace(/^R/, "").split("|"); return { id: k.slice(2), revoked: v[0] === "R", ts: Number(ts), kind: kd.join("|"), raw: v.replace(/^R/, "") };
    }).sort((a, b) => b.ts - a.ts);
    const box = $("#list", el); box.className = "";
    if (!rows.length) { box.className = "empty"; box.innerHTML = "<p>Aún no ha emitido documentos.</p>"; return; }
    box.innerHTML = `<input id="q" class="search" placeholder="Buscar por tipo de documento">` + rows.map(r => `<div class="item" data-k="${esc(r.kind.toLowerCase())}">
      <div><strong>${esc(r.kind)}</strong><br><span class="muted">${fmtDate(r.ts)} · <code>${short("0x" + r.id)}</code></span></div>
      <div class="acts"><span class="pill ${r.revoked ? "warn" : "ok"}">${r.revoked ? "Revocado" : "Válido"}</span><button class="link" data-copy="${r.id}">Enlace</button>
      ${r.revoked ? "" : `<button class="link danger" data-rev="${r.id}">Revocar</button>`}</div></div>`).join("");
    $("#q", el).oninput = e => el.querySelectorAll(".item").forEach(i => i.hidden = !i.dataset.k.includes(e.target.value.toLowerCase()));
    box.onclick = async e => {
      const { copy: cp, rev } = e.target.dataset;
      if (cp) return copy(linkFor(cp));
      if (rev && confirm("¿Revocar este documento? No se puede deshacer.")) {
        try { await send(b => b.addOperation(S.Operation.manageData({ name: "c:" + rev, value: "R" + rows.find(r => r.id === rev).raw }))); toast("Documento revocado"); render(el); }
        catch (err) { toast(errMsg(err), "err"); }
      }
    };
  } catch (e) { $("#list", el).innerHTML = `<p>${esc(errMsg(e))}</p>`; }
}
